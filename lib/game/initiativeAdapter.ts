import type { ScenarioInitiative } from '../scenarios/types';
import { initializeInitiativeStates, type InitiativeState } from './initiativeState';
import type { DynamicInitiative } from './generator';

const riskScore = (initiative: ScenarioInitiative) => initiative.baseRiskScore ?? (initiative.risk === 'LOW' ? 24 : initiative.risk === 'HIGH' ? 72 : 48);

export function scenarioInitiativesToStates(initiatives: ScenarioInitiative[]): Record<string, InitiativeState> {
  const generated: DynamicInitiative[] = initiatives.map((item) => ({
    ...item,
    baseRoi: item.roi,
    baseCost: item.cost,
    baseData: item.data,
    baseHuman: item.human,
    baseRiskScore: riskScore(item),
    riskScore: riskScore(item),
    synergies: [],
  }));
  const states = initializeInitiativeStates(generated);
  Object.values(states).forEach((state) => {
    const definition = initiatives.find((item) => item.id === state.id);
    if (!definition) return;
    state.maturityLevel = definition.initialMaturity || 'nascent';
    state.scenarioMetadata = {
      primaryMetric: definition.primaryMetric,
      baseEffect: definition.baseEffect,
      effectUnit: definition.effectUnit,
      neglect: definition.neglect || { decayRate: 0.15, penaltyThreshold: 4, penaltyAmount: Math.abs(definition.baseEffect) * 0.35 },
    };
  });
  return states;
}

export function scenarioInitiativeToState(initiative: ScenarioInitiative): InitiativeState {
  return scenarioInitiativesToStates([initiative])[initiative.id];
}
