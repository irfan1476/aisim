const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

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

const { buildAdvisorSystemPrompt } = require('../lib/llm/advisorPrompt.ts');
const { resolveQuarter } = require('../lib/game/engine.ts');
const { initialGameState } = require('../lib/game/state.ts');
const { createInferredGeneration } = require('../lib/game/generator.ts');
const { getScenario, scenarioList } = require('../lib/scenarios/registry.ts');
const { scenarioInitiativesToStates } = require('../lib/game/initiativeAdapter.ts');
const { useGameStore } = require('../stores/gameStore.ts');

const allocation = {
  infra: 35,
  data: 25,
  people: 15,
  mlops: 10,
  compliance: 10,
  innovation: 5,
};

function scenarioState(id, seed = 4242) {
  const scenario = getScenario(id);
  const generation = createInferredGeneration([3, 3, 3, 3, 3], seed);
  const startingMetrics = { ...scenario.startingState.startingMetrics };
  return {
    ...initialGameState(generation, {
      scenarioMode: true,
      scenarioId: id,
      quarterlyBudget: scenario.startingState.budget,
      scenarioStartingMetrics: startingMetrics,
      defaultAllocation: scenario.startingState.defaultAllocation,
    }),
    scenarioMode: true,
    scenarioId: id,
    scenarioState: { metrics: startingMetrics, progress: {}, flags: {} },
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    selected: [],
  };
}

test('recommendation application is allocation-safe and preserves the recommendation ledger', () => {
  const before = initialGameState();
  useGameStore.getState().loadGame({ ...before, stage: 'decide', selected: ['demand'] });
  useGameStore.getState().approveRecommendation('Increase compliance budget');
  const approved = useGameStore.getState();
  assert.equal(approved.nextQuarterGuidance.title, 'Increase compliance budget');
  assert.deepEqual(approved.history, before.history, 'approval before a completed quarter is not inventing history');

  const priorSelected = [...approved.selected];
  const priorTotal = Object.values(approved.alloc).reduce((sum, value) => sum + value, 0);
  useGameStore.getState().applyRecommendation();
  const applied = useGameStore.getState();

  assert.equal(applied.nextQuarterGuidance, null);
  assert.equal(applied.alloc.compliance, 18);
  assert.equal(Object.values(applied.alloc).reduce((sum, value) => sum + value, 0), priorTotal);
  assert.deepEqual(applied.selected, priorSelected);
  // Legacy guidance without an initiative payload remains allocation-only for
  // backwards compatibility; current recommendations carry actionable IDs,
  // operating targets and deployment amounts.
});

test('strategy drafts carry their chosen quarterly deployment without exceeding authority', () => {
  const before = initialGameState();
  useGameStore.getState().loadGame({ ...before, stage: 'decide', selected: ['demand'] });
  const chosenDeployment = Math.min(before.quarterlyDeploymentCap, before.deploymentAmount + 1.4);

  useGameStore.getState().applyWhatIfDraft({
    name: 'Focused test',
    selected: ['demand'],
    alloc: before.alloc,
    deploymentAmount: chosenDeployment,
    initiativeActions: { demand: 'discover' },
  });
  assert.equal(useGameStore.getState().deploymentAmount, chosenDeployment);
  assert.equal(useGameStore.getState().initiativeActions.demand, 'discover');

  useGameStore.getState().applyWhatIfDraft({
    name: 'Out-of-range test',
    selected: ['demand'],
    alloc: before.alloc,
    deploymentAmount: before.campaignBudget,
  });
  assert.equal(useGameStore.getState().deploymentAmount, before.quarterlyDeploymentCap);
});

test('advisor prompt carries scenario and visible decision evidence without scoring authority', () => {
  const prompt = buildAdvisorSystemPrompt({
    persona: 'CFO',
    scenarioMode: true,
    scenarioPrompt: 'Connect decisions to fraud containment and compliance readiness.',
    quarterlyBudget: 5,
    campaignBudget: 60,
    campaignBudgetRemaining: 47.5,
    spent: 12.5,
    state: {
      q: 4,
      selected: ['fraudDetection', 'complianceMonitoring'],
      alloc: allocation,
      scenarioProgress: { fraudPressure: 40 },
      causalChain: [{ name: 'Compliance Monitoring' }],
      proactiveRecommendations: [{ title: 'Increase compliance budget' }],
      seed: 987654,
      runId: 'run-internal-only',
      rulesVersion: '3.0',
    },
  });

  assert.match(prompt, /fraud containment and compliance readiness/);
  assert.match(prompt, /Total campaign purse: 60/);
  assert.match(prompt, /remaining: 47\.5/);
  assert.match(prompt, /Current state:/);
  assert.match(prompt, /Do not reveal internal archetype labels or seed values/);
  assert.doesNotMatch(prompt, /"seed":987654/);
  assert.doesNotMatch(prompt, /run-internal-only/);
  assert.doesNotMatch(prompt, /"rulesVersion":"3\.0"/);
  assert.match(prompt, /Recommendation:.*Why:.*Next step:/s);
  // The advisor is explanatory only: numeric outcomes remain engine-owned.
});

test('all four scenarios expose the same generic playable contract', () => {
  assert.equal(scenarioList.length, 4);
  for (const scenario of scenarioList) {
    assert.ok(scenario.id && scenario.name && scenario.industry);
    assert.equal(scenario.initiatives.length, 6);
    assert.ok(scenario.progress.length >= 3);
    assert.ok(scenario.crises.length >= 1);
    assert.ok(scenario.startingState.defaultAllocation);

    const state = scenarioState(scenario.id);
    const selected = scenario.initiatives.slice(0, 2).map((initiative) => initiative.id);
    const result = resolveQuarter(state, { selected, alloc: scenario.startingState.defaultAllocation });
    assert.equal(result.snapshot.selectedCount, 2, `${scenario.id} records the two-initiative decision`);
    assert.equal(result.snapshot.portfolioProvenance, 'calculated-from-portfolio-choice');
    assert.ok(result.scenarioState, `${scenario.id} returns scenario state`);
  }
});

test('same scenario seed and decision produce identical outcomes across repeated runs', () => {
  for (const scenario of scenarioList) {
    const firstState = scenarioState(scenario.id, 7711);
    const secondState = scenarioState(scenario.id, 7711);
    const selected = scenario.initiatives.slice(0, 3).map((initiative) => initiative.id);
    const decision = { selected, alloc: scenario.startingState.defaultAllocation };
    assert.deepEqual(
      resolveQuarter(firstState, decision),
      resolveQuarter(secondState, decision),
      `${scenario.id} should be reproducible for the same seed and decision`,
    );
  }
});

test('different seeds can vary campaign inputs without changing the scenario contract', () => {
  for (const scenario of scenarioList) {
    const first = scenarioState(scenario.id, 7711);
    const second = scenarioState(scenario.id, 8822);
    const selected = scenario.initiatives.slice(0, 2).map((initiative) => initiative.id);
    const decision = { selected, alloc: scenario.startingState.defaultAllocation };
    const firstResult = resolveQuarter(first, decision);
    const secondResult = resolveQuarter(second, decision);
    assert.ok(firstResult.snapshot.selectedCount === secondResult.snapshot.selectedCount);
    assert.ok(firstResult.scenarioState && secondResult.scenarioState);
  }
});
