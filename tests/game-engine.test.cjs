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

  for (let quarter = 0; quarter < 3; quarter += 1) {
    states = updateInitiativeStates(states, [], allocation, { adoption: 38 });
  }
  assert.equal(states.energy.currentData, startingData);

  states = updateInitiativeStates(states, [], allocation, { adoption: 38 });
  assert.equal(states.energy.currentData, startingData - 0.2);
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
