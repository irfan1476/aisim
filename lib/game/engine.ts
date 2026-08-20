import {
  updateInitiativeStates,
  initializeInitiativeStates,
  type InitiativeState,
} from "./initiativeState";
import type { GameState, QuarterSnapshot } from "./state";
import { normalizeGameState } from "./persistence";
import { evaluateSynergies } from "./generator";
import { getScenario } from "../scenarios/registry";
import { applyScenarioEffects, calculateStandardEffects } from "./effectResolver";

export type QuarterDecision = { selected: string[]; alloc: GameState["alloc"] };

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
  const evolved = updateInitiativeStates(
    current.initiativeStates,
    decision.selected,
    decision.alloc,
    { adoption: current.adoption },
  );
  const chosen = decision.selected.map((id) => evolved[id]).filter(Boolean);
  const scenario = current.scenarioMode ? getScenario(current.scenarioId) : undefined;
  const synergies = evaluateSynergies(decision.selected, evolved, scenario?.synergies);
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
  const metrics = calculateStandardEffects(current, decision.selected, decision.alloc, chosen, {
    synergyMultiplier,
    synergyRiskReduction,
    synergyAdoption,
    synergyCostReduction,
  });
  const scenarioState = scenario
    ? applyScenarioEffects(
        scenario,
        current.scenarioState?.metrics && Object.keys(current.scenarioState.metrics).length
          ? current.scenarioState
          : { metrics: { ...(current.scenarioStartingMetrics || {}) }, progress: { ...(current.scenarioProgress || {}) }, flags: {} },
        evolved,
        decision.selected,
        decision.alloc,
        current.adoption,
        synergies,
      )
    : current.scenarioState;
  const resolvedMetrics = scenario
    ? ({ ...metrics, ...scenarioState.metrics } as Partial<GameState>)
    : metrics;
  const snapshot: QuarterSnapshot = {
    q: current.q,
    chosen: chosen.map((item) => item.name),
    selectedIds: [...decision.selected],
    allocation: { ...decision.alloc },
    metrics: resolvedMetrics,
    initiativeStates: JSON.parse(JSON.stringify(evolved)),
    scenarioState: JSON.parse(JSON.stringify(scenarioState)),
    synergiesDiscovered: synergies.map((effect) => effect.key),
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
