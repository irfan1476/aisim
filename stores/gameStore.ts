'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { initialGameState, type GameState } from '../lib/game/state';
import { causalChain } from '../lib/game/metrics';
import { generateCrisis } from '../lib/game/crises';
import { getScenario } from '../lib/scenarios/registry';
import { calculateScenarioProgress } from '../lib/scenarios/progress';
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
  initializeScenario: (scenarioId: string) => void;
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
    return {
      ...state,
      scenarioMode: true,
      scenarioId: scenario.id,
      quarterlyBudget: scenario.startingState.budget,
      scenarioStartingMetrics: startingMetrics,
      scenarioProgress: progress,
      scenarioState: { metrics: startingMetrics, progress, flags: {} },
      alloc: { ...scenario.startingState.defaultAllocation },
      initiativeStates: scenario.initiatives ? scenarioInitiativesToStates(scenario.initiatives) : state.initiativeStates,
      ...nativeMetrics,
    };
  }),

  selectInitiatives: (ids) => set({ selected: [...ids] }),

  updateAllocation: (key, value) => set((state) => ({ alloc: { ...state.alloc, [key]: value } })),

  confirmDecisions: () => {
    const state = normalizeGameState(get());
    const result = resolveQuarter(state, { selected: state.selected, alloc: state.alloc });
    const selectedCost = state.selected.reduce((sum, id) => sum + Number(result.initiativeStates[id]?.currentCost || 0), 0);
    const overspend = state.scenarioMode ? Math.max(0, selectedCost - state.quarterlyBudget) : 0;
    const overspendRisk = state.scenarioMode && state.quarterlyBudget > 0 ? Math.min(15, overspend / state.quarterlyBudget * 10) : 0;
    const adjustedMetrics = { ...result.metrics, risk: Math.min(95, Number(result.metrics.risk ?? state.risk) + overspendRisk) };
    const resolvedState = { ...state, ...adjustedMetrics, initiativeStates: result.initiativeStates, scenarioState: result.scenarioState };
    const discovery = describeSynergies(state.selected, result.initiativeStates);
    const newlyDiscovered = discovery?.effects.map(effect => effect.key) || [];
    const discoveredSynergies = Array.from(new Set([...state.discoveredSynergies, ...newlyDiscovered]));
    const resolvedRisk = Number(adjustedMetrics.risk ?? state.risk);
    const crisisProbability = Math.max(.08, Math.min(.7, (resolvedRisk - 15) / 75));
    const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
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

  respondToCrisis: (impact, cost = 0) => set((state) => {
    const next = { ...state, ...impact, spent: state.spent + (state.scenarioMode ? cost : 0), quarterlyCrisisCost: state.quarterlyCrisisCost + (state.scenarioMode ? cost : 0), crisis: null, stage: 'results' as const };
    const scenario = next.scenarioMode ? getScenario(next.scenarioId) : undefined;
    return { ...next, scenarioProgress: scenario ? calculateScenarioProgress(next, scenario)?.values : next.scenarioProgress };
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
