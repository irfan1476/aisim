import { resolveLifecycleProfile } from '../scenarios/scenarioHelpers';
import type { ScenarioInitiative, ScenarioLifecycleProfile } from '../scenarios/types';
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
    const lifecycleProfile = resolveLifecycleProfile(definition);
    state.maturityLevel = definition.initialMaturity || 'nascent';
    state.scenarioMetadata = {
      primaryMetric: definition.primaryMetric,
      baseEffect: definition.baseEffect,
      effectUnit: definition.effectUnit,
      neglect: definition.neglect || { decayRate: 0.15, penaltyThreshold: 4, penaltyAmount: Math.abs(definition.baseEffect) * 0.35 },
      frameworkContribution: definition.frameworkContribution,
      lifecycleProfile,
    } as typeof state.scenarioMetadata & { lifecycleProfile: ScenarioLifecycleProfile };
    // Keep authored lifecycle facts on the state as well as in metadata. This
    // lets the resolver/UI consume them without coupling scenario packs to a
    // particular engine implementation, while old saves still hydrate safely.
    const lifecycleState = state as InitiativeState & {
      dataReadiness?: number;
      lifecycleProfile?: ScenarioLifecycleProfile;
    };
    // Lifecycle profiles may express a more precise starting readiness than
    // the legacy 1–5 scenario field. Keep both representations aligned so a
    // newly-started capability does not appear to gain data before a learner
    // has made a decision.
    const authoredCurrentData = lifecycleProfile.dataReadiness / 20;
    lifecycleState.currentData = authoredCurrentData;
    lifecycleState.baseData = authoredCurrentData;
    lifecycleState.dataReadiness = lifecycleProfile.dataReadiness;
    lifecycleState.evaluation = {
      ...state.evaluation,
      successCriteria: lifecycleProfile.evaluation.criteria.map((criterion) => ({
        metric: criterion.metric,
        threshold: criterion.threshold,
        actual: 0,
        met: false,
        id: criterion.id,
        label: criterion.label,
        direction: criterion.direction,
        kind: criterion.kind,
        required: criterion.required,
      })),
    } as typeof state.evaluation;
    lifecycleState.risks = {
      modelRisk: lifecycleProfile.risks.model,
      operationalRisk: lifecycleProfile.risks.operational,
      legalRisk: lifecycleProfile.risks.legal,
    };
    lifecycleState.autonomyLevel = lifecycleProfile.autonomy;
    lifecycleState.autonomyBoundaries = lifecycleProfile.autonomyBoundaries;
    lifecycleState.humanOversightRequired = lifecycleProfile.oversight.baseUnits;
    lifecycleState.dataFlywheelActive = lifecycleProfile.flywheel?.active ?? false;
    lifecycleState.dataFlywheelQuality = lifecycleProfile.flywheel?.quality ?? 0;
    lifecycleState.lifecycleProfile = lifecycleProfile;
  });
  return states;
}

export function scenarioInitiativeToState(initiative: ScenarioInitiative): InitiativeState {
  return scenarioInitiativesToStates([initiative])[initiative.id];
}
