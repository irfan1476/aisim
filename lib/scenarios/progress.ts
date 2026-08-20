import type { GameState } from '../game/state';
import type { ScenarioDefinition } from './types';

export type ScenarioProgress = { values: Record<string, number>; overall: number };

export function calculateScenarioProgress(state: GameState, scenario?: ScenarioDefinition): ScenarioProgress | undefined {
  if (!scenario) return undefined;
  const values = Object.fromEntries(scenario.progress.map((definition) => [definition.key, Math.min(100, Math.max(0, definition.evaluate(state)))]));
  const scores = scenario.progress.map((definition) => {
    const current = values[definition.key] ?? definition.start;
    const delta = definition.direction === 'higher-is-better' ? current - definition.start : definition.start - current;
    const scale = Math.max(1, definition.direction === 'higher-is-better' ? 100 - definition.start : definition.start);
    return Math.min(100, Math.max(0, 50 + (delta / scale) * 50));
  });
  return { values, overall: scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0 };
}
