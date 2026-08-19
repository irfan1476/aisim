import { initiatives } from './initiatives';
import { updateInitiativeStates, initializeInitiativeStates, type InitiativeState } from './initiativeState';
import type { GameState, QuarterSnapshot } from './state';

export type QuarterDecision = { selected: string[]; alloc: GameState['alloc'] };

export function hydrateGameState(state: GameState): GameState {
  return { ...state, initiativeStates: Object.keys(state.initiativeStates || {}).length ? state.initiativeStates : initializeInitiativeStates(), history: state.history || [] };
}

export function resolveQuarter(state: GameState, decision: QuarterDecision): { metrics: Partial<GameState>; initiativeStates: Record<string, InitiativeState>; snapshot: QuarterSnapshot } {
  const current = hydrateGameState(state); const evolved = updateInitiativeStates(current.initiativeStates, decision.selected, decision.alloc, { adoption: current.adoption });
  const chosen = decision.selected.map(id => evolved[id]).filter(Boolean);
  const factor = (decision.alloc.people >= 15 ? 1.12 : 0.94) * (decision.alloc.compliance >= 10 ? 1.05 : .93);
  const metrics: Partial<GameState> = {
    roi: Math.min(99, current.roi + chosen.reduce((sum, item) => sum + item.currentRoi, 0) / 100 * factor / 2),
    revenue: Math.min(60, current.revenue + chosen.reduce((sum, item) => sum + (item.id === 'demand' ? 3 : ['quality', 'supply'].includes(item.id) ? 2 : 1), 0)),
    efficiency: Math.min(95, current.efficiency + chosen.reduce((sum, item) => sum + (item.id === 'energy' ? 7 : item.id === 'maintenance' ? 6 : 3), 0)),
    adoption: Math.min(98, current.adoption + (decision.alloc.people >= 18 ? 8 : 3) + (chosen.some(item => item.id === 'knowledge') ? 7 : 0)),
    risk: Math.max(5, current.risk + (chosen.some(item => item.currentRisk === 'HIGH') ? 6 : -3) - (decision.alloc.compliance >= 12 ? 5 : 0)),
    data: Math.min(98, current.data + decision.alloc.data / 10 + (chosen.some(item => item.id === 'demand') ? 3 : 0)),
    satisfaction: Math.min(98, current.satisfaction + decision.alloc.people / 5 + (chosen.some(item => item.id === 'knowledge') ? 5 : 0)),
    literacy: Math.min(98, current.literacy + decision.alloc.people / 4),
    spent: current.spent + chosen.reduce((sum, item) => sum + item.currentCost, 0),
  };
  const snapshot: QuarterSnapshot = { q: current.q, chosen: chosen.map(item => item.name), metrics, initiativeStates: JSON.parse(JSON.stringify(evolved)) };
  return { metrics, initiativeStates: evolved, snapshot };
}

export function deriveScore(state: GameState, metrics: Partial<GameState>) {
  return Math.round((Number(metrics.roi ?? state.roi) + Number(metrics.adoption ?? state.adoption) + Number(metrics.efficiency ?? state.efficiency) + (100 - Number(metrics.risk ?? state.risk))) / 4);
}
