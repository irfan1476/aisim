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
const { composeCampaignScore, explainScore, refreshCampaignScore, realisedFinancialValueScore, validatedLearningScore } = require('../lib/game/scoring.ts');
const { initialGameState } = require('../lib/game/state.ts');

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
  const inputs = { scenarioTargetProgress: 80, realisedFinancialValue: 60, operatingHealth: 70, executionDiscipline: 90, responsibleAI: 100, validatedLearning: 50 };
  const scenario = composeCampaignScore({ ...inputs, scenarioMode: true });
  assert.equal(scenario.score, 73);
  assert.deepEqual(scenario.weights, { scenarioTargetProgress: 35, realisedFinancialValue: 20, operatingHealth: 20, executionDiscipline: 10, responsibleAI: 5, validatedLearning: 10 });

  const standard = composeCampaignScore({ ...inputs, scenarioMode: false });
  assert.equal(standard.weights.scenarioTargetProgress, 0);
  assert.equal(standard.weights.realisedFinancialValue, 30.769231);
  assert.equal(standard.score, 69.23);
  assert.equal(realisedFinancialValueScore({ cumulativeInvestment: 20, cumulativeNetBenefit: 10 }), 50);
});

test('validated learning recognises deliberate early-stage work but not passive starting readiness', () => {
  const state = initialGameState();
  state.initiativeStates.demand.dataReadiness = 95;
  state.initiativeStates.demand.currentData = 4.75;
  state.initiativeStates.demand.aiLifecycle.stage = 'experiment';
  assert.equal(validatedLearningScore(state), 0);

  state.initiativeActions = { demand: 'discover' };
  assert.ok(validatedLearningScore(state) > 0);
});

test('scenario score refresh averages target percentages, not raw domain metric values', () => {
  const state = initialGameState(undefined, { scenarioMode: true, scenarioId: 'projectFactory' });
  state.scenarioState = {
    ...state.scenarioState,
    metrics: {
      ...(state.scenarioState?.metrics || {}),
      // One of five targets is met; the other four remain at their baselines.
      supplyContinuity: 85,
    },
  };
  // This shape reproduces the legacy disconnect: raw metric values were
  // persisted in scenarioProgress and later mistaken for percentages.
  state.scenarioProgress = {
    downtimePressure: 65,
    defectRate: 500,
    energyPressure: 70,
    workforceResilience: 55,
    supplyContinuity: 85,
  };
  const refreshed = refreshCampaignScore(state);
  assert.equal(refreshed.scoreBreakdown.values.scenarioTargetProgress, 20);
  assert.equal(refreshed.scoreBreakdown.contributions.scenarioTargetProgress, 7);
  assert.equal(explainScore(state).values.scenarioTargetProgress, 20);
});
