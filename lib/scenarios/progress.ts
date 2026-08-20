import type { GameState } from '../game/state';
import type { ScenarioDefinition } from './types';

export type ScenarioProgress = { values: Record<string, number>; overall: number };

export function calculateScenarioProgress(state: GameState, scenario?: ScenarioDefinition): ScenarioProgress | undefined {
  if (!scenario) return undefined;
  const values = Object.fromEntries(scenario.progress.map((definition) => {
    const current = state.scenarioState?.metrics?.[definition.key] ?? state.scenarioStartingMetrics?.[definition.key] ?? definition.start;
    return [definition.key, Math.min(definition.max, Math.max(definition.min, current))];
  }));
  const scores = scenario.progress.map((definition) => {
    const current = values[definition.key] ?? definition.start;
    const delta = definition.direction === 'higher-is-better' ? current - definition.start : definition.start - current;
    return Math.min(100, Math.max(0, (delta / Math.max(1, Math.abs(definition.target - definition.start))) * 100));
  });
  return { values, overall: scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0 };
}
