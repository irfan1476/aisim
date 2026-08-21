const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText, filename);
const { resolveV3Decision } = require('../lib/game/v3Runtime.ts');
const { createV3State } = require('../lib/game/state.ts');

test('V3 decision façade composes validation, ledger, gates, and causal/value projections', () => {
  const v3State = createV3State('pf', 1, 5, ['a'], { initiatives: [{ id: 'a', lifecycle: { allowedTransitions: ['deferred to research'] }, capacityRequired: { data: { research: 1 } } }], gates: [{ id: 'g', appliesTo: ['a'], requiredEvidence: ['e'] }], causalRules: [{ id: 'r', delayQuarters: 0, effects: [{ metric: 'uptime', delta: 2 }] }], report: { changes: [{ metric: 'uptime', ruleId: 'r', evidenceIds: ['e'] }] } });
  const pack = { initiatives: [{ id: 'a', lifecycle: { allowedTransitions: ['deferred to research'] } }], gates: [{ id: 'g', appliesTo: ['a'], requiredEvidence: ['e'] }], causalRules: [{ id: 'r', delayQuarters: 0, effects: [{ metric: 'uptime', delta: 2 }] }], report: { changes: [{ metric: 'uptime', ruleId: 'r', evidenceIds: ['e'] }] } };
  const result = resolveV3Decision({ gameState: { v3State }, pack, plan: [{ initiativeId: 'a', lifecycle: 'research', cost: 1 }], evidenceIds: ['e'], metrics: { uptime: 70 }, ledger: { id: 'l1', quarter: 1, initiativeIds: ['a'], rationale: 'test', prediction: 'uptime improves', evidenceIds: ['e'], gateIds: ['g'] }, gateChecks: [{ gateId: 'g' }] });
  assert.equal(result.accepted, true);
  assert.equal(result.state.ledger.length, 1);
  assert.equal(result.metrics.uptime, 72);
  assert.equal(result.value[0].status, 'estimated');
});
