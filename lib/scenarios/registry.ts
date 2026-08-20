import { projectFactory } from './projectFactory';
import type { ScenarioDefinition } from './types';

export const scenarioRegistry: Record<string, ScenarioDefinition> = { projectFactory };
export const scenarioList = Object.values(scenarioRegistry);
export function getScenario(id?: string) { return id ? scenarioRegistry[id] : undefined; }
export function getDefaultScenario() { return projectFactory; }
