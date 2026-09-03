const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Keep this test runnable with the same lightweight TypeScript require hook as
// the rest of the repository's CommonJS test suite.
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
const scenarioHelpers = require('../lib/scenarios/scenarioHelpers.ts');
const { scenarioInitiativesToStates } = require('../lib/game/initiativeAdapter.ts');
const { initialGameState } = require('../lib/game/state.ts');
const { previewStrategy } = require('../lib/game/strategyPreview.ts');

const LEVERS = ['infra', 'data', 'people', 'mlops', 'compliance', 'innovation'];
// Profiles may key effects by the learner-facing action lifecycle or by the
// fuller AI lifecycle overlay. Both are valid as long as they use known stage
// names and bounded lever weights.
const STAGES = ['discover', 'pilot', 'scale', 'maintain', 'pause', 'retire', 'data_readiness', 'experiment', 'evaluate', 'deploy', 'monitor', 'adapt'];
const SCENARIOS = ['projectFactory', 'bankNext', 'care360', 'futureReady'];

function resolver() {
  const resolve = scenarioHelpers.resolveOperatingProfile || scenarioHelpers.defaultOperatingProfile;
  assert.equal(typeof resolve, 'function', 'scenarioHelpers must export resolveOperatingProfile or defaultOperatingProfile');
  return resolve;
}

function assertProfileShape(profile, label) {
  assert.ok(profile && typeof profile === 'object', `${label} resolves an operating profile`);
  assert.equal(profile.revision, 1, `${label} uses operating profile revision 1`);
  assert.ok(Array.isArray(profile.bottleneckOrder) && profile.bottleneckOrder.length > 0, `${label} has a bottleneck order`);
  assert.equal(new Set(profile.bottleneckOrder).size, profile.bottleneckOrder.length, `${label} bottleneck order has no duplicates`);
  profile.bottleneckOrder.forEach((lever) => assert.ok(LEVERS.includes(lever), `${label} uses a known operating lever: ${lever}`));

  assert.ok(profile.stageWeights && typeof profile.stageWeights === 'object', `${label} has stage-aware weights`);
  for (const [stage, weights] of Object.entries(profile.stageWeights)) {
    assert.ok(STAGES.includes(stage), `${label} uses a known lifecycle stage: ${stage}`);
    assert.ok(weights && typeof weights === 'object', `${label}/${stage} has a weight map`);
    for (const [lever, value] of Object.entries(weights)) {
      assert.ok(LEVERS.includes(lever), `${label}/${stage} uses a known operating lever: ${lever}`);
      assert.ok(Number.isFinite(Number(value)), `${label}/${stage}/${lever} is finite`);
      assert.ok(Number(value) >= 0 && Number(value) <= 100, `${label}/${stage}/${lever} is bounded 0..100`);
    }
    const total = Object.values(weights).reduce((sum, value) => sum + Number(value), 0);
    assert.ok(Math.abs(total - 100) < 0.01, `${label}/${stage} weights total 100%`);
  }

  assert.ok(profile.capacitySensitivity && typeof profile.capacitySensitivity === 'object', `${label} has capacity sensitivity`);
  for (const key of ['integration', 'delivery', 'change', 'data', 'governance']) {
    const value = Number(profile.capacitySensitivity[key]);
    assert.ok(Number.isFinite(value), `${label} capacity sensitivity ${key} is finite`);
    assert.ok(value >= 0 && value <= 1, `${label} capacity sensitivity ${key} is bounded 0..1`);
  }
}

test('every current scenario initiative receives a valid operating profile', () => {
  for (const scenarioId of SCENARIOS) {
    const scenario = getScenario(scenarioId);
    assert.ok(scenario?.initiatives?.length, `${scenarioId} has initiatives`);
    const states = scenarioInitiativesToStates(scenario.initiatives);
    for (const initiative of scenario.initiatives) {
      const profile = states[initiative.id]?.scenarioMetadata?.operatingProfile;
      assertProfileShape(profile, `${scenarioId}/${initiative.id}`);
    }
  }
});

test('omitted operating-profile authoring receives deterministic future-safe defaults', () => {
  const resolve = resolver();
  const initiative = {
    id: 'futureInitiative',
    name: 'Future Initiative',
    desc: 'A future scenario-pack initiative.',
    cost: 1.2,
    roi: 140,
    risk: 'MED',
    data: 3,
    human: 3,
    impact: 'Improves the operating baseline.',
    baseEffect: -6,
    primaryMetric: 'futurePressure',
    effectUnit: 'index points',
  };
  const first = resolve(initiative);
  const second = resolve({ ...initiative });
  assert.deepEqual(first, second, 'the same omitted profile resolves identically');
  assertProfileShape(first, 'futureInitiative');
});

test('profile resolution preserves authored operating overrides while filling omitted stages safely', () => {
  const resolve = resolver();
  const initiative = {
    id: 'profileOverride',
    name: 'Profile Override',
    desc: 'An initiative with a deliberately authored operating profile.',
    cost: 1,
    roi: 150,
    risk: 'HIGH',
    data: 4,
    human: 4,
    impact: 'Improves a high-stakes outcome.',
    baseEffect: 5,
    primaryMetric: 'safetySignal',
    effectUnit: 'index points',
    operatingProfile: {
      revision: 1,
      bottleneckOrder: ['compliance', 'people', 'data'],
      stageWeights: { pilot: { compliance: 70, people: 20, data: 10 } },
      capacitySensitivity: { integration: 0.2, delivery: 0.3, change: 0.4, data: 0.5, governance: 0.9 },
    },
  };
  const profile = resolve(initiative);
  assertProfileShape(profile, 'profileOverride');
  assert.deepEqual(profile.bottleneckOrder.slice(0, 3), ['compliance', 'people', 'data']);
  assert.ok(profile.stageWeights.pilot.compliance > profile.stageWeights.pilot.people);
  assert.ok(profile.stageWeights.pilot.people > profile.stageWeights.pilot.data);
  assert.equal(profile.capacitySensitivity.governance, 0.9);
});

test('strategy preview preserves a custom initiative allocation for parity with confirmation', () => {
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
  const customAllocation = { infra: 30, data: 25, people: 18, mlops: 10, compliance: 12, innovation: 5 };
  const result = previewStrategy(state, {
    selected: [initiative.id],
    initiativeActions: { [initiative.id]: 'discover' },
    alloc: state.alloc,
    deploymentAmount: state.initiativeStates[initiative.id].currentCost,
    initiativeAllocationMode: 'custom',
    initiativeAllocations: { [initiative.id]: customAllocation },
  });
  assert.equal(result.alternative.decision.initiativeAllocationMode, 'custom');
  assert.deepEqual(result.alternative.decision.initiativeAllocations[initiative.id], customAllocation);
});
