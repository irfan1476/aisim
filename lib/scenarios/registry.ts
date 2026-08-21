import { projectFactory } from './projectFactory';
import { projectFactoryV3 } from './projectFactoryV3';
import { bankNext } from './bankNext';
import { care360 } from './care360';
import { futureReady } from './futureReady';
import type { ScenarioDefinition } from './types';

export const scenarioRegistry: Record<string, ScenarioDefinition> = { projectFactory, 'project-factory-2030': projectFactoryV3, bankNext, care360, futureReady };
export const scenarioList = Object.values(scenarioRegistry);
export function getScenario(id?: string) { return id ? scenarioRegistry[id] : undefined; }
export function getDefaultScenario() { return projectFactory; }
