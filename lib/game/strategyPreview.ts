import { resolveQuarter } from './engine';
import { applyTurnDecision } from './turnResolver';
import { quarterlyDeploymentCap, type Allocation, type GameState } from './state';
import { getScenario } from '../scenarios/registry';
import { calculateActionCapitalPlan } from './capital';
import { describeSynergies } from './generator';
import { suggestedLifecycleAction } from './lifecycleResolver';
import type { InitiativeAction, InitiativeActionSet } from './businessModel';

export type StrategyPreviewDecision = {
  selected: string[];
  alloc: Allocation;
  deploymentAmount: number;
  initiativeActions?: InitiativeActionSet;
  /** Optional per-initiative operating allocations used by custom mode. */
  initiativeAllocationMode?: GameState['initiativeAllocationMode'];
  initiativeAllocations?: GameState['initiativeAllocations'];
  accelerationAllocations?: GameState['accelerationAllocations'];
};

export type StrategyPreviewMetric = {
  key: string;
  label: string;
  current: number;
  alternative: number;
  delta: number;
  unit: string;
  direction?: 'higher-is-better' | 'lower-is-better';
};

export type StrategyPreview = {
  current: {
    selected: string[];
    deploymentAmount: number;
    spend: number;
    metrics: Record<string, number>;
    scenarioMetrics: Record<string, number>;
    scenarioProgress: Record<string, number>;
  };
  alternative: {
    selected: string[];
    deploymentAmount: number;
    spend: { deploymentAmount: number; amount: number; portfolioCost: number; acceleratedInvestment: number; fundingIntensity: number; provenance: string };
    metrics: Record<string, number>;
    scenarioMetrics: Record<string, number>;
    scenarioProgress: Record<string, number>;
    scenarioState?: GameState['scenarioState'];
    initiativeStates?: GameState['initiativeStates'];
    decision?: {
      selected: string[];
      alloc: Allocation;
      initiativeActions?: InitiativeActionSet;
      initiativeAllocationMode?: GameState['initiativeAllocationMode'];
      initiativeAllocations?: GameState['initiativeAllocations'];
      accelerationAllocations?: GameState['accelerationAllocations'];
    };
  };
  deltas: Record<string, number>;
  uncoveredPressures: string[];
  metricDeltas: StrategyPreviewMetric[];
  improves: StrategyPreviewMetric[];
  worsens: StrategyPreviewMetric[];
  uncovered: string[];
  tradeoffs: string[];
  learningInsight: string;
  valid: boolean;
  warning?: string;
};

const nativeMetrics: Array<[string, string, string, 'higher-is-better' | 'lower-is-better']> = [
  ['roi', 'ROI', '%', 'higher-is-better'],
  ['revenue', 'Revenue uplift', '%', 'higher-is-better'],
  ['efficiency', 'Efficiency', '%', 'higher-is-better'],
  ['adoption', 'Adoption', '%', 'higher-is-better'],
  ['risk', 'Risk exposure', '%', 'lower-is-better'],
  ['data', 'Data readiness', '%', 'higher-is-better'],
  ['satisfaction', 'Satisfaction', '%', 'higher-is-better'],
];

function finite(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function selectedCost(state: GameState, selected: string[]): number {
  return selected.reduce((sum, id) => {
    const item = state.initiativeStates?.[id];
    return sum + finite(item?.currentCost ?? item?.baseCost ?? item?.cost);
  }, 0);
}

function stateScenarioMetrics(state: GameState): Record<string, number> {
  return Object.fromEntries(Object.entries(state.scenarioState?.metrics || {}).map(([key, value]) => [key, finite(value)]));
}

function stateScenarioProgress(state: GameState): Record<string, number> {
  return Object.fromEntries(Object.entries(state.scenarioState?.progress || {}).map(([key, value]) => [key, finite(value)]));
}

function normalizeSelection(state: GameState, selected: string[]): string[] {
  return Array.from(new Set(selected)).filter((id) => Boolean(state.initiativeStates?.[id])).slice(0, 3);
}

export function previewStrategy(state: GameState, decisionOrSelected: StrategyPreviewDecision | string[], legacyAlloc?: Allocation, legacyDeployment?: number): StrategyPreview {
  const decision: StrategyPreviewDecision = Array.isArray(decisionOrSelected)
    ? { selected: decisionOrSelected, alloc: legacyAlloc || state.alloc, deploymentAmount: legacyDeployment ?? state.deploymentAmount }
    : decisionOrSelected;
  const selected = normalizeSelection(state, decision.selected || []);
  const currentSelected = normalizeSelection(state, state.selected || []);
  const currentSpend = selectedCost(state, currentSelected);
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const discovery = describeSynergies(selected, state.initiativeStates || {}, scenario?.synergies);
  const synergyCostReduction = Math.min(0.15, discovery?.effects.reduce((sum, effect) => sum + effect.costReduction, 0) || 0);
  const alternativeSpend = selectedCost(state, selected) * (1 - synergyCostReduction);
  // Keep the laboratory on the same lifecycle contract as live confirmation.
  // The selected cards are delivery actions; funded cards that are not selected
  // retain their explicit action so continuity is visible in the preview.
  const initiativeActions: InitiativeActionSet = { ...(state.initiativeActions || {}), ...(decision.initiativeActions || {}) };
  selected.forEach((id) => {
    if (initiativeActions[id]) return;
    const initiative = state.initiativeStates?.[id];
    initiativeActions[id] = scenario && initiative
      ? suggestedLifecycleAction(initiative, state.q)
      : 'scale';
  });
  Object.entries(state.initiativeStates || {}).forEach(([id, initiative]) => {
    if (initiativeActions[id] || selected.includes(id)) return;
    if (finite(initiative.quartersFunded) > 0) initiativeActions[id] = 'maintain';
  });
  const campaignRemaining = finite(state.campaignBudgetRemaining, finite(state.campaignBudget, state.quarterlyBudget * 12));
  const deploymentCap = quarterlyDeploymentCap(state.campaignBudget, campaignRemaining, state.quarterlyBudget, state.q, state.spent);
  const deploymentAmount = Math.max(0, Math.min(finite(decision.deploymentAmount), deploymentCap));
  const currentDeployment = Math.max(0, Math.min(finite(state.deploymentAmount), deploymentCap));
  // Preview the exact action-aware capital plan used by live confirmation.
  // This is important for discovery/pilot actions: their commitment is not the
  // full scale cost, and extra capital is only acceleration for delivery work.
  const capitalPlan = calculateActionCapitalPlan(state, initiativeActions, deploymentAmount, state.quarterlyCrisisCost, decision.accelerationAllocations);
  const effectiveDeployment = selected.length ? deploymentAmount : 0;
  // Validate and resolve through the same acceptance path used by live play.
  // This is especially important for custom operating mixes: calling
  // resolveQuarter directly would skip the custom 100% and capacity gates and
  // would also pass the shared allocation into scenario effects.
  const turnDecision = {
    selected,
    initiativeActions,
    alloc: decision.alloc || state.alloc,
    initiativeAllocationMode: decision.initiativeAllocationMode,
    initiativeAllocations: decision.initiativeAllocations,
    accelerationAllocations: decision.accelerationAllocations,
    deploymentAmount: selected.length ? deploymentAmount : 0,
  };
  const liveResolution = applyTurnDecision(state, turnDecision);
  // A blocked draft still gets a projection so the laboratory can explain the
  // consequence of the proposed change. Its validity and warning always come
  // from applyTurnDecision, so the learner sees the same blocker as Confirm.
  const fallbackResolution = liveResolution.accepted ? undefined : resolveQuarter(state, {
    ...turnDecision,
    deploymentAmount: selected.length ? capitalPlan.deliveryCapital : 0,
    continuityAllocations: selected.length ? capitalPlan.continuityAllocations : undefined,
  });
  const alternativeMetricsSource = liveResolution.accepted ? liveResolution.nextState : fallbackResolution!;
  const alternativeInitiativeStates = liveResolution.accepted
    ? liveResolution.nextState.initiativeStates
    : fallbackResolution!.initiativeStates;
  const alternativeScenarioStateSource = liveResolution.accepted
    ? liveResolution.nextState.scenarioState
    : fallbackResolution!.scenarioState;
  const currentMetrics = Object.fromEntries(nativeMetrics.map(([key]) => [key, finite(state[key as keyof GameState])]));
  const alternativeMetrics = Object.fromEntries(nativeMetrics.map(([key]) => [key, finite(alternativeMetricsSource[key as keyof typeof alternativeMetricsSource], currentMetrics[key])]));
  const currentScenario = stateScenarioMetrics(state);
  const alternativeScenario = Object.fromEntries(Object.entries(alternativeScenarioStateSource?.metrics || {}).map(([key, value]) => [key, finite(value)]));
  const currentProgress = stateScenarioProgress(state);
  const alternativeProgress = Object.fromEntries(Object.entries(alternativeScenarioStateSource?.progress || {}).map(([key, value]) => [key, finite(value)]));

  const metricDeltas: StrategyPreviewMetric[] = nativeMetrics.map(([key, label, unit, direction]) => ({
    key, label, unit, direction,
    current: currentMetrics[key],
    alternative: alternativeMetrics[key],
    delta: alternativeMetrics[key] - currentMetrics[key],
  }));
  if (scenario) {
    for (const definition of scenario.progress) {
      const current = finite(currentScenario[definition.key], definition.start);
      const alternative = finite(alternativeScenario[definition.key], current);
      metricDeltas.push({ key: definition.key, label: definition.label, unit: definition.unit, direction: definition.direction, current, alternative, delta: alternative - current });
    }
  }

  const improves = metricDeltas.filter((item) => item.direction === 'lower-is-better' ? item.delta < -0.05 : item.delta > 0.05);
  const worsens = metricDeltas.filter((item) => item.direction === 'lower-is-better' ? item.delta > 0.05 : item.delta < -0.05);
  const covered = new Set(selected);
  const uncovered = scenario
    ? scenario.progress.filter((definition) => !Object.values(state.initiativeStates || {}).some((initiative) => covered.has(initiative.id) && initiative.scenarioMetadata?.primaryMetric === definition.key)).map((definition) => definition.label)
    : [];
  const tradeoffs: string[] = [];
  if (selected.length === 0) tradeoffs.push('No initiative receives focus; this preserves optionality but leaves the operating pressures uncovered.');
  if (selected.length === 1) tradeoffs.push('Deep focus can build one capability faster, but concentrates risk and leaves other pressures uncovered.');
  if (selected.length === 2) tradeoffs.push('Two initiatives balance depth and coverage, but still compete for shared people, data, and governance capacity.');
  if (selected.length === 3) tradeoffs.push('Three initiatives broaden coverage, but increase coordination and adoption demands.');
  if (deploymentAmount < currentDeployment) tradeoffs.push('The alternative preserves more budget this quarter, so its benefits may arrive more slowly.');
  if (deploymentAmount > currentDeployment) tradeoffs.push('The alternative deploys more capital now, reducing reserve for later quarters and crises.');
  if (uncovered.length) tradeoffs.push(`Uncovered pressure: ${uncovered.slice(0, 2).join(' and ')}.`);

  const bestImprovement = improves[0];
  const posture = selected.length === 0 ? 'pause' : selected.length === 1 ? 'deep-focus' : selected.length === 2 ? 'focused-balance' : 'portfolio-breadth';
  const learningInsight = bestImprovement
    ? `${posture}: ${bestImprovement.label} moves ${bestImprovement.delta >= 0 ? '+' : ''}${bestImprovement.delta.toFixed(1)}${bestImprovement.unit}. Compare that gain with the ${worsens[0]?.label || 'trade-off'} before applying the draft.`
    : `${posture}: this alternative does not improve a measured outcome yet; it may still be useful as a reserve, sequencing, or risk-control experiment.`;
  const valid = liveResolution.accepted;
  const warning = !liveResolution.accepted
    ? `${liveResolution.reason}${capitalPlan.maintenanceSpend > 0 ? ` This includes ${capitalPlan.maintenanceSpend.toFixed(2)} in continuity commitments.` : ''}`
    : finite(decision.deploymentAmount) > deploymentCap + 1e-9 ? `This deployment exceeds this quarter's available authority of ${deploymentCap.toFixed(2)}.`
    : capitalPlan.requiredCapital > campaignRemaining + 1e-9 ? 'This plan exceeds the remaining campaign purse.' : undefined;

  const deltas: Record<string, number> = Object.fromEntries(metricDeltas.map((item) => [item.key, item.delta]));
  deltas.initiativeSpend = alternativeSpend - currentSpend;
  deltas.deployment = deploymentAmount - currentDeployment;
  const alternativeScenarioState = alternativeScenarioStateSource || (scenario ? { metrics: alternativeScenario, progress: alternativeProgress, flags: {} } : undefined);
  const alternativeFundingIntensity = liveResolution.accepted
    ? finite(liveResolution.nextState.history.at(-1)?.fundingIntensity, 1)
    : finite(fallbackResolution?.snapshot.fundingIntensity, 1);
  const alternativeDecision = {
    selected,
    alloc: decision.alloc || state.alloc,
    initiativeActions,
    initiativeAllocationMode: decision.initiativeAllocationMode,
    initiativeAllocations: decision.initiativeAllocations,
    accelerationAllocations: decision.accelerationAllocations,
  };
  return {
    current: { selected: currentSelected, deploymentAmount: currentDeployment, spend: currentSpend, metrics: currentMetrics, scenarioMetrics: currentScenario, scenarioProgress: currentProgress },
    alternative: { selected, deploymentAmount: effectiveDeployment, spend: { deploymentAmount: effectiveDeployment, amount: effectiveDeployment, portfolioCost: capitalPlan.initiativeMinimum, acceleratedInvestment: selected.length ? capitalPlan.accelerationSpend : 0, fundingIntensity: alternativeFundingIntensity, provenance: 'engine-preview' }, metrics: alternativeMetrics, scenarioMetrics: alternativeScenario, scenarioProgress: alternativeProgress, scenarioState: alternativeScenarioState, initiativeStates: alternativeInitiativeStates, decision: alternativeDecision },
    deltas, uncoveredPressures: uncovered, metricDeltas, improves, worsens, uncovered, tradeoffs, learningInsight, valid, warning,
  };
}
