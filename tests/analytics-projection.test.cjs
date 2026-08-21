const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText, filename);
const { projectV3Analytics } = require('../lib/game/analyticsProjection.ts');
const state = { currentQuarter: 2, budget: { remaining: 3 }, initiatives: { a: { lifecycle: 'pilot' } }, gates: { g: { status: 'met', history: [] } }, stakeholders: { s: { id: 's', sentiment: 4, history: [] } }, capacity: { pools: {}, used: {}, activeDeliveryLimit: 2 }, eventLog: [], ledger: [], scorecard: { stakeholderHealth: 4 } };
test('projects V3 surfaces and preserves hidden legacy result', () => {
  const result = projectV3Analytics(state, { metrics: [{ key: 'uptime', unit: '%', timeBasis: 'q', ownerRole: 'ops', start: 60, sourceRuleIds: ['r'] }], evidence: [{ id: 'e' }] }, [{ metrics: { uptime: 72 } }], { score: 8, roi: 4, revenue: 2, efficiency: 3, adoption: 5 });
  assert.equal(result.dashboard.gateHealth, 100);
  assert.equal(result.metrics.uptime.current, 72);
  assert.deepEqual(result.sourceLinks.uptime.ruleIds, ['r']);
  assert.equal(result.hiddenLegacyResult.score, 8);
});
test('returns null when V3 is not opted in', () => assert.equal(projectV3Analytics(undefined, undefined), null));
