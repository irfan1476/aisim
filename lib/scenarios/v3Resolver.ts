import type { V3ScenarioPack, V3CausalRule, V3Event } from './types';
import type { V3ScenarioState, V3GateRecord, V3EventRecord } from '../game/state';

export type V3ResolverResult<T> = { state: V3ScenarioState; result: T };
export type V3GateResult = { gateId: string; status: 'pending' | 'met' | 'failed'; missingEvidence: string[]; failedConditions: string[] };
export type V3CausalResult = { applied: Array<{ ruleId: string; metric: string; delta: number; availableQuarter: number }>; deferred: Array<{ ruleId: string; availableQuarter: number }> };
export type V3EventResult = { triggered: boolean; eventId?: string; reason?: string };
export type V3ExposureResult = { exposed: boolean; deferred: boolean; reason: string };
export type V3ValueAttribution = { status: 'observed' | 'estimated' | 'not-yet-observable'; metric: string; delta: number; value?: number; sourceRuleIds: string[]; evidenceIds: string[] };

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const gatesFor = (pack: V3ScenarioPack) => pack.gates || pack.governanceGates || [];

export function evaluateV3Gate(pack: V3ScenarioPack, state: V3ScenarioState, gateId: string, evidenceIds: string[] = [], metrics: Record<string, number> = {}): V3ResolverResult<V3GateResult> {
  const gate = gatesFor(pack).find((item) => item.id === gateId);
  const next = clone(state);
  if (!gate) return { state: next, result: { gateId, status: 'failed', missingEvidence: [], failedConditions: ['Unknown gate.'] } };
  const missingEvidence = (gate.requiredEvidence || []).filter((id) => !evidenceIds.includes(id));
  const failedConditions = (gate.conditions || []).filter((condition) => !evaluateCondition(condition, metrics, next.currentQuarter));
  const status = missingEvidence.length || failedConditions.length ? 'failed' : 'met';
  const previous = next.gates[gateId];
  const record: V3GateRecord = previous || { id: gateId, status: 'pending', history: [] };
  record.status = status;
  record.history = [...record.history, { quarter: next.currentQuarter, status, evidenceIds: [...evidenceIds] }];
  next.gates[gateId] = record;
  return { state: next, result: { gateId, status, missingEvidence, failedConditions } };
}

function evaluateCondition(condition: string, metrics: Record<string, number>, quarter = 0): boolean {
  const normalized = condition.trim().replace(/^metric\./, '');
  const quarterMatch = normalized.match(/^quarter\s*(>=|<=|>|<|=)\s*(-?\d+(?:\.\d+)?)$/);
  if (quarterMatch) {
    const expected = Number(quarterMatch[2]);
    return quarterMatch[1] === '>=' ? quarter >= expected : quarterMatch[1] === '<=' ? quarter <= expected : quarterMatch[1] === '>' ? quarter > expected : quarterMatch[1] === '<' ? quarter < expected : quarter === expected;
  }
  const match = normalized.match(/^([\w.-]+)\s*(>=|<=|>|<|=)\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return false;
  const value = metrics[match[1]];
  if (value === undefined) return false;
  const expected = Number(match[3]);
  return match[2] === '>=' ? value >= expected : match[2] === '<=' ? value <= expected : match[2] === '>' ? value > expected : match[2] === '<' ? value < expected : value === expected;
}

/** Apply only rules whose authored signal lag has elapsed; never mutates input. */
export function resolveV3CausalRules(pack: V3ScenarioPack, state: V3ScenarioState, metrics: Record<string, number>, quarter = state.currentQuarter): V3ResolverResult<V3CausalResult> {
  const next = clone(state); const nextMetrics = { ...metrics }; const applied: V3CausalResult['applied'] = []; const deferred: V3CausalResult['deferred'] = [];
  for (const rule of pack.causalRules || []) {
    const ruleRecord = rule as Record<string, unknown>;
    const profile = pack.initiatives?.find((item) => item.id === String(ruleRecord.initiativeId || ''));
    const initiativeId = typeof ruleRecord.initiativeId === 'string' ? ruleRecord.initiativeId : undefined;
    if (initiativeId && typeof ruleRecord.delayQuarters !== 'number') {
      const lifecycle = next.initiatives[initiativeId]?.lifecycle;
      if (!lifecycle || !['pilot', 'scale', 'sustain'].includes(lifecycle)) continue;
    }
    const lag = typeof ruleRecord.delayQuarters === 'number' ? ruleRecord.delayQuarters : (profile?.lifecycle?.timeToSignalQuarters || 0);
    const availableQuarter = quarter + lag;
    const effects = rule.effects || [];
    const condition = typeof ruleRecord.condition === 'string' ? ruleRecord.condition : undefined;
    if (condition && !evaluateCondition(condition, nextMetrics, quarter)) continue;
    if (availableQuarter > quarter) { deferred.push({ ruleId: rule.id, availableQuarter }); continue; }
    for (const effect of effects) {
      nextMetrics[effect.metric] = (nextMetrics[effect.metric] || 0) + effect.delta;
      applied.push({ ruleId: rule.id, metric: effect.metric, delta: effect.delta, availableQuarter });
    }
  }
  return { state: next, result: { applied, deferred } };
}

export function resolveV3Event(pack: V3ScenarioPack, state: V3ScenarioState, eventId: string, optionId?: string, metrics: Record<string, number> = {}): V3ResolverResult<V3EventResult> {
  const next = clone(state); const event = (pack.events || []).find((item) => item.id === eventId);
  if (!event) return { state: next, result: { triggered: false, reason: 'Unknown event.' } };
  if (event.trigger && !evaluateCondition(event.trigger, metrics, next.currentQuarter)) return { state: next, result: { triggered: false, reason: 'Trigger conditions are not met.' } };
  const impacts: Record<string, number> = {};
  for (const effect of event.effects || []) impacts[effect.metric] = (impacts[effect.metric] || 0) + effect.delta;
  const record: V3EventRecord = { id: event.id, quarter: next.currentQuarter, optionId, impacts };
  next.eventLog = [...next.eventLog, record];
  return { state: next, result: { triggered: true, eventId } };
}

export function evaluateV3Stakeholder(pack: V3ScenarioPack, state: V3ScenarioState, stakeholderId: string, delta: number, reason?: string): V3ResolverResult<number> {
  const next = clone(state); const stakeholder = pack.stakeholders?.find((item) => item.id === stakeholderId);
  if (!stakeholder) return { state: next, result: 0 };
  const record = next.stakeholders[stakeholderId] || { id: stakeholderId, sentiment: 0, history: [] };
  record.sentiment = Math.max(-100, Math.min(100, record.sentiment + delta));
  record.history = [...record.history, { quarter: next.currentQuarter, delta, reason }];
  next.stakeholders[stakeholderId] = record;
  next.scorecard.stakeholderHealth = Object.values(next.stakeholders).reduce((sum, item) => sum + item.sentiment, 0);
  return { state: next, result: record.sentiment };
}

export function evaluateV3Exposure(pack: V3ScenarioPack, state: V3ScenarioState, initiativeId: string, exposedEvidenceIds: string[] = []): V3ResolverResult<V3ExposureResult> {
  const next = clone(state); const initiative = pack.initiatives?.find((item) => item.id === initiativeId);
  if (!initiative) return { state: next, result: { exposed: false, deferred: true, reason: 'Unknown initiative.' } };
  const required = initiative.evidenceRequired || []; const exposed = required.every((id) => exposedEvidenceIds.includes(id));
  const deferred = !exposed || initiative.whyNotNow?.status === 'capacity_incompatible';
  return { state: next, result: { exposed, deferred, reason: deferred ? 'Evidence or capacity boundary requires deferral.' : 'Initiative is exposed to the learner.' } };
}

export function recordV3WorkflowAdoption(state: V3ScenarioState, initiativeId: string, evidence: { reviewed?: number; overridden?: number; corrected?: number; trainingCompleted?: boolean }): V3ResolverResult<number> {
  const next = clone(state); const reviewed = evidence.reviewed || 0; const overridden = evidence.overridden || 0; const corrected = evidence.corrected || 0;
  const score = Math.max(0, Math.min(100, reviewed * 10 + (evidence.trainingCompleted ? 20 : 0) - overridden * 5 - corrected * 3));
  next.scorecard.evidence = [...next.scorecard.evidence, `workflow:${initiativeId}`];
  next.scorecard.execution = Math.max(0, Math.min(100, next.scorecard.execution + score / 10));
  return { state: next, result: score };
}

export function applyV3CausalRule(rule: V3CausalRule, metrics: Record<string, number>): Record<string, number> {
  const next = { ...metrics }; for (const effect of rule.effects || []) next[effect.metric] = (next[effect.metric] || 0) + effect.delta; return next;
}

/** Attribute value only when the pack declares an operational metric and evidence. */
export function attributeV3OperationalValue(pack: V3ScenarioPack, metrics: Record<string, number>, before: Record<string, number>): V3ValueAttribution[] {
  return (pack.report?.changes || []).map((change) => {
    const delta = (metrics[change.metric] ?? 0) - (before[change.metric] ?? metrics[change.metric] ?? 0);
    const evidenceIds = [...(change.evidenceIds || [])];
    const sourceRuleIds = change.ruleId ? [change.ruleId] : [];
    return { status: sourceRuleIds.length || evidenceIds.length ? 'estimated' : 'not-yet-observable', metric: change.metric, delta, sourceRuleIds, evidenceIds };
  });
}

export function getV3Event(pack: V3ScenarioPack, eventId: string): V3Event | undefined { return pack.events?.find((event) => event.id === eventId); }
