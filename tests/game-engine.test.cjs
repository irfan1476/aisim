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
