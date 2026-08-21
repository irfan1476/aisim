import type { V3ScenarioPack } from '../scenarios/types';
import type { GameState, V3ScenarioState } from './state';

export type V3AnalyticsProjection = {
  dashboard: { quarter: number; budgetRemaining: number; activeInitiatives: number; gateHealth: number; stakeholderHealth: number; evidenceCount: number };
  metrics: Record<string, { current: number; start?: number; target?: number; unit?: string; owner?: string; sourceRuleIds: string[]; sourceEvidenceIds: string[] }>;
  ledger: V3ScenarioState['ledger'];
  gates: V3ScenarioState['gates'];
  stakeholders: V3ScenarioState['stakeholders'];
  capacity: V3ScenarioState['capacity'];
  events: V3ScenarioState['eventLog'];
  exposures: Array<{ initiativeId: string; exposed: boolean; deferred: boolean; reason: string }>;
  evidence: V3ScenarioPack['evidence'];
  sourceLinks: Record<string, { ruleIds: string[]; evidenceIds: string[] }>;
  hiddenLegacyResult: { score: number; roi: number; revenue: number; efficiency: number; adoption: number } | null;
};

/** Read-only, deterministic projection for V3 analytics surfaces. */
export function projectV3Analytics(state: V3ScenarioState | undefined, pack: V3ScenarioPack | undefined, history: Array<Record<string, unknown>> = [], legacy?: Partial<GameState>): V3AnalyticsProjection | null {
  if (!state || !pack) return null;
  const metrics: V3AnalyticsProjection['metrics'] = {};
  const definitions = [...(pack.metrics || []), ...(pack.reportedMetrics || [])];
  for (const definition of definitions) {
    const values = history.map((entry) => Number((entry.metrics as Record<string, unknown> | undefined)?.[definition.key] ?? entry[definition.key] ?? NaN)).filter(Number.isFinite);
    metrics[definition.key] = { current: values.length ? values[values.length - 1] : Number(definition.start || 0), start: definition.start, target: definition.target, unit: definition.unit, owner: definition.ownerRole, sourceRuleIds: [...(definition.sourceRuleIds || [])], sourceEvidenceIds: [...(definition.sourceEvidenceIds || [])] };
  }
  const activeInitiatives = Object.values(state.initiatives).filter((item) => ['research', 'pilot', 'scale', 'sustain'].includes(item.lifecycle)).length;
  const gateValues = Object.values(state.gates);
  const gateHealth = gateValues.length ? gateValues.filter((gate) => gate.status === 'met' || gate.status === 'repaired').length / gateValues.length * 100 : 100;
  const sourceLinks: V3AnalyticsProjection['sourceLinks'] = {};
  for (const definition of definitions) sourceLinks[definition.key] = { ruleIds: [...(definition.sourceRuleIds || [])], evidenceIds: [...(definition.sourceEvidenceIds || [])] };
  const exposures = Object.entries(state.initiatives).map(([initiativeId, item]) => ({ initiativeId, exposed: item.lifecycle !== 'deferred', deferred: item.lifecycle === 'deferred', reason: item.lifecycle === 'deferred' ? 'Not yet exposed to delivery.' : 'Initiative is in the learner decision path.' }));
  return {
    dashboard: { quarter: state.currentQuarter, budgetRemaining: state.budget.remaining, activeInitiatives, gateHealth, stakeholderHealth: state.scorecard.stakeholderHealth, evidenceCount: (pack.evidence || []).length },
    metrics,
    ledger: state.ledger.map((entry) => ({ ...entry, initiativeIds: [...entry.initiativeIds], evidenceIds: [...entry.evidenceIds], gateIds: [...entry.gateIds] })),
    gates: JSON.parse(JSON.stringify(state.gates)),
    stakeholders: JSON.parse(JSON.stringify(state.stakeholders)),
    capacity: JSON.parse(JSON.stringify(state.capacity)),
    events: JSON.parse(JSON.stringify(state.eventLog)),
    exposures,
    evidence: pack.evidence ? [...pack.evidence] : [],
    sourceLinks,
    hiddenLegacyResult: legacy ? { score: Number(legacy.score || 0), roi: Number(legacy.roi || 0), revenue: Number(legacy.revenue || 0), efficiency: Number(legacy.efficiency || 0), adoption: Number(legacy.adoption || 0) } : null,
  };
}

export const selectV3Analytics = projectV3Analytics;
