import {
  updateInitiativeStates,
  updateInitiativeStatesForActions,
  initializeInitiativeStates,
  type InitiativeState,
} from "./initiativeState";
import type { GameState, InitiativeAllocationMode, InitiativeAllocationSet, QuarterSnapshot } from "./state";
import { normalizeGameState } from "./persistence";
import { evaluateSynergies } from "./generator";
import { getScenario } from "../scenarios/registry";
import { applyScenarioEffects, calculatePortfolioDynamics, calculateStandardEffects, fundingIntensityFor } from "./effectResolver";
import type { AdaptationInput, AdaptationSet, DeploymentModeInput, DeploymentModeSet, InitiativeActionSet, InitiativeFunding, LifecycleReviewInput, LifecycleReviewSet } from './businessModel';
import { applyDataFlywheel, recordEvaluationEvidence } from './lifecycleResolver';

export type QuarterDecision = {
  selected?: string[];
  initiativeActions?: InitiativeActionSet;
  lifecycleReviews?: LifecycleReviewSet;
  deploymentModes?: DeploymentModeSet;
  adaptations?: AdaptationSet;
  evaluationDecisions?: LifecycleReviewInput[];
  deploymentDecisions?: DeploymentModeInput[];
  adaptationDecisions?: AdaptationInput[];
  alloc: GameState["alloc"];
  initiativeAllocationMode?: InitiativeAllocationMode;
  initiativeAllocations?: InitiativeAllocationSet;
  deploymentAmount?: number;
  fundingByInitiative?: Record<string, InitiativeFunding>;
  gateResults?: Record<string, { deliveryMultiplier: number; riskAdjustment: number }>;
  /** Compatibility input for previews and older callers. */
  continuityAllocations?: Record<string, number>;
};

export function hydrateGameState(state: GameState): GameState {
  return normalizeGameState(state);
}

export function resolveQuarter(
  state: GameState,
  decision: QuarterDecision,
): {
  metrics: Partial<GameState>;
  initiativeStates: Record<string, InitiativeState>;
  scenarioState: GameState['scenarioState'];
  snapshot: QuarterSnapshot;
} {
  const current = hydrateGameState(state);
  const legacySelected = (decision.selected || [])
    .filter((id, index, ids) => Boolean(current.initiativeStates[id]) && ids.indexOf(id) === index)
    .slice(0, 3);
  const hasLifecycleDecision = Boolean(decision.initiativeActions || decision.fundingByInitiative);
  const initiativeActions: InitiativeActionSet = Object.keys(decision.initiativeActions || {}).length
    ? { ...decision.initiativeActions }
    : Object.fromEntries(legacySelected.map((id) => [id, 'scale']));
  const selected = Object.entries(initiativeActions)
    .filter(([id, action]) => Boolean(current.initiativeStates[id]) && (action === 'pilot' || action === 'scale'))
    .map(([id]) => id)
    .slice(0, 3);
  const minimumPortfolioCost = selected.reduce(
    (sum, id) => sum + Number(current.initiativeStates[id]?.currentCost ?? current.initiativeStates[id]?.baseCost ?? 0),
    0,
  );
  const fundingIntensity = decision.deploymentAmount === undefined
    ? 1
    : fundingIntensityFor(decision.deploymentAmount, minimumPortfolioCost);
  const investmentMultiplier = decision.deploymentAmount === undefined || !minimumPortfolioCost
    ? 1
    : Math.max(0, Number(decision.deploymentAmount) || 0) / minimumPortfolioCost;
  const fundingByInitiative = decision.fundingByInitiative || Object.fromEntries(Object.entries(current.initiativeStates).map(([id, initiative]) => {
    const delivery = selected.includes(id) ? Number(initiative.currentCost ?? initiative.baseCost ?? initiative.cost ?? 0) * investmentMultiplier : 0;
    const run = Number(decision.continuityAllocations?.[id] || 0);
    return [id, { discovery: 0, delivery, scaleUp: Math.max(0, delivery - Number(initiative.currentCost ?? initiative.cost ?? 0)), run, continuity: run, retirement: 0, total: delivery + run }];
  }));
  let evolved = hasLifecycleDecision
    ? updateInitiativeStatesForActions(
        current.initiativeStates,
        initiativeActions,
        decision.alloc,
        { adoption: current.adoption, fundingIntensity, investmentMultiplier, fundingByInitiative, initiativeAllocationMode: decision.initiativeAllocationMode, initiativeAllocations: decision.initiativeAllocations },
      )
    : updateInitiativeStates(
        current.initiativeStates,
        legacySelected,
        decision.alloc,
        { adoption: current.adoption, fundingIntensity, investmentMultiplier, continuityAllocations: decision.continuityAllocations },
    );
  evolved = applyDataFlywheel(evolved);
  // A maintained capability continues to create value, albeit only to the
  // degree it has already been realised. Paused/retired work is excluded.
  const benefitIds = hasLifecycleDecision
    ? Object.values(evolved)
        .filter((item) => ['pilot', 'scale', 'run'].includes(item.lifecycle) && Number(item.benefitRealization) > 0)
        .map((item) => item.id)
    : legacySelected;
  const chosen = benefitIds.map((id) => evolved[id]).filter(Boolean);
  const scenario = current.scenarioMode ? getScenario(current.scenarioId) : undefined;
  // Derive the portfolio context once per quarter. Every downstream effect
  // and snapshot must use the same inventory-aware denominator and posture.
  const portfolio = calculatePortfolioDynamics(
    selected.length,
    Object.keys(current.initiativeStates || {}).length,
  );
  const synergies = evaluateSynergies(benefitIds, evolved, scenario?.synergies);
  const deliveryGateResults = selected.map((id) => decision.gateResults?.[id]).filter(Boolean);
  const gateMultiplier = deliveryGateResults.length
    ? deliveryGateResults.reduce((sum, gate) => sum + Number(gate?.deliveryMultiplier || 1), 0) / deliveryGateResults.length
    : 1;
  const gateRiskAdjustment = deliveryGateResults.reduce((sum, gate) => sum + Number(gate?.riskAdjustment || 0), 0);
  const synergyMultiplier =
    1 + synergies.reduce((sum, effect) => sum + effect.roiBoost, 0);
  const synergyRiskReduction = synergies.reduce(
    (sum, effect) => sum + effect.riskReduction,
    0,
  );
  const synergyAdoption = synergies.reduce(
    (sum, effect) => sum + effect.adoptionBoost,
    0,
  );
  const synergyCostReduction = Math.min(
    0.15,
    synergies.reduce((sum, effect) => sum + effect.costReduction, 0),
  );
  const metrics = calculateStandardEffects(current, selected, decision.alloc, chosen, {
    synergyMultiplier,
    synergyRiskReduction,
    synergyAdoption,
    synergyCostReduction,
    fundingIntensity,
    gateMultiplier,
    gateRiskAdjustment,
    portfolio,
  });
  const scenarioState = scenario
    ? applyScenarioEffects(
        scenario,
        current.scenarioState?.metrics && Object.keys(current.scenarioState.metrics).length
          ? current.scenarioState
          : { metrics: { ...(current.scenarioStartingMetrics || {}) }, progress: { ...(current.scenarioProgress || {}) }, flags: {} },
        evolved,
        benefitIds,
        decision.alloc,
        current.adoption,
        synergies,
        fundingIntensity,
        portfolio,
        gateMultiplier,
        decision.initiativeAllocationMode,
        decision.initiativeAllocations,
      )
    : current.scenarioState;
  const resolvedMetrics = scenario
    ? ({ ...metrics, ...scenarioState.metrics } as Partial<GameState>)
    : metrics;
  evolved = recordEvaluationEvidence(
    evolved,
    scenario ? (current.scenarioState?.metrics || {}) : (current as unknown as Record<string, number>),
    scenario ? (scenarioState.metrics || {}) : (resolvedMetrics as Record<string, number>),
  );
  const snapshot: QuarterSnapshot = {
    q: current.q,
    chosen: chosen.map((item) => item.name),
    selectedIds: [...selected],
    initiativeActions: { ...initiativeActions },
    lifecycleReviews: decision.lifecycleReviews,
    deploymentModes: decision.deploymentModes,
    adaptations: decision.adaptations,
    evaluationDecisions: decision.evaluationDecisions,
    deploymentDecisions: decision.deploymentDecisions,
    adaptationDecisions: decision.adaptationDecisions,
    portfolio,
    selectedCount: portfolio.selectedCount,
    portfolioPosture: portfolio.portfolioPosture,
    breadth: portfolio.breadth,
    concentrationRisk: portfolio.concentrationRisk,
    portfolioProvenance: portfolio.provenance,
    provenance: portfolio.provenance,
    allocation: { ...decision.alloc },
    allocationMode: decision.initiativeAllocationMode,
    initiativeAllocations: decision.initiativeAllocations ? JSON.parse(JSON.stringify(decision.initiativeAllocations)) : undefined,
    metrics: resolvedMetrics,
    initiativeStates: JSON.parse(JSON.stringify(evolved)),
    scenarioState: JSON.parse(JSON.stringify(scenarioState)),
    synergiesDiscovered: synergies.map((effect) => effect.key),
    fundingIntensity,
  };
  return { metrics: resolvedMetrics, initiativeStates: evolved, scenarioState, snapshot };
}

export function deriveScore(state: GameState, metrics: Partial<GameState>) {
  const outcomeScore =
    (Number(metrics.roi ?? state.roi) +
      Number(metrics.adoption ?? state.adoption) +
      Number(metrics.efficiency ?? state.efficiency) +
      (100 - Number(metrics.risk ?? state.risk))) /
    4;
  const sustainedExecution = Math.min(10, Math.max(0, state.q - 2));
  const establishedCapabilities = Object.values(
    state.initiativeStates || {},
  ).filter((item) => item.quartersFunded >= 4).length;
  const capabilityConsistency = Math.min(4, establishedCapabilities * 1.34);
  return Math.min(
    100,
    Math.round(outcomeScore + sustainedExecution + capabilityConsistency),
  );
}
