import { normalizeGameState } from './game/persistence';
import type { Allocation, GameState, InitiativeAllocationMode, InitiativeAllocationSet } from './game/state';
import { advanceTurn, applyCrisisResponse, applyTurnDecision, type CrisisResponse, type TurnDecision } from './game/turnResolver';
import type { InitiativeAccelerationAllocation, InitiativeActionSet } from './game/businessModel';

/** V1/V2 remain readable; V3 records tailored initiative operating mixes. */
export const COUNTERFACTUAL_TRACE_VERSION = 3;
const SUPPORTED_COUNTERFACTUAL_TRACE_VERSIONS = new Set([1, 2, COUNTERFACTUAL_TRACE_VERSION]);
export const ACTIVE_COUNTERFACTUAL_TRACE_STORAGE_KEY = 'aisim-active-counterfactual-trace-v1';

export type EvaluationDecision = {
  initiativeId: string;
  decision: 'go' | 'no_go' | 'pause';
  rationale: string;
  owner: string;
};

export type DeploymentModeDecision = {
  initiativeId: string;
  mode: 'augmentation' | 'automation';
  rationale: string;
};

export type AdaptationDecision = {
  initiativeId: string;
  action: 'retrain' | 'tune' | 'rollback' | 'deprecate';
  reason: string;
};

export type LifecycleDecisionPayload = {
  evaluationDecisions?: EvaluationDecision[];
  deploymentDecisions?: DeploymentModeDecision[];
  adaptationDecisions?: AdaptationDecision[];
};

export type RecordedDecision = TurnDecision & {
  type: 'decision';
  q: number;
  /** Full action map is required for deterministic lifecycle replay. */
  initiativeActions?: InitiativeActionSet;
  /** Optional learner-authored lifecycle decisions, added in trace v2. */
  evaluationDecisions?: EvaluationDecision[];
  deploymentDecisions?: DeploymentModeDecision[];
  adaptationDecisions?: AdaptationDecision[];
};

export type RecordedCrisisResponse = CrisisResponse & {
  type: 'crisis-response';
  q: number;
  eventTitle?: string;
  eventType?: string;
};

export type CounterfactualAction = RecordedDecision | RecordedCrisisResponse;

export type CounterfactualTrace = {
  version: number;
  runId: string;
  scenarioId?: string;
  seed: number;
  rulesVersion: string;
  initialState: GameState;
  actions: CounterfactualAction[];
};

export type CounterfactualEdit = {
  q: number;
  selected: string[];
  alloc: Allocation;
  deploymentAmount: number;
  /** Omitted fields inherit the recorded quarter, preserving the original branch. */
  initiativeActions?: InitiativeActionSet;
  initiativeAllocationMode?: InitiativeAllocationMode;
  initiativeAllocations?: InitiativeAllocationSet;
  /** Omitted fields inherit the recorded quarter's acceleration split. */
  accelerationAllocations?: InitiativeAccelerationAllocation;
  evaluationDecisions?: EvaluationDecision[];
  deploymentDecisions?: DeploymentModeDecision[];
  adaptationDecisions?: AdaptationDecision[];
};

export type CounterfactualReplay = {
  status: 'complete' | 'blocked' | 'invalid';
  state: GameState;
  appliedThroughQuarter: number;
  reason?: string;
  divergentQuarter?: number;
};

function copyState(value: GameState): GameState {
  return normalizeGameState(JSON.parse(JSON.stringify(value)));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isLifecycleDecisionPayload(value: unknown): value is LifecycleDecisionPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as LifecycleDecisionPayload;
  const validEvaluation = payload.evaluationDecisions === undefined || (
    Array.isArray(payload.evaluationDecisions) && payload.evaluationDecisions.every((item) =>
      Boolean(item) && typeof item.initiativeId === 'string' && ['go', 'no_go', 'pause'].includes(item.decision)
      && typeof item.rationale === 'string' && typeof item.owner === 'string'));
  const validDeployment = payload.deploymentDecisions === undefined || (
    Array.isArray(payload.deploymentDecisions) && payload.deploymentDecisions.every((item) =>
      Boolean(item) && typeof item.initiativeId === 'string' && ['augmentation', 'automation'].includes(item.mode)
      && typeof item.rationale === 'string'));
  const validAdaptation = payload.adaptationDecisions === undefined || (
    Array.isArray(payload.adaptationDecisions) && payload.adaptationDecisions.every((item) =>
      Boolean(item) && typeof item.initiativeId === 'string' && ['retrain', 'tune', 'rollback', 'deprecate'].includes(item.action)
      && typeof item.reason === 'string'));
  return validEvaluation && validDeployment && validAdaptation;
}

function isInitiativeActionSet(value: unknown): value is InitiativeActionSet {
  return Boolean(value) && typeof value === 'object' && Object.entries(value as Record<string, unknown>).every(([, action]) =>
    ['discover', 'pilot', 'scale', 'maintain', 'pause', 'retire'].includes(String(action)));
}

function isAllocation(value: unknown): value is Allocation {
  if (!value || typeof value !== 'object') return false;
  const source = value as Record<string, unknown>;
  return ['infra', 'data', 'people', 'mlops', 'compliance', 'innovation'].every((key) => isFiniteNumber(source[key]) && source[key] >= 0);
}

function isInitiativeAllocationSet(value: unknown): value is InitiativeAllocationSet {
  return Boolean(value) && typeof value === 'object'
    && Object.values(value as Record<string, unknown>).every(isAllocation);
}

function isAccelerationAllocationSet(value: unknown): value is InitiativeAccelerationAllocation {
  return Boolean(value) && typeof value === 'object'
    && Object.entries(value as Record<string, unknown>).every(([, weight]) => isFiniteNumber(weight) && weight >= 0);
}

function isRecordedAction(value: unknown): value is CounterfactualAction {
  if (!value || typeof value !== 'object') return false;
  const action = value as Partial<CounterfactualAction>;
  if (!Number.isInteger(action.q) || (action.q as number) < 1) return false;
  if (action.type === 'decision') {
    return Array.isArray(action.selected)
      && action.selected.every((id) => typeof id === 'string')
      && Boolean(action.alloc)
      && typeof action.alloc === 'object'
      && isFiniteNumber(action.deploymentAmount)
      && action.deploymentAmount >= 0
      && (action.initiativeActions === undefined || isInitiativeActionSet(action.initiativeActions))
      && (action.initiativeAllocationMode === undefined || action.initiativeAllocationMode === 'shared' || action.initiativeAllocationMode === 'custom')
      && (action.initiativeAllocations === undefined || isInitiativeAllocationSet(action.initiativeAllocations))
      && (action.accelerationAllocations === undefined || isAccelerationAllocationSet(action.accelerationAllocations))
      && isLifecycleDecisionPayload(action);
  }
  if (action.type === 'crisis-response') {
    return Boolean(action.impact)
      && typeof action.impact === 'object'
      && Object.values(action.impact as Record<string, unknown>).every(isFiniteNumber)
      && (action.cost === undefined || (isFiniteNumber(action.cost) && action.cost >= 0));
  }
  return false;
}

function isValidTrace(value: Partial<CounterfactualTrace>): value is CounterfactualTrace {
  return typeof value.version === 'number'
    && SUPPORTED_COUNTERFACTUAL_TRACE_VERSIONS.has(value.version)
    && Boolean(value.initialState)
    && Array.isArray(value.actions)
    && value.actions.every(isRecordedAction);
}

/** Create a self-contained, executable record at the first decision point. */
export function createCounterfactualTrace(initialState: GameState): CounterfactualTrace {
  const state = copyState(initialState);
  return {
    version: COUNTERFACTUAL_TRACE_VERSION,
    runId: state.runMetadata.runId,
    scenarioId: state.scenarioId,
    seed: state.runMetadata.seed,
    rulesVersion: state.runMetadata.rulesVersion,
    initialState: state,
    actions: [],
  };
}

export function recordDecision(trace: CounterfactualTrace, decision: RecordedDecision): CounterfactualTrace {
  const next: RecordedDecision = {
    type: 'decision',
    q: decision.q,
    selected: [...decision.selected],
    alloc: { ...decision.alloc },
    deploymentAmount: decision.deploymentAmount,
    ...(decision.initiativeActions ? { initiativeActions: { ...decision.initiativeActions } } : {}),
    ...(decision.initiativeAllocationMode ? { initiativeAllocationMode: decision.initiativeAllocationMode } : {}),
    ...(decision.initiativeAllocations ? { initiativeAllocations: JSON.parse(JSON.stringify(decision.initiativeAllocations)) } : {}),
    ...(decision.accelerationAllocations ? { accelerationAllocations: { ...decision.accelerationAllocations } } : {}),
    ...(decision.evaluationDecisions ? { evaluationDecisions: decision.evaluationDecisions.map((item) => ({ ...item })) } : {}),
    ...(decision.deploymentDecisions ? { deploymentDecisions: decision.deploymentDecisions.map((item) => ({ ...item })) } : {}),
    ...(decision.adaptationDecisions ? { adaptationDecisions: decision.adaptationDecisions.map((item) => ({ ...item })) } : {}),
  };
  return {
    ...trace,
    actions: [...trace.actions.filter((action) => !(action.type === 'decision' && action.q === decision.q)), next]
      .sort((left, right) => left.q - right.q || (left.type === 'decision' ? -1 : 1)),
  };
}

/**
 * Attach learner-authored lifecycle decisions to an already-recorded quarter.
 * Lifecycle reviews happen after the board decision, so this helper updates
 * the existing immutable action rather than appending a second decision for
 * the same quarter. A v1 trace is promoted to the current schema only when it
 * receives the new payload.
 */
export function recordLifecycleDecisions(
  trace: CounterfactualTrace,
  q: number,
  payload: LifecycleDecisionPayload,
): CounterfactualTrace {
  const existing = trace.actions.find((action): action is RecordedDecision => action.type === 'decision' && action.q === q);
  if (!existing || !isLifecycleDecisionPayload(payload)) return trace;
  return recordDecision(
    { ...trace, version: COUNTERFACTUAL_TRACE_VERSION },
    {
      ...existing,
      ...(payload.evaluationDecisions ? { evaluationDecisions: payload.evaluationDecisions } : {}),
      ...(payload.deploymentDecisions ? { deploymentDecisions: payload.deploymentDecisions } : {}),
      ...(payload.adaptationDecisions ? { adaptationDecisions: payload.adaptationDecisions } : {}),
    },
  );
}

export function recordCrisisResponse(trace: CounterfactualTrace, response: RecordedCrisisResponse): CounterfactualTrace {
  const next: RecordedCrisisResponse = {
    type: 'crisis-response',
    q: response.q,
    impact: { ...response.impact },
    cost: response.cost,
    eventTitle: response.eventTitle,
    eventType: response.eventType,
  };
  return {
    ...trace,
    actions: [...trace.actions.filter((action) => !(action.type === 'crisis-response' && action.q === response.q)), next]
      .sort((left, right) => left.q - right.q || (left.type === 'decision' ? -1 : 1)),
  };
}

/** The active campaign keeps one executable trace; completed traces are saved with replay notebook entries. */
export function readActiveCounterfactualTrace(): CounterfactualTrace | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_COUNTERFACTUAL_TRACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CounterfactualTrace>;
    if (!isValidTrace(parsed)) return null;
    return {
      version: COUNTERFACTUAL_TRACE_VERSION,
      runId: typeof parsed.runId === 'string' ? parsed.runId : normalizeGameState(parsed.initialState).runMetadata.runId,
      scenarioId: typeof parsed.scenarioId === 'string' ? parsed.scenarioId : undefined,
      seed: Number(parsed.seed) || normalizeGameState(parsed.initialState).runMetadata.seed,
      rulesVersion: typeof parsed.rulesVersion === 'string' ? parsed.rulesVersion : normalizeGameState(parsed.initialState).runMetadata.rulesVersion,
      initialState: copyState(parsed.initialState),
      actions: parsed.actions.map((action) => action.type === 'decision' ? {
        ...action,
        selected: [...action.selected],
        alloc: { ...action.alloc },
        ...(action.initiativeActions ? { initiativeActions: { ...action.initiativeActions } } : {}),
        ...(action.initiativeAllocationMode ? { initiativeAllocationMode: action.initiativeAllocationMode } : {}),
        ...(action.initiativeAllocations ? { initiativeAllocations: JSON.parse(JSON.stringify(action.initiativeAllocations)) } : {}),
        ...(action.accelerationAllocations ? { accelerationAllocations: { ...action.accelerationAllocations } } : {}),
        ...(action.evaluationDecisions ? { evaluationDecisions: action.evaluationDecisions.map((item) => ({ ...item })) } : {}),
        ...(action.deploymentDecisions ? { deploymentDecisions: action.deploymentDecisions.map((item) => ({ ...item })) } : {}),
        ...(action.adaptationDecisions ? { adaptationDecisions: action.adaptationDecisions.map((item) => ({ ...item })) } : {}),
      } : { ...action, impact: { ...action.impact } }),
    };
  } catch {
    return null;
  }
}

export function writeActiveCounterfactualTrace(trace: CounterfactualTrace): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVE_COUNTERFACTUAL_TRACE_STORAGE_KEY, JSON.stringify(trace));
}

export function clearActiveCounterfactualTrace(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACTIVE_COUNTERFACTUAL_TRACE_STORAGE_KEY);
}

function fail(state: GameState, appliedThroughQuarter: number, reason: string, divergentQuarter?: number): CounterfactualReplay {
  return { status: 'blocked', state, appliedThroughQuarter, reason, divergentQuarter };
}

/**
 * Replay an immutable decision trace, substituting one board decision. When a
 * changed action produces a different crisis or makes a later decision invalid,
 * replay intentionally pauses rather than inventing a learner choice.
 */
export function replayCounterfactual(trace: CounterfactualTrace, edit: CounterfactualEdit): CounterfactualReplay {
  // Keep a runtime-validatable view separate from the public type. Saved
  // localStorage payloads can be malformed even though callers normally pass
  // a CounterfactualTrace, and this keeps the defensive branch type-safe.
  const candidate = trace as unknown as Partial<CounterfactualTrace>;
  if (!isValidTrace(candidate)) {
    let state: GameState;
    try {
      state = copyState(candidate.initialState as GameState);
    } catch {
      state = normalizeGameState({} as GameState);
    }
    return { status: 'invalid', state, appliedThroughQuarter: 0, reason: 'This campaign contains an invalid or incompatible replay trace.' };
  }
  if (edit.q < 1 || !Number.isInteger(edit.q)) {
    return { status: 'invalid', state: copyState(trace.initialState), appliedThroughQuarter: 0, reason: 'Choose a valid completed quarter to test.' };
  }

  let state = copyState(trace.initialState);
  const decisions = trace.actions.filter((action): action is RecordedDecision => action.type === 'decision').sort((a, b) => a.q - b.q);
  const responses = new Map(trace.actions
    .filter((action): action is RecordedCrisisResponse => action.type === 'crisis-response')
    .map((action) => [action.q, action]));
  let appliedThroughQuarter = 0;

  for (const recorded of decisions) {
    if (recorded.q !== state.q) {
      return { status: 'invalid', state, appliedThroughQuarter, reason: `The trace skips or duplicates Quarter ${state.q}.` };
    }
    const decision: TurnDecision & LifecycleDecisionPayload = {
      selected: recorded.q === edit.q ? [...edit.selected] : [...recorded.selected],
      alloc: recorded.q === edit.q ? { ...edit.alloc } : { ...recorded.alloc },
      deploymentAmount: recorded.q === edit.q ? edit.deploymentAmount : recorded.deploymentAmount,
      // A counterfactual changes only what it explicitly supplies. This keeps
      // the original lifecycle plan and learner rationale on the replay path.
      initiativeActions: recorded.q === edit.q ? { ...(edit.initiativeActions || recorded.initiativeActions || {}) } : recorded.initiativeActions,
      initiativeAllocationMode: recorded.q === edit.q ? edit.initiativeAllocationMode ?? recorded.initiativeAllocationMode : recorded.initiativeAllocationMode,
      initiativeAllocations: recorded.q === edit.q ? edit.initiativeAllocations ?? recorded.initiativeAllocations : recorded.initiativeAllocations,
      accelerationAllocations: recorded.q === edit.q ? edit.accelerationAllocations ?? recorded.accelerationAllocations : recorded.accelerationAllocations,
      evaluationDecisions: recorded.q === edit.q ? edit.evaluationDecisions ?? recorded.evaluationDecisions : recorded.evaluationDecisions,
      deploymentDecisions: recorded.q === edit.q ? edit.deploymentDecisions ?? recorded.deploymentDecisions : recorded.deploymentDecisions,
      adaptationDecisions: recorded.q === edit.q ? edit.adaptationDecisions ?? recorded.adaptationDecisions : recorded.adaptationDecisions,
    };
    const resolved = applyTurnDecision(state, decision);
    if (!resolved.accepted) return fail(resolved.nextState, appliedThroughQuarter, resolved.reason, recorded.q === edit.q ? recorded.q : undefined);
    state = resolved.nextState;
    const recordedResponse = responses.get(recorded.q);
    if (recordedResponse) {
      if (!state.crisis) {
        return fail(state, appliedThroughQuarter, `The original Quarter ${recorded.q} crisis no longer occurs after the changed decision. Choose how to continue from this divergence.`, recorded.q);
      }
      if (recordedResponse.eventTitle && state.crisis.title !== recordedResponse.eventTitle) {
        return fail(state, appliedThroughQuarter, `Quarter ${recorded.q} now presents a different crisis. Choose a new response before continuing.`, recorded.q);
      }
      state = applyCrisisResponse(state, recordedResponse);
    } else if (state.crisis) {
      return fail(state, appliedThroughQuarter, `Quarter ${recorded.q} now requires a crisis response that was not part of the original run.`, recorded.q);
    }
    appliedThroughQuarter = recorded.q;
    state = advanceTurn(state);
  }

  return { status: state.stage === 'done' ? 'complete' : 'blocked', state, appliedThroughQuarter, reason: state.stage === 'done' ? undefined : 'The original campaign ended before this branch could reach a final outcome.' };
}
