'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initialGameState, type GameState } from '../lib/game/state';
import { causalChain } from '../lib/game/metrics';
import { generateCrisis } from '../lib/game/crises';
import { generateProactiveRecommendations } from '../lib/game/recommendations';
import { hydrateGameState, resolveQuarter, deriveScore } from '../lib/game/engine';

type GameStore = GameState & { startGame: () => void; selectInitiatives: (ids: string[]) => void; updateAllocation: (key: keyof GameState['alloc'], value: number) => void; confirmDecisions: () => void; respondToCrisis: (impact: Record<string, number>) => void; advanceQuarter: () => void; resetGame: () => void; loadGame: (state: GameState) => void };
export const useGameStore = create<GameStore>()(persist((set, get) => ({
  ...initialGameState(), startGame: () => set(initialGameState()), selectInitiatives: (ids) => set({ selected: ids }),
  updateAllocation: (key, value) => set((state) => ({ alloc: { ...state.alloc, [key]: value } })),
  confirmDecisions: () => { const state = hydrateGameState(get()); const result = resolveQuarter(state, { selected: state.selected, alloc: state.alloc }); const next = { ...state, ...result.metrics, initiativeStates: result.initiativeStates, score: deriveScore(state, result.metrics), stage: 'results' as const, crisis: state.q % 3 === 0 ? generateCrisis() : null, causalChain: causalChain(state, state.selected), proactiveRecommendations: generateProactiveRecommendations({ ...state, ...result.metrics }), history: [...state.history, result.snapshot] }; set(next); },
  respondToCrisis: (impact) => set((state) => ({ ...impact, crisis: null, stage: 'results' })),
  advanceQuarter: () => { const state = get(); if (state.q >= 12) return set({ stage: 'done' }); set({ q: state.q + 1, stage: 'decide', selected: [], crisis: null, causalChain: [], proactiveRecommendations: [], feedback: `Quarter ${state.q + 1} is ready.` }); },
  resetGame: () => set(initialGameState()), loadGame: (state) => set(state),
}), { name: 'ai-investment-game' }));

export function useGameState(initializer: () => any): [any, (update: any) => void] {
  const store = useGameStore();
  const setState = useGameStore.setState;
  if (!store.feedback) setState(initializer());
  return [store, (update) => setState((current) => typeof update === 'function' ? update(current) : update)];
}
