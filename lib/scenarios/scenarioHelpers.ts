import type { ScenarioInitiative, ScenarioProgressDefinition, ScenarioSynergyDefinition } from './types';

export function initiative(
  value: Omit<ScenarioInitiative, 'provisional'>,
): ScenarioInitiative {
  return { ...value, provisional: true };
}

export function metric(
  key: string,
  label: string,
  unit: string,
  start: number,
  target: number,
  direction: ScenarioProgressDefinition['direction'],
  min = 0,
  max = 100,
): ScenarioProgressDefinition {
  return { key, label, unit, start, target, min, max, direction };
}

export function synergy(
  value: ScenarioSynergyDefinition,
): ScenarioSynergyDefinition {
  return value;
}
