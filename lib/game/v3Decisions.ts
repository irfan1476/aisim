import type { V3BaselineResponse, V3BaselineState, V3LedgerEntry, V3Lifecycle, V3ScenarioState } from './state';
import type { V3InitiativeProfile, V3ScenarioPack } from '../scenarios/types';

export type V3DecisionError = { code: string; message: string; initiativeId?: string; pool?: string };
export type V3BaselineInput = { questionId: string; response: string };

/** Baseline is reflective metadata only; it is never consumed by outcome rules. */
export function createV3Baseline(version = 'v1'): V3BaselineState {
  return { version, responses: [] };
}

export function recordV3BaselineResponse(baseline: V3BaselineState, input: V3BaselineInput): V3BaselineState {
  const questionId = input.questionId.trim();
  const response = input.response.trim();
  if (!questionId || !response) return baseline;
  const next: V3BaselineResponse = { questionId, version: baseline.version, response };
  const responses = [...baseline.responses.filter((item) => item.questionId !== questionId), next];
  return { version: baseline.version, responses };
}

export function validateV3Baseline(baseline: V3BaselineState, expectedResponses = 5): V3DecisionError[] {
  const errors: V3DecisionError[] = [];
  if (!baseline.version.trim()) errors.push({ code: 'baseline-version-required', message: 'Baseline question version is required.' });
  const ids = new Set<string>();
  baseline.responses.forEach((item) => {
    if (ids.has(item.questionId)) errors.push({ code: 'duplicate-baseline-question', message: `Baseline question '${item.questionId}' is repeated.` });
    ids.add(item.questionId);
    if (!item.response.trim()) errors.push({ code: 'baseline-response-required', message: `Baseline response '${item.questionId}' is empty.` });
    if (item.version !== baseline.version) errors.push({ code: 'baseline-version-mismatch', message: `Baseline response '${item.questionId}' uses a different question version.` });
  });
  if (baseline.responses.length !== expectedResponses) errors.push({ code: 'baseline-response-count', message: `Expected ${expectedResponses} baseline responses; received ${baseline.responses.length}.` });
  return errors;
}

function transitionAllowed(profile: V3InitiativeProfile | undefined, from: V3Lifecycle, to: V3Lifecycle): boolean {
  if (from === to) return true;
  return (profile?.lifecycle?.allowedTransitions || []).some((transition) => {
    const [left, right] = transition.replace(/_/g, ' ').split(/\s+to\s+|→/).map((item) => item.trim());
    return left === from && right === to;
  });
}

export type V3PortfolioPlan = { initiativeId: string; lifecycle: V3Lifecycle; cost?: number; capacity?: Record<string, number>; gateIds?: string[]; ownerId?: string };

/** Validate authored lifecycle transitions, prerequisites, gates, and active-work limit. */
export function validateV3LifecyclePlan(state: V3ScenarioState, pack: V3ScenarioPack, plan: V3PortfolioPlan[]): V3DecisionError[] {
  const errors: V3DecisionError[] = [];
  const profiles = new Map((pack.initiatives || []).map((item) => [item.id, item]));
  const active = plan.filter((item) => item.lifecycle === 'pilot' || item.lifecycle === 'scale');
  if (active.length > state.capacity.activeDeliveryLimit) errors.push({ code: 'active-capacity-limit', message: `At most ${state.capacity.activeDeliveryLimit} initiatives may be in pilot or scale.` });
  for (const item of plan) {
    const current = state.initiatives[item.initiativeId];
    const profile = profiles.get(item.initiativeId);
    if (!current || !profile) { errors.push({ code: 'unknown-initiative', message: `Unknown V3 initiative '${item.initiativeId}'.`, initiativeId: item.initiativeId }); continue; }
    if (!transitionAllowed(profile, current.lifecycle, item.lifecycle)) errors.push({ code: 'invalid-lifecycle-transition', message: `Cannot transition '${item.initiativeId}' from ${current.lifecycle} to ${item.lifecycle}.`, initiativeId: item.initiativeId });
    for (const dependency of profile.dependencies || []) {
      const dependencyPlan = plan.find((candidate) => candidate.initiativeId === dependency);
      const dependencyState = state.initiatives[dependency];
      const dependencyLifecycle = dependencyPlan?.lifecycle || dependencyState?.lifecycle;
      if (item.lifecycle === 'scale' && (!dependencyLifecycle || dependencyLifecycle === 'deferred' || dependencyLifecycle === 'stop' || dependencyLifecycle === 'pause')) errors.push({ code: 'dependency-not-ready', message: `Scale requires dependency '${dependency}' to be active.`, initiativeId: item.initiativeId });
    }
    const requiredGates = (pack.gates || pack.governanceGates || []).filter((gate) => (gate.appliesTo || []).some((target) => target.split('.')[0] === item.initiativeId));
    if (item.lifecycle === 'scale') for (const gate of requiredGates) {
      const record = state.gates[gate.id];
      if (!record || (record.status !== 'met' && record.status !== 'repaired')) errors.push({ code: 'gate-not-met', message: `Scale requires gate '${gate.id}' to be met.`, initiativeId: item.initiativeId });
    }
  }
  return errors;
}

/** Check budget and declared capacity independently, allowing fewer than three initiatives. */
export function validateV3BudgetAndCapacity(state: V3ScenarioState, plan: V3PortfolioPlan[]): V3DecisionError[] {
  const errors: V3DecisionError[] = [];
  const spend = plan.reduce((sum, item) => sum + Math.max(0, item.cost || 0), 0);
  if (spend > state.budget.remaining + 1e-9) errors.push({ code: 'budget-exceeded', message: `Plan costs ${spend} against ${state.budget.remaining} remaining.` });
  const used: Record<string, number> = {};
  plan.forEach((item) => Object.entries(item.capacity || {}).forEach(([pool, amount]) => { used[pool] = (used[pool] || 0) + Math.max(0, amount); }));
  Object.entries(used).forEach(([pool, amount]) => {
    const limit = state.capacity.pools[pool];
    if (limit !== undefined && amount > limit + 1e-9) errors.push({ code: 'capacity-exceeded', message: `Plan uses ${amount} of ${limit} ${pool} capacity.`, pool });
  });
  return errors;
}

export type V3LedgerPlan = Omit<V3LedgerEntry, 'outcome' | 'reflection'>;

export function appendV3LedgerEntry(state: V3ScenarioState, entry: V3LedgerPlan): V3ScenarioState {
  return { ...state, ledger: [...state.ledger, { ...entry, initiativeIds: [...entry.initiativeIds], evidenceIds: [...entry.evidenceIds], gateIds: [...entry.gateIds] }] };
}

export function attachV3LedgerOutcome(state: V3ScenarioState, entryId: string, outcome: Record<string, unknown>, reflection?: string): V3ScenarioState {
  return { ...state, ledger: state.ledger.map((entry) => entry.id === entryId ? { ...entry, outcome: { ...outcome }, reflection } : entry) };
}

export function applyV3PortfolioPlan(state: V3ScenarioState, plan: V3PortfolioPlan[], quarter = state.currentQuarter): V3ScenarioState {
  const spent = plan.reduce((sum, item) => sum + Math.max(0, item.cost || 0), 0);
  const used: Record<string, number> = {};
  plan.forEach((item) => Object.entries(item.capacity || {}).forEach(([pool, amount]) => { used[pool] = (used[pool] || 0) + Math.max(0, amount); }));
  const initiatives = { ...state.initiatives };
  plan.forEach((item) => { const previous = initiatives[item.initiativeId]; if (previous) initiatives[item.initiativeId] = { ...previous, lifecycle: item.lifecycle, ownerId: item.ownerId, gateIds: [...(item.gateIds || previous.gateIds)], capacity: { ...(item.capacity || previous.capacity) } }; });
  const nextUsed = { ...state.capacity.used };
  Object.entries(used).forEach(([pool, amount]) => { nextUsed[pool] = (nextUsed[pool] || 0) + amount; });
  return { ...state, currentQuarter: Math.max(state.currentQuarter, quarter), budget: { ...state.budget, spent: state.budget.spent + spent, remaining: state.budget.remaining - spent }, capacity: { ...state.capacity, used: nextUsed }, initiatives };
}
