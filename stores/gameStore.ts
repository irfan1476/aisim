'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { initialGameState, type GameState } from '../lib/game/state';
import { causalChain } from '../lib/game/metrics';
import { generateCrisis } from '../lib/game/crises';
import { generateProactiveRecommendations } from '../lib/game/recommendations';
import { resolveQuarter, deriveScore } from '../lib/game/engine';
import { describeSynergies } from '../lib/game/generator';
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
  respondToCrisis: (impact: Record<string, number>) => void;
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
  loadGame: (state: unknown) => void;
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

  selectInitiatives: (ids) => set({ selected: [...ids] }),

  updateAllocation: (key, value) => set((state) => ({ alloc: { ...state.alloc, [key]: value } })),

  confirmDecisions: () => {
    const state = normalizeGameState(get());
    const result = resolveQuarter(state, { selected: state.selected, alloc: state.alloc });
    const resolvedState = { ...state, ...result.metrics, initiativeStates: result.initiativeStates };
    const discovery = describeSynergies(state.selected, result.initiativeStates);
    const newlyDiscovered = discovery?.effects.map(effect => effect.key) || [];
    const discoveredSynergies = Array.from(new Set([...state.discoveredSynergies, ...newlyDiscovered]));
    const resolvedRisk = Number(result.metrics.risk ?? state.risk);
    const crisisProbability = Math.max(.08, Math.min(.7, (resolvedRisk - 15) / 75));
    set({
      ...resolvedState,
      score: deriveScore(state, result.metrics),
      stage: 'results',
      crisis: state.q % 3 === 0 && crisisRoll(state.initiativeGeneration.seed, state.q) < crisisProbability ? generateCrisis(state.initiativeGeneration.seed + state.q) : null,
      causalChain: causalChain(resolvedState, state.selected),
      proactiveRecommendations: generateProactiveRecommendations(resolvedState),
      discoveredSynergies,
      feedback: discovery?.message || `Quarter ${state.q} resolved. Your portfolio is now showing the consequences of this allocation.`,
      history: [...state.history, result.snapshot],
    });
  },

  respondToCrisis: (impact) => set((state) => ({ ...impact, crisis: null, stage: 'results' })),

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
