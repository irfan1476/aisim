'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { initialGameState, normalizeDeploymentAmount, quarterlyDeploymentCap, type Allocation, type GameState, type Recommendation } from '../lib/game/state';
import { getScenario } from '../lib/scenarios/registry';
import { scenarioInitiativesToStates } from '../lib/game/initiativeAdapter';
import { advanceTurn, applyCrisisResponse, applyTurnDecision } from '../lib/game/turnResolver';
import type { InitiativeAction } from '../lib/game/businessModel';
import type { AdaptationInput, DeploymentModeInput, LifecycleReviewInput } from '../lib/game/businessModel';
import { applyAdaptation, applyDeploymentMode, applyLifecycleReview, normalizeLifecycleReviewInput, suggestedLifecycleAction } from '../lib/game/lifecycleResolver';
import { allocationForInitiative, seedInitiativeAllocations } from '../lib/game/initiativeAllocation';
import { clearActiveCounterfactualTrace, createCounterfactualTrace, readActiveCounterfactualTrace, recordCrisisResponse, recordDecision, recordLifecycleDecisions, writeActiveCounterfactualTrace } from '../lib/counterfactual';
import type { AdaptationDecision, DeploymentModeDecision, EvaluationDecision, LifecycleDecisionPayload, RecordedDecision } from '../lib/counterfactual';
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
  setInitiativeAction: (id: string, action: InitiativeAction) => void;
  updateAllocation: (key: keyof GameState['alloc'], value: number) => void;
  setInitiativeAllocationMode: (mode: GameState['initiativeAllocationMode']) => void;
  updateInitiativeAllocation: (initiativeId: string, key: keyof GameState['alloc'], value: number) => void;
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
  submitLifecycleEvaluation: (payload: LifecycleReviewInput) => void;
  submitLifecycleDeployment: (payload: DeploymentModeInput) => void;
  submitLifecycleAdaptation: (payload: AdaptationInput) => void;
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

function pendingLifecycleReviews(state: GameState): number {
  return (state.selected || []).reduce((count, id) => {
    const item = state.initiativeStates?.[id] as any;
    if (!item) return count;
    const stage = item.aiLifecycle?.stage;
    const status = item.aiLifecycle?.stageStatus;
    const decision = item.evaluation?.goNoGoDecision;
    const evaluation = item.evaluation && stage === 'evaluate' && !['go', 'no_go', 'pause'].includes(decision);
    const deployment = item.deploymentMode === 'not_set' && stage === 'deploy' && status !== 'completed';
    const monitoring = item.monitoring;
    const latestAdaptation = Array.isArray(item.adaptationHistory) ? item.adaptationHistory.at(-1) : undefined;
    const adaptation = Boolean(item.lifecycle !== 'retired' && status !== 'completed' && !(latestAdaptation && Number(latestAdaptation.quarter) >= Number(state.q)) && monitoring && (monitoring.isDegraded || monitoring.actionAvailable || monitoring.availableActions?.length));
    return count + Number(evaluation) + Number(deployment) + Number(adaptation);
  }, 0);
}

function recordLifecycleDecisionInTrace(
  state: GameState,
  kind: 'evaluation' | 'deployment' | 'adaptation',
  payload: EvaluationDecision | DeploymentModeDecision | AdaptationDecision,
): void {
  const trace = readActiveCounterfactualTrace();
  if (!trace) return;
  const recorded = trace.actions.find((action): action is RecordedDecision => action.type === 'decision' && action.q === state.q);
  if (!recorded) return;
  let lifecycle: LifecycleDecisionPayload;
  if (kind === 'evaluation') {
    const next = [...(recorded.evaluationDecisions || []).filter((item: EvaluationDecision) => item.initiativeId !== payload.initiativeId), payload as EvaluationDecision];
    lifecycle = { evaluationDecisions: next };
  } else if (kind === 'deployment') {
    const next = [...(recorded.deploymentDecisions || []).filter((item: DeploymentModeDecision) => item.initiativeId !== payload.initiativeId), payload as DeploymentModeDecision];
    lifecycle = { deploymentDecisions: next };
  } else {
    const next = [...(recorded.adaptationDecisions || []).filter((item: AdaptationDecision) => item.initiativeId !== payload.initiativeId), payload as AdaptationDecision];
    lifecycle = { adaptationDecisions: next };
  }
  writeActiveCounterfactualTrace(recordLifecycleDecisions(trace, state.q, lifecycle as LifecycleDecisionPayload));
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
      initiativeAllocationMode: 'shared',
      initiativeAllocations: {},
      selected: [],
      initiativeActions: {},
      stage: 'decide',
      initiativeStates: scenario.initiatives ? scenarioInitiativesToStates(scenario.initiatives) : state.initiativeStates,
      ...nativeMetrics,
    };
    return nextState;
    });
    if (nextState) saveCampaignCheckpoint(nextState, 'Quarter 1 decision point');
  },

  selectInitiatives: (ids) => set((state) => {
    const selected = Array.from(new Set(ids)).slice(0, 3);
    // Selection is the portfolio scope for new delivery/discovery work. Drop
    // stale delivery actions when a card is deselected; otherwise the resolver
    // can still fund the old action even though the card is no longer chosen.
    const selectedSet = new Set(selected);
    const initiativeActions = Object.fromEntries(
      Object.entries(state.initiativeActions).filter(([id, action]) =>
        selectedSet.has(id) || action === 'maintain' || action === 'pause' || action === 'retire',
      ),
    );
    selected.forEach((id) => {
      const existing = initiativeActions[id];
      // Selection is a portfolio-scope choice, not a lifecycle decision.
      // Preserve any action the learner already chose, including pause.
      if (existing) return;
      const initiative = state.initiativeStates[id];
      initiativeActions[id] = state.scenarioMode && initiative
        ? suggestedLifecycleAction(initiative, state.q)
        : 'scale';
    });
    return { selected, initiativeActions };
  }),

  setInitiativeAction: (id, action) => set((state) => {
    if (!state.initiativeStates[id]) return {};
    const initiativeActions = { ...state.initiativeActions, [id]: action };
    // Discovery is a genuine portfolio investment: it consumes capital and
    // should count toward the three-initiative focus limit even though it
    // does not yet create delivery outcomes.
    const selected = ['discover', 'pilot', 'scale'].includes(action)
      ? Array.from(new Set([...state.selected.filter((item) => item !== id), id])).slice(0, 3)
      : state.selected.filter((item) => item !== id);
    return { initiativeActions, selected };
  }),

  updateAllocation: (key, value) => set((state) => ({
    alloc: { ...state.alloc, [key]: Math.min(50, Math.max(5, Math.round(Number(value) || 0))) },
  })),

  setInitiativeAllocationMode: (mode) => set((state) => ({
    initiativeAllocationMode: mode,
    initiativeAllocations: mode === 'custom'
      ? { ...state.initiativeAllocations, ...seedInitiativeAllocations(state.selected, state.initiativeAllocations, state.alloc) }
      : state.initiativeAllocations,
  })),

  updateInitiativeAllocation: (initiativeId, key, value) => set((state) => {
    if (!state.initiativeStates[initiativeId]) return {};
    const current = allocationForInitiative(initiativeId, state.initiativeAllocationMode, state.initiativeAllocations, state.alloc);
    return {
      initiativeAllocationMode: 'custom',
      initiativeAllocations: {
        ...state.initiativeAllocations,
        [initiativeId]: {
          ...current,
          [key]: Math.min(50, Math.max(5, Math.round(Number(value) || 0))),
        },
      },
    };
  }),

  setDeploymentAmount: (amount) => set((state) => ({
    deploymentAmount: normalizeDeploymentAmount(amount, state.campaignBudget, state.campaignBudgetRemaining, state.quarterlyBudget, state.q, state.spent),
  })),

  confirmDecisions: () => {
    const before = normalizeGameState(get());
    const resolution = applyTurnDecision(before, {
      selected: before.selected,
      initiativeActions: before.initiativeActions,
      alloc: before.alloc,
      initiativeAllocationMode: before.initiativeAllocationMode,
      initiativeAllocations: before.initiativeAllocations,
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
    const current = normalizeGameState(get());
    const reviews = pendingLifecycleReviews(current);
    if (reviews > 0) {
      set({ feedback: `Complete ${reviews} pending lifecycle review${reviews === 1 ? '' : 's'} before advancing the quarter.` });
      return;
    }
    const next = advanceTurn(current);
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
      initiativeActions: normalized.initiativeActions || state.initiativeActions,
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

  submitLifecycleEvaluation: (payload) => set((state) => {
    const current = normalizeGameState(state);
    const review = normalizeLifecycleReviewInput(payload);
    const next = applyLifecycleReview(current, review);
    recordLifecycleDecisionInTrace(current, 'evaluation', review);
    return next;
  }),
  submitLifecycleDeployment: (payload) => set((state) => {
    const current = normalizeGameState(state);
    const next = applyDeploymentMode(current, payload);
    recordLifecycleDecisionInTrace(current, 'deployment', payload);
    return next;
  }),
  submitLifecycleAdaptation: (payload) => set((state) => {
    const current = normalizeGameState(state);
    const next = applyAdaptation(current, payload);
    recordLifecycleDecisionInTrace(current, 'adaptation', payload);
    return next;
  }),
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
