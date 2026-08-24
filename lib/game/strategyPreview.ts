import { evaluateSynergies } from './generator';
import { resolveQuarter, type QuarterDecision } from './engine';
import { calculatePortfolioDynamics } from './effectResolver';
import type { InitiativeState } from './initiativeState';
import type { Allocation, GameState, ScenarioState } from './state';
import { getScenario } from '../scenarios/registry';

export type StrategyPreviewDecision = {
  selected: string[];
  alloc: Allocation;
  deploymentAmount?: number;
};

export type StrategyPreviewSpend = {
  initiativeSpend: number;
  deploymentAmount: number;
  reserveAfterDeployment: number;
  campaignRemaining: number;
  provenance: 'engine-preview-estimate';
};

export type StrategyPreviewPlan = {
  decision: StrategyPreviewDecision;
  metrics: Partial<GameState>;
  initiativeStates: Record<string, InitiativeState>;
  scenarioState?: ScenarioState;
  spend: StrategyPreviewSpend;
};

export type StrategyPreview = {
  current: StrategyPreviewPlan;
  alternative: StrategyPreviewPlan;
  deltas: Record<string, number>;
  tradeoffs: string[];
  uncoveredPressures: string[];
  learningInsight: string;
  /** Convenient aliases for consumers that only need the comparison values. */
  currentMetrics: Partial<GameState>;
  alternativeMetrics: Partial<GameState>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function numericMetrics(state: GameState, scenarioState?: ScenarioState): Record<string, number> {
  const metrics: Record<string, number> = {};
  const source = { ...state, ...(scenarioState?.metrics || {}) } as Record<string, unknown>;
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'number' && Number.isFinite(value)) metrics[key] = value;
  }
  return metrics;
}

function normalizeDecision(state: GameState, decision: StrategyPreviewDecision): StrategyPreviewDecision {
  const available = new Set(Object.keys(state.initiativeStates || {}));
  const selected = Array.from(new Set(decision.selected || []))
    .filter((id) => available.has(id))
    .slice(0, 3);
  return { selected, alloc: { ...state.alloc, ...decision.alloc }, deploymentAmount: decision.deploymentAmount };
}

function latestDecision(state: GameState): StrategyPreviewDecision {
  const latest = state.history.at(-1);
  return {
    selected: state.selected.length ? [...state.selected] : [...(latest?.selectedIds || [])],
    alloc: { ...(latest?.allocation || state.alloc) },
    deploymentAmount: state.lastQuarterDeployment || state.deploymentAmount,
  };
}

function planSpend(state: GameState, decision: StrategyPreviewDecision, states: Record<string, InitiativeState>): StrategyPreviewSpend {
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const synergies = evaluateSynergies(decision.selected, states, scenario?.synergies);
  const costReduction = Math.min(0.15, synergies.reduce((sum, item) => sum + item.costReduction, 0));
  const initiativeSpend = decision.selected.reduce((sum, id) => {
    const item = states[id];
    return sum + Number(item?.baseCost ?? item?.cost ?? item?.currentCost ?? 0);
  }, 0) * (1 - costReduction);
  const campaignRemaining = Number(state.campaignBudgetRemaining ?? state.campaignBudget ?? 0);
  const requestedDeployment = Number(decision.deploymentAmount ?? state.deploymentAmount ?? state.quarterlyBudget);
  const deploymentAmount = clamp(
    Number.isFinite(requestedDeployment) ? requestedDeployment : state.quarterlyBudget,
    0,
    Math.max(0, campaignRemaining),
  );
  return {
    initiativeSpend: Number(initiativeSpend.toFixed(2)),
    deploymentAmount: Number(deploymentAmount.toFixed(2)),
    reserveAfterDeployment: Number(Math.max(0, campaignRemaining - deploymentAmount).toFixed(2)),
    campaignRemaining,
    provenance: 'engine-preview-estimate',
  };
}

function previewPlan(state: GameState, decision: StrategyPreviewDecision): StrategyPreviewPlan {
  const normalized = normalizeDecision(state, decision);
  const quarterDecision: QuarterDecision = { selected: normalized.selected, alloc: normalized.alloc };
  const result = resolveQuarter(clone(state), quarterDecision);
  return {
    decision: normalized,
    metrics: clone(result.metrics),
    initiativeStates: clone(result.initiativeStates),
    scenarioState: clone(result.scenarioState),
    spend: planSpend(state, normalized, result.initiativeStates),
  };
}

function deltaMetrics(current: StrategyPreviewPlan, alternative: StrategyPreviewPlan): Record<string, number> {
  const keys = new Set([
    ...Object.keys(numericMetrics({ ...({} as GameState), ...current.metrics }, current.scenarioState)),
    ...Object.keys(numericMetrics({ ...({} as GameState), ...alternative.metrics }, alternative.scenarioState)),
  ]);
  const deltas: Record<string, number> = {};
  for (const key of Array.from(keys)) {
    const before = Number(current.scenarioState?.metrics?.[key] ?? current.metrics[key as keyof GameState] ?? 0);
    const after = Number(alternative.scenarioState?.metrics?.[key] ?? alternative.metrics[key as keyof GameState] ?? 0);
    if (Number.isFinite(before) && Number.isFinite(after)) deltas[key] = Number((after - before).toFixed(2));
  }
  deltas.initiativeSpend = Number((alternative.spend.initiativeSpend - current.spend.initiativeSpend).toFixed(2));
  deltas.deploymentAmount = Number((alternative.spend.deploymentAmount - current.spend.deploymentAmount).toFixed(2));
  return deltas;
}

function buildUncoveredPressures(state: GameState, plan: StrategyPreviewPlan): string[] {
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  if (!scenario) return [];
  return scenario.progress
    .filter((definition) => {
      const value = Number(plan.scenarioState?.metrics?.[definition.key] ?? definition.start);
      const moved = definition.direction === 'higher-is-better' ? value - definition.start : definition.start - value;
      const progress = moved / Math.max(1, Math.abs(definition.target - definition.start));
      return progress < 0.75;
    })
    .map((definition) => definition.label);
}

function buildTradeoffs(state: GameState, current: StrategyPreviewPlan, alternative: StrategyPreviewPlan, deltas: Record<string, number>): string[] {
  const tradeoffs: string[] = [];
  const countDelta = alternative.decision.selected.length - current.decision.selected.length;
  if (countDelta < 0) tradeoffs.push(`Deeper focus on ${alternative.decision.selected.length} initiative${alternative.decision.selected.length === 1 ? '' : 's'} leaves more pressures uncovered.`);
  if (countDelta > 0) tradeoffs.push(`Broader coverage adds coordination pressure across ${alternative.decision.selected.length} initiatives.`);
  if (deltas.risk > 0.1) tradeoffs.push(`Risk rises by ${deltas.risk.toFixed(1)} points; strengthen governance before scaling.`);
  if (deltas.risk < -0.1) tradeoffs.push(`Risk falls by ${Math.abs(deltas.risk).toFixed(1)} points, but this may trade off near-term growth.`);
  if (deltas.adoption < -0.1) tradeoffs.push(`Adoption is lower by ${Math.abs(deltas.adoption).toFixed(1)} points in this alternative.`);
  if (alternative.spend.reserveAfterDeployment < current.spend.reserveAfterDeployment - 0.01) tradeoffs.push('This plan uses more of the available reserve this quarter.');
  if (!tradeoffs.length) tradeoffs.push(`The alternative keeps the same ${state.scenarioMode ? 'scenario' : 'operating'} posture while changing the allocation emphasis.`);
  return tradeoffs;
}

function learningInsight(state: GameState, alternative: StrategyPreviewPlan, deltas: Record<string, number>, uncovered: string[]): string {
  const posture = calculatePortfolioDynamics(alternative.decision.selected.length, Object.keys(state.initiativeStates || {}).length).portfolioPosture;
  const postureText = posture === 'deep-focus' ? 'a deep-focus bet' : posture === 'focused-balance' ? 'a focused balance' : posture === 'portfolio-breadth' ? 'broad portfolio coverage' : 'a deliberate pause';
  const leading = Object.entries(deltas)
    .filter(([key, value]) => !['initiativeSpend', 'deploymentAmount'].includes(key) && Math.abs(value) > 0.1)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))[0];
  const outcome = leading ? `${leading[0]} moves ${leading[1] >= 0 ? 'up' : 'down'} by ${Math.abs(leading[1]).toFixed(1)} points` : 'the measured metrics remain broadly unchanged';
  return `This is ${postureText}: ${outcome}. ${uncovered.length ? `It still leaves ${uncovered.slice(0, 2).join(' and ')} to work on.` : 'It keeps the main pressures covered.'}`;
}

/**
 * Previews an alternative quarter without mutating the live campaign.
 * Both sides of the comparison use the same resolveQuarter contract as play.
 */
export function previewStrategy(
  state: GameState,
  alternative: StrategyPreviewDecision,
): StrategyPreview;
export function previewStrategy(
  state: GameState,
  selected: string[],
  alloc: Allocation,
  deploymentAmount?: number,
): StrategyPreview;
export function previewStrategy(
  state: GameState,
  alternativeOrSelected: StrategyPreviewDecision | string[],
  alloc?: Allocation,
  deploymentAmount?: number,
): StrategyPreview {
  const alternative = Array.isArray(alternativeOrSelected)
    ? { selected: alternativeOrSelected, alloc: alloc || state.alloc, deploymentAmount }
    : alternativeOrSelected;
  const current = previewPlan(state, latestDecision(state));
  const next = previewPlan(state, alternative);
  const deltas = deltaMetrics(current, next);
  const uncoveredPressures = buildUncoveredPressures(state, next);
  return {
    current,
    alternative: next,
    deltas,
    tradeoffs: buildTradeoffs(state, current, next, deltas),
    uncoveredPressures,
    learningInsight: learningInsight(state, next, deltas, uncoveredPressures),
    currentMetrics: current.metrics,
    alternativeMetrics: next.metrics,
  };
}

export const previewQuarter = previewStrategy;
