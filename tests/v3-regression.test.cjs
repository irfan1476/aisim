const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, {
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

const { createV3State, initialGameState } = require('../lib/game/state.ts');
const { normalizeGameState } = require('../lib/game/persistence.ts');
const { resolveQuarter } = require('../lib/game/engine.ts');

const pack = {
  initiatives: [
    { id: 'maintenance', capacityRequired: { technicians: { research: 2, pilot: 4, scale: 6 } } },
    { id: 'quality', capacityRequired: { technicians: { research: 1, pilot: 3, scale: 5 }, reviewers: { pilot: 1 } } },
  ],
  gates: [{ id: 'evidence-gate', appliesTo: ['maintenance'], ownerRole: 'operations' }],
  stakeholders: [{ id: 'technicians', role: 'frontline' }],
};

test('V3 state factory is deterministic and baseline-independent', () => {
  const first = createV3State('projectFactory', 4242, 5, ['maintenance', 'quality'], pack);
  const second = createV3State('projectFactory', 4242, 5, ['maintenance', 'quality'], pack);
  assert.deepEqual(first, second);
  assert.equal(first.currentQuarter, 1);
  assert.equal(first.budget.remaining, 5);
  assert.deepEqual(first.initiatives.maintenance.capacity, { technicians: 2 });
  assert.deepEqual(first.initiatives.quality.capacity, { technicians: 1, reviewers: 1 });
  assert.deepEqual(first.capacity.pools, { technicians: 0, reviewers: 0 });
  assert.equal(first.capacity.activeDeliveryLimit, 2);
  assert.deepEqual(first.initiatives.maintenance.gateIds, ['evidence-gate']);
});

test('V3 ledger keeps pre-resolution prediction, resolver outcome, and reflection separate', () => {
  const state = createV3State('projectFactory', 7, 5, ['maintenance'], pack);
  state.ledger.push({
    id: 'window-1', quarter: 1, initiativeIds: ['maintenance'], rationale: 'Protect uptime',
    prediction: 'Downtime pressure will fall', assumption: 'Telemetry is complete', evidenceIds: ['asset-data'],
    gateIds: ['evidence-gate'], outcome: { status: 'observed', delta: -4 }, reflection: 'Review the false positives.',
  });
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(restored.ledger[0].prediction, 'Downtime pressure will fall');
  assert.deepEqual(restored.ledger[0].outcome, { status: 'observed', delta: -4 });
  assert.equal(restored.ledger[0].reflection, 'Review the false positives.');
  assert.notEqual(restored.ledger[0].prediction, restored.ledger[0].reflection);
});

test('V3 learner-authored text cannot alter legacy resolver output', () => {
  const state = initialGameState();
  const decision = { selected: ['demand', 'energy'], alloc: { infra: 35, data: 25, people: 15, mlops: 10, compliance: 10, innovation: 5 } };
  const baseline = resolveQuarter(state, decision);
  const annotated = structuredClone(state);
  annotated.v3State = createV3State('projectFactory', 2030, 5, ['demand']);
  annotated.v3State.ledger.push({ id: 'x', quarter: 1, initiativeIds: ['demand'], rationale: 'changed', prediction: 'anything', evidenceIds: [], gateIds: [], reflection: 'learner text' });
  const withText = resolveQuarter(annotated, decision);
  assert.deepEqual(withText.metrics, baseline.metrics);
  assert.deepEqual(withText.snapshot.metrics, baseline.snapshot.metrics);
});

test('legacy saves remain V3 opt-out after normalization', () => {
  const legacy = normalizeGameState({ q: 2, scenarioMode: true, scenarioId: 'projectFactory', history: [{ q: 1, chosen: [], metrics: { roi: 1 } }] });
  assert.equal(legacy.v3State, undefined);
  assert.equal(legacy.history.length, 1);
  assert.equal(legacy.history[0].q, 1);
});
