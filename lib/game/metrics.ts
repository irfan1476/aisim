import type { GameState, PortfolioSnapshot } from "./state";
import { evaluateSynergies } from "./generator";
import { getScenario } from "../scenarios/registry";
import { allocationToReadiness } from "./allocation";
import { allocationForInitiative } from "./initiativeAllocation";
import { deriveOperatingSignal, profileForState } from "./operatingEffects";
import { maturityReadiness } from "./maturity";
import { calculatePortfolioDynamics, fundingIntensityFor } from "./effectResolver";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function calculateMetrics(
  state: GameState,
  selected: string[],
): Partial<GameState> {
  const chosen = selected
    .map((id) => state.initiativeStates[id])
    .filter(Boolean);
  const factor =
    (state.alloc.people >= 15 ? 1.12 : 0.94) *
    (state.alloc.compliance >= 10 ? 1.05 : 0.93);
  const synergies = evaluateSynergies(selected, state.initiativeStates);
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
  const averageRiskScore = chosen.length
    ? chosen.reduce((sum, item) => sum + Number(item.riskScore ?? 48), 0) /
      chosen.length
    : 48;
  const adoptionHeadroom = Math.max(0.18, 1 - state.adoption / 115);
  const teamReadiness =
    0.8 + Number(state.initiativeGeneration?.context.team || 0.6) * 0.3;
  const adoptionGain =
    (0.8 +
      state.alloc.people / 10 +
      (chosen.some((item) => item.id === "knowledge") ? 2.5 : 0) +
      synergyAdoption) *
    adoptionHeadroom *
    teamReadiness;
  const technicalLeverage = 0.7 + (state.alloc.infra + state.alloc.mlops) / 100;
  const riskChange =
    ((averageRiskScore - 48) / 10) * 0.55 -
    ((state.alloc.compliance - 10) / 5) * (0.5 + state.risk / 60) -
    synergyRiskReduction;
  return {
    roi: Math.min(
      99,
      state.roi +
        (((chosen.reduce((a, i) => a + i.currentRoi, 0) / 100) * factor) / 2) *
          synergyMultiplier,
    ),
    revenue: Math.min(
      60,
      state.revenue +
        chosen.reduce(
          (a, i) =>
            a +
            (i.id === "demand"
              ? 3
              : i.id === "quality" || i.id === "supply"
                ? 2
                : 1),
          0,
        ),
    ),
    efficiency: Math.min(
      95,
      state.efficiency +
        chosen.reduce(
          (a, i) =>
            a + (i.id === "energy" ? 7 : i.id === "maintenance" ? 6 : 3),
          0,
        ) *
          0.3 *
          technicalLeverage,
    ),
    adoption: Math.min(98, state.adoption + adoptionGain),
    risk: Math.max(5, Math.min(95, state.risk + riskChange)),
    data: Math.min(
      98,
      state.data +
        state.alloc.data / 10 +
        (chosen.some((i) => i.id === "demand") ? 3 : 0),
    ),
    satisfaction: Math.min(
      98,
      state.satisfaction +
        state.alloc.people / 5 +
        (chosen.some((i) => i.id === "knowledge") ? 5 : 0),
    ),
    literacy: Math.min(98, state.literacy + state.alloc.people / 4),
    spent: state.spent + chosen.reduce((a, i) => a + i.currentCost, 0),
  };
}

export function causalChain(
  state: GameState,
  selected: string[],
  resolvedInitiativeStates: GameState["initiativeStates"] = state.initiativeStates,
  deploymentAmount?: number,
  portfolioContext?: PortfolioSnapshot,
  initiativeAllocationMode: GameState['initiativeAllocationMode'] = 'shared',
  initiativeAllocations: GameState['initiativeAllocations'] = state.initiativeAllocations,
) {
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  if (scenario) {
    const definitions = new Map(scenario.progress.map((item) => [item.key, item]));
    const synergies = evaluateSynergies(selected, resolvedInitiativeStates, scenario.synergies);
    const synergyMultiplier = 1 + synergies.reduce((sum, item) => sum + item.roiBoost, 0);
    const adoptionFactor = 0.7 + Math.max(0, Math.min(1, state.adoption / 100)) * 0.3;
    const portfolio = portfolioContext || calculatePortfolioDynamics(
      selected.length,
      Object.keys(resolvedInitiativeStates || {}).length,
    );
    const portfolioEffect = portfolio.focusMultiplier * (1 - portfolio.coordinationPressure / 100);
    const minimumPortfolioCost = selected.reduce(
      (sum, id) => sum + Number(state.initiativeStates[id]?.currentCost ?? state.initiativeStates[id]?.baseCost ?? 0),
      0,
    );
    // Direct engine callers from older saves and tests do not supply a deployment
    // amount. In that case the resolver also uses the baseline portfolio effect.
    // Only a deliberate deployment choice may accelerate the causal explanation.
    const fundingIntensity = deploymentAmount === undefined
      ? 1
      : fundingIntensityFor(deploymentAmount, minimumPortfolioCost);
    const fundingMultiplier = 1 + Math.max(0, Math.min(0.35, fundingIntensity - 1)) * 0.7;
    // Apply contributions in the same order and against the same bounded metric
    // values as the quarter resolver. The displayed deltas therefore reconcile
    // with the recorded scenario outcome rather than acting as illustrative copy.
    const projectedMetrics = { ...(state.scenarioState?.metrics || state.scenarioStartingMetrics || {}) };
    return selected
      .map((id) => resolvedInitiativeStates[id])
      .filter(Boolean)
      .map((initiative) => {
        const metadata = initiative.scenarioMetadata;
        const definition = metadata ? definitions.get(metadata.primaryMetric) : undefined;
        if (!metadata || !definition) return null;
        const localAllocation = allocationForInitiative(initiative.id, initiativeAllocationMode, initiativeAllocations, state.alloc);
        const readiness = allocationToReadiness(localAllocation);
        const operatingSignal = deriveOperatingSignal(
          profileForState(initiative),
          initiative.lifecycle === 'run' ? 'maintain' : initiative.lifecycle === 'scale' ? 'scale' : 'pilot',
          localAllocation,
          initiative.aiLifecycle?.stage,
        );
        const readinessFactor = (0.55 + readiness.data * 0.2 + readiness.people * 0.15 + readiness.governance * 0.1) * operatingSignal.fit;
        const diminishingReturns = 1 / (1 + Math.max(0, initiative.quartersFunded - 1) * 0.08);
        const rawEffect = metadata.baseEffect * maturityReadiness(initiative.maturityLevel) * readinessFactor * adoptionFactor * diminishingReturns * synergyMultiplier * portfolioEffect * fundingMultiplier;
        const before = Number(projectedMetrics[metadata.primaryMetric] ?? definition.start);
        const after = clamp(before + rawEffect, definition.min, definition.max);
        const delta = after - before;
        projectedMetrics[metadata.primaryMetric] = after;
        const direction = definition.direction === "higher-is-better" ? "increase" : "reduce";
        const outcomeImproves = definition.direction === "higher-is-better" ? delta >= 0 : delta <= 0;
        return {
          name: initiative.name,
          explanation: `${direction} ${definition.label.toLowerCase()} through ${initiative.maturityLevel} capability maturity, current allocation readiness, and ${initiative.quartersFunded} funded quarter${initiative.quartersFunded === 1 ? "" : "s"}.`,
          effects: [{
            metric: definition.label,
            delta,
            color: outcomeImproves ? "emerald" : "crimson",
            unit: definition.unit,
          explanation: `Recorded contribution from a base effect of ${metadata.baseEffect > 0 ? "+" : ""}${metadata.baseEffect} ${metadata.effectUnit}, adjusted for maturity, readiness, adoption, portfolio focus, funding intensity, synergies, diminishing returns, and metric bounds.`,
          }],
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  const factor =
    (state.alloc.people >= 15 ? 1.12 : 0.94) *
    (state.alloc.compliance >= 10 ? 1.05 : 0.93);
  return selected
    .map((id) => state.initiativeStates[id])
    .filter(Boolean)
    .map((i) => {
      const effects: { metric: string; delta: number; color: string }[] = [];
      const roiDelta = ((i.currentRoi / 100) * factor) / 2;
      if (roiDelta > 0.5)
        effects.push({ metric: "ROI", delta: roiDelta, color: "emerald" });
      const adoptionDelta =
        (i.id === "knowledge"
          ? 7
          : i.id === "demand"
            ? 3
            : i.id === "quality" || i.id === "supply"
              ? 2
              : 1) +
        (state.alloc.people - 15) * 0.3;
      if (Math.abs(adoptionDelta) > 1)
        effects.push({
          metric: "Adoption",
          delta: adoptionDelta,
          color: "purple",
        });
      const riskDelta =
        (Number(i.riskScore ?? 48) - 48) / 10 - state.alloc.compliance / 6;
      if (Math.abs(riskDelta) > 1)
        effects.push({ metric: "Risk", delta: riskDelta, color: "crimson" });
      const dataDelta =
        i.id === "demand"
          ? 3
          : i.id === "maintenance"
            ? 2
            : i.id === "quality"
              ? 1
              : 0;
      if (dataDelta > 1)
        effects.push({ metric: "Data", delta: dataDelta, color: "cyan" });
      return { name: i.name, effects };
    })
    .filter((item) => item.effects.length > 0);
}
