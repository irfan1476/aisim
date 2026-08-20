import {
  updateInitiativeStates,
  initializeInitiativeStates,
  type InitiativeState,
} from "./initiativeState";
import type { GameState, QuarterSnapshot } from "./state";
import { normalizeGameState } from "./persistence";
import { evaluateSynergies } from "./generator";
import { getScenario } from "../scenarios/registry";
import { applyScenarioEffects } from "./effectResolver";

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
  const synergies = evaluateSynergies(decision.selected, evolved);
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
  const averageRiskScore = chosen.length
    ? chosen.reduce((sum, item) => sum + Number(item.riskScore ?? 48), 0) /
      chosen.length
    : 48;
  const portfolioRiskPressure = (averageRiskScore - 48) / 10;
  const governanceRelief = (Number(decision.alloc.compliance || 0) - 10) / 5;
  const factor =
    (decision.alloc.people >= 15 ? 1.12 : 0.94) *
    (decision.alloc.compliance >= 10 ? 1.05 : 0.93);
  const adoptionHeadroom = Math.max(0.18, 1 - current.adoption / 115);
  const teamReadiness =
    0.8 + Number(current.initiativeGeneration?.context.team || 0.6) * 0.3;
  const adoptionGain =
    (0.8 +
      decision.alloc.people / 10 +
      (chosen.some((item) => item.id === "knowledge") ? 2.5 : 0) +
      synergyAdoption) *
    adoptionHeadroom *
    teamReadiness;
  const technicalLeverage =
    0.7 + (decision.alloc.infra + decision.alloc.mlops) / 100;
  const efficiencyGain =
    chosen.reduce(
      (sum, item) =>
        sum + (item.id === "energy" ? 7 : item.id === "maintenance" ? 6 : 3),
      0,
    ) *
    0.3 *
    technicalLeverage;
  const riskChange =
    portfolioRiskPressure * 0.55 -
    governanceRelief * (0.5 + current.risk / 60) -
    synergyRiskReduction;
  const metrics: Partial<GameState> = {
    roi: Math.min(
      99,
      current.roi +
        (((chosen.reduce((sum, item) => sum + item.currentRoi, 0) / 100) *
          factor) /
          2) *
          synergyMultiplier,
    ),
    revenue: Math.min(
      60,
      current.revenue +
        chosen.reduce(
          (sum, item) =>
            sum +
            (item.id === "demand"
              ? 3
              : ["quality", "supply"].includes(item.id)
                ? 2
                : 1),
          0,
        ),
    ),
    efficiency: Math.min(95, current.efficiency + efficiencyGain),
    adoption: Math.min(98, current.adoption + adoptionGain),
    risk: Math.max(5, Math.min(95, current.risk + riskChange)),
    data: Math.min(
      98,
      current.data +
        decision.alloc.data / 10 +
        (chosen.some((item) => item.id === "demand") ? 3 : 0),
    ),
    satisfaction: Math.min(
      98,
      current.satisfaction +
        decision.alloc.people / 5 +
        (chosen.some((item) => item.id === "knowledge") ? 5 : 0),
    ),
    literacy: Math.min(98, current.literacy + decision.alloc.people / 4),
    spent:
      current.spent +
      chosen.reduce((sum, item) => sum + item.currentCost, 0) *
        (1 - synergyCostReduction),
  };
  const scenario = current.scenarioMode ? getScenario(current.scenarioId) : undefined;
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
