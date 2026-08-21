import type { V3ScenarioPack } from '../scenarios/types';
import type { GameState, V3ScenarioState } from './state';
import { applyV3PortfolioPlan, validateV3BudgetAndCapacity, validateV3LifecyclePlan, type V3LedgerPlan, type V3PortfolioPlan } from './v3Decisions';
import { attributeV3OperationalValue, evaluateV3Gate, resolveV3CausalRules, resolveV3Event } from '../scenarios/v3Resolver';

export type V3DecisionResolution = {
  accepted: boolean;
  errors: Array<{ code: string; message: string; initiativeId?: string; pool?: string }>;
  state?: V3ScenarioState;
  metrics: Record<string, number>;
  value: ReturnType<typeof attributeV3OperationalValue>;
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
  const causal = resolveV3CausalRules(input.pack, state, metrics, state.currentQuarter);
  state = causal.state;
  causal.result.applied.forEach((effect) => { metrics[effect.metric] = (metrics[effect.metric] || 0) + effect.delta; });
  if (input.eventId) {
    const event = input.pack.events?.find((item) => item.id === input.eventId);
    const eventResult = resolveV3Event(input.pack, state, input.eventId, input.eventOptionId, metrics);
    state = eventResult.state;
    if (eventResult.result.triggered) for (const effect of event?.effects || []) metrics[effect.metric] = (metrics[effect.metric] || 0) + effect.delta;
  }
  return { accepted: true, errors: [], state, metrics, value: attributeV3OperationalValue(input.pack, metrics, input.metrics || {}) };
}
