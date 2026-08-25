const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Load the TypeScript modules without adding a test-runner dependency.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
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

const { initialGameState } = require('../lib/game/state.ts');
const { applyCrisisResponse, applyTurnDecision, advanceTurn } = require('../lib/game/turnResolver.ts');
const {
  createCounterfactualTrace,
  recordCrisisResponse,
  recordDecision,
  replayCounterfactual,
  readActiveCounterfactualTrace,
  writeActiveCounterfactualTrace,
  ACTIVE_COUNTERFACTUAL_TRACE_STORAGE_KEY,
} = require('../lib/counterfactual.ts');
const {
  buildReplayRun,
  REPLAY_STORAGE_KEY,
  readReplayRuns,
  saveReplayRun,
} = require('../lib/replay.ts');

const storage = new Map();
global.window = {
  localStorage: {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
};

const allocation = { infra: 35, data: 25, people: 15, mlops: 10, compliance: 10, innovation: 5 };

function completedTrace() {
  let state = initialGameState();
  let trace = createCounterfactualTrace(state);
  for (let q = 1; q <= 12; q += 1) {
    const decision = { selected: ['demand'], alloc: allocation, deploymentAmount: state.deploymentAmount };
    const result = applyTurnDecision(state, decision);
    assert.equal(result.accepted, true);
    state = result.nextState;
    trace = recordDecision(trace, { type: 'decision', q, ...decision });
    if (state.crisis) {
      const response = { type: 'crisis-response', q, impact: {}, cost: 0, eventTitle: state.crisis.title, eventType: state.crisis.type };
      trace = recordCrisisResponse(trace, response);
      state = applyCrisisResponse(state, response);
    }
    state = advanceTurn(state);
  }
  return { state, trace };
}

test('saved replay notebook entries preserve an executable counterfactual trace', () => {
  storage.clear();
  const { state, trace } = completedTrace();
  const run = buildReplayRun(state, 'Trace campaign', trace);
  const runs = saveReplayRun(run);
  assert.equal(runs[0].counterfactualTrace.runId, trace.runId);
  assert.equal(readReplayRuns()[0].counterfactualTrace.actions.length, trace.actions.length);

  const replay = replayCounterfactual(readReplayRuns()[0].counterfactualTrace, {
    q: 1,
    selected: ['demand'],
    alloc: { ...allocation, data: 35, infra: 25 },
    deploymentAmount: trace.actions.find((action) => action.type === 'decision' && action.q === 1).deploymentAmount,
  });
  assert.equal(replay.status, 'complete');
  assert.equal(replay.appliedThroughQuarter, 12);
});

test('legacy replay notebook entries remain readable without a counterfactual trace', () => {
  storage.clear();
  storage.set(REPLAY_STORAGE_KEY, JSON.stringify([{ id: 'legacy', name: 'Old run', score: 42, quarters: [] }]));
  const [legacy] = readReplayRuns();
  assert.equal(legacy.id, 'legacy');
  assert.equal(legacy.counterfactualTrace, undefined);
});

test('active trace round-trips through storage and rejects incompatible versions', () => {
  storage.clear();
  const { trace } = completedTrace();
  writeActiveCounterfactualTrace(trace);
  assert.deepEqual(readActiveCounterfactualTrace(), trace);
  storage.set(ACTIVE_COUNTERFACTUAL_TRACE_STORAGE_KEY, JSON.stringify({ ...trace, version: 999 }));
  assert.equal(readActiveCounterfactualTrace(), null);
});
