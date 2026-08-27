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

const { getScenario } = require('../lib/scenarios/registry.ts');
const { defaultLifecycleProfile } = require('../lib/scenarios/scenarioHelpers.ts');
const { scenarioInitiativesToStates } = require('../lib/game/initiativeAdapter.ts');
const { initialGameState } = require('../lib/game/state.ts');
const { applyTurnDecision, advanceTurn } = require('../lib/game/turnResolver.ts');
const { applyAdaptation, applyDeploymentMode, applyLifecycleReview, normalizeLifecycleReviewInput, recordEvaluationEvidence, suggestedLifecycleAction, lifecycleActionError } = require('../lib/game/lifecycleResolver.ts');
const {
  COUNTERFACTUAL_TRACE_VERSION,
  createCounterfactualTrace,
  recordDecision,
  recordLifecycleDecisions,
  replayCounterfactual,
} = require('../lib/counterfactual.ts');
const { allocationTotal, rebalanceOperatingAllocation } = require('../lib/game/initiativeAllocation.ts');

const allocation = { infra: 35, data: 25, people: 15, mlops: 10, compliance: 10, innovation: 5 };

test('shared and tailored allocation changes rebalance the full 100% mix', () => {
  const next = rebalanceOperatingAllocation(allocation, 'data', 40);
  assert.equal(allocationTotal(next), 100);
  assert.equal(next.data, 40);
  assert.ok(Object.keys(allocation).filter((key) => key !== 'data' && next[key] !== allocation[key]).length > 1);
});

test('every scenario initiative receives a stable AI lifecycle profile', () => {
  for (const id of ['projectFactory', 'bankNext', 'care360', 'futureReady']) {
    const scenario = getScenario(id);
    assert.ok(scenario.initiatives?.length, `${id} has initiatives`);
    const states = scenarioInitiativesToStates(scenario.initiatives);
    for (const initiative of scenario.initiatives) {
      const profile = states[initiative.id].scenarioMetadata.lifecycleProfile;
      assert.ok(profile, `${id}/${initiative.id} has lifecycle profile`);
      assert.ok(profile.dataReadiness >= 0 && profile.dataReadiness <= 100);
      assert.ok(profile.evaluation.criteria.length >= 1);
      assert.ok(profile.deployment.modes.augmentation);
      assert.ok(profile.deployment.modes.automation);
      assert.ok(profile.drift.quarterlyRate >= 0);
      assert.ok(profile.oversight.baseUnits >= 1);
    }
  }
});

test('high-stakes profiles author safer deployment choices and concrete evaluation criteria', () => {
  const factory = getScenario('projectFactory');
  const factoryStates = scenarioInitiativesToStates(factory.initiatives);
  const maintenance = factoryStates.maintenance.scenarioMetadata.lifecycleProfile;
  assert.equal(maintenance.deployment.defaultMode, 'augmentation');
  assert.equal(maintenance.flywheel.active, true);
  assert.deepEqual(maintenance.flywheel.recipientIds, ['quality', 'energy']);

  const care = getScenario('care360');
  const careStates = scenarioInitiativesToStates(care.initiatives);
  const radiology = careStates.radiologyAssistant.scenarioMetadata.lifecycleProfile;
  assert.equal(radiology.autonomy, 'advisory');
  assert.equal(radiology.deployment.modes.automation.riskDelta, 20);
  assert.ok(radiology.evaluation.criteria.some((criterion) => criterion.id === 'clinician-safety'));
});

test('authored readiness stays aligned with the persistent 1–5 data asset', () => {
  const factory = getScenario('projectFactory');
  const states = scenarioInitiativesToStates(factory.initiatives);
  const maintenance = states.maintenance;
  assert.equal(maintenance.currentData, maintenance.dataReadiness / 20);
  assert.equal(maintenance.baseData, maintenance.currentData);
});

test('generic lower-is-better outcomes retain a modest negative pilot movement target', () => {
  const profile = defaultLifecycleProfile({ baseEffect: -8, primaryMetric: 'downtime pressure', risk: 'MED', data: 3, human: 2 });
  assert.equal(profile.evaluation.criteria[0].direction, 'lower-is-better');
  assert.equal(profile.evaluation.criteria[0].threshold, -1.6);
});

test('scenario capabilities cannot skip directly from data readiness to pilot or deployment', () => {
  const scenario = getScenario('projectFactory');
  const state = {
    ...initialGameState(),
    scenarioMode: true,
    scenarioId: scenario.id,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    selected: ['maintenance'],
  };
  const maintenance = state.initiativeStates.maintenance;
  assert.equal(suggestedLifecycleAction(maintenance, state.q), 'discover');
  const pilot = applyTurnDecision(state, {
    selected: ['maintenance'], initiativeActions: { maintenance: 'pilot' }, alloc: allocation, deploymentAmount: state.deploymentAmount,
  });
  assert.equal(pilot.accepted, false);
  assert.match(pilot.reason, /discovery and experiment/i);
  const scale = applyTurnDecision(state, {
    selected: ['maintenance'], initiativeActions: { maintenance: 'scale' }, alloc: allocation, deploymentAmount: state.deploymentAmount,
  });
  assert.equal(scale.accepted, false);
  assert.match(scale.reason, /evaluation is required/i);
});

test('scenario authors can require more than one experiment quarter before pilot', () => {
  const maintenance = scenarioInitiativesToStates(getScenario('projectFactory').initiatives).maintenance;
  const experiment = {
    ...maintenance,
    lifecycleProfile: { ...maintenance.lifecycleProfile, experimentQuarters: 2 },
    aiLifecycle: { ...maintenance.aiLifecycle, stage: 'experiment', stageStartedAt: 1, stageStatus: 'in_progress' },
  };
  assert.equal(suggestedLifecycleAction(experiment, 2), 'discover');
  assert.match(lifecycleActionError(experiment, 'pilot', 2), /required discovery and experiment period/i);
  assert.equal(suggestedLifecycleAction(experiment, 3), 'pilot');
  assert.equal(lifecycleActionError(experiment, 'pilot', 3), undefined);
});

test('blank evaluation context never blocks progress and is retained as No Entry', () => {
  const decision = applyTurnDecision(initialGameState(), {
    selected: ['demand'], initiativeActions: { demand: 'discover' }, alloc: allocation, deploymentAmount: 1,
  });
  assert.equal(decision.accepted, true);
  const base = decision.nextState;
  const state = {
    ...base,
    initiativeStates: {
      ...base.initiativeStates,
      demand: { ...base.initiativeStates.demand, aiLifecycle: { ...base.initiativeStates.demand.aiLifecycle, stage: 'evaluate', stageStatus: 'in_progress' } },
    },
  };
  const normalized = normalizeLifecycleReviewInput({ initiativeId: 'demand', decision: 'go', rationale: '  ', owner: '' });
  assert.deepEqual(normalized, { initiativeId: 'demand', decision: 'go', rationale: 'No Entry', owner: 'No Entry' });
  const reviewed = applyLifecycleReview(state, normalized);
  assert.equal(reviewed.initiativeStates.demand.evaluation.decisionRationale, 'No Entry');
  assert.equal(reviewed.initiativeStates.demand.evaluation.decisionOwner, 'No Entry');
  assert.equal(reviewed.history.at(-1).evaluationDecisions[0].rationale, 'No Entry');
  assert.equal(reviewed.history.at(-1).evaluationDecisions[0].owner, 'No Entry');
});

test('counterfactual traces preserve lifecycle actions and learner decisions', () => {
  let state = initialGameState();
  const decision = {
    selected: ['demand'],
    initiativeActions: { demand: 'pilot', energy: 'pause' },
    alloc: allocation,
    deploymentAmount: state.deploymentAmount,
  };
  const resolution = applyTurnDecision(state, decision);
  assert.equal(resolution.accepted, true);
  let trace = createCounterfactualTrace(state);
  trace = recordDecision(trace, {
    type: 'decision',
    q: 1,
    ...decision,
    evaluationDecisions: [{ initiativeId: 'demand', decision: 'pause', rationale: 'Need one more seasonal cycle.', owner: 'COO' }],
    deploymentDecisions: [{ initiativeId: 'demand', mode: 'augmentation', rationale: 'Keep planners accountable.' }],
    adaptationDecisions: [{ initiativeId: 'energy', action: 'tune', reason: 'Telemetry is noisy.' }],
  });
  assert.equal(trace.version, COUNTERFACTUAL_TRACE_VERSION);
  assert.deepEqual(trace.actions[0].initiativeActions, decision.initiativeActions);
  assert.equal(trace.actions[0].evaluationDecisions[0].owner, 'COO');

  const replay = replayCounterfactual(trace, {
    q: 1,
    selected: ['demand'],
    alloc: allocation,
    deploymentAmount: state.deploymentAmount,
  });
  assert.equal(replay.status, 'blocked');
  assert.deepEqual(replay.state.history[0].initiativeActions, decision.initiativeActions);
});

test('version 1 traces remain replayable after the lifecycle schema bump', () => {
  const state = initialGameState();
  const decision = { selected: ['demand'], alloc: allocation, deploymentAmount: state.deploymentAmount };
  const result = applyTurnDecision(state, decision);
  assert.equal(result.accepted, true);
  const current = recordDecision(createCounterfactualTrace(state), { type: 'decision', q: 1, ...decision });
  const legacy = { ...current, version: 1 };
  const replay = replayCounterfactual(legacy, { q: 1, ...decision });
  assert.equal(replay.status, 'blocked');
  assert.equal(replay.appliedThroughQuarter, 1);
});

test('tailored initiative operating mixes change individual effects and replay exactly', () => {
  const state = { ...initialGameState(), selected: ['demand', 'energy'] };
  const decision = {
    selected: ['demand', 'energy'],
    initiativeActions: { demand: 'scale', energy: 'scale' },
    alloc: allocation,
    deploymentAmount: state.deploymentAmount,
  };
  const shared = applyTurnDecision(state, decision);
  assert.equal(shared.accepted, true, shared.accepted ? '' : shared.reason);
  const initiativeAllocations = {
    demand: { infra: 20, data: 5, people: 40, mlops: 10, compliance: 15, innovation: 10 },
    energy: { infra: 15, data: 50, people: 10, mlops: 10, compliance: 10, innovation: 5 },
  };
  const tailored = applyTurnDecision(state, { ...decision, initiativeAllocationMode: 'custom', initiativeAllocations });
  assert.equal(tailored.accepted, true, tailored.accepted ? '' : tailored.reason);
  assert.ok(tailored.nextState.initiativeStates.energy.currentData > shared.nextState.initiativeStates.energy.currentData);
  assert.ok(tailored.nextState.initiativeStates.demand.changeReadiness > shared.nextState.initiativeStates.demand.changeReadiness);
  assert.equal(tailored.nextState.history[0].allocationMode, 'custom');
  assert.deepEqual(tailored.nextState.history[0].initiativeAllocations, initiativeAllocations);

  const trace = recordDecision(createCounterfactualTrace(state), { type: 'decision', q: 1, ...tailored.decision });
  const replay = replayCounterfactual(trace, { q: 1, ...decision });
  assert.equal(replay.status, 'blocked');
  assert.deepEqual(replay.state.history[0].initiativeAllocations, initiativeAllocations);
  assert.equal(JSON.stringify(replay.state.history[0].initiativeStates), JSON.stringify(tailored.nextState.history[0].initiativeStates));
});

test('lifecycle reviews update the recorded quarter instead of creating a second decision', () => {
  const state = initialGameState();
  const decision = { selected: ['demand'], alloc: allocation, deploymentAmount: state.deploymentAmount };
  const trace = recordDecision(createCounterfactualTrace(state), { type: 'decision', q: 1, ...decision });
  const updated = recordLifecycleDecisions(trace, 1, {
    evaluationDecisions: [{ initiativeId: 'demand', decision: 'go', rationale: 'Pilot evidence is sufficient.', owner: 'COO' }],
  });
  assert.equal(updated.version, COUNTERFACTUAL_TRACE_VERSION);
  assert.equal(updated.actions.filter((action) => action.type === 'decision' && action.q === 1).length, 1);
  assert.equal(updated.actions[0].evaluationDecisions[0].decision, 'go');
});

test('the operating lifecycle requires pilot evidence, records deployment mode, and charges adaptation capital', () => {
  let state = initialGameState();
  const decide = (initiativeActions) => {
    const result = applyTurnDecision(state, {
      selected: ['demand'],
      initiativeActions,
      alloc: allocation,
      deploymentAmount: state.deploymentAmount,
    });
    assert.equal(result.accepted, true, result.accepted ? '' : result.reason);
    state = result.nextState;
  };

  decide({ demand: 'discover' });
  assert.equal(state.initiativeStates.demand.aiLifecycle.stage, 'experiment');
  state = advanceTurn(state);

  decide({ demand: 'pilot' });
  assert.equal(state.initiativeStates.demand.aiLifecycle.stage, 'pilot');
  state = advanceTurn(state);

  decide({ demand: 'pilot' });
  assert.equal(state.initiativeStates.demand.aiLifecycle.stage, 'evaluate');

  state = applyLifecycleReview(state, {
    initiativeId: 'demand', decision: 'go', rationale: 'Pilot evidence is sufficient to use a bounded deployment.', owner: 'COO',
  });
  state = applyDeploymentMode(state, {
    initiativeId: 'demand', mode: 'automation', rationale: 'Forecast publication remains reversible and bounded.',
  });
  assert.equal(state.history.at(-1).evaluationDecisions[0].owner, 'COO');
  assert.equal(state.history.at(-1).deploymentDecisions[0].mode, 'automation');
  assert.equal(state.initiativeStates.demand.deploymentImpact.efficiencyDelta, 12);
  state = advanceTurn(state);

  decide({ demand: 'scale' });
  assert.equal(state.initiativeStates.demand.aiLifecycle.stage, 'deploy');
  assert.equal(state.initiativeStates.demand.aiLifecycle.stageStatus, 'completed');
  state.initiativeStates.demand.monitoring = { ...state.initiativeStates.demand.monitoring, drift: 60, performance: 45, isDegraded: true, actionAvailable: true };
  state.initiativeStates.demand.retrainingCost = 0.5;
  const spentBeforeAdaptation = state.spent;
  state = applyAdaptation(state, { initiativeId: 'demand', action: 'retrain', reason: 'Measured forecast performance has degraded.' });
  assert.equal(state.spent, spentBeforeAdaptation + 0.5);
  assert.equal(state.initiativeStates.demand.monitoring.isDegraded, false);
  assert.equal(state.history.at(-1).adaptationDecisions[0].action, 'retrain');
});

test('evaluation evidence respects lower-is-better criteria and derives a recommendation', () => {
  const states = scenarioInitiativesToStates(getScenario('projectFactory').initiatives);
  states.maintenance.aiLifecycle = { ...states.maintenance.aiLifecycle, stage: 'evaluate', stageStatus: 'in_progress' };
  const evaluated = recordEvaluationEvidence(states, { downtimePressure: 65 }, { downtimePressure: 62 });
  const criterion = evaluated.maintenance.evaluation.successCriteria.find((item) => item.id === 'downtime-signal');
  assert.equal(criterion.actual, -3);
  assert.equal(criterion.met, true);
  assert.ok(['go', 'go_with_conditions', 'no_go'].includes(evaluated.maintenance.evaluation.recommendedDecision));
});

test('evaluation separates pilot evidence from full ROI and honours mandatory safety checks', () => {
  const states = scenarioInitiativesToStates(getScenario('projectFactory').initiatives);
  const maintenance = states.maintenance;
  maintenance.aiLifecycle = { ...maintenance.aiLifecycle, stage: 'evaluate', stageStatus: 'in_progress' };
  maintenance.lifecycleProfile = {
    ...(maintenance.lifecycleProfile || {}),
    evaluation: { goThreshold: 1, conditionalThreshold: .5 },
  };
  maintenance.evaluation.successCriteria = [
    { id: 'directional', label: 'Directional pilot signal', metric: 'downtimePressure', threshold: -2, direction: 'lower-is-better', actual: 0, met: false, kind: 'outcome' },
    { id: 'safety', label: 'Safety and control evidence', metric: 'safetyEvidence', threshold: 20, direction: 'higher-is-better', actual: 0, met: false, kind: 'safety', required: true },
    { id: 'full-readiness', label: 'Full production readiness', metric: 'operationalEvidence', threshold: 99, direction: 'higher-is-better', actual: 0, met: false, kind: 'evidence' },
  ];
  const conditional = recordEvaluationEvidence(states, { downtimePressure: 65 }, { downtimePressure: 62 });
  assert.equal(conditional.maintenance.evaluation.successCriteria.find((item) => item.id === 'directional').met, true);
  assert.equal(conditional.maintenance.evaluation.successCriteria.find((item) => item.id === 'safety').met, true);
  assert.equal(conditional.maintenance.evaluation.recommendedDecision, 'go_with_conditions');

  const blocked = { ...conditional, maintenance: { ...conditional.maintenance, evaluation: { ...conditional.maintenance.evaluation, successCriteria: conditional.maintenance.evaluation.successCriteria.map((criterion) => criterion.id === 'safety' ? { ...criterion, threshold: 99 } : criterion) } } };
  const safetyBlocked = recordEvaluationEvidence(blocked, { downtimePressure: 65 }, { downtimePressure: 62 });
  assert.equal(safetyBlocked.maintenance.evaluation.recommendedDecision, 'no_go');
});
