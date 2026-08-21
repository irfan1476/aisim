const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');

// Keep the contract tests runnable without adding a runtime TypeScript dependency.
require.extensions['.ts'] = (mod, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  mod._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText, filename);
};
const { validateScenarioV3Pack } = require('../lib/scenarios/v3Validator.ts');

const validPack = () => ({
  metrics: [{ key: 'uptime', unit: '%', timeBasis: 'quarter', ownerRole: 'operations', min: 0, max: 100, start: 70 }],
  evidence: [{ id: 'asset-data', sourceStatus: 'provisional_synthetic', claimStatus: 'supported' }],
  initiatives: [{ id: 'maintenance', valueMetric: 'uptime', dependencies: [], evidenceRequired: ['asset-data'], lifecycle: { allowedTransitions: ['deferred_to_research', 'research_to_pilot', 'any_to_pause'] } }],
  causalRules: [{ id: 'maintenance-signal', metric: 'uptime', evidenceIds: ['asset-data'], effects: [{ metric: 'uptime', delta: 5, unit: '%' }] }],
  events: [{ id: 'line-failure', triggerMetric: 'uptime', effects: [{ metric: 'uptime', delta: -5, unit: '%' }] }],
  report: { changes: [{ metric: 'uptime', ruleId: 'maintenance-signal' }] },
});

test('accepts a self-contained V3 pack', () => assert.equal(validateScenarioV3Pack(validPack()).valid, true));

test('rejects unknown references, cycles, and untraceable report changes', () => {
  const pack = validPack();
  pack.initiatives[0].dependencies = ['missing'];
  pack.report.changes.push({ metric: 'uptime' });
  const result = validateScenarioV3Pack(pack);
  assert.ok(result.errors.some((e) => e.code === 'unknown-initiative-reference'));
  assert.ok(result.errors.some((e) => e.code === 'report-source-required'));
});

test('rejects incompatible units and duplicate metric authority', () => {
  const pack = validPack();
  pack.metrics.push({ key: 'uptime', unit: 'index points', timeBasis: 'month', ownerRole: 'quality' });
  pack.causalRules[0].effects[0].unit = 'hours';
  const result = validateScenarioV3Pack(pack);
  assert.ok(result.errors.some((e) => e.code === 'metric-authority-collision'));
  assert.ok(result.errors.some((e) => e.code === 'incompatible-effect-unit'));
});
