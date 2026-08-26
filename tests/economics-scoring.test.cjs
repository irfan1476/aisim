const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveTypeScriptImports(request, parent, isMain, options) {
  if (request.startsWith('.') && !path.extname(request)) {
    try { return resolveFilename.call(this, request, parent, isMain, options); }
    catch (error) {
      const candidate = path.resolve(path.dirname(parent.filename), `${request}.ts`);
      if (fs.existsSync(candidate)) return candidate;
      throw error;
    }
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

const { emptyFinancialLedger, hasPaidBack, lifecycleBenefitRealisation, realiseBenefit, realisedROI, updateFinancialLedger } = require('../lib/game/economics.ts');
const { composeCampaignScore, realisedFinancialValueScore } = require('../lib/game/scoring.ts');

test('financial ledger records all cash costs, realised ROI, and first payback quarter', () => {
  const start = emptyFinancialLedger();
  const q1 = updateFinancialLedger(start, { investment: 10, grossBenefit: 3, quarter: 1 });
  assert.equal(q1.netBenefit, -7);
  assert.equal(q1.cumulativeInvestment, 10);
  assert.equal(q1.cumulativeNetBenefit, -7);
  assert.equal(q1.paybackQuarter, undefined);

  const q2 = updateFinancialLedger(q1, { runCost: 1, crisisCost: 1, grossBenefit: 21, quarter: 2 });
  assert.equal(q2.cumulativeInvestment, 12);
  assert.equal(q2.cumulativeNetBenefit, 12);
  assert.equal(q2.paybackQuarter, 2);
  assert.equal(q2.realisedROI, 100);
  assert.equal(realisedROI(q2), 100);
  assert.equal(hasPaidBack(q2), true);
  assert.equal(q1.cumulativeInvestment, 10, 'updates are immutable');
});

test('lifecycle benefit realisation is bounded and requires adoption and readiness', () => {
  const discovery = lifecycleBenefitRealisation({ lifecycle: 'discovery', adoption: 100, readiness: 100 });
  const pilot = lifecycleBenefitRealisation({ lifecycle: 'pilot', quartersInLifecycle: 1, adoption: 100, readiness: 100 });
  const scale = lifecycleBenefitRealisation({ lifecycle: 'scale', quartersInLifecycle: 5, adoption: 100, readiness: 100 });
  const run = lifecycleBenefitRealisation({ lifecycle: 'run', quartersInLifecycle: 8, adoption: 100, readiness: 100 });
  const constrainedRun = lifecycleBenefitRealisation({ lifecycle: 'run', quartersInLifecycle: 8, adoption: 0, readiness: 0 });
  assert.equal(discovery, 0);
  assert.ok(pilot > discovery && scale > pilot && run <= 1);
  assert.ok(constrainedRun < run);
  assert.equal(realiseBenefit(40, { lifecycle: 'pilot', adoption: 100, readiness: 100 }), 4);
});

test('campaign score applies agreed scenario weights and normalises Standard mode', () => {
  const inputs = { scenarioTargetProgress: 80, realisedFinancialValue: 60, operatingHealth: 70, executionDiscipline: 90, responsibleAI: 100 };
  const scenario = composeCampaignScore({ ...inputs, scenarioMode: true });
  assert.equal(scenario.score, 75);
  assert.deepEqual(scenario.weights, { scenarioTargetProgress: 40, realisedFinancialValue: 25, operatingHealth: 20, executionDiscipline: 10, responsibleAI: 5 });

  const standard = composeCampaignScore({ ...inputs, scenarioMode: false });
  assert.equal(standard.weights.scenarioTargetProgress, 0);
  assert.equal(standard.weights.realisedFinancialValue, 41.666667);
  assert.equal(standard.score, 71.67);
  assert.equal(realisedFinancialValueScore({ cumulativeInvestment: 20, cumulativeNetBenefit: 10 }), 50);
});
