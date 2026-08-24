import type { GameState } from '../game/state';
import type { ScenarioDefinition, ScenarioProgressDefinition } from './types';

export type ScenarioProgress = { values: Record<string, number>; overall: number };
export type ScenarioChallengeStatus = 'critical' | 'watch' | 'recovering' | 'controlled';

export type ScenarioChallengePresentation = {
  status: ScenarioChallengeStatus;
  label: string;
  current: number;
  start: number;
  target: number;
  progress: number;
  delta: number;
  deltaLabel: string;
  explanation: string;
  tone: 'red' | 'amber' | 'blue' | 'green';
};

export function scenarioProgressValue(
  metrics: Record<string, number> | undefined,
  definition: ScenarioProgressDefinition,
): number {
  const value = metrics?.[definition.key] ?? definition.start;
  return Math.min(definition.max, Math.max(definition.min, Number(value)));
}

export function scenarioProgressScore(
  value: number,
  definition: ScenarioProgressDefinition,
): number {
  const delta = definition.direction === 'higher-is-better'
    ? value - definition.start
    : definition.start - value;
  return Math.min(100, Math.max(0, (delta / Math.max(1, Math.abs(definition.target - definition.start))) * 100));
}

export function presentScenarioChallenge(
  challenge: ScenarioDefinition['challenges'][number],
  metrics: Record<string, number> | undefined,
  scenario: ScenarioDefinition,
): ScenarioChallengePresentation {
  const definition = scenario.progress.find((item) => item.key === challenge.metric);
  const fallback = {
    key: challenge.metric,
    label: challenge.label,
    unit: 'index',
    start: metrics?.[challenge.metric] ?? 0,
    target: metrics?.[challenge.metric] ?? 0,
    min: 0,
    max: 100,
    direction: challenge.direction,
  } as ScenarioProgressDefinition;
  const progressDefinition = definition || fallback;
  const current = scenarioProgressValue(metrics, progressDefinition);
  const progress = scenarioProgressScore(current, progressDefinition);
  const delta = current - progressDefinition.start;
  const worsened = challenge.direction === 'higher-is-better' ? delta < 0 : delta > 0;
  const status: ScenarioChallengeStatus = worsened
    ? 'critical'
    : progress >= 75
      ? 'controlled'
      : progress > 0
        ? 'recovering'
        : 'watch';
  const label = status === 'critical' ? 'Critical' : status === 'watch' ? 'Watch' : status === 'recovering' ? 'Recovering' : 'Controlled';
  const unit = progressDefinition.unit;
  const signedDelta = `${delta > 0 ? '+' : ''}${Number.isInteger(delta) ? delta : delta.toFixed(1)} ${unit}`;
  const explanation = status === 'critical'
    ? `${challenge.description} The current signal is moving away from the target.`
    : status === 'watch'
      ? `${challenge.description} No improvement is visible yet; the next allocation matters.`
      : status === 'recovering'
        ? `${challenge.description} Funding and operating choices are moving this pressure in the right direction.`
        : `${challenge.description} This pressure is currently within the scenario's intended control range.`;
  return {
    status,
    label,
    current,
    start: progressDefinition.start,
    target: progressDefinition.target,
    progress,
    delta,
    deltaLabel: signedDelta,
    explanation,
    tone: status === 'critical' ? 'red' : status === 'watch' ? 'amber' : status === 'recovering' ? 'blue' : 'green',
  };
}

export function calculateProgressPercentages(
  metrics: Record<string, number>,
  scenario: ScenarioDefinition,
): Record<string, number> {
  return Object.fromEntries(scenario.progress.map((definition) => {
    const current = scenarioProgressValue(metrics, definition);
    return [definition.key, scenarioProgressScore(current, definition)];
  }));
}

export function calculateScenarioProgress(state: GameState, scenario?: ScenarioDefinition): ScenarioProgress | undefined {
  if (!scenario) return undefined;
  const values = Object.fromEntries(scenario.progress.map((definition) => {
    const current = state.scenarioState?.metrics?.[definition.key] ?? state.scenarioStartingMetrics?.[definition.key] ?? definition.start;
    return [definition.key, scenarioProgressValue({ [definition.key]: current }, definition)];
  }));
  const scores = Object.values(calculateProgressPercentages(values, scenario));
  return { values, overall: scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0 };
}
