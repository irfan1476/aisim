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
const { calculateProgressPercentages, calculateScenarioMissionProgress } = require("../lib/scenarios/progress.ts");
const { explainScore } = require("../lib/game/scoring.ts");
const { deriveCampaignVerdict } = require("../lib/game/verdict.ts");

const SCENARIO_IDS = ["projectFactory", "bankNext", "care360", "futureReady"];
// Keep this aligned with the player-facing report in GameDoneScreen: a 62+ is
// the A band. The strategic verdict is intentionally also recorded below, but
// uses its own richer operating-health policy.
const PLAYER_FACING_A_THRESHOLD = 62;

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

function actionForFocusedQuarter(quarter) {
  // A focused learner can run a second improvement loop after the first
  // deployment. Deployment is not the end of learning; a later pilot can
  // refine a live capability without resetting the campaign.
  if (quarter <= 6) return actionForWindow(quarter);
  if (quarter <= 8) return "pilot";
  if (quarter === 9) return "scale";
  return "maintain";
}

function shiftAllocation(base, changes) {
  const next = { ...base };
  Object.entries(changes).forEach(([key, delta]) => {
    next[key] = Number(next[key] || 0) + Number(delta || 0);
  });
  const total = Object.values(next).reduce((sum, value) => sum + Number(value || 0), 0);
  next.infra = Number(next.infra || 0) + (100 - total);
  return next;
}

function customAllocations(scenario, strategy, strategyIds) {
  const base = scenario.startingState.defaultAllocation;
  if (strategy === "excellent") {
    // A strong route funds the operating model alongside delivery: each
    // mission initiative carries enough data, people, and control capacity
    // to progress without outsourcing the constraint to a hidden default.
    return Object.fromEntries(strategyIds.map((initiativeId) => [
      initiativeId,
      shiftAllocation(base, { infra: -10, data: 5, people: 3, compliance: 2 }),
    ]));
  }
  if (strategy === "focused") {
    return { [strategyIds[0]]: shiftAllocation(base, { infra: -5, data: 5 }) };
  }
  // The paired strategy gives each capability a different operating emphasis
  // while keeping every initiative mix at 100%.
  return {
    [strategyIds[0]]: shiftAllocation(base, { infra: -5, data: 5 }),
    [strategyIds[1]]: shiftAllocation(base, { infra: -5, people: 5 }),
  };
}

function deploymentForQuarter(strategy, quarter, state) {
  const remaining = Math.max(0, Number(state.campaignBudgetRemaining) || 0);
  // These are explicit learner choices: focused acceleration funds a second
  // learning loop; paired delivery preserves reserve while two capabilities
  // progress in sequence.
  const requested = strategy === "excellent"
    ? (quarter === 1 ? .7 : quarter <= 3 ? 4 : quarter === 4 || quarter >= 9 ? 6.5 : quarter === 5 ? 2.6 : quarter <= 7 ? 4.6 : 6.3)
    : strategy === "focused"
    ? (quarter <= 4 ? 4.5 : 3.2)
    : (quarter <= 6 ? 3.2 : 2.8);
  return Math.min(requested, remaining);
}

function excellentPortfolioPlan(scenario) {
  // An excellent campaign makes two deliberate waves. The first establishes
  // the primary mission and an available guardrail. The second broadens the
  // operating model, while one first-wave capability receives continued
  // delivery acceleration. The final wave returns to the mission portfolio. This respects the real
  // three-initiative limit instead of silently funding a six-project plan.
  const idsForRoles = (roles) => scenario.initiatives
    .filter((initiative) => scenario.progress.some((outcome) => roles.includes(outcome.role) && outcome.key === initiative.primaryMetric))
    .map((initiative) => initiative.id);
  const unique = (ids) => Array.from(new Set(ids));
  const primary = idsForRoles(["primary"]);
  const guardrail = idsForRoles(["guardrail"]);
  const supporting = idsForRoles(["supporting"]);
  const firstWave = unique([...primary, ...guardrail, ...supporting]).slice(0, 3);
  const secondCandidates = unique([...guardrail, ...supporting, ...primary, ...scenario.initiatives.map((initiative) => initiative.id)])
    .filter((initiativeId) => !firstWave.includes(initiativeId));
  const secondWave = secondCandidates.slice(0, 2);
  // Continue the primary outcome that needs the most delivery cycles relative
  // to its authored effect. This is a transparent pacing choice, not a
  // scenario-specific shortcut (for example, visual quality needs more time
  // than a small index-pressure reduction).
  const anchor = [...firstWave]
    .filter((initiativeId) => primary.includes(initiativeId))
    .sort((leftId, rightId) => {
      const effortFor = (initiativeId) => {
        const initiative = scenario.initiatives.find((item) => item.id === initiativeId);
        const outcome = scenario.progress.find((item) => item.key === initiative?.primaryMetric);
        return Math.abs(Number(outcome?.target || 0) - Number(outcome?.start || 0)) / Math.max(.1, Math.abs(Number(initiative?.baseEffect || 0)));
      };
      return effortFor(rightId) - effortFor(leftId);
    })[0] || firstWave[0];
  return {
    firstWave,
    secondWave,
    anchor,
    finalWave: firstWave,
    all: unique([...firstWave, ...secondWave]),
  };
}

function excellentActionsForQuarter(plan, quarter) {
  const stageAction = actionForWindow(((quarter - 1) % 4) + 1);
  if (quarter <= 4) return Object.fromEntries(plan.firstWave.map((initiativeId) => [initiativeId, stageAction]));
  if (quarter <= 8) return Object.fromEntries([
    ...(plan.anchor ? [[plan.anchor, "scale"]] : []),
    ...plan.secondWave.map((initiativeId) => [initiativeId, stageAction]),
  ]);
  // Once the evidence and deployment gates are complete, the final four
  // quarters deliberately use the campaign reserve to accelerate the mission
  // portfolio. This is the explicit funding-to-stage pathway players need to
  // see: extra capital increases delivery intensity; it does not skip gates.
  return Object.fromEntries(plan.finalWave.map((initiativeId) => [initiativeId, "scale"]));
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
  const excellentPlan = strategy === "excellent" ? excellentPortfolioPlan(scenario) : undefined;
  const strategyIds = strategy === "excellent"
    ? excellentPlan.all
    : scenario.initiatives.slice(0, strategy === "focused" ? 1 : 2).map((item) => item.id);
  const initiativeAllocations = customAllocations(scenario, strategy, strategyIds);
  let state = createScenarioState(scenarioId, seed);
  const blocked = [];
  const decisions = [];

  for (let quarter = 1; quarter <= 12; quarter += 1) {
    const actions = {};
    if (strategy === "excellent") {
      Object.assign(actions, excellentActionsForQuarter(excellentPlan, quarter));
    }
    const activeIndex = strategy === "focused" ? 0 : quarter <= 6 ? 0 : 1;
    const activeId = strategyIds[activeIndex];
    if (strategy !== "excellent") {
      actions[activeId] = strategy === "focused"
        ? actionForFocusedQuarter(quarter)
        : actionForWindow(((quarter - 1) % 6) + 1);
    }

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
      initiativeAllocationMode: "custom",
      initiativeAllocations,
      deploymentAmount: deploymentForQuarter(strategy, quarter, state),
    };

    const scalingIds = Object.entries(decision.initiativeActions)
      .filter(([, action]) => action === "scale")
      .map(([initiativeId]) => initiativeId);
    if (scalingIds.length > 0) {
      decision.evaluationDecisions = scalingIds.map((initiativeId) => ({
        initiativeId,
        decision: "go",
        rationale: "Feasibility harness: evidence supports a controlled deployment.",
        owner: "Feasibility harness",
      }));
      decision.deploymentDecisions = scalingIds.map((initiativeId) => ({
        initiativeId,
        mode: "augmentation",
        rationale: "Feasibility harness: retain human oversight while scaling.",
      }));
    }

    const result = applyTurnDecision(state, decision);
    if (!result.accepted) {
      blocked.push({
        quarter,
        selected: decision.selected,
        action: decision.initiativeActions,
        released: decision.deploymentAmount,
        reason: result.reason,
        feedback: result.nextState.feedback,
      });
      break;
    }
    decisions.push({
      quarter,
      selected: [...decision.selected],
      actions: { ...decision.initiativeActions },
      released: decision.deploymentAmount,
      delivered: result.nextState.history.at(-1)?.deliveryIds || [],
    });
    state = result.nextState;

    const crisisResponse = crisisResponseFor(state);
    if (crisisResponse) state = applyCrisisResponse(state, crisisResponse);
    if (quarter < 12) state = advanceTurn(state);
  }

  const progress = calculateProgressPercentages(state.scenarioState.metrics, scenario);
  const mission = calculateScenarioMissionProgress(state.scenarioState.metrics, scenario);
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
    scenarioMode: true,
    missionReady: mission.missionReady,
    masteryReady: mission.masteryReady,
  });

  return {
    scenarioId,
    strategy,
    primaryMetric,
    primaryProgress: Number((progress[primaryMetric] || 0).toFixed(2)),
    missionPrimaryProgress: Number(mission.primaryProgress.toFixed(2)),
    guardrailProtection: Number(mission.guardrailProtection.toFixed(2)),
    missionReady: mission.missionReady,
    masteryReady: mission.masteryReady,
    overallProgress: Number((Object.values(progress).reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(progress).length)).toFixed(2)),
    score: state.score,
    adoption: Number(state.adoption.toFixed(2)),
    risk: Number(state.risk.toFixed(2)),
    verdict: verdict.grade,
    deliveryQuarters,
    discoveryQuarters,
    quartersResolved: state.history.length,
    blocked,
    decisions,
    finalFeedback: state.feedback,
    finalInitiatives: Object.fromEntries(strategyIds.map((id) => {
      const initiative = state.initiativeStates[id];
      return [id, {
        lifecycle: initiative.lifecycle,
        quartersInvested: initiative.quartersInvested,
        totalInvestment: initiative.totalInvestment,
        maturity: initiative.maturityLevel,
      }];
    })),
    finalMetrics: { ...state.scenarioState.metrics },
  };
}

function feasibilityMatrix(seed = 240829) {
  return SCENARIO_IDS.flatMap((scenarioId) => [
    runCampaign(scenarioId, "focused", seed),
    runCampaign(scenarioId, "balanced", seed),
    runCampaign(scenarioId, "excellent", seed),
  ]);
}

test("live resolver feasibility matrix completes first-run and excellent campaigns", () => {
  const results = feasibilityMatrix();
  assert.equal(results.length, SCENARIO_IDS.length * 3);

  for (const result of results) {
    assert.equal(result.quartersResolved, 12, `${result.scenarioId}/${result.strategy} did not resolve all 12 quarters: ${JSON.stringify(result.blocked)}`);
    assert.deepEqual(result.blocked, [], `${result.scenarioId}/${result.strategy} was blocked: ${JSON.stringify(result.blocked)}`);
    // A viable first run should show material movement on the mission signal,
    // not merely pass through the lifecycle gates. This is deliberately below
    // the 60% mission-ready threshold so an honest first campaign can still
    // leave room for a stronger replay.
    assert.ok(result.primaryProgress >= 50, `${result.scenarioId}/${result.strategy} produced less than 50% primary-outcome progress`);
    assert.equal(result.decisions.length, 12, `${result.scenarioId}/${result.strategy} did not record all decisions`);
    assert.ok(Object.values(result.finalInitiatives).every((item) => item.quartersInvested > 0), `${result.scenarioId}/${result.strategy} did not record investment quarters`);
  }

  const excellentResults = results.filter((result) => result.strategy === "excellent");
  // Keep the matrix visible in CI output as a balance diagnostic. The
  // excellent rows are executable reference strategies, while the focused and
  // balanced rows keep first-run feasibility visible.
  console.table(results.map((result) => ({
    scenario: result.scenarioId,
    strategy: result.strategy,
    primary: result.primaryMetric,
    primaryProgress: result.primaryProgress,
    missionPrimary: result.missionPrimaryProgress,
    guardrails: result.guardrailProtection,
    missionReady: result.missionReady,
    overallProgress: result.overallProgress,
    score: result.score,
    adoption: result.adoption,
    risk: result.risk,
    verdict: result.verdict,
    invested: Object.values(result.finalInitiatives).map((item) => item.quartersInvested).join(","),
  })));
  for (const result of excellentResults) {
    assert.ok(result.missionPrimaryProgress >= 60, `${result.scenarioId} excellent route did not materially complete its primary mission`);
    assert.ok(result.score >= PLAYER_FACING_A_THRESHOLD, `${result.scenarioId} excellent route did not reach the player-facing A band (${result.score}/100)`);
    assert.ok(["A", "A+"].includes(result.verdict), `${result.scenarioId} excellent route must display an excellent verdict (${result.verdict})`);
  }

});

test("live resolver exposes an actionable blocker instead of silently stalling", () => {
  const state = createScenarioState("projectFactory");
  const initiativeId = getScenario("projectFactory").initiatives[0].id;
  const result = applyTurnDecision(state, {
    selected: [initiativeId],
    initiativeActions: { [initiativeId]: "pilot" },
    alloc: state.alloc,
    deploymentAmount: 3,
  });

  assert.equal(result.accepted, false);
  assert.match(result.reason, /required discovery and experiment period/i);
  assert.equal(result.nextState.feedback, result.reason);
});

test("live feasibility findings are deterministic for replay and balance work", () => {
  assert.deepEqual(feasibilityMatrix(73129), feasibilityMatrix(73129));
});
