const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText, filename);
};
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveTypeScriptImports(request, parent, isMain, options) {
  if (request.startsWith('.') && !path.extname(request)) {
    try { return resolveFilename.call(this, request, parent, isMain, options); } catch (error) {
      const candidate = path.resolve(path.dirname(parent.filename), `${request}.ts`);
      if (fs.existsSync(candidate)) return candidate;
      throw error;
    }
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'v3', 'project-factory-v3.json'), 'utf8'));
const { validateScenarioV3Pack } = require('../lib/scenarios/v3Validator.ts');
const { createV3State } = require('../lib/game/state.ts');
const { resolveV3Decision } = require('../lib/game/v3Runtime.ts');
const { calculateProgressPercentages } = require('../lib/scenarios/progress.ts');
const { getScenario } = require('../lib/scenarios/registry.ts');
const { normalizeGameState } = require('../lib/game/persistence.ts');

test('Project Factory V3 fixture loads with valid source references', () => {
  const result = validateScenarioV3Pack(fixture);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.deepEqual(fixture.report.changes[0].evidenceIds, ['asset-data']);
  assert.equal(fixture.initiatives[0].effect.sourceRuleId, 'maintenance-signal');
});

test('converted fixture resolves deterministically through the V3 runtime', () => {
  const v3State = createV3State('projectFactory', 4242, 5, ['maintenance'], fixture);
  // The factory records declared pools; the run supplies the available
  // quarter capacity before validating a learner's plan.
  v3State.capacity.pools.technicians = 4;
  const input = { gameState: { v3State }, pack: fixture, plan: [{ initiativeId: 'maintenance', lifecycle: 'research', cost: 1, capacity: { technicians: 2 } }], evidenceIds: ['asset-data'], metrics: { uptime: 70 }, gateChecks: [{ gateId: 'asset-evidence' }] };
  const first = resolveV3Decision(input);
  const second = resolveV3Decision(input);
  assert.equal(first.accepted, true, JSON.stringify(first.errors));
  assert.deepEqual(first, second);
  assert.equal(first.metrics.uptime, 70);
  assert.equal(first.state.gates['asset-evidence'].status, 'met');
});

test('direction-aware progress selectors are pure and deterministic', () => {
  const scenario = getScenario('projectFactory');
  const metrics = { downtimePressure: 35, defectRate: 200, energyPressure: 40, workforceResilience: 85, supplyContinuity: 85 };
  const before = JSON.stringify(metrics);
  const first = calculateProgressPercentages(metrics, scenario);
  const second = calculateProgressPercentages(metrics, scenario);
  assert.deepEqual(first, second);
  assert.equal(first.downtimePressure, 100);
  assert.equal(first.workforceResilience, 100);
  assert.equal(JSON.stringify(metrics), before);
});

test('legacy V2 saves do not expose V3 state', () => {
  const save = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'v2', 'project-factory-q2.json'), 'utf8'));
  const restored = normalizeGameState(save);
  assert.equal(restored.v3State, undefined);
  assert.equal(restored.scenarioId, 'projectFactory');
});
