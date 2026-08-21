const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Keep the test harness dependency-free: TypeScript is already a project
// dependency, while Node's built-in test runner provides assertions/reporting.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveTypeScriptImports(request, parent, isMain, options) {
  if (request.startsWith('.') && !path.extname(request)) {
    try {
      return resolveFilename.call(this, request, parent, isMain, options);
    } catch (error) {
      const candidate = path.resolve(path.dirname(parent.filename), `${request}.ts`);
      if (fs.existsSync(candidate)) return candidate;
      throw error;
    }
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

const { deriveScore, hydrateGameState, resolveQuarter } = require('../lib/game/engine.ts');
const { initializeInitiativeStates, updateInitiativeStates } = require('../lib/game/initiativeState.ts');
const { initialGameState } = require('../lib/game/state.ts');
const { createInferredGeneration, evaluateSynergies, generateInitiatives, inferArchetypeFromCampaign } = require('../lib/game/generator.ts');
const { normalizeGameState } = require('../lib/game/persistence.ts');
const { useGameStore } = require('../stores/gameStore.ts');
const { getScenario } = require('../lib/scenarios/registry.ts');
const { scenarioInitiativesToStates } = require('../lib/game/initiativeAdapter.ts');
const { scenarioInitiativeToState } = require('../lib/game/initiativeAdapter.ts');
const { allocationToReadiness } = require('../lib/game/allocation.ts');
const { maturityMultiplier } = require('../lib/game/maturity.ts');
const { applyScenarioEffects } = require('../lib/game/effectResolver.ts');

const allocation = {
  infra: 35,
  data: 25,
  people: 15,
  mlops: 10,
  compliance: 10,
  innovation: 5,
};

test('resolveQuarter is deterministic for the same state and decision', () => {
  const state = initialGameState();
  const decision = { selected: ['demand', 'energy'], alloc: allocation };

  const first = resolveQuarter(state, decision);
  const second = resolveQuarter(state, decision);

  assert.deepEqual(first, second);
  assert.equal(first.snapshot.q, 1);
  assert.deepEqual(first.snapshot.chosen, ['Demand Forecasting', 'Energy Optimization']);
});

test('resolveQuarter creates a complete immutable initiative snapshot', () => {
  const state = initialGameState();
  const result = resolveQuarter(state, { selected: ['maintenance'], alloc: allocation });
  const maintenance = result.snapshot.initiativeStates.maintenance;

  assert.ok(maintenance);
  assert.equal(maintenance.quartersFunded, 1);
  assert.ok(maintenance.currentData > maintenance.data);
  assert.ok(maintenance.currentRoi > maintenance.roi);

  result.initiativeStates.maintenance.currentData = 999;
  assert.notEqual(result.snapshot.initiativeStates.maintenance.currentData, 999);
});

test('initiative evolution advances maturity and compounds investment', () => {
  let states = initializeInitiativeStates();

  states = updateInitiativeStates(states, ['maintenance'], allocation, { adoption: 38 });
  assert.equal(states.maintenance.maturityLevel, 'nascent');
  assert.equal(states.maintenance.quartersFunded, 1);
  const firstRoi = states.maintenance.currentRoi;

  states = updateInitiativeStates(states, ['maintenance'], allocation, { adoption: 42 });
  assert.equal(states.maintenance.maturityLevel, 'developing');
  assert.equal(states.maintenance.quartersFunded, 2);
  assert.ok(states.maintenance.currentRoi > firstRoi);
  assert.equal(states.maintenance.quartersSinceLastFund, 0);
});

test('neglected initiatives decay after three unfunded quarters', () => {
  let states = initializeInitiativeStates();
  const startingData = states.energy.currentData;
  const startingRisk = states.energy.currentRisk === 'LOW' ? 24 : states.energy.currentRisk === 'HIGH' ? 72 : 48;

  for (let quarter = 0; quarter < 3; quarter += 1) {
    states = updateInitiativeStates(states, [], allocation, { adoption: 38 });
  }
  assert.equal(states.energy.currentData, startingData);

  states = updateInitiativeStates(states, [], allocation, { adoption: 38 });
  assert.equal(states.energy.currentData, startingData - 0.2);
  assert.ok(states.energy.riskScore > startingRisk);
});

test('funding and governance reduce initiative risk continuously', () => {
  const starting = initializeInitiativeStates();
  const lowGovernance = updateInitiativeStates(starting, ['maintenance'], { ...allocation, compliance: 5 }, { adoption: 38 });
  const highGovernance = updateInitiativeStates(starting, ['maintenance'], { ...allocation, compliance: 25 }, { adoption: 38 });

  assert.ok(lowGovernance.maintenance.riskScore < 48);
  assert.ok(highGovernance.maintenance.riskScore < lowGovernance.maintenance.riskScore);
});

test('discovered synergies improve ROI, adoption, risk, and cost mechanically', () => {
  const state = initialGameState();
  const decision = { selected: ['demand', 'knowledge'], alloc: allocation };
  const synergized = resolveQuarter(state, decision);
  const disabled = structuredClone(state);
  disabled.initiativeStates.demand.synergies = [];
  disabled.initiativeStates.knowledge.synergies = [];
  const isolated = resolveQuarter(disabled, decision);

  assert.ok(synergized.metrics.roi > isolated.metrics.roi);
  assert.ok(synergized.metrics.adoption > isolated.metrics.adoption);
  assert.ok(synergized.metrics.risk < isolated.metrics.risk);
  assert.ok(synergized.metrics.spent < isolated.metrics.spent);
  assert.deepEqual(synergized.snapshot.synergiesDiscovered, ['demand:knowledge']);
  assert.equal(evaluateSynergies(decision.selected, state.initiativeStates).length, 1);
});

test('hydrateGameState repairs missing initiative state and history', () => {
  const state = initialGameState();
  const hydrated = hydrateGameState({ ...state, initiativeStates: undefined, history: undefined });

  assert.equal(Object.keys(hydrated.initiativeStates).length, 6);
  assert.deepEqual(hydrated.history, []);
});

test('deriveScore uses resolved metrics and rewards lower risk', () => {
  const state = initialGameState();
  const score = deriveScore(state, { roi: 50, adoption: 60, efficiency: 70, risk: 20 });

  assert.equal(score, 65);
});

test('initiative generation is reproducible for the same baseline and seed', () => {
  const generation = createInferredGeneration([4, 3, 4, 4, 3], 4242);
  assert.deepEqual(generateInitiatives(generation), generateInitiatives(generation));
});

test('Q1 resolves the initiative values shown to the player without regeneration', () => {
  const generation = createInferredGeneration([5, 3, 3, 4, 3], 4242);
  const game = { ...initialGameState(generation), baseline: [5, 3, 3, 4, 3], selected: ['maintenance', 'quality'], alloc: { infra: 40, data: 10, people: 10, mlops: 25, compliance: 10, innovation: 5 } };
  useGameStore.getState().loadGame(game);
  const visibleValues = Object.fromEntries(Object.entries(useGameStore.getState().initiativeStates).map(([id, item]) => [id, { roi: item.roi, cost: item.cost, baseRiskScore: item.baseRiskScore }]));
  useGameStore.getState().confirmDecisions();
  const resolved = useGameStore.getState();

  Object.entries(visibleValues).forEach(([id, values]) => {
    assert.equal(resolved.initiativeStates[id].roi, values.roi);
    assert.equal(resolved.initiativeStates[id].cost, values.cost);
    assert.equal(resolved.initiativeStates[id].baseRiskScore, values.baseRiskScore);
  });
});

test('campaign archetype uses the full allocation history', () => {
  const history = Array.from({ length: 8 }, () => ({ allocation: { infra: 15, data: 15, people: 35, mlops: 10, compliance: 15, innovation: 10 }, selectedIds: ['knowledge'] }));
  assert.equal(inferArchetypeFromCampaign([3, 3, 3, 3, 3], history), 'people-first');
});

test('legacy migration derives generation context from the saved baseline', () => {
  const baseline = [5, 3, 3, 4, 3];
  const migrated = normalizeGameState({ baseline, initiativeGeneration: { seed: 4242 } });
  const expected = createInferredGeneration(baseline, 4242);

  assert.equal(migrated.initiativeGeneration.archetype, expected.archetype);
  assert.deepEqual(migrated.initiativeGeneration.context, expected.context);
});

test('scenario registry exposes four domain packs with data-only progress definitions', () => {
  ['projectFactory', 'bankNext', 'care360', 'futureReady'].forEach((id) => {
    const scenario = getScenario(id);
    assert.ok(scenario);
    assert.equal(scenario.initiatives.length, 6);
    scenario.progress.forEach((item) => {
      assert.equal(typeof item.evaluate, 'undefined');
      assert.ok(item.target !== undefined);
      assert.ok(item.min !== undefined && item.max !== undefined);
    });
  });
});

test('scenario effects change domain metrics and persist scenario state', () => {
  const scenario = getScenario('bankNext');
  const generation = createInferredGeneration([3, 3, 3, 3, 3], 4242);
  const initial = initialGameState(generation, { scenarioMode: true, scenarioId: scenario.id, scenarioStartingMetrics: scenario.startingState.startingMetrics, scenarioProgress: {} });
  const state = { ...initial, initiativeStates: scenarioInitiativesToStates(scenario.initiatives), scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} }, selected: ['fraudDetection'], alloc: scenario.startingState.defaultAllocation };
  const result = resolveQuarter(state, { selected: state.selected, alloc: state.alloc });
  assert.ok(result.scenarioState.metrics.fraudPressure < 80);
  assert.ok(result.scenarioState.progress.fraudPressure > 0);
  assert.equal(result.snapshot.scenarioState.metrics.fraudPressure, result.scenarioState.metrics.fraudPressure);
});

test('scenario-declared synergies change domain outcomes without engine scenario branches', () => {
  const scenario = getScenario('bankNext');
  const generation = createInferredGeneration([3, 3, 3, 3, 3], 4242);
  const base = initialGameState(generation, { scenarioMode: true, scenarioId: scenario.id, scenarioStartingMetrics: scenario.startingState.startingMetrics });
  const state = {
    ...base,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
    selected: ['fraudDetection', 'complianceMonitoring'],
    alloc: scenario.startingState.defaultAllocation,
  };
  const withSynergy = resolveQuarter(state, { selected: state.selected, alloc: state.alloc });
  const withoutSynergy = resolveQuarter(state, { selected: ['fraudDetection'], alloc: state.alloc });

  assert.ok(withSynergy.scenarioState.metrics.fraudPressure < withoutSynergy.scenarioState.metrics.fraudPressure);
  assert.deepEqual(withSynergy.snapshot.synergiesDiscovered, ['fraudDetection:complianceMonitoring']);
});

test('scenario save migration keeps domain initiative ids', () => {
  const scenario = getScenario('care360');
  const migrated = normalizeGameState({ scenarioMode: true, scenarioId: 'care360', scenarioStartingMetrics: scenario.startingState.startingMetrics, initiativeStates: {} });
  assert.deepEqual(Object.keys(migrated.initiativeStates).sort(), scenario.initiatives.map((item) => item.id).sort());
  assert.equal(migrated.scenarioState.metrics.patientWaitTime, 75);
});

test('scenario initialization clears Standard-mode default selections', () => {
  useGameStore.getState().initializeScenario('bankNext');
  const state = useGameStore.getState();
  assert.deepEqual(state.selected, []);
  assert.deepEqual(Object.keys(state.initiativeStates).sort(), getScenario('bankNext').initiatives.map((item) => item.id).sort());
});

test('maturity and allocation helpers stay bounded and deterministic', () => {
  assert.equal(maturityMultiplier('nascent'), 0.72);
  assert.equal(maturityMultiplier('optimized'), 1.08);
  assert.equal(allocationToReadiness({ infra: 0, data: 0, people: 0, mlops: 0, compliance: 0, innovation: 100 }).data, 0.3);
  assert.equal(allocationToReadiness({ infra: 50, data: 30, people: 25, mlops: 50, compliance: 20, innovation: 0 }).technical, 1);
  assert.equal(allocationToReadiness({ infra: 50, data: 30, people: 25, mlops: 50, compliance: 20, innovation: 0 }).governance, 1);
});

test('scenario initiative adapter produces complete state and metadata', () => {
  const scenario = getScenario('bankNext');
  const state = scenarioInitiativeToState(scenario.initiatives[0]);
  assert.equal(state.id, 'fraudDetection');
  assert.equal(state.currentData, state.data);
  assert.equal(state.currentRoi, state.roi);
  assert.equal(state.quartersFunded, 0);
  assert.equal(state.maturityLevel, 'nascent');
  assert.equal(state.baseRiskScore, 48);
  assert.equal(state.scenarioMetadata.primaryMetric, 'fraudPressure');
});

test('scenario effects are immutable and skip unknown metrics safely', () => {
  const scenario = getScenario('bankNext');
  const states = scenarioInitiativesToStates(scenario.initiatives);
  const previous = { metrics: { fraudPressure: 80 }, progress: {}, flags: {} };
  const before = structuredClone(previous);
  const result = applyScenarioEffects(scenario, previous, states, ['fraudDetection'], scenario.startingState.defaultAllocation, 45);
  assert.deepEqual(previous, before);
  assert.ok(result.metrics.fraudPressure < 80);
  const unknown = { ...states.fraudDetection, scenarioMetadata: { ...states.fraudDetection.scenarioMetadata, primaryMetric: 'missingMetric' } };
  assert.doesNotThrow(() => applyScenarioEffects(scenario, previous, { ...states, fraudDetection: unknown }, ['fraudDetection'], scenario.startingState.defaultAllocation, 45));
});

test('all four scenarios survive a twelve-quarter decision loop', () => {
  ['projectFactory', 'bankNext', 'care360', 'futureReady'].forEach((id) => {
    const scenario = getScenario(id);
    let state = initialGameState(undefined, { scenarioMode: true, scenarioId: id, scenarioStartingMetrics: scenario.startingState.startingMetrics });
    state = { ...state, selected: [], alloc: scenario.startingState.defaultAllocation, initiativeStates: scenarioInitiativesToStates(scenario.initiatives), scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} } };
    for (let quarter = 1; quarter <= 12; quarter += 1) {
      const selected = scenario.initiatives.slice((quarter - 1) % 4, ((quarter - 1) % 4) + 3).map((item) => item.id);
      const result = resolveQuarter(state, { selected, alloc: scenario.startingState.defaultAllocation });
      assert.equal(Object.keys(result.initiativeStates).length, 6);
      Object.values(result.scenarioState.progress).forEach((value) => assert.ok(value >= 0 && value <= 100));
      state = { ...state, ...result.metrics, initiativeStates: result.initiativeStates, scenarioState: result.scenarioState, q: quarter + 1 };
    }
    assert.equal(state.q, 13);
  });
});

test('scenario neglect applies an explicit penalty only after the configured threshold', () => {
  const scenario = getScenario('bankNext');
  const initialState = {
    ...initialGameState(undefined, {
      scenarioMode: true,
      scenarioId: scenario.id,
      scenarioStartingMetrics: scenario.startingState.startingMetrics,
    }),
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: {
      metrics: { ...scenario.startingState.startingMetrics },
      progress: {},
      flags: {},
    },
  };

  let state = initialState;
  const pressureByQuarter = [];
  for (let quarter = 1; quarter <= 4; quarter += 1) {
    const result = resolveQuarter(state, { selected: [], alloc: scenario.startingState.defaultAllocation });
    pressureByQuarter.push(result.scenarioState.metrics.fraudPressure);
    state = {
      ...state,
      initiativeStates: result.initiativeStates,
      scenarioState: result.scenarioState,
      q: quarter + 1,
    };
  }

  assert.equal(state.initiativeStates.fraudDetection.quartersSinceLastFund, 4);
  assert.equal(pressureByQuarter[0], 80);
  assert.equal(pressureByQuarter[1], 80);
  assert.equal(pressureByQuarter[2], 80);
  assert.ok(pressureByQuarter[3] > pressureByQuarter[2]);

  const fifth = resolveQuarter(state, { selected: [], alloc: scenario.startingState.defaultAllocation });
  assert.ok(fifth.scenarioState.metrics.fraudPressure > pressureByQuarter[3]);
  assert.equal(fifth.initiativeStates.fraudDetection.quartersSinceLastFund, 5);
});

test('scenario metric effects clamp at both native boundaries', () => {
  const scenario = getScenario('bankNext');
  const states = scenarioInitiativesToStates(scenario.initiatives);
  const allocationForEffects = scenario.startingState.defaultAllocation;

  const atUpperBound = applyScenarioEffects(
    scenario,
    { metrics: { digitalAdoption: 100 }, progress: {}, flags: {} },
    states,
    ['customerCopilot'],
    allocationForEffects,
    100,
  );
  assert.equal(atUpperBound.metrics.digitalAdoption, 100);

  const atLowerBound = applyScenarioEffects(
    scenario,
    { metrics: { fraudPressure: 0 }, progress: {}, flags: {} },
    states,
    ['fraudDetection'],
    allocationForEffects,
    100,
  );
  assert.equal(atLowerBound.metrics.fraudPressure, 0);
  assert.ok(atUpperBound.progress.digitalAdoption <= 100);
  assert.ok(atLowerBound.progress.fraudPressure <= 100);
});

test('scenario crisis response persists impact and cumulative cost through normalization', () => {
  const scenario = getScenario('bankNext');
  const base = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: scenario.id,
    quarterlyBudget: scenario.startingState.budget,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
  });
  const scenarioState = {
    ...base,
    scenarioMode: true,
    scenarioId: scenario.id,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: {
      metrics: { ...scenario.startingState.startingMetrics },
      progress: {},
      flags: {},
    },
    crisis: {
      title: 'Test regulatory review',
      type: 'COMPLIANCE',
      text: 'A controlled test crisis.',
      options: [],
    },
  };
  useGameStore.getState().loadGame(scenarioState);
  useGameStore.getState().respondToCrisis({ risk: 28, compliance: 67 }, 0.8);

  const afterResponse = useGameStore.getState();
  assert.equal(afterResponse.crisis, null);
  assert.equal(afterResponse.risk, 28);
  assert.equal(afterResponse.compliance, 67);
  assert.equal(afterResponse.spent, 0.8);
  assert.equal(afterResponse.quarterlyCrisisCost, 0.8);
  assert.equal(afterResponse.scenarioBudgetRemaining, 4.2);

  const roundTripped = normalizeGameState(JSON.parse(JSON.stringify(afterResponse)));
  assert.equal(roundTripped.scenarioMode, true);
  assert.equal(roundTripped.scenarioId, 'bankNext');
  assert.equal(roundTripped.risk, 28);
  assert.equal(roundTripped.compliance, 67);
  assert.equal(roundTripped.spent, 0.8);
  assert.equal(roundTripped.quarterlyCrisisCost, 0.8);
  assert.equal(roundTripped.scenarioBudgetRemaining, 4.2);
});

test('scenario crisis domain impacts update scenario metrics and progress', () => {
  const scenario = getScenario('bankNext');
  const base = initialGameState(undefined, { scenarioMode: true, scenarioId: scenario.id, scenarioStartingMetrics: scenario.startingState.startingMetrics });
  useGameStore.getState().loadGame({
    ...base,
    scenarioMode: true,
    scenarioId: scenario.id,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
  });
  useGameStore.getState().respondToCrisis({ fraudPressure: -8 }, 0.2);
  const afterResponse = useGameStore.getState();
  assert.equal(afterResponse.scenarioState.metrics.fraudPressure, 72);
  assert.ok(afterResponse.scenarioState.progress.fraudPressure > 0);
  assert.equal(afterResponse.fraudPressure, undefined);
});

test('scenario synergy cost relief is used consistently for overspend risk', () => {
  const scenario = getScenario('bankNext');
  const base = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: scenario.id,
    quarterlyBudget: 2.85,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
  });
  useGameStore.getState().loadGame({
    ...base,
    selected: ['fraudDetection', 'complianceMonitoring'],
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
  });
  useGameStore.getState().confirmDecisions();
  assert.equal(useGameStore.getState().scenarioOverspend, 0);
});

test('Standard mode remains scenario-free when resolving a quarter', () => {
  const state = initialGameState();
  const result = resolveQuarter(state, { selected: ['demand'], alloc: allocation });

  assert.equal(state.scenarioMode, false);
  assert.equal(state.scenarioId, undefined);
  assert.deepEqual(result.scenarioState, state.scenarioState);
  assert.equal(result.metrics.fraudPressure, undefined);
  assert.equal(result.metrics.complianceReadiness, undefined);
  assert.ok(result.initiativeStates.demand);
  assert.equal(result.initiativeStates.fraudDetection, undefined);
});

test('scenario save/load round-trip preserves state, history, crisis, and domain initiative progress', () => {
  const scenario = getScenario('care360');
  const base = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: scenario.id,
    quarterlyBudget: scenario.startingState.budget,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
  });
  const states = scenarioInitiativesToStates(scenario.initiatives);
  states.radiologyAssistant.quartersFunded = 3;
  states.radiologyAssistant.currentData = 4.7;
  const snapshot = {
    q: 2,
    chosen: ['AI Radiology Assistant'],
    selectedIds: ['radiologyAssistant'],
    allocation: scenario.startingState.defaultAllocation,
    metrics: { roi: 12, adoption: 49 },
    initiativeStates: states,
    scenarioState: {
      metrics: { patientWaitTime: 61, patientSafety: 74 },
      progress: { patientWaitTime: 31.25, patientSafety: 20 },
      flags: { privacyReviewComplete: true },
    },
    crisis: { title: 'A privacy concern pauses an AI pilot.' },
    crisisResponse: { risk: -8 },
  };
  const saved = {
    ...base,
    q: 2,
    stage: 'results',
    selected: ['radiologyAssistant'],
    initiativeStates: states,
    history: [snapshot],
    scenarioState: snapshot.scenarioState,
    scenarioProgress: snapshot.scenarioState.progress,
    scenarioBudgetRemaining: 3.7,
    quarterlyCrisisCost: 0.3,
    crisis: snapshot.crisis,
  };

  const restored = normalizeGameState(JSON.parse(JSON.stringify(saved)));
  assert.equal(restored.scenarioMode, true);
  assert.equal(restored.scenarioId, 'care360');
  assert.equal(restored.q, 2);
  assert.equal(restored.stage, 'results');
  assert.equal(restored.scenarioBudgetRemaining, 3.7);
  assert.equal(restored.quarterlyCrisisCost, 0.3);
  assert.equal(restored.scenarioState.metrics.patientWaitTime, 61);
  assert.equal(restored.scenarioState.progress.patientSafety, 20);
  assert.equal(restored.scenarioState.flags.privacyReviewComplete, true);
  assert.equal(restored.initiativeStates.radiologyAssistant.quartersFunded, 3);
  assert.equal(restored.initiativeStates.radiologyAssistant.currentData, 4.7);
  assert.equal(restored.history[0].scenarioState.metrics.patientWaitTime, 61);
  assert.equal(restored.crisis.title, 'A privacy concern pauses an AI pilot.');
});

test('v4 scenario saves migrate into v5 scenario state without losing domain identity', () => {
  const scenario = getScenario('bankNext');
  const legacyV4 = {
    q: 5,
    stage: 'decide',
    scenarioMode: true,
    scenarioId: 'bankNext',
    quarterlyBudget: 5,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
    scenarioProgress: { fraudPressure: 42, complianceReadiness: 18 },
    scenarioOverspend: 0.4,
    quarterlyCrisisCost: 0.8,
    scenarioBonus: 1,
  };

  const migrated = normalizeGameState(legacyV4);
  assert.equal(migrated.scenarioMode, true);
  assert.equal(migrated.scenarioId, 'bankNext');
  assert.equal(migrated.scenarioState.metrics.fraudPressure, 80);
  assert.equal(migrated.scenarioState.progress.fraudPressure, 42);
  assert.equal(migrated.scenarioState.progress.complianceReadiness, 18);
  assert.equal(migrated.scenarioOverspend, 0.4);
  assert.equal(migrated.quarterlyCrisisCost, 0.8);
  assert.equal(migrated.scenarioBonus, 1);
  assert.deepEqual(Object.keys(migrated.initiativeStates).sort(), scenario.initiatives.map((item) => item.id).sort());
  assert.equal(migrated.scenarioBudgetRemaining, 5);
});

test('legacy Standard saves remain Standard and receive no scenario initiatives or effects', () => {
  const migrated = normalizeGameState({
    q: 4,
    stage: 'results',
    baseline: [4, 3, 3, 4, 3],
    selected: ['demand'],
    spent: 2.5,
    history: [],
  });

  assert.equal(migrated.scenarioMode, false);
  assert.equal(migrated.scenarioId, undefined);
  assert.equal(migrated.quarterlyBudget, 10);
  assert.equal(migrated.scenarioBudgetRemaining, 10);
  assert.equal(migrated.scenarioState.metrics.fraudPressure, undefined);
  assert.equal(migrated.initiativeStates.demand.name, 'Demand Forecasting');
  assert.equal(migrated.initiativeStates.fraudDetection, undefined);
});

test('repeated scenario funding compounds effects while respecting native bounds', () => {
  const scenario = getScenario('bankNext');
  let state = {
    ...initialGameState(undefined, {
      scenarioMode: true,
      scenarioId: scenario.id,
      scenarioStartingMetrics: scenario.startingState.startingMetrics,
    }),
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: {
      metrics: { ...scenario.startingState.startingMetrics },
      progress: {},
      flags: {},
    },
  };
  let previousPressure = state.scenarioState.metrics.fraudPressure;
  for (let quarter = 1; quarter <= 12; quarter += 1) {
    const result = resolveQuarter(state, {
      selected: ['fraudDetection'],
      alloc: scenario.startingState.defaultAllocation,
    });
    const currentPressure = result.scenarioState.metrics.fraudPressure;
    assert.ok(currentPressure <= previousPressure);
    assert.ok(currentPressure >= 30 && currentPressure <= 80);
    assert.ok(result.scenarioState.progress.fraudPressure >= 0 && result.scenarioState.progress.fraudPressure <= 100);
    previousPressure = currentPressure;
    state = {
      ...state,
      initiativeStates: result.initiativeStates,
      scenarioState: result.scenarioState,
      q: quarter + 1,
    };
  }
  assert.equal(state.initiativeStates.fraudDetection.quartersFunded, 12);
  assert.equal(state.initiativeStates.fraudDetection.quartersSinceLastFund, 0);
  assert.ok(state.scenarioState.metrics.fraudPressure < 80);
});

test('scenario quarter flow persists progress and resets only quarter-local crisis cost', () => {
  const scenario = getScenario('futureReady');
  const base = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: scenario.id,
    quarterlyBudget: scenario.startingState.budget,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
  });
  useGameStore.getState().loadGame({
    ...base,
    scenarioMode: true,
    scenarioId: scenario.id,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    selected: ['successPredictor', 'facultyCopilot', 'chatbot'],
    alloc: scenario.startingState.defaultAllocation,
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
    scenarioBudgetRemaining: 5,
    quarterlyCrisisCost: 0.5,
  });

  useGameStore.getState().confirmDecisions();
  const afterQ1 = useGameStore.getState();
  assert.equal(afterQ1.stage, 'results');
  assert.equal(afterQ1.history.length, 1);
  assert.ok(afterQ1.scenarioState.progress.studentPersistence > 0);

  useGameStore.getState().advanceQuarter();
  const nextQuarter = useGameStore.getState();
  assert.equal(nextQuarter.q, 2);
  assert.equal(nextQuarter.stage, 'decide');
  assert.equal(nextQuarter.quarterlyCrisisCost, 0);
  assert.equal(nextQuarter.scenarioBudgetRemaining, 5);
  assert.deepEqual(nextQuarter.selected, []);

  useGameStore.getState().confirmDecisions();
  const afterQ2 = useGameStore.getState();
  assert.equal(afterQ2.history.length, 2);
  assert.ok(afterQ2.scenarioState.metrics.studentPersistence >= afterQ1.scenarioState.metrics.studentPersistence);
});
