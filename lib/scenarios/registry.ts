import { projectFactory } from './projectFactory';
import { bankNext } from './bankNext';
import { care360 } from './care360';
import { futureReady } from './futureReady';
import type { ScenarioDefinition } from './types';

export const scenarioRegistry: Record<string, ScenarioDefinition> = { projectFactory, bankNext, care360, futureReady };
export const scenarioList = Object.values(scenarioRegistry);
export function getScenario(id?: string) { return id ? scenarioRegistry[id] : undefined; }
export function getDefaultScenario() { return projectFactory; }
