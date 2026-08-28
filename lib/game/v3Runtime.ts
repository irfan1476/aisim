import type { V3ScenarioPack } from '../scenarios/types';
import type { GameState, V3ScenarioState } from './state';
import { applyV3PortfolioPlan, attachV3LedgerOutcome, validateV3BudgetAndCapacity, validateV3LifecyclePlan, type V3LedgerPlan, type V3PortfolioPlan } from './v3Decisions';
import { attributeV3OperationalValue, evaluateV3Gate, resolveV3CausalRules, resolveV3Event, resolveV3ResearchReview } from '../scenarios/v3Resolver';
import type { V3WindowDefinition } from '../scenarios/types';

export type V3DecisionResolution = {
  accepted: boolean;
  errors: Array<{ code: string; message: string; initiativeId?: string; pool?: string }>;
  state?: V3ScenarioState;
  metrics: Record<string, number>;
  value: ReturnType<typeof attributeV3OperationalValue>;
  researchReview?: ReturnType<typeof resolveV3ResearchReview>['result'];
};

/**
 * Compose the V3 pure decision/resolver lanes without changing the legacy
 * quarter engine. A future V3 store action can call this façade after it has
 * collected a lifecycle plan and ledger snapshot from the UI.
 */
export function resolveV3Decision(input: {
  gameState: GameState;
  pack: V3ScenarioPack;
  plan: V3PortfolioPlan[];
  ledger?: V3LedgerPlan;
  evidenceIds?: string[];
  metrics?: Record<string, number>;
  gateChecks?: Array<{ gateId: string; evidenceIds?: string[] }>;
  eventId?: string;
  eventOptionId?: string;
}): V3DecisionResolution {
  const base = input.gameState.v3State;
  if (!base) return { accepted: false, errors: [{ code: 'v3-state-required', message: 'V3 state is required for a V3 decision.' }], metrics: { ...(input.metrics || {}) }, value: [] };
  const errors = [...validateV3LifecyclePlan(base, input.pack, input.plan), ...validateV3BudgetAndCapacity(base, input.plan)];
  if (errors.length) return { accepted: false, errors, state: base, metrics: { ...(input.metrics || {}) }, value: [] };
  let state = applyV3PortfolioPlan(base, input.plan);
  if (input.ledger) state = { ...state, ledger: [...state.ledger, { ...input.ledger, initiativeIds: [...input.ledger.initiativeIds], evidenceIds: [...input.ledger.evidenceIds], gateIds: [...input.ledger.gateIds] }] };
  const metrics = { ...(input.metrics || {}) };
  for (const check of input.gateChecks || []) state = evaluateV3Gate(input.pack, state, check.gateId, check.evidenceIds || input.evidenceIds || [], metrics).state;
  const researchOnly = input.plan.length > 0 && input.plan.every((item) => item.lifecycle === 'research');
  const causal = researchOnly
    ? { state, result: { applied: [], deferred: (input.pack.causalRules || []).map((rule) => ({ ruleId: rule.id, availableQuarter: state.currentQuarter + Number((rule as Record<string, unknown>).delayQuarters || 1) })) } }
    : resolveV3CausalRules(input.pack, state, metrics, state.currentQuarter);
  state = causal.state;
  causal.result.applied.forEach((effect) => { metrics[effect.metric] = (metrics[effect.metric] || 0) + effect.delta; });
  if (input.eventId) {
    const event = input.pack.events?.find((item) => item.id === input.eventId);
    const eventResult = resolveV3Event(input.pack, state, input.eventId, input.eventOptionId, metrics);
    state = eventResult.state;
    if (eventResult.result.triggered) for (const effect of event?.effects || []) metrics[effect.metric] = (metrics[effect.metric] || 0) + effect.delta;
  }
  let researchReview: ReturnType<typeof resolveV3ResearchReview>['result'] | undefined;
  const researchInitiative = input.plan.find((item) => item.lifecycle === 'research');
  if (researchInitiative) {
    const reviewed = resolveV3ResearchReview(input.pack, state, researchInitiative.initiativeId, state.currentQuarter);
    state = reviewed.state;
    researchReview = reviewed.result;
  }
  if (input.ledger) {
    const outcome = {
      status: researchReview?.branch || (causal.result.applied.length ? 'observed' : 'unchanged'),
      quarter: state.currentQuarter,
      metrics: Object.fromEntries(Object.keys(metrics).map((key) => [key, { before: input.metrics?.[key], after: metrics[key], delta: (metrics[key] || 0) - (input.metrics?.[key] || metrics[key] || 0) }])),
      ruleIds: causal.result.applied.map((item) => item.ruleId),
      evidenceIds: [...(input.evidenceIds || [])],
      researchOutcomeArtifactId: researchReview?.outcome?.id,
      uncertainty: researchReview?.outcome?.unresolvedConditions || (researchOnly ? ['Operating benefit is not yet observable during Research.'] : []),
    };
    state = attachV3LedgerOutcome(state, input.ledger.id, outcome);
  }
  return { accepted: true, errors: [], state, metrics, value: attributeV3OperationalValue(input.pack, metrics, input.metrics || {}, { operatingEffectsObserved: !researchOnly }), researchReview };
}

export type V3WindowResolution = V3DecisionResolution & {
  window?: { windowId: string; quarterRange: [number, number]; status: 'resolved' | 'paused'; aggregateOutcome: { changed: Record<string, number>; unchanged: string[]; uncertainty: string[]; sourceRuleIds: string[]; sourceEvidenceIds: string[] } };
};

/** Resolve a board window as Q1–Q3 atomic snapshots while keeping Research non-operational. */
export function resolveV3Window(input: Parameters<typeof resolveV3Decision>[0] & { window: V3WindowDefinition }): V3WindowResolution {
  const start = input.window.quarterRange[0];
  const end = input.window.quarterRange[1];
  const first = resolveV3Decision({ ...input, gameState: { ...input.gameState, v3State: input.gameState.v3State ? { ...input.gameState.v3State, currentQuarter: start } : undefined } });
  if (!first.accepted || !first.state) return first;
  let state = first.state;
  const snapshots: V3ScenarioState['windowHistory'][number]['quarterSnapshots'] = [{ quarter: start, metrics: { ...first.metrics }, lifecycle: Object.fromEntries(Object.entries(state.initiatives).map(([id, value]) => [id, value.lifecycle])), note: 'Research commitment.' }];
  let researchReview = first.researchReview;
  for (let quarter = start + 1; quarter <= end; quarter += 1) {
    state = { ...state, currentQuarter: quarter };
    if (researchReview?.branch === 'in-progress') {
      const reviewed = resolveV3ResearchReview(input.pack, state, input.plan[0].initiativeId, quarter);
      state = reviewed.state;
      researchReview = reviewed.result;
    }
    snapshots.push({ quarter, metrics: { ...first.metrics }, lifecycle: Object.fromEntries(Object.entries(state.initiatives).map(([id, value]) => [id, value.lifecycle])), note: quarter === end ? 'Window review point.' : 'Research signal observation.' });
  }
  if (input.ledger && researchReview) {
    state = attachV3LedgerOutcome(state, input.ledger.id, { ...(state.ledger.find((entry) => entry.id === input.ledger?.id)?.outcome || {}), status: researchReview.branch, researchOutcomeArtifactId: researchReview.outcome?.id, uncertainty: researchReview.outcome?.unresolvedConditions || ['Operating benefit is not yet observable during Research.'] });
  }
  const changed: Record<string, number> = {};
  const unchanged: string[] = [];
  Object.entries(first.metrics).forEach(([key, value]) => { if (value === input.metrics?.[key]) unchanged.push(key); else changed[key] = value - (input.metrics?.[key] || value); });
  const aggregateOutcome = { changed, unchanged, uncertainty: researchReview?.outcome?.unresolvedConditions || ['Window 1 does not produce operating benefit; the Q2 signal is a research finding.'], sourceRuleIds: [], sourceEvidenceIds: input.evidenceIds || [] };
  state = { ...state, windowHistory: [...(state.windowHistory || []), { windowId: input.window.id, quarterRange: input.window.quarterRange, status: 'resolved', decisionLedgerId: input.ledger?.id, quarterSnapshots: snapshots, aggregateOutcome }] };
  return { ...first, state, researchReview, window: { windowId: input.window.id, quarterRange: input.window.quarterRange, status: 'resolved', aggregateOutcome } };
}
