import { deriveScore, hydrateGameState, resolveQuarter } from './engine';
import { initializeInitiativeStates, updateInitiativeStates, type InitiativeState } from './initiativeState';
import { initialGameState, type Allocation, type GameState } from './state';

/**
 * Small, dependency-free validation helpers for the simulation domain.
 *
 * The repository does not currently include a test runner, so these checks are
 * intentionally framework agnostic. A test runner can call
 * `runGameEngineValidation()` and assert that `passed` is true, while local
 * diagnostics can call it directly and inspect the individual checks.
 */
export type GameValidationCheck = {
  name: string;
  passed: boolean;
  detail?: string;
};

export type GameValidationReport = {
  passed: boolean;
  checks: GameValidationCheck[];
};

const balancedAllocation: Allocation = {
  infra: 35,
  data: 25,
  people: 15,
  mlops: 10,
  compliance: 10,
  innovation: 5,
};

function check(name: string, assertion: () => void): GameValidationCheck {
  try {
    assertion();
    return { name, passed: true };
  } catch (error) {
    return {
      name,
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function expect(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectClose(actual: number, expected: number, message: string, tolerance = 0.0001) {
  expect(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

function resolveFrom(state: GameState, selected = state.selected) {
  return resolveQuarter(state, { selected, alloc: balancedAllocation });
}

function fundedStates(rounds: number): Record<string, InitiativeState> {
  let states = initializeInitiativeStates();
  for (let round = 0; round < rounds; round += 1) {
    states = updateInitiativeStates(states, ['maintenance'], balancedAllocation, { adoption: 38 });
  }
  return states;
}

/**
 * Runs deterministic smoke checks over the pure engine and initiative model.
 * No browser APIs, React state, persistence, network, or randomness are used.
 */
export function runGameEngineValidation(): GameValidationReport {
  const checks: GameValidationCheck[] = [
    check('initial initiative states include every canonical initiative', () => {
      const states = initializeInitiativeStates();
      expect(Object.keys(states).length === 6, 'expected six initialized initiatives');
      expect(Boolean(states.maintenance), 'maintenance initiative is missing');
    }),

    check('quarter resolution evolves selected initiatives and creates a snapshot', () => {
      const state = initialGameState();
      const result = resolveFrom(state, ['maintenance']);
      expect(result.snapshot.q === state.q, 'snapshot quarter should match the resolved quarter');
      expect(result.snapshot.chosen.length === 1, 'snapshot should contain the selected initiative');
      expect(Boolean(result.snapshot.initiativeStates?.maintenance), 'snapshot should contain initiative states');
      expect(result.initiativeStates.maintenance.quartersFunded === 1, 'funding count should increment');
    }),

    check('quarter resolution does not mutate the input state', () => {
      const state = initialGameState();
      const before = JSON.stringify(state.initiativeStates);
      resolveFrom(state, ['maintenance']);
      expect(JSON.stringify(state.initiativeStates) === before, 'input initiative states were mutated');
      expect(state.history.length === 0, 'input history was mutated');
    }),

    check('snapshots are immutable copies of evolved initiative states', () => {
      const result = resolveFrom(initialGameState(), ['maintenance']);
      const snapshot = result.snapshot.initiativeStates;
      expect(Boolean(snapshot), 'snapshot initiative states are missing');
      const snapshotData = snapshot!.maintenance.currentData;
      result.initiativeStates.maintenance.currentData += 1;
      expectClose(snapshot!.maintenance.currentData, snapshotData, 'snapshot changed after result mutation');
    }),

    check('repeated funding compounds maturity and ROI', () => {
      const first = fundedStates(1).maintenance;
      const second = fundedStates(2).maintenance;
      expect(second.currentRoi > first.currentRoi, 'ROI should increase with repeated funding');
      expect(second.currentData > first.currentData, 'data readiness should increase with repeated funding');
      expect(second.maturityLevel === 'developing', 'two funded quarters should be developing');
    }),

    check('neglect decay starts after more than three unfunded quarters', () => {
      const baseline = initializeInitiativeStates().maintenance.currentData;
      const states = updateInitiativeStates(
        initializeInitiativeStates(),
        [],
        balancedAllocation,
        { adoption: 38 },
      );
      let neglected = states;
      for (let quarter = 0; quarter < 3; quarter += 1) {
        neglected = updateInitiativeStates(neglected, [], balancedAllocation, { adoption: 38 });
      }
      expect(neglected.maintenance.currentData < baseline, 'data readiness should decay after four neglected quarters');
      expect(neglected.maintenance.quartersSinceLastFund === 4, 'neglect counter should be four');
    }),

    check('hydration repairs missing initiative states and history', () => {
      const legacy = { ...initialGameState(), initiativeStates: undefined, history: undefined } as unknown as GameState;
      const hydrated = hydrateGameState(legacy);
      expect(Object.keys(hydrated.initiativeStates).length === 6, 'hydration should initialize initiative states');
      expect(Array.isArray(hydrated.history), 'hydration should initialize history');
    }),

    check('derived score uses resolved metrics', () => {
      const state = initialGameState();
      const score = deriveScore(state, { roi: 40, adoption: 60, efficiency: 80, risk: 20 });
      expect(score === 65, `expected resolved score of 65, got ${score}`);
    }),
  ];

  return { passed: checks.every((item) => item.passed), checks };
}

