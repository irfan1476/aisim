const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Keep this regression suite dependency-free while exercising the same
// TypeScript modules used by the live game and replay notebook.
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

const { getScenario } = require('../lib/scenarios/registry.ts');
const { calculateScenarioMissionProgress } = require('../lib/scenarios/progress.ts');
const { composeCampaignScore, explainScore } = require('../lib/game/scoring.ts');
const { initialGameState } = require('../lib/game/state.ts');
const { applyCrisisResponse, applyTurnDecision, advanceTurn } = require('../lib/game/turnResolver.ts');
const {
  createCounterfactualTrace,
  recordCrisisResponse,
  recordDecision,
  replayCounterfactual,
} = require('../lib/counterfactual.ts');

const allocation = { infra: 35, data: 25, people: 15, mlops: 10, compliance: 10, innovation: 5 };

test('partial early-stage progress is visible without pretending the mission is complete', () => {
  const scenario = getScenario('projectFactory');
  const metrics = {
    ...scenario.startingState.startingMetrics,
    // Halfway from the starting pressure to the authored target.
    downtimePressure: 50,
  };
  const mission = calculateScenarioMissionProgress(metrics, scenario);

  assert.equal(mission.primaryProgress, 25, 'one of two primary signals has made 50% progress');
  assert.ok(mission.missionProgress > 0, 'early evidence must contribute to mission progress');
  assert.equal(mission.missionReady, false, 'partial early progress must not claim mission readiness');
  assert.ok(mission.blockers.some((blocker) => /primary mission/i.test(blocker)));
});

test('guardrail deterioration remains a blocker, and recovery restores readiness', () => {
  const scenario = getScenario('projectFactory');
  const unsafeMetrics = {
    ...scenario.startingState.startingMetrics,
    downtimePressure: 35,
    defectRate: 200,
    supplyContinuity: 60,
  };
  const unsafe = calculateScenarioMissionProgress(unsafeMetrics, scenario);

  assert.equal(unsafe.primaryProgress, 100, 'primary targets can be met independently');
  assert.ok(unsafe.guardrailProtection < 100);
  assert.equal(unsafe.missionReady, false, 'primary success cannot hide a guardrail regression');
  assert.ok(unsafe.blockers.some((blocker) => /guardrail/i.test(blocker)));

  const recovered = calculateScenarioMissionProgress({ ...unsafeMetrics, supplyContinuity: 65 }, scenario);
  assert.equal(recovered.guardrailProtection, 100);
  assert.equal(recovered.missionReady, true, 'restoring the guardrail enables mission readiness');
  assert.ok(recovered.blockers.every((blocker) => !/guardrail/i.test(blocker)), 'recovery clears the guardrail blocker');
});

function completedStandardTrace() {
  let state = initialGameState();
  let trace = createCounterfactualTrace(state);

  for (let q = 1; q <= 12; q += 1) {
    const decision = { selected: ['demand'], alloc: allocation, deploymentAmount: state.deploymentAmount };
    const result = applyTurnDecision(state, decision);
    assert.equal(result.accepted, true, `baseline Standard decision for Quarter ${q} should resolve`);
    state = result.nextState;
    trace = recordDecision(trace, { type: 'decision', q, ...decision });
    if (state.crisis) {
      const response = {
        type: 'crisis-response',
        q,
        impact: {},
        cost: 0,
        eventTitle: state.crisis.title,
        eventType: state.crisis.type,
      };
      trace = recordCrisisResponse(trace, response);
      state = applyCrisisResponse(state, response);
    }
    if (q < 12) state = advanceTurn(state);
  }
  return { state, trace };
}

test('a replayed operating recovery can improve the outcome and still complete', () => {
  const { state: original, trace } = completedStandardTrace();
  const originalTrace = JSON.stringify(trace);
  const replay = replayCounterfactual(trace, {
    q: 1,
    selected: ['demand'],
    alloc: { ...allocation, infra: 25, people: 25 },
    deploymentAmount: trace.actions.find((action) => action.type === 'decision' && action.q === 1).deploymentAmount,
  });

  assert.equal(replay.status, 'complete');
  assert.equal(replay.appliedThroughQuarter, 12);
  assert.ok(replay.state.adoption > original.adoption, 'the replayed people allocation improves adoption');
  assert.ok(explainScore(replay.state).values.operatingHealth > explainScore(original).values.operatingHealth);
  assert.equal(JSON.stringify(trace), originalTrace, 'replay must preserve the original branch for comparison');
});

test('Standard mode scoring remains invariant to scenario-only progress input', () => {
  const inputs = {
    realisedFinancialValue: 60,
    operatingHealth: 70,
    executionDiscipline: 90,
    responsibleAI: 100,
    validatedLearning: 50,
    scenarioMode: false,
  };
  const withoutScenarioProgress = composeCampaignScore({ ...inputs, scenarioTargetProgress: 0 });
  const withScenarioProgress = composeCampaignScore({ ...inputs, scenarioTargetProgress: 100 });

  assert.equal(withoutScenarioProgress.score, withScenarioProgress.score);
  assert.equal(withoutScenarioProgress.weights.scenarioTargetProgress, 0);
  assert.equal(withScenarioProgress.weights.scenarioTargetProgress, 0);
});
