'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { initialGameState, normalizeDeploymentAmount, quarterlyDeploymentCap, type Allocation, type GameState, type Recommendation } from '../lib/game/state';
import { getScenario } from '../lib/scenarios/registry';
import { scenarioInitiativesToStates } from '../lib/game/initiativeAdapter';
import { advanceTurn, applyCrisisResponse, applyTurnDecision } from '../lib/game/turnResolver';
import { clearActiveCounterfactualTrace, createCounterfactualTrace, readActiveCounterfactualTrace, recordCrisisResponse, recordDecision, writeActiveCounterfactualTrace } from '../lib/counterfactual';
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
  readLatestViableCampaignCheckpoint,
  saveCampaignCheckpoint,
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
  saveCampaign: () => void;
  applyWhatIfDraft: (draft: WhatIfDraft) => void;
  saveWhatIfDraft: (draft: WhatIfDraft) => void;
  clearWhatIfDraft: () => void;
  approveRecommendation: (title: string) => void;
  applyRecommendation: () => void;
  dismissRecommendation: () => void;
  saveReflection: (reflection: Partial<GameState['userReflections']>) => void;
  loadGame: (state: unknown) => void;
  initializeScenario: (scenarioId: string, campaignBudget?: number) => void;
  restoreLatestViableCheckpoint: () => boolean;
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
    clearActiveCounterfactualTrace();
    const next = initialGameState();
    set(next);
    saveCampaignCheckpoint(next, 'Quarter 1 decision point');
  },

  initializeScenario: (scenarioId, campaignBudgetOverride) => {
    let nextState: GameState | null = null;
    set((state) => {
    const scenario = getScenario(scenarioId);
    if (!scenario) return state;
    const campaignBudget = Number.isFinite(campaignBudgetOverride) && Number(campaignBudgetOverride) > 0
      ? Number(campaignBudgetOverride)
      : scenario.startingState.budget * 12;
    const quarterlyBudget = campaignBudget / 12;
    const deploymentCap = quarterlyDeploymentCap(campaignBudget, campaignBudget, quarterlyBudget, 1, 0);
    const startingMetrics = { ...scenario.startingState.startingMetrics };
    const nativeMetrics = {
      efficiency: startingMetrics.efficiency ?? state.efficiency,
      adoption: startingMetrics.adoption ?? state.adoption,
      data: startingMetrics.data ?? state.data,
      satisfaction: startingMetrics.satisfaction ?? state.satisfaction,
    };
    const progress = Object.fromEntries(scenario.progress.map((item) => [item.key, 0]));
    nextState = {
      ...state,
      scenarioMode: true,
      scenarioId: scenario.id,
      quarterlyBudget,
      campaignBudget,
      campaignBudgetRemaining: campaignBudget,
      scenarioBudgetRemaining: quarterlyBudget,
      deploymentAmount: Math.min(quarterlyBudget * 0.6, deploymentCap),
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
    return nextState;
    });
    if (nextState) saveCampaignCheckpoint(nextState, 'Quarter 1 decision point');
  },

  selectInitiatives: (ids) => set({ selected: Array.from(new Set(ids)).slice(0, 3) }),

  updateAllocation: (key, value) => set((state) => ({ alloc: { ...state.alloc, [key]: value } })),

  setDeploymentAmount: (amount) => set((state) => ({
    deploymentAmount: normalizeDeploymentAmount(amount, state.campaignBudget, state.campaignBudgetRemaining, state.quarterlyBudget, state.q, state.spent),
  })),

  confirmDecisions: () => {
    const before = normalizeGameState(get());
    const resolution = applyTurnDecision(before, {
      selected: before.selected,
      alloc: before.alloc,
      deploymentAmount: before.deploymentAmount,
    });
    if (resolution.accepted) {
      const trace = readActiveCounterfactualTrace() || createCounterfactualTrace(before);
      writeActiveCounterfactualTrace(recordDecision(trace, {
        type: 'decision',
        q: before.q,
        ...resolution.decision,
      }));
    }
    set(resolution.nextState);
  },

  respondToCrisis: (impact, cost = 0) => set((state) => {
    const trace = readActiveCounterfactualTrace();
    if (trace) {
      writeActiveCounterfactualTrace(recordCrisisResponse(trace, {
        type: 'crisis-response',
        q: state.q,
        impact,
        cost,
        eventTitle: state.crisis?.title,
        eventType: state.crisis?.type,
      }));
    }
    return applyCrisisResponse(state, { impact, cost });
  }),

  advanceQuarter: () => {
    const next = advanceTurn(get());
    set(next);
    if (next.stage === 'decide') saveCampaignCheckpoint(next, `Quarter ${next.q} decision point`);
  },

  quickReset: () => set((state) => quickResetState(normalizeGameState(state))),

  resetCampaign: () => {
    clearPersistedCampaign();
    clearActiveCounterfactualTrace();
    const next = initialGameState();
    set(next);
    saveCampaignCheckpoint(next, 'Quarter 1 decision point');
  },

  resetAllData: () => {
    clearPersistedGameData();
    clearActiveCounterfactualTrace();
    const next = initialGameState();
    set(next);
    saveCampaignCheckpoint(next, 'Quarter 1 decision point');
  },

  // Backwards-compatible campaign reset action.
  resetGame: () => {
    clearPersistedCampaign();
    clearActiveCounterfactualTrace();
    set(initialGameState());
  },

  // Persist middleware writes the current snapshot on every state update. A
  // dedicated action gives the UI an explicit, learner-visible checkpoint
  // without changing any measured gameplay state.
  saveCampaign: () => {
    const state = normalizeGameState(get());
    saveCampaignCheckpoint(state, `Manual checkpoint · Q${state.q}`);
    set({ feedback: `Checkpoint saved for Quarter ${state.q}.` });
  },

  restoreLatestViableCheckpoint: () => {
    const current = normalizeGameState(get());
    const checkpoint = readLatestViableCampaignCheckpoint(current);
    if (!checkpoint) {
      set({ feedback: 'No earlier funded decision checkpoint is available for this campaign. Restart to try a new capital pace.' });
      return false;
    }
    set({ ...checkpoint.state, feedback: `Restored ${checkpoint.label}. Revise the capital pace, then continue.` });
    return true;
  },

  applyWhatIfDraft: (draft) => {
    const normalized = normalizeWhatIfDraft(draft);
    if (!normalized) return;
    set((state) => ({
      selected: normalized.selected,
      alloc: normalized.alloc,
      deploymentAmount: normalized.deploymentAmount === undefined
        ? state.deploymentAmount
        : normalizeDeploymentAmount(normalized.deploymentAmount, state.campaignBudget, state.campaignBudgetRemaining, state.quarterlyBudget, state.q, state.spent),
      feedback: 'What-If strategy applied to the next decision.',
    }));
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
    const deployment = normalizeDeploymentAmount(guidance.deploymentAmount, state.campaignBudget, state.campaignBudgetRemaining, state.quarterlyBudget, state.q, state.spent);
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
