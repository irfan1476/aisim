'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initialGameState, type GameState } from '../lib/game/state';
import { calculateMetrics, causalChain } from '../lib/game/metrics';
import { generateCrisis } from '../lib/game/crises';
import { generateProactiveRecommendations } from '../lib/game/recommendations';
import { initiatives } from '../lib/game/initiatives';

type GameStore = GameState & { startGame: () => void; selectInitiatives: (ids: string[]) => void; updateAllocation: (key: keyof GameState['alloc'], value: number) => void; confirmDecisions: () => void; respondToCrisis: (impact: Record<string, number>) => void; advanceQuarter: () => void; resetGame: () => void; loadGame: (state: GameState) => void };
export const useGameStore = create<GameStore>()(persist((set, get) => ({
  ...initialGameState(), startGame: () => set(initialGameState()), selectInitiatives: (ids) => set({ selected: ids }),
  updateAllocation: (key, value) => set((state) => ({ alloc: { ...state.alloc, [key]: value } })),
  confirmDecisions: () => { const state = get(); const metrics = calculateMetrics(state, state.selected); const next = { ...state, ...metrics }; set({ ...metrics, stage: 'results', crisis: state.q % 3 === 0 ? generateCrisis() : null, causalChain: causalChain(state, state.selected), proactiveRecommendations: generateProactiveRecommendations(next), history: [...state.history, { q: state.q, chosen: state.selected.map((id) => initiatives.find((i) => i.id === id)?.name), metrics }] }); },
  respondToCrisis: (impact) => set((state) => ({ ...impact, crisis: null, stage: 'results' })),
  advanceQuarter: () => { const state = get(); if (state.q >= 12) return set({ stage: 'done' }); set({ q: state.q + 1, stage: 'decide', selected: [], crisis: null, causalChain: [], proactiveRecommendations: [], feedback: `Quarter ${state.q + 1} is ready.` }); },
  resetGame: () => set(initialGameState()), loadGame: (state) => set(state),
}), { name: 'ai-investment-game' }));
