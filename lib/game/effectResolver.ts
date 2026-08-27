import type { ScenarioDefinition } from '../scenarios/types';
import type { GameState, InitiativeAllocationMode, InitiativeAllocationSet, PortfolioSnapshot, ScenarioState } from './state';
import { allocationForInitiative } from './initiativeAllocation';
import type { InitiativeState } from './initiativeState';
import type { Allocation } from './state';
import { allocationToReadiness } from './allocation';
import { maturityReadiness } from './maturity';
import type { SynergyEffect } from './generator';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Extra capital is allocated pro rata across the selected portfolio. It speeds
 * delivery but with deliberately bounded diminishing returns: twice the
 * baseline funding is not twice the next-quarter outcome.
 */
export function fundingIntensityFor(deploymentAmount: number | undefined, minimumPortfolioCost: number): number {
  const minimum = Math.max(0, Number(minimumPortfolioCost) || 0);
  const deployed = Math.max(0, Number(deploymentAmount) || 0);
  if (!minimum || deployed <= minimum) return 1;
  const surplusRatio = deployed / minimum - 1;
  return Number((1 + Math.min(0.35, Math.log1p(surplusRatio) * 0.22)).toFixed(3));
}

function deliveryMultiplier(fundingIntensity = 1): number {
  return 1 + Math.max(0, Math.min(0.35, fundingIntensity - 1)) * 0.7;
}

export function calculatePortfolioDynamics(
  selectedCount: number,
  availableInitiatives: number,
  neglectedCount = Math.max(0, availableInitiatives - selectedCount),
): PortfolioSnapshot {
  const count = clamp(Math.round(selectedCount), 0, 3);
  const available = Math.max(count, Math.round(availableInitiatives) || 0);
  const portfolioPosture: PortfolioSnapshot['portfolioPosture'] = count === 0
    ? 'pause'
    : count === 1
      ? 'deep-focus'
      : count === 2
        ? 'focused-balance'
        : 'portfolio-breadth';
  return {
    selectedCount: count,
    availableInitiatives: available,
    portfolioPosture,
    breadth: Number((available ? count / available : 0).toFixed(3)),
    // A smaller portfolio concentrates capability-building effort on fewer bets.
    focusMultiplier: [0, 1.04, 1.05, 0.96][count],
    // Concentration is a pressure signal, not a judgement: one bet is viable,
    // but it makes the campaign more dependent on that bet.
    concentrationRisk: [0, 7, 3, 1][count],
    coordinationPressure: [0, 0, 1.5, 3][count],
    neglectedCount: Math.max(0, Math.round(neglectedCount)),
    provenance: 'calculated-from-portfolio-choice',
  };
}

export type StandardEffectInputs = {
  synergyMultiplier: number;
  synergyRiskReduction: number;
  synergyAdoption: number;
  synergyCostReduction: number;
  fundingIntensity?: number;
  gateMultiplier?: number;
  gateRiskAdjustment?: number;
  /** The quarter's canonical portfolio context, derived by resolveQuarter. */
  portfolio?: PortfolioSnapshot;
};

/**
 * The original Standard-mode formulas live here unchanged. Keeping this pure
 * makes the regression boundary explicit before scenario effects are merged.
 */
export function calculateStandardEffects(
  current: GameState,
  selected: string[],
  allocation: GameState['alloc'],
  chosen: InitiativeState[],
  inputs: StandardEffectInputs,
): Partial<GameState> {
  // An observation quarter must not create generic operating improvements just
  // because an allocation exists. Explicit scenario maintenance/neglect is
  // resolved separately; native metrics remain at their current values.
  if (chosen.length === 0) {
    return {
      roi: current.roi,
      revenue: current.revenue,
      efficiency: current.efficiency,
      adoption: current.adoption,
      risk: current.risk,
      data: current.data,
      satisfaction: current.satisfaction,
      literacy: current.literacy,
      spent: current.spent,
    };
  }
  const fundingMultiplier = deliveryMultiplier(inputs.fundingIntensity);
  const gateMultiplier = Math.max(0, Math.min(1, Number(inputs.gateMultiplier) || 1));
  const portfolio = inputs.portfolio || calculatePortfolioDynamics(
    chosen.length,
    Object.keys(current.initiativeStates || {}).length,
  );
  // Preserve the established three-bet Standard-mode baseline. Focused
  // one/two-bet choices still create the new trade-offs; the existing
  // three-bet path remains a regression-safe control condition.
  const portfolioActive = current.scenarioMode || chosen.length < 3;
  const coordinationFactor = portfolioActive ? 1 - portfolio.coordinationPressure / 100 : 1;
  const portfolioEffect = portfolioActive ? portfolio.focusMultiplier * coordinationFactor : 1;
  const portfolioRisk = portfolioActive ? portfolio.concentrationRisk + portfolio.coordinationPressure : 0;
  const averageRiskScore = chosen.length
    ? chosen.reduce((sum, item) => sum + Number(item.riskScore ?? 48), 0) / chosen.length
    : 48;
  const portfolioRiskPressure = (averageRiskScore - 48) / 10;
  const governanceRelief = (Number(allocation.compliance || 0) - 10) / 5;
  const factor = (allocation.people >= 15 ? 1.12 : 0.94) * (allocation.compliance >= 10 ? 1.05 : 0.93);
  const adoptionHeadroom = Math.max(0.18, 1 - current.adoption / 115);
  const teamReadiness = 0.8 + Number(current.initiativeGeneration?.context.team || 0.6) * 0.3;
  const adoptionGain = (0.8 + allocation.people / 10 + (chosen.some((item) => item.id === 'knowledge') ? 2.5 : 0) + inputs.synergyAdoption) * adoptionHeadroom * teamReadiness;
  const technicalLeverage = 0.7 + (allocation.infra + allocation.mlops) / 100;
  const efficiencyGain = chosen.reduce((sum, item) => sum + (item.id === 'energy' ? 7 : item.id === 'maintenance' ? 6 : 3), 0) * 0.3 * technicalLeverage;
  const deployedModeEffects = chosen
    .filter((item) => ['scale', 'run'].includes(item.lifecycle) && item.deploymentImpact)
    .map((item) => item.deploymentImpact!);
  const deploymentEfficiencyMultiplier = deployedModeEffects.length
    ? 1 + deployedModeEffects.reduce((sum, impact) => sum + Number(impact.efficiencyDelta || 0), 0) / deployedModeEffects.length / 100
    : 1;
  const deploymentTrustEffect = deployedModeEffects.length
    ? deployedModeEffects.reduce((sum, impact) => sum + Number(impact.trustDelta || 0), 0) / deployedModeEffects.length
    : 0;
  const riskChange = portfolioRiskPressure * 0.55 - governanceRelief * (0.5 + current.risk / 60) - inputs.synergyRiskReduction + Math.max(0, Number(inputs.gateRiskAdjustment) || 0);
  return {
    roi: Math.min(99, current.roi + (((chosen.reduce((sum, item) => sum + item.currentRoi, 0) / 100) * factor / 2) * inputs.synergyMultiplier * portfolioEffect * fundingMultiplier * gateMultiplier)),
    revenue: Math.min(60, current.revenue + chosen.reduce((sum, item) => sum + (item.id === 'demand' ? 3 : ['quality', 'supply'].includes(item.id) ? 2 : 1), 0) * (0.9 + portfolio.breadth * 0.1) * fundingMultiplier),
    efficiency: Math.min(95, current.efficiency + efficiencyGain * portfolioEffect * fundingMultiplier * gateMultiplier * deploymentEfficiencyMultiplier),
    adoption: Math.min(98, current.adoption + adoptionGain * (0.9 + portfolio.breadth * 0.1) * fundingMultiplier * gateMultiplier + deploymentTrustEffect * .12),
    risk: Math.max(5, Math.min(95, current.risk + riskChange + portfolioRisk)),
    data: Math.min(98, current.data + (allocation.data / 10 + (chosen.some((item) => item.id === 'demand') ? 3 : 0)) * fundingMultiplier * gateMultiplier),
    satisfaction: Math.min(98, current.satisfaction + (allocation.people / 5 + (chosen.some((item) => item.id === 'knowledge') ? 5 : 0)) * fundingMultiplier * gateMultiplier + deploymentTrustEffect * .16),
    literacy: Math.min(98, current.literacy + allocation.people / 4 * fundingMultiplier * gateMultiplier),
    // The learner's budget commitment is the initiative's fixed campaign
    // cost. Evolution may change the operating cost displayed on the card,
    // but it must not silently rewrite the financial rules of the campaign.
    spent: current.spent + chosen.reduce((sum, item) => sum + Number(item.baseCost ?? item.cost ?? item.currentCost), 0) * (1 - inputs.synergyCostReduction),
  };
}

export function applyScenarioEffects(
  scenario: ScenarioDefinition,
  previous: ScenarioState,
  states: Record<string, InitiativeState>,
  selected: string[],
  allocation: Allocation,
  adoption: number,
  synergies: SynergyEffect[] = [],
  fundingIntensity = 1,
  portfolio?: PortfolioSnapshot,
  gateMultiplier = 1,
  initiativeAllocationMode: InitiativeAllocationMode = 'shared',
  initiativeAllocations?: InitiativeAllocationSet,
): ScenarioState {
  const metrics = { ...previous.metrics };
  const adoptionFactor = 0.7 + clamp(adoption / 100, 0, 1) * 0.3;
  const definitions = new Map(scenario.progress.map((item) => [item.key, item]));
  const synergyMultiplier = 1 + synergies.reduce((sum, item) => sum + item.roiBoost, 0);
  const portfolioContext = portfolio || calculatePortfolioDynamics(selected.length, Object.keys(states || {}).length);
  const coordinationFactor = 1 - portfolioContext.coordinationPressure / 100;
  const portfolioEffect = portfolioContext.focusMultiplier * coordinationFactor;
  const fundingMultiplier = deliveryMultiplier(fundingIntensity);

  selected.forEach((id) => {
    const state = states[id];
    const metadata = state?.scenarioMetadata;
    if (!metadata) return;
    const definition = definitions.get(metadata.primaryMetric);
    if (!definition) return;
    const initiativeReadiness = allocationToReadiness(allocationForInitiative(id, initiativeAllocationMode, initiativeAllocations, allocation));
    const readinessFactor = 0.55 + initiativeReadiness.data * 0.2 + initiativeReadiness.people * 0.15 + initiativeReadiness.governance * 0.1;
    const diminishingReturns = 1 / (1 + Math.max(0, state.quartersFunded - 1) * 0.08);
    // Older direct-engine callers predate lifecycle tracking; retain their
    // established effect while action-aware turns only include capabilities
    // whose benefits have begun to realise.
    const realisedBenefit = Number(state.benefitRealization) > 0
      ? Math.max(0, Math.min(1, Number(state.benefitRealization)))
      : 1;
    const deploymentMultiplier = ['scale', 'run'].includes(state.lifecycle) && state.deploymentImpact
      ? 1 + Number(state.deploymentImpact.efficiencyDelta || 0) / 100
      : 1;
    const effect = metadata.baseEffect * maturityReadiness(state.maturityLevel) * readinessFactor * adoptionFactor * diminishingReturns * synergyMultiplier * portfolioEffect * fundingMultiplier * Math.max(.05, realisedBenefit) * Math.max(0, Math.min(1, gateMultiplier)) * deploymentMultiplier;
    metrics[metadata.primaryMetric] = clamp((metrics[metadata.primaryMetric] ?? definition.start) + effect, definition.min, definition.max);
  });

  // Only capabilities that have actually received funding can be neglected.
  // If multiple active initiatives affect one KPI, apply only the most
  // material penalty for that KPI in this quarter rather than stacking all
  // alternatives into one shared outcome.
  const neglectedByMetric = new Map<string, { state: InitiativeState; penalty: number }>();
  Object.values(states).forEach((state) => {
    if (selected.includes(state.id) || Number(state.quartersFunded) <= 0) return;
    const metadata = state.scenarioMetadata;
    if (!metadata || state.quartersSinceLastFund < metadata.neglect.penaltyThreshold) return;
    const definition = definitions.get(metadata.primaryMetric);
    if (!definition) return;
    const penalty = Math.min(
      metadata.neglect.penaltyAmount * 3,
      metadata.neglect.penaltyAmount * metadata.neglect.decayRate * Math.max(1, state.quartersSinceLastFund - metadata.neglect.penaltyThreshold + 1),
    );
    const existing = neglectedByMetric.get(metadata.primaryMetric);
    if (!existing || penalty > existing.penalty) neglectedByMetric.set(metadata.primaryMetric, { state, penalty });
  });
  neglectedByMetric.forEach(({ state, penalty }) => {
    const metadata = state.scenarioMetadata;
    if (!metadata) return;
    const definition = definitions.get(metadata.primaryMetric);
    if (!definition) return;
    const direction = metadata.baseEffect >= 0 ? -1 : 1;
    metrics[metadata.primaryMetric] = clamp((metrics[metadata.primaryMetric] ?? definition.start) + direction * penalty, definition.min, definition.max);
  });

  const progress = Object.fromEntries(scenario.progress.map((definition) => {
    const current = clamp(metrics[definition.key] ?? definition.start, definition.min, definition.max);
    const span = Math.max(1, Math.abs(definition.target - definition.start));
    const moved = definition.direction === 'higher-is-better' ? current - definition.start : definition.start - current;
    return [definition.key, clamp((moved / span) * 100, 0, 100)];
  }));
  return { metrics, progress, flags: { ...previous.flags } };
}
