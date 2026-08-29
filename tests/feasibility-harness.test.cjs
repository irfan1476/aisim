const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Keep this harness on the same dependency-free TypeScript loading convention
// as the engine tests. It intentionally imports the live resolver, scoring,
// and verdict modules rather than reimplementing gameplay rules.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
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
Module._resolveFilename = function resolveTypeScriptImports(
  request,
  parent,
  isMain,
  options,
) {
  if (request.startsWith(".") && !path.extname(request)) {
    try {
      return resolveFilename.call(this, request, parent, isMain, options);
    } catch (error) {
      const candidate = path.resolve(
        path.dirname(parent.filename),
        `${request}.ts`,
      );
      if (fs.existsSync(candidate)) return candidate;
      throw error;
    }
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

const { getScenario } = require("../lib/scenarios/registry.ts");
const { initialGameState } = require("../lib/game/state.ts");
const { createInferredGeneration } = require("../lib/game/generator.ts");
const { scenarioInitiativesToStates } = require("../lib/game/initiativeAdapter.ts");
const {
  applyTurnDecision,
  applyCrisisResponse,
  advanceTurn,
} = require("../lib/game/turnResolver.ts");
const { calculateProgressPercentages } = require("../lib/scenarios/progress.ts");
const { explainScore } = require("../lib/game/scoring.ts");
const { deriveCampaignVerdict } = require("../lib/game/verdict.ts");

const SCENARIO_IDS = ["projectFactory", "bankNext", "care360", "futureReady"];

function createScenarioState(scenarioId, seed = 240829) {
  const scenario = getScenario(scenarioId);
  const allocation = scenario.startingState.defaultAllocation;
  const base = initialGameState(createInferredGeneration([3, 3, 3, 3, 3], seed), {
    scenarioMode: true,
    scenarioId,
    scenarioStartingMetrics: { ...scenario.startingState.startingMetrics },
    scenarioProgress: {},
    quarterlyBudget: scenario.startingState.budget,
    campaignBudget: scenario.startingState.budget * 12,
    defaultAllocation: allocation,
  });
  return {
    ...base,
    alloc: allocation,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: {
      metrics: { ...scenario.startingState.startingMetrics },
      progress: {},
      flags: {},
    },
  };
}

function actionForWindow(quarterInWindow) {
  if (quarterInWindow === 1) return "discover";
  if (quarterInWindow <= 3) return "pilot";
  if (quarterInWindow === 4) return "scale";
  return "maintain";
}

function crisisResponseFor(state) {
  const option = state.crisis?.options?.[0];
  if (!option) return null;
  // The resolver serialises crisis options as tuples in a live state while
  // older fixtures may still expose option objects.
  return {
    impact: Array.isArray(option) ? option[2] || {} : option.impacts || {},
    cost: Array.isArray(option) ? option[3] : option.cost,
  };
}

function runCampaign(scenarioId, strategy, seed = 240829) {
  const scenario = getScenario(scenarioId);
  const strategyIds = scenario.initiatives.slice(0, strategy === "focused" ? 1 : 2).map((item) => item.id);
  let state = createScenarioState(scenarioId, seed);
  const blocked = [];

  for (let quarter = 1; quarter <= 12; quarter += 1) {
    const actions = {};
    const activeIndex = strategy === "focused" ? 0 : quarter <= 6 ? 0 : 1;
    const activeId = strategyIds[activeIndex];
    actions[activeId] = actionForWindow(strategy === "focused" ? quarter : ((quarter - 1) % 6) + 1);

    // A balanced portfolio keeps the first capability alive while bringing a
    // second one through its own evidence-to-deployment cycle.
    if (strategy === "balanced" && activeIndex === 1) {
      actions[strategyIds[0]] = "maintain";
    }

    const selected = Object.keys(actions);
    const decision = {
      selected,
      initiativeActions: actions,
      alloc: state.alloc,
      deploymentAmount: Math.min(3, Math.max(0, Number(state.campaignBudgetRemaining) || 0)),
    };

    if (decision.initiativeActions[activeId] === "scale") {
      decision.evaluationDecisions = [{
        initiativeId: activeId,
        decision: "go",
        rationale: "Feasibility harness: evidence supports a controlled deployment.",
        owner: "Feasibility harness",
      }];
      decision.deploymentDecisions = [{
        initiativeId: activeId,
        mode: "augmentation",
        rationale: "Feasibility harness: retain human oversight while scaling.",
      }];
    }

    const result = applyTurnDecision(state, decision);
    if (!result.accepted) {
      blocked.push({ quarter, action: decision.initiativeActions, reason: result.reason });
      break;
    }
    state = result.nextState;

    const crisisResponse = crisisResponseFor(state);
    if (crisisResponse) state = applyCrisisResponse(state, crisisResponse);
    if (quarter < 12) state = advanceTurn(state);
  }

  const progress = calculateProgressPercentages(state.scenarioState.metrics, scenario);
  const primaryMetric = scenario.initiatives[0].primaryMetric;
  const breakdown = explainScore(state);
  const deliveryQuarters = state.history.filter((entry) => (entry.deliveryIds || []).length > 0).length;
  const discoveryQuarters = state.history.filter((entry) => (entry.discoveryIds || []).length > 0).length;
  const verdict = deriveCampaignVerdict({
    score: state.score,
    adoption: state.adoption,
    risk: state.risk,
    validatedLearning: breakdown.values.validatedLearning,
    deliveryQuarters,
    discoveryQuarters,
  });

  return {
    scenarioId,
    strategy,
    primaryMetric,
    primaryProgress: Number((progress[primaryMetric] || 0).toFixed(2)),
    overallProgress: Number((Object.values(progress).reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(progress).length)).toFixed(2)),
    score: state.score,
    adoption: Number(state.adoption.toFixed(2)),
    risk: Number(state.risk.toFixed(2)),
    verdict: verdict.grade,
    deliveryQuarters,
    discoveryQuarters,
    quartersResolved: state.history.length,
    blocked,
    finalMetrics: { ...state.scenarioState.metrics },
  };
}

function feasibilityMatrix(seed = 240829) {
  return SCENARIO_IDS.flatMap((scenarioId) => [
    runCampaign(scenarioId, "focused", seed),
    runCampaign(scenarioId, "balanced", seed),
  ]);
}

test("live resolver feasibility matrix completes focused and balanced campaigns", () => {
  const results = feasibilityMatrix();
  assert.equal(results.length, SCENARIO_IDS.length * 2);

  for (const result of results) {
    assert.equal(result.quartersResolved, 12, `${result.scenarioId}/${result.strategy} did not resolve all 12 quarters`);
    assert.deepEqual(result.blocked, [], `${result.scenarioId}/${result.strategy} was blocked: ${JSON.stringify(result.blocked)}`);
    assert.ok(result.primaryProgress > 0, `${result.scenarioId}/${result.strategy} produced no primary-outcome movement`);
  }

  // Keep the matrix visible in CI output as a balance diagnostic. The test is
  // intentionally not an A-grade assertion: it measures whether a strategy
  // can progress, while verdict policy is the next tuning surface.
  console.table(results.map((result) => ({
    scenario: result.scenarioId,
    strategy: result.strategy,
    primary: result.primaryMetric,
    primaryProgress: result.primaryProgress,
    overallProgress: result.overallProgress,
    score: result.score,
    adoption: result.adoption,
    risk: result.risk,
    verdict: result.verdict,
  })));
});

test("live feasibility findings are deterministic for replay and balance work", () => {
  assert.deepEqual(feasibilityMatrix(73129), feasibilityMatrix(73129));
});
