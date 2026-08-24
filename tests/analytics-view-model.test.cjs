const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Keep these focused tests dependency-free and consistent with the existing
// Node test harness: load the TypeScript modules directly through transpileModule.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
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

const { analyticsBudget, analyticsHistory, analyticsMetrics, initiativeSpend, lowestScenarioMetric, scenarioForecast } = require('../lib/analyticsViewModel.ts');
const { initialGameState } = require('../lib/game/state.ts');
const { normalizeGameState } = require('../lib/game/persistence.ts');
const { getScenario } = require('../lib/scenarios/registry.ts');
const { scenarioInitiativesToStates } = require('../lib/game/initiativeAdapter.ts');
const { useGameStore } = require('../stores/gameStore.ts');

function futureReadyState() {
  const scenario = getScenario('futureReady');
  const startingMetrics = { ...scenario.startingState.startingMetrics };
  return {
    ...initialGameState(undefined, {
      scenarioMode: true,
      scenarioId: scenario.id,
      quarterlyBudget: scenario.startingState.budget,
      scenarioStartingMetrics: startingMetrics,
    }),
    scenarioMode: true,
    scenarioId: scenario.id,
    scenarioState: {
      metrics: { ...startingMetrics, studentPersistence: 64 },
      progress: { studentPersistence: 42 },
      flags: {},
    },
    scenarioProgress: { studentPersistence: 42 },
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    history: [
      {
        q: 1,
        chosen: ['AI Student Success Predictor'],
        selectedIds: ['successPredictor'],
        allocation: scenario.startingState.defaultAllocation,
        metrics: { spent: 1.2, roi: 8, adoption: 42 },
        scenarioState: {
          metrics: { ...startingMetrics, studentPersistence: 60 },
          progress: { studentPersistence: 22 },
          flags: {},
        },
      },
    ],
    q: 2,
    spent: 2.7,
    scenarioBudgetRemaining: 3.8,
  };
}

test('analytics view model uses scenario metrics, history, budget, and target forecast', () => {
  const state = futureReadyState();
  const metrics = analyticsMetrics(state);

  assert.ok(metrics.length > 0);
  assert.ok(metrics.every((metric) => metric.source === 'scenario'));
  assert.equal(metrics.find((metric) => metric.key === 'studentPersistence').current, 64);
  assert.equal(metrics.find((metric) => metric.key === 'studentPersistence').progress, 42);

  const persistence = metrics.find((metric) => metric.key === 'studentPersistence');
  const history = analyticsHistory(state, persistence);
  assert.deepEqual(history, [{ quarter: 1, value: 60 }]);

  const budget = analyticsBudget(state);
  assert.equal(budget.spentCampaign, 2.7);
  assert.equal(budget.spentLastCompletedQuarter, 1.2);
  assert.equal(budget.lastCompletedQuarter, 1);
  assert.equal(budget.remainingThisQuarter, 3.8);
  assert.equal(budget.envelope, 5);

  const spend = initiativeSpend(state);
  assert.deepEqual(spend, []);

  const lowest = lowestScenarioMetric(state);
  assert.equal(lowest.key, 'studentEngagement');
  assert.equal(lowest.progress, Math.min(...metrics.map((metric) => metric.progress)));
  const forecast = scenarioForecast(state, 2);
  assert.equal(forecast.length, 2);
  assert.deepEqual(forecast.map((point) => point.quarter), [3, 4]);
  assert.ok(Number.isFinite(forecast[0].values.studentPersistence));
  assert.equal(forecast[0].provenance, 'directional-model');
  assert.ok(forecast[0].ranges.studentPersistence.low <= forecast[0].values.studentPersistence);
  assert.ok(forecast[0].ranges.studentPersistence.high >= forecast[0].values.studentPersistence);
  assert.equal(forecast[0].confidence, 'low');
});

test('analytics metrics expose provenance so learners can distinguish fact from interpretation', () => {
  const scenarioState = futureReadyState();
  const scenarioMetrics = analyticsMetrics(scenarioState);
  assert.ok(scenarioMetrics.every((metric) => metric.provenance === 'measured'));

  const standardMetrics = analyticsMetrics(initialGameState());
  assert.ok(standardMetrics.every((metric) => metric.provenance === 'derived'));
});

test('analytics spend uses evolved cumulative investment after advancing quarter', () => {
  const state = futureReadyState();
  state.initiativeStates.successPredictor.totalInvestment = 2.4;
  state.history[0].initiativeStates = {
    successPredictor: { ...state.initiativeStates.successPredictor, totalInvestment: 1.2 },
  };
  const budget = analyticsBudget(state);
  assert.equal(budget.spentLastCompletedQuarter, 1.2);
  assert.equal(budget.lastCompletedQuarter, 1);
  assert.deepEqual(initiativeSpend(state), [{ id: 'successPredictor', name: 'AI Student Success Predictor', amount: 2.4 }]);
});

test('store defensively limits direct initiative selection to three unique IDs', () => {
  useGameStore.getState().selectInitiatives(['a', 'b', 'a', 'c', 'd']);
  assert.deepEqual(useGameStore.getState().selected, ['a', 'b', 'c']);
});

test('quarter ledger retains approved recommendation and crisis response details', () => {
  const base = futureReadyState();
  useGameStore.getState().loadGame({
    ...base,
    stage: 'results',
    crisis: { title: 'A consent review pauses the pilot.', type: 'DATA GOVERNANCE', options: [] },
  });

  useGameStore.getState().approveRecommendation('Increase compliance budget');
  let state = useGameStore.getState();
  assert.deepEqual(state.history.at(-1).approvedRecommendations, ['Increase compliance budget']);
  assert.equal(state.nextQuarterGuidance.title, 'Increase compliance budget');

  useGameStore.getState().respondToCrisis({ academicGovernance: 8, risk: -4 }, 0.3);
  state = useGameStore.getState();
  const latest = state.history.at(-1);
  assert.deepEqual(latest.approvedRecommendations, ['Increase compliance budget']);
  assert.deepEqual(latest.crisisResponse, { academicGovernance: 8, risk: -4 });
  assert.equal(latest.metrics.spent, 3.0);
  assert.equal(state.crisis, null);

  // The ledger is JSON-safe and survives the normal save migration path.
  const restored = normalizeGameState(state);
  assert.deepEqual(restored.history.at(-1).crisisResponse, { academicGovernance: 8, risk: -4 });
  assert.deepEqual(restored.history.at(-1).approvedRecommendations, ['Increase compliance budget']);
});
