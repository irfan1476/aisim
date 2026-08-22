'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { initialGameState, normalizeDeploymentAmount, quarterlyDeploymentCap, type Allocation, type GameState, type Recommendation } from '../lib/game/state';
import { causalChain } from '../lib/game/metrics';
import { generateCrisis } from '../lib/game/crises';
import { getScenario } from '../lib/scenarios/registry';
import { calculateProgressPercentages, calculateScenarioProgress } from '../lib/scenarios/progress';
import { generateProactiveRecommendations } from '../lib/game/recommendations';
import { resolveQuarter, deriveScore } from '../lib/game/engine';
import { describeSynergies } from '../lib/game/generator';
import { scenarioInitiativesToStates } from '../lib/game/initiativeAdapter';
import {
  clearPersistedCampaign,
  clearPersistedGameData,
  GAME_PERSISTENCE_VERSION,
  GAME_STORAGE_KEY,
  LEGACY_GAME_STORAGE_KEY,
  normalizeGameState,
  normalizeWhatIfDraft,
  readLegacyGameState,
  removeLegacySaveAfterMigration,
  removeWhatIfDraft,
  type WhatIfDraft,
  WHAT_IF_STORAGE_KEY,
  writeWhatIfDraft,
} from '../lib/game/persistence';

type GameStore = GameState & {
  startGame: () => void;
  selectInitiatives: (ids: string[]) => void;
  updateAllocation: (key: keyof GameState['alloc'], value: number) => void;
  setDeploymentAmount: (amount: number) => void;
  confirmDecisions: () => void;
  respondToCrisis: (impact: Record<string, number>, cost?: number) => void;
  advanceQuarter: () => void;
  quickReset: () => void;
  resetCampaign: () => void;
  resetAllData: () => void;
  resetGame: () => void;
  applyWhatIfDraft: (draft: WhatIfDraft) => void;
  saveWhatIfDraft: (draft: WhatIfDraft) => void;
  clearWhatIfDraft: () => void;
  approveRecommendation: (title: string) => void;
  applyRecommendation: () => void;
  dismissRecommendation: () => void;
  saveReflection: (reflection: Partial<GameState['userReflections']>) => void;
  loadGame: (state: unknown) => void;
  initializeScenario: (scenarioId: string, campaignBudget?: number) => void;
};

const browserStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    const current = window.localStorage.getItem(name);
    if (current || name !== GAME_STORAGE_KEY) return current;

    // Import the old save only when the Zustand key is absent. The legacy
    // payload is normalized before it is handed to Zustand's JSON parser.
    const legacy = readLegacyGameState();
    if (!legacy) return null;
    const migrated = JSON.stringify({ state: legacy, version: GAME_PERSISTENCE_VERSION });
    window.localStorage.setItem(name, migrated);
    return migrated;
  },
  setItem: (name, value) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(name);
  },
};

function quickResetState(state: GameState): Partial<GameState> {
  return {
    selected: [],
    stage: 'decide',
    crisis: null,
    causalChain: [],
    proactiveRecommendations: [],
    feedback: `Quarter ${state.q} is ready for a new decision.`,
  };
}

function crisisRoll(seed: number, quarter: number): number {
  let value = ((seed >>> 0) + quarter * 2654435761) >>> 0;
  value = (value * 1664525 + 1013904223) >>> 0;
  return value / 4294967296;
}

const allocationKeys: (keyof Allocation)[] = ['infra', 'data', 'people', 'mlops', 'compliance', 'innovation'];

function rebalanceAllocation(current: Allocation, targets: Partial<Allocation> = {}): Allocation {
  const next = { ...current };
  for (const key of allocationKeys) {
    if (targets[key] !== undefined) next[key] = Math.min(50, Math.max(5, Math.round(Number(targets[key]))));
  }
  let difference = 100 - allocationKeys.reduce((sum, key) => sum + next[key], 0);
  const candidates = [...allocationKeys.filter((key) => targets[key] === undefined), ...allocationKeys];
  for (const key of candidates) {
    if (Math.abs(difference) < 1) break;
    if (difference > 0) {
      const increase = Math.min(difference, 50 - next[key]);
      next[key] += increase;
      difference -= increase;
    } else {
      const decrease = Math.min(-difference, next[key] - 5);
      next[key] -= decrease;
      difference += decrease;
    }
  }
  return next;
}

function recommendationFor(state: GameState, title: string): Recommendation | undefined {
  return state.proactiveRecommendations.find((item) => item.title === title)
    || state.history.at(-1)?.recommendations?.find((item) => item.title === title);
}

export const useGameStore = create<GameStore>()(persist((set, get) => ({
  ...initialGameState(),

  startGame: () => {
    clearPersistedCampaign();
    set(initialGameState());
  },

  initializeScenario: (scenarioId, campaignBudgetOverride) => set((state) => {
    const scenario = getScenario(scenarioId);
    if (!scenario) return state;
    const campaignBudget = Number.isFinite(campaignBudgetOverride) && Number(campaignBudgetOverride) > 0
      ? Number(campaignBudgetOverride)
      : scenario.startingState.budget * 12;
    const quarterlyBudget = campaignBudget / 12;
    const deploymentCap = quarterlyDeploymentCap(campaignBudget, quarterlyBudget);
    const startingMetrics = { ...scenario.startingState.startingMetrics };
    const nativeMetrics = {
      efficiency: startingMetrics.efficiency ?? state.efficiency,
      adoption: startingMetrics.adoption ?? state.adoption,
      data: startingMetrics.data ?? state.data,
      satisfaction: startingMetrics.satisfaction ?? state.satisfaction,
    };
    const progress = Object.fromEntries(scenario.progress.map((item) => [item.key, 0]));
    return {
      ...state,
      scenarioMode: true,
      scenarioId: scenario.id,
      quarterlyBudget,
      campaignBudget,
      campaignBudgetRemaining: campaignBudget,
      scenarioBudgetRemaining: quarterlyBudget,
      deploymentAmount: Math.min(quarterlyBudget, deploymentCap),
      quarterlyDeploymentCap: deploymentCap,
      lastQuarterDeployment: 0,
      scenarioStartingMetrics: startingMetrics,
      scenarioProgress: progress,
      scenarioState: { metrics: startingMetrics, progress, flags: {} },
      alloc: { ...scenario.startingState.defaultAllocation },
      selected: [],
      stage: 'decide',
      initiativeStates: scenario.initiatives ? scenarioInitiativesToStates(scenario.initiatives) : state.initiativeStates,
      ...nativeMetrics,
    };
  }),

  selectInitiatives: (ids) => set({ selected: Array.from(new Set(ids)).slice(0, 3) }),

  updateAllocation: (key, value) => set((state) => ({ alloc: { ...state.alloc, [key]: value } })),

  setDeploymentAmount: (amount) => set((state) => ({
    deploymentAmount: normalizeDeploymentAmount(amount, state.campaignBudgetRemaining, state.quarterlyBudget),
  })),

  confirmDecisions: () => {
    const state = normalizeGameState(get());
    const result = resolveQuarter(state, { selected: state.selected, alloc: state.alloc });
    const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
    const discovery = describeSynergies(state.selected, result.initiativeStates, scenario?.synergies);
    const synergyCostReduction = Math.min(0.15, discovery?.effects.reduce((sum, effect) => sum + effect.costReduction, 0) || 0);
    const selectedCost = state.selected.reduce((sum, id) => {
      const initiative = result.initiativeStates[id];
      return sum + Number(initiative?.baseCost ?? initiative?.cost ?? initiative?.currentCost ?? 0);
    }, 0) * (1 - synergyCostReduction);
    const campaignRemaining = Number(state.campaignBudgetRemaining ?? state.campaignBudget ?? state.quarterlyBudget * 12);
    const deploymentCap = quarterlyDeploymentCap(campaignRemaining, state.quarterlyBudget);
    const deploymentAmount = normalizeDeploymentAmount(state.deploymentAmount, campaignRemaining, state.quarterlyBudget);
    if (selectedCost > deploymentAmount + 1e-9) {
      set({ feedback: `This portfolio costs ${selectedCost.toFixed(2)} but only ${deploymentAmount.toFixed(2)} is deployed this quarter. Increase deployment, choose fewer initiatives, or keep the reserve.` });
      return;
    }
    const overspend = state.scenarioMode ? Math.max(0, selectedCost - state.quarterlyBudget) : 0;
    const purseOverrun = state.scenarioMode ? Math.max(0, selectedCost - campaignRemaining) : 0;
    const overspendRisk = state.scenarioMode && state.quarterlyBudget > 0
      ? Math.min(25, (overspend / state.quarterlyBudget) * 10 + (purseOverrun > 0 ? 10 : 0))
      : 0;
    const adjustedMetrics = { ...result.metrics, risk: Math.min(95, Number(result.metrics.risk ?? state.risk) + overspendRisk) };
    const resolvedState = { ...state, ...adjustedMetrics, initiativeStates: result.initiativeStates, scenarioState: result.scenarioState };
    const newlyDiscovered = discovery?.effects.map(effect => effect.key) || [];
    const discoveredSynergies = Array.from(new Set([...state.discoveredSynergies, ...newlyDiscovered]));
    const resolvedRisk = Number(adjustedMetrics.risk ?? state.risk);
    const crisisProbability = Math.max(.08, Math.min(.7, (resolvedRisk - 15) / 75));
    const scenarioProgress = scenario ? (result.scenarioState?.progress || calculateScenarioProgress(resolvedState, scenario)?.values) : state.scenarioProgress;
    const scenarioBonus = state.scenarioMode && state.q >= 12 && scenario ? Math.round((calculateScenarioProgress(resolvedState, scenario)?.overall || 0) / 20) : state.scenarioBonus;
    const scenarioCrisis = scenario && state.q % 3 === 0 && crisisRoll(state.initiativeGeneration.seed, state.q) < crisisProbability
      ? scenario.crises[Math.abs(state.initiativeGeneration.seed + state.q) % scenario.crises.length]
      : null;
    const nextCrisis = scenarioCrisis
      ? { ...scenarioCrisis, options: scenarioCrisis.options.map((option) => [option.label, option.description, option.impacts, option.cost] as [string, string, Record<string, number>, number?]) }
      : state.q % 3 === 0 && crisisRoll(state.initiativeGeneration.seed, state.q) < crisisProbability
        ? generateCrisis(state.initiativeGeneration.seed + state.q)
        : null;
    const nextCausalChain = causalChain(resolvedState, state.selected);
    const nextRecommendations = generateProactiveRecommendations(resolvedState);
    set({
      ...resolvedState,
      score: Math.min(100, deriveScore(state, adjustedMetrics) + scenarioBonus),
      scenarioProgress,
      scenarioState: result.scenarioState,
      portfolio: result.snapshot.portfolio,
      selectedCount: result.snapshot.selectedCount ?? result.snapshot.selectedIds?.length ?? 0,
      portfolioPosture: result.snapshot.portfolioPosture ?? 'pause',
      portfolioBreadth: result.snapshot.breadth ?? 0,
      concentrationRisk: result.snapshot.concentrationRisk ?? 0,
      scenarioOverspend: overspend,
      campaignBudgetRemaining: Math.max(0, campaignRemaining - selectedCost),
      deploymentAmount,
      quarterlyDeploymentCap: deploymentCap,
      lastQuarterDeployment: selectedCost,
      scenarioBudgetRemaining: state.scenarioMode
        ? Math.max(0, state.quarterlyBudget - selectedCost)
        : state.scenarioBudgetRemaining,
      scenarioBonus,
      stage: 'results',
      crisis: nextCrisis,
      causalChain: nextCausalChain,
      proactiveRecommendations: nextRecommendations,
      discoveredSynergies,
      feedback: discovery?.message || `Quarter ${state.q} resolved. Your portfolio is now showing the consequences of this allocation.`,
      history: [...state.history, { ...result.snapshot, deployedAmount: selectedCost, fixedInitiativeSpend: selectedCost, budgetProvenance: 'campaign-purse-with-two-quarter-cap', metrics: adjustedMetrics, crisis: nextCrisis, causalChain: nextCausalChain, recommendations: nextRecommendations }],
    });
  },

  respondToCrisis: (impact, cost = 0) => set((state) => {
    const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
    const scenarioKeys = new Set(scenario?.progress.map((definition) => definition.key) || []);
    const nativeImpact = Object.fromEntries(Object.entries(impact).filter(([key]) => !scenarioKeys.has(key)));
    const scenarioMetrics = scenario
      ? { ...(state.scenarioState?.metrics || {}) }
      : undefined;
    if (scenarioMetrics) {
      for (const [key, delta] of Object.entries(impact)) {
        const definition = scenario?.progress.find((item) => item.key === key);
        if (definition) {
          scenarioMetrics[key] = Math.min(
            definition.max,
            Math.max(definition.min, (scenarioMetrics[key] || definition.start) + Number(delta)),
          );
        }
      }
    }
    const next = {
      ...state,
      ...nativeImpact,
      spent: state.spent + cost,
      campaignBudgetRemaining: Math.max(0, Number(state.campaignBudgetRemaining ?? state.campaignBudget ?? state.quarterlyBudget * 12) - cost),
      scenarioBudgetRemaining: state.scenarioMode ? Math.max(0, state.scenarioBudgetRemaining - cost) : state.scenarioBudgetRemaining,
      quarterlyDeploymentCap: quarterlyDeploymentCap(Math.max(0, Number(state.campaignBudgetRemaining ?? state.campaignBudget ?? state.quarterlyBudget * 12) - cost), state.quarterlyBudget),
      quarterlyCrisisCost: state.quarterlyCrisisCost + cost,
      crisis: null,
      stage: 'results' as const,
      ...(scenarioMetrics ? { scenarioState: { ...state.scenarioState, metrics: scenarioMetrics } } : {}),
    };
    const nextScenarioState = scenarioMetrics && scenario
      ? { ...next.scenarioState, progress: calculateProgressPercentages(scenarioMetrics, scenario) }
      : next.scenarioState;
    const history = next.history.length
      ? [...next.history.slice(0, -1), {
          ...next.history[next.history.length - 1],
          scenarioState: nextScenarioState,
          crisisResponse: impact,
          metrics: { ...next.history[next.history.length - 1].metrics, spent: next.spent },
        }]
      : next.history;
    return {
      ...next,
      history,
      scenarioProgress: scenario ? calculateScenarioProgress(next, scenario)?.values : next.scenarioProgress,
      scenarioState: nextScenarioState,
    };
  }),

  advanceQuarter: () => {
    const state = normalizeGameState(get());
    if (state.q >= 12) return set({ stage: 'done' });
    set({
      q: state.q + 1,
      stage: 'decide',
      selected: [],
      crisis: null,
      causalChain: [],
      proactiveRecommendations: [],
      quarterlyCrisisCost: 0,
      scenarioBudgetRemaining: state.scenarioBudgetRemaining === undefined ? state.quarterlyBudget : state.quarterlyBudget,
      quarterlyDeploymentCap: quarterlyDeploymentCap(state.campaignBudgetRemaining, state.quarterlyBudget),
      deploymentAmount: Math.min(state.quarterlyBudget, quarterlyDeploymentCap(state.campaignBudgetRemaining, state.quarterlyBudget)),
      scenarioOverspend: 0,
      feedback: `Quarter ${state.q + 1} is ready.`,
    });
  },

  quickReset: () => set((state) => quickResetState(normalizeGameState(state))),

  resetCampaign: () => {
    clearPersistedCampaign();
    set(initialGameState());
  },

  resetAllData: () => {
    clearPersistedGameData();
    set(initialGameState());
  },

  // Backwards-compatible campaign reset action.
  resetGame: () => {
    clearPersistedCampaign();
    set(initialGameState());
  },

  applyWhatIfDraft: (draft) => {
    const normalized = normalizeWhatIfDraft(draft);
    if (!normalized) return;
    set({ selected: normalized.selected, alloc: normalized.alloc, feedback: 'What-If strategy applied to the next decision.' });
    removeWhatIfDraft();
  },

  saveWhatIfDraft: (draft) => {
    const normalized = normalizeWhatIfDraft(draft);
    if (normalized) writeWhatIfDraft(normalized);
  },

  clearWhatIfDraft: removeWhatIfDraft,
  approveRecommendation: (title) => set((state) => {
    const source = recommendationFor(state, title);
    const allocationKey = title.toLowerCase().includes('compliance') || title.toLowerCase().includes('risk') ? 'compliance' : title.toLowerCase().includes('data') ? 'data' : title.toLowerCase().includes('training') || title.toLowerCase().includes('adoption') || title.toLowerCase().includes('people') ? 'people' : undefined;
    const guidance = { title, action: source?.action || (allocationKey ? `Increase ${allocationKey} allocation before confirming this quarter.` : 'Review this recommendation before confirming the quarter.'), allocationKey, initiativeIds: source?.initiativeIds, preferredInitiativeIds: source?.preferredInitiativeIds, deploymentAmount: source?.deploymentAmount, operatingAllocationTargets: source?.operatingAllocationTargets };
    const approvedRecommendations = state.approvedRecommendations.includes(title) ? state.approvedRecommendations : [...state.approvedRecommendations, title];
    const history = state.history.length
      ? [...state.history.slice(0, -1), { ...state.history[state.history.length - 1], approvedRecommendations }]
      : state.history;
    return { approvedRecommendations, nextQuarterGuidance: guidance, history, feedback: `Recommendation approved: ${title}. It is queued as next-quarter guidance.` };
  }),
  applyRecommendation: () => set((state) => {
    const guidance = state.nextQuarterGuidance;
    if (!guidance) return { feedback: 'Review the recommendation manually before confirming.' };
    const ids = Array.from(new Set((guidance.preferredInitiativeIds?.length ? guidance.preferredInitiativeIds : guidance.initiativeIds) || []))
      .filter((id) => Boolean(state.initiativeStates?.[id]))
      .slice(0, 3);
    // Preserve compatibility with approvals created by older saves, which
    // only carried an allocation key. New recommendations always carry the
    // complete actionable payload above.
    if (!guidance.operatingAllocationTargets && guidance.allocationKey) {
      const key = guidance.allocationKey as keyof Allocation;
      const current = state.alloc[key];
      const increase = Math.min(8, 20 - current);
      const source = key === 'infra' ? 'innovation' : 'infra';
      const shift = Math.min(increase, Math.max(0, state.alloc[source] - 5));
      if (shift > 0) {
        return { alloc: { ...state.alloc, [key]: current + shift, [source]: state.alloc[source] - shift }, feedback: `Applied guidance: ${key} allocation increased by ${shift} points.`, nextQuarterGuidance: null };
      }
    }
    const allocation = rebalanceAllocation(state.alloc, guidance.operatingAllocationTargets);
    const deployment = normalizeDeploymentAmount(guidance.deploymentAmount, state.campaignBudgetRemaining, state.quarterlyBudget);
    const selectedText = ids.length ? ` Selected: ${ids.join(', ')}.` : ' No initiative matched this recommendation; review the cards manually.';
    return { selected: ids, alloc: allocation, deploymentAmount: deployment, feedback: `Applied guidance for ${guidance.title}. You can edit the initiatives, deployment, and operating allocation before confirming.${selectedText}`, nextQuarterGuidance: null };
  }),
  dismissRecommendation: () => set({ nextQuarterGuidance: null, feedback: 'Recommendation dismissed for this quarter; it remains in campaign history.' }),

  saveReflection: (reflection) => set((state) => ({
    userReflections: { ...state.userReflections, ...reflection },
  })),

  loadGame: (state) => set(normalizeGameState(state)),
}), {
  name: GAME_STORAGE_KEY,
  version: GAME_PERSISTENCE_VERSION,
  storage: createJSONStorage(() => browserStorage),
  partialize: (state) => normalizeGameState(state),
  migrate: (persistedState) => normalizeGameState(persistedState),
  onRehydrateStorage: () => (_state, error) => {
    if (!error) removeLegacySaveAfterMigration();
  },
}));

export function useGameState(initializer: () => any): [any, (update: any) => void] {
  const store = useGameStore();
  const setState = useGameStore.setState;
  if (!store.feedback) setState(initializer());
  return [store, (update) => setState((current) => typeof update === 'function' ? update(current) : update)];
}

export { GAME_STORAGE_KEY, LEGACY_GAME_STORAGE_KEY, WHAT_IF_STORAGE_KEY };
