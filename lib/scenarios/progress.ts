import type { GameState } from '../game/state';
import type { ScenarioDefinition, ScenarioOutcomeRole, ScenarioProgressDefinition } from './types';

export type ScenarioProgress = { values: Record<string, number>; overall: number };
export type ScenarioMissionRoleProgress = {
  role: ScenarioOutcomeRole;
  /** Progress against the authored target, averaged across this role. */
  progress: number;
  /** Lowest individual outcome progress in this role. */
  minimum: number;
  outcomeKeys: string[];
};
export type ScenarioMissionProgress = {
  values: Record<string, number>;
  scores: Record<string, number>;
  roles: Record<ScenarioOutcomeRole, ScenarioMissionRoleProgress>;
  primaryProgress: number;
  supportingProgress: number;
  guardrailProgress: number;
  /** 100 means no guardrail has deteriorated from its starting position. */
  guardrailProtection: number;
  /** Weighted mission view used by the campaign score in a later phase. */
  missionProgress: number;
  missionReady: boolean;
  masteryReady: boolean;
  blockers: string[];
};
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

/**
 * Return the authored role, retaining a safe default for scenario packs that
 * pre-date mission roles.  `calculateScenarioMissionProgress` handles the
 * additional no-primary fallback so old packs remain useful as missions.
 */
export function scenarioOutcomeRole(definition: ScenarioProgressDefinition): ScenarioOutcomeRole {
  return definition.role || 'supporting';
}

function emptyRoleProgress(role: ScenarioOutcomeRole): ScenarioMissionRoleProgress {
  return { role, progress: 0, minimum: 0, outcomeKeys: [] };
}

/**
 * Calculate a mission-oriented view without changing the raw scenario
 * progress contract. Primary outcomes carry the mission, supporting outcomes
 * add breadth, and guardrails are reported separately so a deterioration is
 * visible even when the other outcomes improve.
 */
export function calculateScenarioMissionProgress(
  metrics: Record<string, number> | undefined,
  scenario: ScenarioDefinition,
): ScenarioMissionProgress {
  const definitions = scenario.progress;
  const hasAuthoredPrimary = definitions.some((definition) => definition.role === 'primary');
  const classified = definitions.map((definition, index) => ({
    definition,
    role: definition.role || (!hasAuthoredPrimary && index === 0 ? 'primary' : 'supporting') as ScenarioOutcomeRole,
  }));
  const values: Record<string, number> = {};
  const scores: Record<string, number> = {};
  const roleBuckets: Record<ScenarioOutcomeRole, ScenarioMissionRoleProgress> = {
    primary: emptyRoleProgress('primary'),
    supporting: emptyRoleProgress('supporting'),
    guardrail: emptyRoleProgress('guardrail'),
  };

  classified.forEach(({ definition, role }) => {
    const current = scenarioProgressValue(metrics, definition);
    const score = scenarioProgressScore(current, definition);
    values[definition.key] = current;
    scores[definition.key] = score;
    const bucket = roleBuckets[role];
    bucket.outcomeKeys.push(definition.key);
    bucket.progress += score;
    bucket.minimum = bucket.outcomeKeys.length === 1 ? score : Math.min(bucket.minimum, score);
  });

  (Object.keys(roleBuckets) as ScenarioOutcomeRole[]).forEach((role) => {
    const bucket = roleBuckets[role];
    if (bucket.outcomeKeys.length) bucket.progress = bucket.progress / bucket.outcomeKeys.length;
  });

  const primaryProgress = roleBuckets.primary.progress;
  const supportingProgress = roleBuckets.supporting.outcomeKeys.length ? roleBuckets.supporting.progress : primaryProgress;
  const guardrailProgress = roleBuckets.guardrail.outcomeKeys.length ? roleBuckets.guardrail.progress : 100;
  const guardrailDefinitions = classified.filter(({ role }) => role === 'guardrail');
  const guardrailProtection = guardrailDefinitions.length
    ? guardrailDefinitions.reduce((sum, { definition }) => {
      const current = scenarioProgressValue(metrics, definition);
      const protectedValue = definition.direction === 'higher-is-better'
        ? current >= definition.start
        : current <= definition.start;
      return sum + (protectedValue ? 100 : Math.max(0, 100 - Math.abs(current - definition.start) / Math.max(1, Math.abs(definition.target - definition.start)) * 100));
    }, 0) / guardrailDefinitions.length
    : 100;
  const missionProgress = primaryProgress * .6 + supportingProgress * .25 + guardrailProgress * .15;
  const blockers: string[] = [];
  if (primaryProgress < 75) blockers.push('Primary mission outcomes are not yet at 75% progress.');
  if (guardrailProtection < 100) blockers.push('At least one guardrail has deteriorated from its starting position.');
  return {
    values,
    scores,
    roles: roleBuckets,
    primaryProgress,
    supportingProgress,
    guardrailProgress,
    guardrailProtection,
    missionProgress,
    missionReady: primaryProgress >= 75 && guardrailProtection >= 100,
    masteryReady: missionProgress >= 85 && supportingProgress >= 70 && guardrailProtection >= 100,
    blockers,
  };
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
