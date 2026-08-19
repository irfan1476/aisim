import type { GameState } from './state';

export function calculateMetrics(state: GameState, selected: string[]): Partial<GameState> {
  const chosen = selected.map((id) => state.initiativeStates[id]).filter(Boolean);
  const factor = (state.alloc.people >= 15 ? 1.12 : 0.94) * (state.alloc.compliance >= 10 ? 1.05 : 0.93);
  return {
    roi: Math.min(99, state.roi + chosen.reduce((a, i) => a + i.roi, 0) / 100 * factor / 2),
    revenue: Math.min(60, state.revenue + chosen.reduce((a, i) => a + (i.id === 'demand' ? 3 : i.id === 'quality' || i.id === 'supply' ? 2 : 1), 0)),
    efficiency: Math.min(95, state.efficiency + chosen.reduce((a, i) => a + (i.id === 'energy' ? 7 : i.id === 'maintenance' ? 6 : 3), 0)),
    adoption: Math.min(98, state.adoption + (state.alloc.people >= 18 ? 8 : 3) + (chosen.some((i) => i.id === 'knowledge') ? 7 : 0)),
    risk: Math.max(5, state.risk + (chosen.some((i) => i.risk === 'HIGH') ? 6 : -3) - (state.alloc.compliance >= 12 ? 5 : 0)),
    data: Math.min(98, state.data + state.alloc.data / 10 + (chosen.some((i) => i.id === 'demand') ? 3 : 0)),
    satisfaction: Math.min(98, state.satisfaction + state.alloc.people / 5 + (chosen.some((i) => i.id === 'knowledge') ? 5 : 0)),
    literacy: Math.min(98, state.literacy + state.alloc.people / 4),
    spent: state.spent + chosen.reduce((a, i) => a + i.cost, 0),
  };
}

export function causalChain(state: GameState, selected: string[]) {
  const factor = (state.alloc.people >= 15 ? 1.12 : 0.94) * (state.alloc.compliance >= 10 ? 1.05 : 0.93);
  return selected.map((id) => state.initiativeStates[id]).filter(Boolean).map((i) => {
    const effects: { metric: string; delta: number; color: string }[] = [];
    const roiDelta = i.roi / 100 * factor / 2;
    if (roiDelta > 0.5) effects.push({ metric: 'ROI', delta: roiDelta, color: 'emerald' });
    const adoptionDelta = (i.id === 'knowledge' ? 7 : i.id === 'demand' ? 3 : i.id === 'quality' || i.id === 'supply' ? 2 : 1) + (state.alloc.people - 15) * 0.3;
    if (Math.abs(adoptionDelta) > 1) effects.push({ metric: 'Adoption', delta: adoptionDelta, color: 'purple' });
    const riskDelta = (i.currentRisk === 'HIGH' ? 6 : i.currentRisk === 'MED' ? 2 : -2) - state.alloc.compliance / 20;
    if (Math.abs(riskDelta) > 1) effects.push({ metric: 'Risk', delta: riskDelta, color: 'crimson' });
    const dataDelta = i.id === 'demand' ? 3 : i.id === 'maintenance' ? 2 : i.id === 'quality' ? 1 : 0;
    if (dataDelta > 1) effects.push({ metric: 'Data', delta: dataDelta, color: 'cyan' });
    return { name: i.name, effects };
  }).filter((item) => item.effects.length > 0);
}
