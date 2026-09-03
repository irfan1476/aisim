const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Keep this focused suite runnable with the repository's dependency-light
// CommonJS TypeScript hook. It imports the live scenario adapter, preview, and
// turn resolver so these assertions cannot drift into a second rules engine.
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
const { scenarioInitiativesToStates } = require('../lib/game/initiativeAdapter.ts');
const { initialGameState } = require('../lib/game/state.ts');
const { applyTurnDecision } = require('../lib/game/turnResolver.ts');
const { previewStrategy } = require('../lib/game/strategyPreview.ts');

const LEVERS = ['infra', 'data', 'people', 'mlops', 'compliance', 'innovation'];
const BASE_ALLOCATION = { infra: 25, data: 25, people: 20, mlops: 15, compliance: 10, innovation: 5 };

function createScenarioState(scenarioId = 'projectFactory') {
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
  return state;
}

function experimentReady(state, initiativeId) {
  return {
    ...state,
    initiativeStates: {
      ...state.initiativeStates,
      [initiativeId]: {
        ...state.initiativeStates[initiativeId],
        aiLifecycle: {
          ...state.initiativeStates[initiativeId].aiLifecycle,
          stage: 'experiment',
          stageStartedAt: 0,
          stageStatus: 'in_progress',
        },
      },
    },
  };
}

function allocationWithMore(lever, points = 5) {
  const next = { ...BASE_ALLOCATION };
  const donor = lever === 'infra' ? 'innovation' : 'infra';
  next[lever] += points;
  next[donor] -= points;
  return next;
}

function pilotDecision(state, allocation = BASE_ALLOCATION) {
  const initiativeId = getScenario(state.scenarioId).initiatives[0].id;
  const prepared = experimentReady(state, initiativeId);
  const decision = {
    selected: [initiativeId],
    initiativeActions: { [initiativeId]: 'pilot' },
    alloc: prepared.alloc,
    initiativeAllocationMode: 'custom',
    initiativeAllocations: { [initiativeId]: allocation },
    deploymentAmount: prepared.initiativeStates[initiativeId].currentCost * 0.6,
  };
  return { prepared, initiativeId, decision, result: applyTurnDecision(prepared, decision) };
}

function stateDigest(result, initiativeId) {
  assert.equal(result.accepted, true);
  const snapshot = result.nextState.history.at(-1);
  return {
    native: {
      roi: result.nextState.roi,
      efficiency: result.nextState.efficiency,
      adoption: result.nextState.adoption,
      risk: result.nextState.risk,
      data: result.nextState.data,
    },
    scenario: result.nextState.scenarioState,
    initiative: {
      currentData: result.nextState.initiativeStates[initiativeId].currentData,
      changeReadiness: result.nextState.initiativeStates[initiativeId].changeReadiness,
      controlMaturity: result.nextState.initiativeStates[initiativeId].controlMaturity,
      technicalDebt: result.nextState.initiativeStates[initiativeId].technicalDebt,
    },
    allocation: snapshot.initiativeAllocations?.[initiativeId],
  };
}

test('operating profiles expose all six levers across distinct lifecycle stages for every scenario', () => {
  for (const scenarioId of ['projectFactory', 'bankNext', 'care360', 'futureReady']) {
    const scenario = getScenario(scenarioId);
    const states = scenarioInitiativesToStates(scenario.initiatives);
    for (const initiative of scenario.initiatives) {
      const profile = states[initiative.id].scenarioMetadata.operatingProfile;
      assert.ok(profile, `${scenarioId}/${initiative.id} has an operating profile`);
      assert.deepEqual([...new Set(profile.bottleneckOrder)].sort(), [...LEVERS].sort());
      for (const [stage, weights] of Object.entries(profile.stageWeights)) {
        assert.deepEqual(Object.keys(weights).sort(), [...LEVERS].sort(), `${scenarioId}/${initiative.id}/${stage} covers every lever`);
        assert.equal(Number(Object.values(weights).reduce((sum, value) => sum + Number(value), 0).toFixed(2)), 100);
      }
      assert.notDeepEqual(profile.stageWeights.discover, profile.stageWeights.deploy, `${scenarioId}/${initiative.id} changes emphasis as work matures`);
    }
  }
});

test('custom operating mix has exact preview/live parity and remains learner-controlled', () => {
  const state = createScenarioState();
  const { prepared, initiativeId, decision, result } = pilotDecision(state, { infra: 30, data: 25, people: 18, mlops: 10, compliance: 12, innovation: 5 });
  assert.equal(result.accepted, true);
  const preview = previewStrategy(prepared, decision);
  assert.equal(preview.valid, true);
  assert.deepEqual(preview.alternative.scenarioMetrics, result.nextState.scenarioState.metrics);
  assert.deepEqual(preview.alternative.initiativeStates, result.nextState.initiativeStates);
  assert.deepEqual(preview.alternative.decision.initiativeAllocations[initiativeId], decision.initiativeAllocations[initiativeId]);
  assert.deepEqual(result.nextState.history.at(-1).initiativeAllocations[initiativeId], decision.initiativeAllocations[initiativeId]);
});

test('the same seed, lifecycle action, and six-lever mix produce identical evidence and outcomes', () => {
  const first = pilotDecision(createScenarioState(), BASE_ALLOCATION);
  const second = pilotDecision(createScenarioState(), BASE_ALLOCATION);
  assert.deepEqual(stateDigest(first.result, first.initiativeId), stateDigest(second.result, second.initiativeId));
  assert.deepEqual(first.result.nextState.history.at(-1), second.result.nextState.history.at(-1));
});

test('each operating lever produces an attributable learner-facing signal in the resolved quarter', () => {
  const baseline = pilotDecision(createScenarioState(), BASE_ALLOCATION);
  const baselineSnapshot = baseline.result.nextState.history.at(-1);
  const baselineEvidence = baselineSnapshot.operatingEvidence;
  assert.ok(baselineEvidence, 'the resolved quarter records operating evidence for the learner');
  const entries = Array.isArray(baselineEvidence) ? baselineEvidence : [baselineEvidence];
  const evidence = entries.find((item) => item.initiativeId === baseline.initiativeId);
  assert.ok(evidence, 'operating evidence identifies the selected initiative');
  assert.equal(evidence.action, 'pilot');
  assert.deepEqual(evidence.localAllocation, BASE_ALLOCATION);
  assert.ok(evidence.effectivePortfolioAllocation);
  assert.equal(Object.keys(evidence.effectivePortfolioAllocation).length, LEVERS.length);
  assert.ok(LEVERS.includes(evidence.bottleneck));
  assert.ok(evidence.signals && typeof evidence.signals === 'object');
  assert.ok(Array.isArray(evidence.outcomeEffects));
  assert.ok(Array.isArray(evidence.tradeOffs));

  for (const lever of LEVERS) {
    const changed = pilotDecision(createScenarioState(), allocationWithMore(lever));
    assert.equal(changed.result.accepted, true, `${lever} allocation remains executable`);
    const changedEvidenceRaw = changed.result.nextState.history.at(-1).operatingEvidence;
    const changedEntries = Array.isArray(changedEvidenceRaw) ? changedEvidenceRaw : [changedEvidenceRaw];
    const changedEvidence = changedEntries.find((item) => item?.initiativeId === changed.initiativeId);
    assert.ok(changedEvidence, `${lever} change is recorded against the initiative`);
    const signal = changedEvidence.signals?.[lever];
    assert.ok(signal && Number.isFinite(Number(signal.delta)), `${lever} exposes a numeric attributable delta`);
    assert.notEqual(Number(signal.delta), 0, `${lever} changes at least one learner-facing signal`);
  }
});

test('discovery creates evidence and investment history but never fake realised ROI', () => {
  const state = createScenarioState();
  const initiativeId = getScenario(state.scenarioId).initiatives[0].id;
  const allocation = { ...BASE_ALLOCATION };
  const decision = {
    selected: [initiativeId],
    initiativeActions: { [initiativeId]: 'discover' },
    alloc: state.alloc,
    initiativeAllocationMode: 'custom',
    initiativeAllocations: { [initiativeId]: allocation },
    deploymentAmount: state.initiativeStates[initiativeId].currentCost * 0.2,
  };
  const before = state.initiativeStates[initiativeId];
  const result = applyTurnDecision(state, decision);
  assert.equal(result.accepted, true);
  const after = result.nextState.initiativeStates[initiativeId];
  assert.deepEqual(result.nextState.scenarioState.metrics, state.scenarioState.metrics);
  assert.equal(result.nextState.roi, state.roi);
  assert.equal(result.nextState.revenue, state.revenue);
  assert.equal(result.nextState.financialLedger.grossBenefit, 0);
  assert.ok(after.dataInvestment > before.dataInvestment, 'discovery builds durable evidence');
  assert.equal(after.quartersInvested, 1, 'discovery is recorded as an investment quarter');
  assert.ok(after.totalInvestment > 0, 'discovery spend is attributed to the initiative');
  assert.deepEqual(result.nextState.history.at(-1).discoveryIds, [initiativeId]);
});
