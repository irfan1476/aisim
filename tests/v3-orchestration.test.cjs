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

const { createV3State } = require('../lib/game/state.ts');
const {
  evaluateV3Gate,
  resolveV3CausalRules,
  resolveV3Event,
  evaluateV3Exposure,
  recordV3WorkflowAdoption,
  attributeV3OperationalValue,
} = require('../lib/scenarios/v3Resolver.ts');

const pack = {
  metrics: [{ key: 'uptime', unit: '%', timeBasis: 'quarter', ownerRole: 'operations' }],
  evidence: [{ id: 'asset-data' }],
  initiatives: [{ id: 'maintenance', evidenceRequired: ['asset-data'], lifecycle: { timeToSignalQuarters: 2 }, whyNotNow: { status: 'capacity_incompatible' } }],
  gates: [{ id: 'evidence-gate', requiredEvidence: ['asset-data'], conditions: ['metric.uptime >= 70'], appliesTo: ['maintenance'], ownerRole: 'operations' }],
  causalRules: [{ id: 'maintenance-signal', initiativeId: 'maintenance', delayQuarters: 2, metric: 'uptime', effects: [{ metric: 'uptime', delta: 5, unit: '%' }] }],
  events: [{ id: 'line-failure', trigger: 'metric.uptime < 50', effects: [{ metric: 'uptime', delta: -5, unit: '%' }] }],
  report: { changes: [{ metric: 'uptime', ruleId: 'maintenance-signal', evidenceIds: ['asset-data'] }] },
};

function state() { return createV3State('projectFactory', 4242, 5, ['maintenance'], pack); }

test('V3 orchestration records gate provenance without mutating input state', () => {
  const before = state();
  const met = evaluateV3Gate(pack, before, 'evidence-gate', ['asset-data'], { uptime: 72 });
  assert.equal(met.result.status, 'met');
  assert.deepEqual(met.result.missingEvidence, []);
  assert.equal(met.state.gates['evidence-gate'].history[0].evidenceIds[0], 'asset-data');
  assert.deepEqual(before.gates['evidence-gate'].history, []);
});

test('V3 orchestration defers causal effects until authored signal delay', () => {
  const result = resolveV3CausalRules(pack, state(), { uptime: 70 }, 1);
  assert.deepEqual(result.result.applied, []);
  assert.deepEqual(result.result.deferred, [{ ruleId: 'maintenance-signal', availableQuarter: 3 }]);
});

test('V3 event, exposure, workflow evidence, and value attribution are source-bound', () => {
  const event = resolveV3Event(pack, state(), 'line-failure', 'workaround', { uptime: 45 });
  assert.equal(event.result.triggered, true);
  assert.deepEqual(event.state.eventLog[0].impacts, { uptime: -5 });

  const exposure = evaluateV3Exposure(pack, state(), 'maintenance', []);
  assert.equal(exposure.result.deferred, true);
  assert.match(exposure.result.reason, /Evidence|capacity/);

  const workflow = recordV3WorkflowAdoption(state(), 'maintenance', { reviewed: 3, overridden: 1, trainingCompleted: true });
  assert.equal(workflow.result, 45);
  assert.deepEqual(workflow.state.scorecard.evidence, ['workflow:maintenance']);

  const value = attributeV3OperationalValue(pack, { uptime: 75 }, { uptime: 70 }, { operatingEffectsObserved: true });
  assert.deepEqual(value[0], { status: 'estimated', metric: 'uptime', delta: 5, sourceRuleIds: ['maintenance-signal'], evidenceIds: ['asset-data'] });
});

test('legacy Standard orchestration remains outside the V3 resolver path', () => {
  const standard = createV3State('standard-test-only', 1, 10, [], {});
  assert.deepEqual(standard.ledger, []);
  assert.deepEqual(standard.eventLog, []);
  assert.equal(standard.budget.envelope, 10);
});

test('existing scenario UI exposes scenario budget and operating challenge context', () => {
  const selector = fs.readFileSync(path.join(__dirname, '..', 'components', 'ScenarioSelector.tsx'), 'utf8');
  const decision = fs.readFileSync(path.join(__dirname, '..', 'components', 'GameDecisionView.tsx'), 'utf8');
  assert.match(selector, /Quarterly budget/);
  assert.match(selector, /scenario\.challenges/);
  assert.match(decision, /Scenario progress/);
});
