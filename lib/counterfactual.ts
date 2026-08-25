import { normalizeGameState } from './game/persistence';
import type { Allocation, GameState } from './game/state';
import { advanceTurn, applyCrisisResponse, applyTurnDecision, type CrisisResponse, type TurnDecision } from './game/turnResolver';

export const COUNTERFACTUAL_TRACE_VERSION = 1;
export const ACTIVE_COUNTERFACTUAL_TRACE_STORAGE_KEY = 'aisim-active-counterfactual-trace-v1';

export type RecordedDecision = TurnDecision & {
  type: 'decision';
  q: number;
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
      && action.deploymentAmount >= 0;
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
  return value.version === COUNTERFACTUAL_TRACE_VERSION
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
  };
  return {
    ...trace,
    actions: [...trace.actions.filter((action) => !(action.type === 'decision' && action.q === decision.q)), next]
      .sort((left, right) => left.q - right.q || (left.type === 'decision' ? -1 : 1)),
  };
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
      actions: parsed.actions,
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
  if (trace.version !== COUNTERFACTUAL_TRACE_VERSION || !isValidTrace(trace)) {
    let state: GameState;
    try {
      state = copyState(trace.initialState);
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
    const decision: TurnDecision = recorded.q === edit.q
      ? { selected: [...edit.selected], alloc: { ...edit.alloc }, deploymentAmount: edit.deploymentAmount }
      : recorded;
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
