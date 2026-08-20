import type { ScenarioDefinition } from '../scenarios/types';
import type { GameState, ScenarioState } from './state';
import type { InitiativeState } from './initiativeState';
import type { Allocation } from './state';
import { allocationToReadiness } from './allocation';
import { maturityReadiness } from './maturity';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type StandardEffectInputs = {
  synergyMultiplier: number;
  synergyRiskReduction: number;
  synergyAdoption: number;
  synergyCostReduction: number;
};

/**
 * The original Standard-mode formulas live here unchanged. Keeping this pure
 * makes the regression boundary explicit before scenario effects are merged.
 */
export function calculateStandardEffects(
  current: GameState,
  selected: string[],
  allocation: GameState['alloc'],
  chosen: InitiativeState[],
  inputs: StandardEffectInputs,
): Partial<GameState> {
  const averageRiskScore = chosen.length
    ? chosen.reduce((sum, item) => sum + Number(item.riskScore ?? 48), 0) / chosen.length
    : 48;
  const portfolioRiskPressure = (averageRiskScore - 48) / 10;
  const governanceRelief = (Number(allocation.compliance || 0) - 10) / 5;
  const factor = (allocation.people >= 15 ? 1.12 : 0.94) * (allocation.compliance >= 10 ? 1.05 : 0.93);
  const adoptionHeadroom = Math.max(0.18, 1 - current.adoption / 115);
  const teamReadiness = 0.8 + Number(current.initiativeGeneration?.context.team || 0.6) * 0.3;
  const adoptionGain = (0.8 + allocation.people / 10 + (chosen.some((item) => item.id === 'knowledge') ? 2.5 : 0) + inputs.synergyAdoption) * adoptionHeadroom * teamReadiness;
  const technicalLeverage = 0.7 + (allocation.infra + allocation.mlops) / 100;
  const efficiencyGain = chosen.reduce((sum, item) => sum + (item.id === 'energy' ? 7 : item.id === 'maintenance' ? 6 : 3), 0) * 0.3 * technicalLeverage;
  const riskChange = portfolioRiskPressure * 0.55 - governanceRelief * (0.5 + current.risk / 60) - inputs.synergyRiskReduction;
  return {
    roi: Math.min(99, current.roi + (((chosen.reduce((sum, item) => sum + item.currentRoi, 0) / 100) * factor / 2) * inputs.synergyMultiplier)),
    revenue: Math.min(60, current.revenue + chosen.reduce((sum, item) => sum + (item.id === 'demand' ? 3 : ['quality', 'supply'].includes(item.id) ? 2 : 1), 0)),
    efficiency: Math.min(95, current.efficiency + efficiencyGain),
    adoption: Math.min(98, current.adoption + adoptionGain),
    risk: Math.max(5, Math.min(95, current.risk + riskChange)),
    data: Math.min(98, current.data + allocation.data / 10 + (chosen.some((item) => item.id === 'demand') ? 3 : 0)),
    satisfaction: Math.min(98, current.satisfaction + allocation.people / 5 + (chosen.some((item) => item.id === 'knowledge') ? 5 : 0)),
    literacy: Math.min(98, current.literacy + allocation.people / 4),
    spent: current.spent + chosen.reduce((sum, item) => sum + item.currentCost, 0) * (1 - inputs.synergyCostReduction),
  };
}

export function applyScenarioEffects(
  scenario: ScenarioDefinition,
  previous: ScenarioState,
  states: Record<string, InitiativeState>,
  selected: string[],
  allocation: Allocation,
  adoption: number,
): ScenarioState {
  const metrics = { ...previous.metrics };
  const readiness = allocationToReadiness(allocation);
  const adoptionFactor = 0.7 + clamp(adoption / 100, 0, 1) * 0.3;
  const definitions = new Map(scenario.progress.map((item) => [item.key, item]));

  selected.forEach((id) => {
    const state = states[id];
    const metadata = state?.scenarioMetadata;
    if (!metadata) return;
    const definition = definitions.get(metadata.primaryMetric);
    if (!definition) return;
    const readinessFactor = 0.55 + readiness.data * 0.2 + readiness.people * 0.15 + readiness.governance * 0.1;
    const diminishingReturns = 1 / (1 + Math.max(0, state.quartersFunded - 1) * 0.08);
    const effect = metadata.baseEffect * maturityReadiness(state.maturityLevel) * readinessFactor * adoptionFactor * diminishingReturns;
    metrics[metadata.primaryMetric] = clamp((metrics[metadata.primaryMetric] ?? definition.start) + effect, definition.min, definition.max);
  });

  Object.values(states).forEach((state) => {
    if (selected.includes(state.id)) return;
    const metadata = state.scenarioMetadata;
    if (!metadata || state.quartersSinceLastFund < metadata.neglect.penaltyThreshold) return;
    const definition = definitions.get(metadata.primaryMetric);
    if (!definition) return;
    const direction = metadata.baseEffect >= 0 ? -1 : 1;
    const penalty = metadata.neglect.penaltyAmount * metadata.neglect.decayRate * Math.max(1, state.quartersSinceLastFund - metadata.neglect.penaltyThreshold + 1);
    metrics[metadata.primaryMetric] = clamp((metrics[metadata.primaryMetric] ?? definition.start) + direction * penalty, definition.min, definition.max);
  });

  const progress = Object.fromEntries(scenario.progress.map((definition) => {
    const current = clamp(metrics[definition.key] ?? definition.start, definition.min, definition.max);
    const span = Math.max(1, Math.abs(definition.target - definition.start));
    const moved = definition.direction === 'higher-is-better' ? current - definition.start : definition.start - current;
    return [definition.key, clamp((moved / span) * 100, 0, 100)];
  }));
  return { metrics, progress, flags: { ...previous.flags } };
}
