'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { createV3State, initialGameState, type GameState, type V3BoardMemoState, type V3ResponsibleImpactState } from '../lib/game/state';
import { causalChain } from '../lib/game/metrics';
import { generateCrisis } from '../lib/game/crises';
import { getScenario } from '../lib/scenarios/registry';
import { calculateProgressPercentages, calculateScenarioProgress } from '../lib/scenarios/progress';
import { generateProactiveRecommendations } from '../lib/game/recommendations';
import { resolveQuarter, deriveScore } from '../lib/game/engine';
import { describeSynergies } from '../lib/game/generator';
import { scenarioInitiativesToStates } from '../lib/game/initiativeAdapter';
import { resolveV3Decision, resolveV3Window, type V3DecisionResolution, type V3WindowResolution } from '../lib/game/v3Runtime';
import type { V3LedgerPlan, V3PortfolioPlan } from '../lib/game/v3Decisions';
import type { V3WindowDefinition } from '../lib/scenarios/types';
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
  confirmDecisions: () => void;
  respondToCrisis: (impact: Record<string, number>, cost?: number) => void;
  advanceQuarter: () => void;
  advanceV3Window: (nextQuarter: number) => void;
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
  initializeScenario: (scenarioId: string) => void;
  /** Opt-in V3 decision seam; legacy confirmDecisions remains unchanged. */
  confirmV3Decisions: (plan: V3PortfolioPlan[], ledger?: V3LedgerPlan) => V3DecisionResolution;
  confirmV3Window: (plan: V3PortfolioPlan[], ledger: V3LedgerPlan, window: V3WindowDefinition) => V3WindowResolution;
  setV3Baseline: (responses: Array<{ questionId: string; response: string }>) => void;
  saveV3Reflection: (entryId: string, reflection: string) => void;
  saveV3BoardMemo: (memo: V3BoardMemoState) => void;
  saveV3ResponsibleImpact: (impact: V3ResponsibleImpactState) => void;
  setV3Cursor: (phase: 'orient' | 'compare' | 'commit' | 'outcome' | 'reflect' | 'next') => void;
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

export const useGameStore = create<GameStore>()(persist((set, get) => ({
  ...initialGameState(),

  startGame: () => {
    clearPersistedCampaign();
    set(initialGameState());
  },

  initializeScenario: (scenarioId) => set((state) => {
    const scenario = getScenario(scenarioId);
    if (!scenario) return state;
    const startingMetrics = { ...scenario.startingState.startingMetrics };
    const nativeMetrics = {
      efficiency: startingMetrics.efficiency ?? state.efficiency,
      adoption: startingMetrics.adoption ?? state.adoption,
      data: startingMetrics.data ?? state.data,
      satisfaction: startingMetrics.satisfaction ?? state.satisfaction,
    };
    const progress = Object.fromEntries(scenario.progress.map((item) => [item.key, 0]));
    const v3Metrics = scenario.v3
      ? Object.fromEntries([...(scenario.v3.metrics || []), ...(scenario.v3.reportedMetrics || [])].filter((metric) => metric.start !== undefined).map((metric) => [metric.key, metric.start as number]))
      : {};
    return {
      ...state,
      scenarioMode: true,
      scenarioId: scenario.id,
      quarterlyBudget: scenario.startingState.budget,
      scenarioBudgetRemaining: scenario.startingState.budget,
      scenarioStartingMetrics: startingMetrics,
      scenarioProgress: progress,
      scenarioState: { metrics: { ...startingMetrics, ...v3Metrics }, progress, flags: {} },
      alloc: { ...scenario.startingState.defaultAllocation },
      selected: [],
      stage: 'decide',
      initiativeStates: scenario.initiatives ? scenarioInitiativesToStates(scenario.initiatives) : state.initiativeStates,
      v3State: scenario.v3 ? createV3State(scenario.id, state.initiativeGeneration.seed, scenario.startingState.budget, (scenario.initiatives || []).map((item) => item.id), scenario.v3) : undefined,
      ...nativeMetrics,
    };
  }),

  selectInitiatives: (ids) => set({ selected: [...ids] }),

  updateAllocation: (key, value) => set((state) => ({ alloc: { ...state.alloc, [key]: value } })),

  confirmDecisions: () => {
    const state = normalizeGameState(get());
    const result = resolveQuarter(state, { selected: state.selected, alloc: state.alloc });
    const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
    const discovery = describeSynergies(state.selected, result.initiativeStates, scenario?.synergies);
    const synergyCostReduction = Math.min(0.15, discovery?.effects.reduce((sum, effect) => sum + effect.costReduction, 0) || 0);
    const selectedCost = state.selected.reduce((sum, id) => sum + Number(result.initiativeStates[id]?.currentCost || 0), 0) * (1 - synergyCostReduction);
    const overspend = state.scenarioMode ? Math.max(0, selectedCost - state.quarterlyBudget) : 0;
    const overspendRisk = state.scenarioMode && state.quarterlyBudget > 0 ? Math.min(15, overspend / state.quarterlyBudget * 10) : 0;
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
    set({
      ...resolvedState,
      score: Math.min(100, deriveScore(state, adjustedMetrics) + scenarioBonus),
      scenarioProgress,
      scenarioState: result.scenarioState,
      scenarioOverspend: overspend,
      scenarioBonus,
      stage: 'results',
      crisis: scenarioCrisis ? { ...scenarioCrisis, options: scenarioCrisis.options.map((option) => [option.label, option.description, option.impacts, option.cost] as [string, string, Record<string, number>, number?]) } : state.q % 3 === 0 && crisisRoll(state.initiativeGeneration.seed, state.q) < crisisProbability ? generateCrisis(state.initiativeGeneration.seed + state.q) : null,
      causalChain: causalChain(resolvedState, state.selected),
      proactiveRecommendations: generateProactiveRecommendations(resolvedState),
      discoveredSynergies,
      feedback: discovery?.message || `Quarter ${state.q} resolved. Your portfolio is now showing the consequences of this allocation.`,
      history: [...state.history, { ...result.snapshot, metrics: adjustedMetrics }],
    });
  },

  confirmV3Decisions: (plan, ledger) => {
    const state = normalizeGameState(get());
    const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
    if (!scenario?.v3) {
      return { accepted: false, errors: [{ code: 'v3-pack-required', message: 'The current scenario is not opted into V3.' }], metrics: {}, value: [] };
    }
    const metricKeys = new Set([...(scenario.v3.metrics || []), ...(scenario.v3.reportedMetrics || [])].map((metric) => metric.key));
    const metrics = Object.fromEntries(Object.entries(state.scenarioState?.metrics || {}).filter(([key]) => metricKeys.has(key)));
    const resolution = resolveV3Decision({ gameState: state, pack: scenario.v3, plan, ledger, metrics });
    if (!resolution.accepted || !resolution.state) return resolution;
    const nextScenarioMetrics = { ...(state.scenarioState?.metrics || {}) };
    Object.entries(resolution.metrics).forEach(([key, value]) => { if (metricKeys.has(key)) nextScenarioMetrics[key] = value; });
    set({
      v3State: resolution.state,
      scenarioState: { ...state.scenarioState, metrics: nextScenarioMetrics },
      scenarioProgress: state.scenarioProgress,
      stage: 'results',
      feedback: 'V3 decision recorded. Review the evidence and outcome before the next board window.',
    });
    return resolution;
  },

  confirmV3Window: (plan, ledger, window) => {
    const state = normalizeGameState(get());
    const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
    if (!scenario?.v3) return { accepted: false, errors: [{ code: 'v3-pack-required', message: 'The current scenario is not opted into V3.' }], metrics: {}, value: [] };
    const metricKeys = new Set([...(scenario.v3.metrics || []), ...(scenario.v3.reportedMetrics || [])].map((metric) => metric.key));
    const metrics = Object.fromEntries(Object.entries(state.scenarioState?.metrics || {}).filter(([key]) => metricKeys.has(key)));
    const resolution = resolveV3Window({ gameState: state, pack: scenario.v3, window, plan, ledger, metrics });
    if (!resolution.accepted || !resolution.state) return resolution;
    const nextScenarioMetrics = { ...(state.scenarioState?.metrics || {}) };
    Object.entries(resolution.metrics).forEach(([key, value]) => { if (metricKeys.has(key)) nextScenarioMetrics[key] = value; });
    set({
      ...state,
      q: window.quarterRange[0],
      v3State: { ...resolution.state, cursor: { windowId: window.id, phase: 'outcome', nextQuarter: window.quarterRange[1] + 1 } },
      scenarioState: { ...state.scenarioState, metrics: nextScenarioMetrics },
      stage: 'results',
      feedback: 'V3 board window resolved. Review the evidence, research finding, and uncertainty before the next window.',
    });
    return resolution;
  },

  setV3Baseline: (responses) => set((state) => state.v3State ? {
    v3State: {
      ...state.v3State,
      baseline: { version: 'v1', responses: responses.map((item) => ({ questionId: item.questionId, version: 'v1', response: item.response })) },
    },
  } : state),

  saveV3Reflection: (entryId, reflection) => set((state) => state.v3State ? {
    v3State: { ...state.v3State, ledger: state.v3State.ledger.map((entry) => entry.id === entryId ? { ...entry, reflection: reflection.trim() || undefined } : entry) },
  } : state),

  saveV3BoardMemo: (memo) => set((state) => state.v3State ? {
    v3State: { ...state.v3State, boardMemo: { ...(state.v3State.boardMemo || {}), ...memo, updatedAt: new Date().toISOString() } },
  } : state),

  saveV3ResponsibleImpact: (impact) => set((state) => state.v3State ? {
    v3State: { ...state.v3State, responsibleImpact: { ...(state.v3State.responsibleImpact || {}), ...impact } },
  } : state),

  setV3Cursor: (phase) => set((state) => state.v3State ? { v3State: { ...state.v3State, cursor: { windowId: state.v3State.cursor?.windowId || 'PF-W1', phase, nextQuarter: state.v3State.cursor?.nextQuarter || state.q } } } : state),

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
      spent: state.spent + (state.scenarioMode ? cost : 0),
      scenarioBudgetRemaining: state.scenarioMode ? Math.max(0, state.scenarioBudgetRemaining - cost) : state.scenarioBudgetRemaining,
      quarterlyCrisisCost: state.quarterlyCrisisCost + (state.scenarioMode ? cost : 0),
      crisis: null,
      stage: 'results' as const,
      ...(scenarioMetrics ? { scenarioState: { ...state.scenarioState, metrics: scenarioMetrics } } : {}),
    };
    return {
      ...next,
      scenarioProgress: scenario ? calculateScenarioProgress(next, scenario)?.values : next.scenarioProgress,
      ...(scenarioMetrics && scenario ? {
        scenarioState: {
          ...next.scenarioState,
          progress: calculateProgressPercentages(scenarioMetrics, scenario),
        },
      } : {}),
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
      scenarioOverspend: 0,
      feedback: `Quarter ${state.q + 1} is ready.`,
    });
  },

  advanceV3Window: (nextQuarter) => set((state) => {
    if (!state.v3State) return state;
    const quarter = Math.max(state.q, Math.min(12, Math.floor(nextQuarter)));
    return {
      ...state,
      q: quarter,
      stage: 'decide',
      selected: [],
      crisis: null,
      causalChain: [],
      proactiveRecommendations: [],
      quarterlyCrisisCost: 0,
      scenarioOverspend: 0,
      feedback: `Window ${Math.ceil(quarter / 3)} is ready.`,
      v3State: { ...state.v3State, currentQuarter: quarter, cursor: { windowId: state.v3State.cursor?.windowId || `PF-W${Math.ceil(quarter / 3)}`, phase: 'orient', nextQuarter: quarter } },
    };
  }),

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
    const allocationKey = title.toLowerCase().includes('compliance') || title.toLowerCase().includes('risk') ? 'compliance' : title.toLowerCase().includes('data') ? 'data' : title.toLowerCase().includes('training') || title.toLowerCase().includes('adoption') || title.toLowerCase().includes('people') ? 'people' : undefined;
    const guidance = { title, action: allocationKey ? `Increase ${allocationKey} allocation before confirming this quarter.` : 'Review this recommendation before confirming the quarter.', allocationKey };
    return { approvedRecommendations: state.approvedRecommendations.includes(title) ? state.approvedRecommendations : [...state.approvedRecommendations, title], nextQuarterGuidance: guidance, feedback: `Recommendation approved: ${title}. It is queued as next-quarter guidance.` };
  }),
  applyRecommendation: () => set((state) => {
    const key = state.nextQuarterGuidance?.allocationKey as keyof typeof state.alloc | undefined;
    if (!key) return { feedback: 'Review the recommendation manually before confirming.', nextQuarterGuidance: null };
    const current = state.alloc[key]; const increase = Math.min(8, 20 - current); const source: keyof typeof state.alloc = key === 'infra' ? 'innovation' : 'infra'; const available = state.alloc[source]; const shift = Math.min(increase, Math.max(0, available - 5));
    return shift <= 0 ? { feedback: `Keep ${key} at ${current}%; the recommendation is noted for this quarter.`, nextQuarterGuidance: null } : { alloc: { ...state.alloc, [key]: current + shift, [source]: available - shift }, feedback: `Applied guidance: ${key} allocation increased by ${shift} points.`, nextQuarterGuidance: null };
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
