const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
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

const { initialGameState } = require('../lib/game/state.ts');
const { previewStrategy } = require('../lib/game/strategyPreview.ts');
const { applyTurnDecision } = require('../lib/game/turnResolver.ts');
const { getScenario } = require('../lib/scenarios/registry.ts');
const { scenarioInitiativesToStates } = require('../lib/game/initiativeAdapter.ts');
const { normalizeWhatIfDraft } = require('../lib/game/persistence.ts');

const allocation = { infra: 35, data: 25, people: 15, mlops: 10, compliance: 10, innovation: 5 };

test('strategy preview is pure and uses the same engine for standard mode', () => {
  const state = initialGameState();
  const before = JSON.stringify(state);
  const result = previewStrategy(state, ['maintenance'], allocation, 6);
  assert.equal(JSON.stringify(state), before);
  assert.equal(result.alternative.decision.selected.length, 1);
  assert.ok(result.alternative.initiativeStates.maintenance.quartersFunded >= 1);
  assert.equal(result.alternative.spend.deploymentAmount, 6);
  assert.match(result.learningInsight, /deep-focus/);
});

for (const scenarioId of ['projectFactory', 'bankNext', 'care360', 'futureReady']) {
  test(`strategy preview is scenario-native for ${scenarioId}`, () => {
    const scenario = getScenario(scenarioId);
    const state = initialGameState(undefined, {
      scenarioMode: true,
      scenarioId,
      quarterlyBudget: scenario.startingState.budget,
      campaignBudget: scenario.startingState.budget * 12,
      defaultAllocation: scenario.startingState.defaultAllocation,
      scenarioStartingMetrics: scenario.startingState.startingMetrics,
      startingMetrics: scenario.startingState.startingMetrics,
    });
    state.initiativeStates = scenarioInitiativesToStates(scenario.initiatives);
    const result = previewStrategy(state, { selected: scenario.initiatives.slice(0, 1).map((item) => item.id), alloc: state.alloc, deploymentAmount: state.quarterlyBudget });
    assert.ok(result.alternative.scenarioState);
    assert.ok(Object.keys(result.alternative.scenarioState.metrics).length > 0);
    assert.ok(Array.isArray(result.uncoveredPressures));
    assert.match(result.alternative.spend.provenance, /engine-preview/);
  });

  test(`extra deployment changes the measured scenario outcome for ${scenarioId}`, () => {
    const scenario = getScenario(scenarioId);
    const state = initialGameState(undefined, {
      scenarioMode: true,
      scenarioId,
      quarterlyBudget: scenario.startingState.budget,
      campaignBudget: scenario.startingState.budget * 12,
      defaultAllocation: scenario.startingState.defaultAllocation,
      scenarioStartingMetrics: scenario.startingState.startingMetrics,
      startingMetrics: scenario.startingState.startingMetrics,
    });
    state.initiativeStates = scenarioInitiativesToStates(scenario.initiatives);
    const initiative = scenario.initiatives[0];
    // Exercise the action-aware preview with a lifecycle-valid pilot. The
    // scenario starts in data readiness, so a direct scale would correctly be
    // rejected by the live lifecycle contract.
    state.initiativeStates[initiative.id] = {
      ...state.initiativeStates[initiative.id],
      aiLifecycle: { ...state.initiativeStates[initiative.id].aiLifecycle, stage: 'experiment', stageStartedAt: 0, stageStatus: 'in_progress' },
    };
    const minimumCost = state.initiativeStates[initiative.id].currentCost;
    const action = { [initiative.id]: 'pilot' };
    const baseline = previewStrategy(state, { selected: [initiative.id], initiativeActions: action, alloc: state.alloc, deploymentAmount: minimumCost * .6 });
    const accelerated = previewStrategy(state, { selected: [initiative.id], initiativeActions: action, alloc: state.alloc, deploymentAmount: minimumCost * 1.2 });

    assert.ok(accelerated.alternative.spend.fundingIntensity > 1);
    assert.notEqual(
      accelerated.alternative.scenarioMetrics[initiative.primaryMetric],
      baseline.alternative.scenarioMetrics[initiative.primaryMetric],
    );
  });
}

test('preview exposes trade-offs for a materially different portfolio', () => {
  const state = initialGameState();
  const result = previewStrategy(state, [], allocation, 0);
  assert.ok(result.tradeoffs.length > 0);
  assert.ok(Object.hasOwn(result.deltas, 'initiativeSpend'));
  assert.match(result.learningInsight, /pause/);
});

test('additional deployment accelerates a selected portfolio with bounded returns', () => {
  const state = initialGameState();
  const selected = ['maintenance'];
  const minimumCost = state.initiativeStates.maintenance.currentCost;
  const baseline = previewStrategy(state, { selected, alloc: allocation, deploymentAmount: minimumCost });
  const accelerated = previewStrategy(state, { selected, alloc: allocation, deploymentAmount: minimumCost * 2 });

  assert.equal(baseline.alternative.spend.acceleratedInvestment, 0);
  assert.ok(accelerated.alternative.spend.acceleratedInvestment > 0);
  assert.ok(accelerated.alternative.spend.fundingIntensity > 1);
  assert.ok(accelerated.alternative.metrics.efficiency > baseline.alternative.metrics.efficiency);
  assert.ok(accelerated.alternative.initiativeStates.maintenance.totalInvestment > baseline.alternative.initiativeStates.maintenance.totalInvestment);
});

test('focused acceleration preview matches live funding and persisted allocation', () => {
  const state = initialGameState();
  const selected = ['demand', 'energy'];
  const initiativeActions = { demand: 'pilot', energy: 'scale' };
  const floor = require('../lib/game/capital.ts').calculateActionCapitalPlan(state, initiativeActions, 100).requiredCapital;
  const decision = {
    selected,
    initiativeActions,
    alloc: allocation,
    deploymentAmount: floor + 6,
    accelerationAllocations: { demand: 100, energy: 0 },
  };
  const preview = previewStrategy(state, decision);
  const live = applyTurnDecision(state, decision);

  assert.equal(preview.valid, true, preview.warning || 'focused acceleration preview should be valid');
  assert.equal(live.accepted, true, live.reason || 'focused acceleration decision should be accepted');
  assert.equal(preview.alternative.spend.acceleratedInvestment, 6);
  assert.deepEqual(preview.alternative.decision.accelerationAllocations, decision.accelerationAllocations);
  assert.deepEqual(live.decision.accelerationAllocations, { demand: 100 });
  assert.equal(preview.alternative.initiativeStates.demand.totalInvestment, live.nextState.initiativeStates.demand.totalInvestment);
  assert.equal(preview.alternative.initiativeStates.energy.totalInvestment, live.nextState.initiativeStates.energy.totalInvestment);
  assert.deepEqual(live.nextState.history[0].accelerationAllocations, decision.accelerationAllocations);
});

test('preview includes continuity commitments and rejects an underfunded plan', () => {
  const state = initialGameState(undefined, { campaignBudget: 24, quarterlyBudget: 2 });
  state.initiativeStates.energy = { ...state.initiativeStates.energy, quartersFunded: 2, currentCost: 2 };
  const result = previewStrategy(state, { selected: ['demand'], alloc: allocation, deploymentAmount: 1.5 });
  assert.equal(result.valid, false);
  assert.match(result.warning, /continuity/);
  assert.ok(result.alternative.spend.portfolioCost < state.initiativeStates.demand.currentCost);
  assert.ok(result.alternative.initiativeStates.energy.continuityInvestment >= 0);
  assert.equal(result.alternative.initiativeStates.energy.quartersSinceLastFund, 0);
});

test('action-aware preview matches the live resolver for the same lifecycle decision', () => {
  const scenario = getScenario('projectFactory');
  const state = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: scenario.id,
    quarterlyBudget: scenario.startingState.budget,
    campaignBudget: scenario.startingState.budget * 12,
    defaultAllocation: scenario.startingState.defaultAllocation,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
    startingMetrics: scenario.startingState.startingMetrics,
  });
  state.initiativeStates = scenarioInitiativesToStates(scenario.initiatives);
  const initiative = scenario.initiatives[0];
  state.initiativeStates[initiative.id] = {
    ...state.initiativeStates[initiative.id],
    aiLifecycle: { ...state.initiativeStates[initiative.id].aiLifecycle, stage: 'experiment', stageStartedAt: 0, stageStatus: 'in_progress' },
  };
  const initiativeActions = { [initiative.id]: 'pilot' };
  const deploymentAmount = state.initiativeStates[initiative.id].currentCost * .6;
  const decision = { selected: [initiative.id], initiativeActions, alloc: state.alloc, deploymentAmount };
  const preview = previewStrategy(state, decision);
  const live = applyTurnDecision(state, decision);
  assert.equal(live.accepted, true);
  assert.deepEqual(preview.alternative.scenarioMetrics, live.nextState.scenarioState.metrics);
  assert.equal(preview.alternative.initiativeStates[initiative.id].lifecycle, live.nextState.initiativeStates[initiative.id].lifecycle);
  assert.deepEqual(preview.alternative.decision.initiativeActions, initiativeActions);
});

test('custom operating allocations flow through preview and What-If drafts', () => {
  const scenario = getScenario('projectFactory');
  const state = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: scenario.id,
    quarterlyBudget: scenario.startingState.budget,
    campaignBudget: scenario.startingState.budget * 12,
    defaultAllocation: scenario.startingState.defaultAllocation,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
    startingMetrics: scenario.startingState.startingMetrics,
  });
  state.initiativeStates = scenarioInitiativesToStates(scenario.initiatives);
  const initiative = scenario.initiatives[0];
  state.initiativeStates[initiative.id] = {
    ...state.initiativeStates[initiative.id],
    aiLifecycle: { ...state.initiativeStates[initiative.id].aiLifecycle, stage: 'experiment', stageStartedAt: 0, stageStatus: 'in_progress' },
  };
  const initiativeActions = { [initiative.id]: 'pilot' };
  const localAllocation = { infra: 30, data: 25, people: 18, mlops: 10, compliance: 12, innovation: 5 };
  const decision = {
    selected: [initiative.id],
    initiativeActions,
    alloc: state.alloc,
    initiativeAllocationMode: 'custom',
    initiativeAllocations: { [initiative.id]: localAllocation },
    deploymentAmount: state.initiativeStates[initiative.id].currentCost * .8,
  };
  const preview = previewStrategy(state, decision);
  const live = applyTurnDecision(state, decision);
  assert.equal(live.accepted, true);
  assert.deepEqual(preview.alternative.scenarioMetrics, live.nextState.scenarioState.metrics);
  assert.deepEqual(preview.alternative.initiativeStates, live.nextState.initiativeStates);
  assert.equal(preview.alternative.decision.initiativeAllocationMode, 'custom');
  assert.deepEqual(preview.alternative.decision.initiativeAllocations, { [initiative.id]: localAllocation });

  const draft = normalizeWhatIfDraft({
    selected: [initiative.id],
    alloc: state.alloc,
    initiativeAllocationMode: 'custom',
    initiativeAllocations: { [initiative.id]: localAllocation },
    accelerationAllocationMode: 'focused',
    accelerationAllocations: { [initiative.id]: 100 },
  });
  assert.equal(draft.initiativeAllocationMode, 'custom');
  assert.deepEqual(draft.initiativeAllocations[initiative.id], localAllocation);
  assert.equal(draft.accelerationAllocationMode, 'focused');
  assert.deepEqual(draft.accelerationAllocations, { [initiative.id]: 100 });
});
