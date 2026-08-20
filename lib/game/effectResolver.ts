import type { ScenarioDefinition } from '../scenarios/types';
import type { ScenarioState } from './state';
import type { InitiativeState } from './initiativeState';
import type { Allocation } from './state';
import { allocationToReadiness } from './allocation';
import { maturityReadiness } from './maturity';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
