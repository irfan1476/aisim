const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText, filename);
const r = require('../lib/scenarios/v3Resolver.ts');
const state = { schemaVersion: 1, scenarioId: 'x', seed: 1, currentQuarter: 2, budget: { envelope: 5, spent: 0, remaining: 5 }, capacity: { pools: {}, used: {}, activeDeliveryLimit: 2 }, initiatives: {}, ledger: [], gates: {}, eventLog: [], stakeholders: { tech: { id: 'tech', sentiment: 0, history: [] } }, scorecard: { execution: 0, governance: 0, stakeholderHealth: 0, resilience: 0, evidenceQuality: 0, evidence: [] } };
const pack = { metrics: [{ key: 'uptime', unit: '%', timeBasis: 'q', ownerRole: 'ops' }], gates: [{ id: 'g', requiredEvidence: ['e'], conditions: ['metric.uptime >= 70'], ownerRole: 'ops' }], events: [{ id: 'e1', effects: [{ metric: 'uptime', delta: -2 }] }], stakeholders: [{ id: 'tech' }] };

test('gate resolution and events are immutable and source-bound', () => {
  const before = JSON.stringify(state);
  const gate = r.evaluateV3Gate(pack, state, 'g', ['e'], { uptime: 75 });
  assert.equal(gate.result.status, 'met');
  assert.equal(JSON.stringify(state), before);
  const event = r.resolveV3Event(pack, gate.state, 'e1', 'contain');
  assert.equal(event.result.triggered, true);
  assert.equal(event.state.eventLog[0].optionId, 'contain');
});

test('workflow evidence changes evidence/execution, not a global adoption metric', () => {
  const result = r.recordV3WorkflowAdoption(state, 'initiative', { reviewed: 5, overridden: 1, trainingCompleted: true });
  assert.ok(result.result > 0);
  assert.deepEqual(result.state.scorecard.evidence, ['workflow:initiative']);
  assert.equal(result.state.metrics, undefined);
});

test('causal resolution is source-pure and event triggers are conditional', () => {
  const pack = { causalRules: [{ id: 'r1', condition: 'metric.downtime <= 50', delayQuarters: 1, effects: [{ metric: 'efficiency', delta: 3 }] }], events: [{ id: 'e1', trigger: 'metric.downtime > 70', effects: [{ metric: 'downtime', delta: 5 }] }] };
  const state = { ...rState(), currentQuarter: 1 };
  const metrics = { downtime: 60, efficiency: 10 };
  const before = JSON.stringify(metrics);
  const deferred = r.resolveV3CausalRules(pack, state, metrics, 1);
  assert.equal(JSON.stringify(metrics), before);
  assert.equal(deferred.result.applied.length, 0);
  const blocked = r.resolveV3Event(pack, state, 'e1', undefined, metrics);
  assert.equal(blocked.result.triggered, false);
  const triggered = r.resolveV3Event(pack, state, 'e1', undefined, { downtime: 80 });
  assert.equal(triggered.result.triggered, true);
});

function rState() {
  return { schemaVersion: 1, scenarioId: 'pf', seed: 7, currentQuarter: 1, budget: { envelope: 5, spent: 0, remaining: 5 }, capacity: { pools: {}, used: {}, activeDeliveryLimit: 2 }, initiatives: {}, ledger: [], gates: {}, eventLog: [], stakeholders: {}, scorecard: { execution: 0, governance: 0, stakeholderHealth: 0, resilience: 0, evidenceQuality: 0, evidence: [] }, baseline: { version: 'v1', responses: [] } };
}
