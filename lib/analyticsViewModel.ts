import type { GameState } from './game/state';
import { getScenario } from './scenarios/registry';
import type { ScenarioProgressDefinition } from './scenarios/types';

export type AnalyticsMetric = {
  key: string;
  label: string;
  unit: string;
  current: number;
  start: number;
  target: number;
  min: number;
  max: number;
  direction: 'higher-is-better' | 'lower-is-better';
  progress: number;
  delta: number;
  source: 'scenario' | 'native';
  status: 'measured' | 'derived';
  provenance: 'measured' | 'derived';
  confidence: 'high' | 'medium' | 'low';
  sourceDetail: string;
};

export type InitiativeSpend = { id: string; name: string; amount: number };

export type PortfolioPosture = 'deep focus' | 'focused balance' | 'portfolio breadth';

export type QuarterDecisionEvidence = {
  quarter: number;
  selectedIds: string[];
  selectedCount: number;
  posture: PortfolioPosture;
  spend: number;
  spendPerInitiative: number;
  breadth: number;
  concentrationRisk: number;
  provenance: 'calculated-from-portfolio-choice' | 'legacy-derived';
};

export type PortfolioDecisionProfile = {
  completedQuarters: number;
  latest: QuarterDecisionEvidence | undefined;
  quarters: QuarterDecisionEvidence[];
  averageSelected: number;
  oneInitiativeQuarters: number;
  twoInitiativeQuarters: number;
  threeInitiativeQuarters: number;
  averageSpend: number;
  suggestedPace: number;
  paceStatus: 'behind pace' | 'within pace' | 'ahead of pace';
  concentration: number;
  breadth: number;
  fundedInitiatives: number;
};

function selectedIdsForEntry(entry: any): string[] {
  const ids = Array.isArray(entry?.selectedIds) && entry.selectedIds.length
    ? entry.selectedIds
    : entry?.chosen;
  return Array.isArray(ids) ? ids.filter(Boolean) : [];
}

function postureForCount(count: number): PortfolioPosture {
  if (count <= 1) return 'deep focus';
  if (count === 2) return 'focused balance';
  return 'portfolio breadth';
}

function displayPosture(value: unknown, count: number): PortfolioPosture {
  if (value === 'deep-focus') return 'deep focus';
  if (value === 'focused-balance') return 'focused balance';
  if (value === 'portfolio-breadth') return 'portfolio breadth';
  return postureForCount(count);
}

function spendForEntry(entry: any, previous: any): number {
  const snapshotSpend = Number(entry?.metrics?.spent ?? 0);
  const previousSpend = Number(previous?.metrics?.spent ?? 0);
  if (Number.isFinite(snapshotSpend) && snapshotSpend > 0) return Math.max(0, snapshotSpend - previousSpend);
  return Math.max(0, Number(entry?.spend ?? entry?.quarterSpend ?? 0));
}

export function portfolioDecisionProfile(state: GameState): PortfolioDecisionProfile {
  const history = Array.isArray(state.history) ? state.history : [];
  const quarters = history.map((entry, index) => {
    const selectedIds = selectedIdsForEntry(entry);
    const spend = spendForEntry(entry, history[index - 1]);
    const selectedCount = Number.isFinite(Number(entry.selectedCount)) ? Number(entry.selectedCount) : selectedIds.length;
    const provenance: QuarterDecisionEvidence['provenance'] = entry.portfolioProvenance || entry.portfolio?.provenance
      ? 'calculated-from-portfolio-choice'
      : 'legacy-derived';
    return {
      quarter: Number(entry.q ?? index + 1),
      selectedIds,
      selectedCount,
      posture: displayPosture(entry.portfolioPosture ?? entry.portfolio?.portfolioPosture, selectedCount),
      spend,
      spendPerInitiative: selectedCount ? spend / selectedCount : 0,
      breadth: Number(entry.breadth ?? entry.portfolioBreadth ?? entry.portfolio?.breadth ?? 0),
      concentrationRisk: Number(entry.concentrationRisk ?? entry.portfolio?.concentrationRisk ?? 0),
      provenance,
    };
  });
  const totalSelected = quarters.reduce((sum, item) => sum + item.selectedCount, 0);
  const funded = new Set(quarters.flatMap(item => item.selectedIds));
  const initiativeSpend = new Map<string, number>();
  quarters.forEach(item => item.selectedIds.forEach(id => initiativeSpend.set(id, (initiativeSpend.get(id) || 0) + item.spend / Math.max(1, item.selectedCount))));
  const topSpend = Math.max(0, ...Array.from(initiativeSpend.values()));
  const totalSpend = quarters.reduce((sum, item) => sum + item.spend, 0);
  const averageSpend = quarters.length ? totalSpend / quarters.length : 0;
  const suggestedPace = Number(state.campaignBudget ?? state.quarterlyBudget ?? 0) / 12;
  const paceRatio = suggestedPace > 0 ? averageSpend / suggestedPace : 0;
  const explicitBreadth = quarters.filter(item => item.provenance === 'calculated-from-portfolio-choice' && item.breadth > 0);
  const explicitConcentration = quarters.filter(item => item.provenance === 'calculated-from-portfolio-choice' && item.concentrationRisk > 0);
  return {
    completedQuarters: quarters.length,
    latest: quarters.at(-1),
    quarters,
    averageSelected: quarters.length ? totalSelected / quarters.length : 0,
    oneInitiativeQuarters: quarters.filter(item => item.selectedCount === 1).length,
    twoInitiativeQuarters: quarters.filter(item => item.selectedCount === 2).length,
    threeInitiativeQuarters: quarters.filter(item => item.selectedCount >= 3).length,
    averageSpend,
    suggestedPace,
    paceStatus: paceRatio > 1.1 ? 'ahead of pace' : paceRatio < 0.9 ? 'behind pace' : 'within pace',
    concentration: explicitConcentration.length
      ? Math.round(explicitConcentration.reduce((sum, item) => sum + item.concentrationRisk, 0) / explicitConcentration.length)
      : totalSpend ? Math.round((topSpend / totalSpend) * 100) : 0,
    breadth: explicitBreadth.length
      ? Math.round(explicitBreadth.reduce((sum, item) => sum + item.breadth, 0) / explicitBreadth.length)
      : Math.round((funded.size / Math.max(1, Object.keys(state.initiativeStates || {}).length)) * 100),
    fundedInitiatives: funded.size,
  };
}

export function metricProvenance(metric: AnalyticsMetric): 'measured outcome' | 'scenario-defined effect' | 'modelled proxy' {
  if (metric.provenance === 'measured') return 'measured outcome';
  return 'modelled proxy';
}

export type ForecastPoint = {
  quarter: number;
  values: Record<string, number>;
  ranges: Record<string, { low: number; high: number }>;
  provenance: 'directional-model';
  confidence: 'medium' | 'low';
};

const nativeDefinitions: ScenarioProgressDefinition[] = [
  { key: 'roi', label: 'ROI', unit: '%', start: 0, target: 35, min: 0, max: 100, direction: 'higher-is-better' },
  { key: 'adoption', label: 'Adoption', unit: '%', start: 38, target: 67, min: 0, max: 100, direction: 'higher-is-better' },
  { key: 'risk', label: 'Risk exposure', unit: '%', start: 36, target: 20, min: 0, max: 100, direction: 'lower-is-better' },
  { key: 'data', label: 'Data readiness', unit: '%', start: 54, target: 80, min: 0, max: 100, direction: 'higher-is-better' },
  { key: 'efficiency', label: 'Efficiency', unit: '%', start: 8, target: 55, min: 0, max: 100, direction: 'higher-is-better' },
];

function progressFor(value: number, definition: ScenarioProgressDefinition) {
  const moved = definition.direction === 'higher-is-better'
    ? value - definition.start
    : definition.start - value;
  return Math.max(0, Math.min(100, (moved / Math.max(1, Math.abs(definition.target - definition.start))) * 100));
}

function definitionForNative(definition: ScenarioProgressDefinition, state: GameState): AnalyticsMetric {
  const current = Number(state[definition.key as keyof GameState] ?? definition.start);
  return {
    ...definition,
    current,
    progress: progressFor(current, definition),
    delta: current - definition.start,
    source: 'native',
    status: 'measured',
    provenance: 'derived',
    confidence: 'medium',
    sourceDetail: 'Native operating metric; target progress is calculated from the standard-mode baseline.',
  };
}

export function analyticsMetrics(state: GameState): AnalyticsMetric[] {
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  if (!scenario) return nativeDefinitions.map((definition) => definitionForNative(definition, state));

  const currentMetrics = state.scenarioState?.metrics || {};
  return scenario.progress.map((definition) => {
    const current = Number(currentMetrics[definition.key] ?? definition.start);
    return {
      ...definition,
      current,
      progress: Number(state.scenarioState?.progress?.[definition.key] ?? progressFor(current, definition)),
      delta: current - definition.start,
      source: 'scenario',
      status: 'measured',
      provenance: 'measured',
      confidence: 'high',
      sourceDetail: `Recorded ${scenario.name} outcome; progress is calculated against this scenario's declared baseline and target.`,
    };
  });
}

export function analyticsHistory(state: GameState, metric: AnalyticsMetric) {
  return (state.history || []).map((entry) => {
    const value = metric.source === 'scenario'
      ? Number(entry.scenarioState?.metrics?.[metric.key] ?? metric.start)
      : Number(entry.metrics?.[metric.key as keyof typeof entry.metrics] ?? metric.start);
    return { quarter: entry.q, value };
  });
}

export function analyticsBudget(state: GameState) {
  const latest = state.history.at(-1);
  const previous = state.history.at(-2);
  const spentLastCompletedQuarter = latest
    ? Math.max(0, Number(latest.metrics?.spent ?? 0) - Number(previous?.metrics?.spent ?? 0))
    : 0;
  return {
    spentCampaign: Number(state.spent || 0),
    spentLastCompletedQuarter,
    lastCompletedQuarter: latest?.q,
    remainingThisQuarter: state.scenarioMode
      ? Math.max(0, Number(state.scenarioBudgetRemaining ?? state.quarterlyBudget))
      : undefined,
    envelope: state.scenarioMode ? Number(state.quarterlyBudget) : undefined,
    campaignBudget: Number(state.campaignBudget ?? state.quarterlyBudget * 12),
    campaignBudgetRemaining: Math.max(0, Number(state.campaignBudgetRemaining ?? (state.campaignBudget ?? state.quarterlyBudget * 12) - state.spent)),
    pace: Number(state.quarterlyBudget || (state.campaignBudget ?? 0) / 12),
    paceStatus: portfolioDecisionProfile(state).paceStatus,
  };
}

export function initiativeSpend(state: GameState): InitiativeSpend[] {
  const currentStates = state.initiativeStates || {};
  const latestStates = state.history.at(-1)?.initiativeStates || {};
  const ids = Array.from(new Set([...Object.keys(currentStates), ...Object.keys(latestStates)]));
  return ids.map((id) => {
    const current = currentStates[id];
    const latest = latestStates[id];
    // Older saves may contain the attributable funding ledger without the
    // newer cumulative totalInvestment field. Recover that spend from the
    // recorded quarter snapshots so discovery/run/retirement cash is not
    // silently omitted from Analytics.
    const ledgerSpend = (state.history || []).reduce((sum, entry) => {
      const funding = entry.initiativeFunding?.[id];
      return sum + (funding ? Number(funding.total || 0) : 0);
    }, 0);
    return {
      id,
      name: current?.name || latest?.name || id,
      amount: Math.max(Number(current?.totalInvestment ?? 0), Number(latest?.totalInvestment ?? 0), ledgerSpend),
    };
  }).filter((item) => item.amount > 0);
}

export function lowestScenarioMetric(state: GameState) {
  const metrics = analyticsMetrics(state);
  return metrics.reduce<AnalyticsMetric | undefined>((lowest, metric) => {
    if (!lowest) return metric;
    return metric.progress < lowest.progress ? metric : lowest;
  }, undefined);
}

export function scenarioForecast(state: GameState, quarters = 3): ForecastPoint[] {
  const metrics = analyticsMetrics(state).filter((metric) => metric.source === 'scenario');
  const history = state.history || [];
  return Array.from({ length: quarters }, (_, index) => {
    const quarter = state.q + index + 1;
    const values = Object.fromEntries(metrics.map((metric) => {
      const history = analyticsHistory(state, metric);
      const previous = history.at(-1)?.value ?? metric.start;
      const before = history.at(-2)?.value ?? metric.start;
      const momentum = previous - before;
      const towardTarget = (metric.target - previous) * 0.18;
      const next = metric.direction === 'higher-is-better'
        ? previous + (momentum * 0.35) + towardTarget
        : previous + (momentum * 0.35) + towardTarget;
      return [metric.key, Math.max(metric.min, Math.min(metric.max, next))];
    }));
    const ranges = Object.fromEntries(metrics.map((metric) => {
      const series = analyticsHistory(state, metric).map((point) => point.value);
      const changes = series.slice(1).map((value, changeIndex) => value - series[changeIndex]);
      const volatility = changes.length > 1
        ? Math.sqrt(changes.reduce((sum, change) => sum + Math.pow(change - changes.reduce((a, b) => a + b, 0) / changes.length, 2), 0) / changes.length)
        : Math.max(1, Math.abs(metric.target - metric.start) * 0.04);
      const spread = Math.min(Math.abs(metric.max - metric.min) * 0.2, Math.max(1, volatility) * (index + 1) * 1.25);
      const value = values[metric.key];
      return [metric.key, {
        low: Math.max(metric.min, value - spread),
        high: Math.min(metric.max, value + spread),
      }];
    }));
    return {
      quarter,
      values,
      ranges,
      provenance: 'directional-model',
      confidence: history.length >= 3 ? 'medium' : 'low',
    };
  });
}
