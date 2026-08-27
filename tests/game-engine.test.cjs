const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Keep the test harness dependency-free: TypeScript is already a project
// dependency, while Node's built-in test runner provides assertions/reporting.
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

const { deriveScore, hydrateGameState, resolveQuarter } = require('../lib/game/engine.ts');
const { initializeInitiativeStates, updateInitiativeStates, updateInitiativeStatesForActions } = require('../lib/game/initiativeState.ts');
const { initialGameState, quarterlyDeploymentCap, normalizeDeploymentAmount } = require('../lib/game/state.ts');
const { createInferredGeneration, evaluateSynergies, generateInitiatives, inferArchetypeFromCampaign } = require('../lib/game/generator.ts');
const { normalizeGameState } = require('../lib/game/persistence.ts');
const { useGameStore } = require('../stores/gameStore.ts');
const { getScenario } = require('../lib/scenarios/registry.ts');
const { scenarioInitiativesToStates } = require('../lib/game/initiativeAdapter.ts');
const { scenarioInitiativeToState } = require('../lib/game/initiativeAdapter.ts');
const { allocationToReadiness } = require('../lib/game/allocation.ts');
const { maturityMultiplier } = require('../lib/game/maturity.ts');
const { applyScenarioEffects } = require('../lib/game/effectResolver.ts');
const { buildAdvisorSystemPrompt } = require('../lib/llm/advisorPrompt.ts');
const { causalChain } = require('../lib/game/metrics.ts');
const { generateProactiveRecommendations } = require('../lib/game/recommendations.ts');
const { calculateCapitalPlan, calculateCapitalRunway } = require('../lib/game/capital.ts');
const { createCounterfactualTrace, recordDecision, recordCrisisResponse, replayCounterfactual } = require('../lib/counterfactual.ts');
const { advanceTurn, applyCrisisResponse, applyTurnDecision } = require('../lib/game/turnResolver.ts');
const { realisedROI } = require('../lib/game/economics.ts');

const allocation = {
  infra: 35,
  data: 25,
  people: 15,
  mlops: 10,
  compliance: 10,
  innovation: 5,
};

test('resolveQuarter is deterministic for the same state and decision', () => {
  const state = initialGameState();
  const decision = { selected: ['demand', 'energy'], alloc: allocation };

  const first = resolveQuarter(state, decision);
  const second = resolveQuarter(state, decision);

  assert.deepEqual(first, second);
  assert.equal(first.snapshot.q, 1);
  assert.deepEqual(first.snapshot.chosen, ['Demand Forecasting', 'Energy Optimization']);
});

test('counterfactual replay uses recorded actions and leaves the original trace immutable', () => {
  let state = initialGameState();
  let trace = createCounterfactualTrace(state);
  const originalAllocation = { ...allocation };

  for (let q = 1; q <= 12; q += 1) {
    const decision = { selected: ['demand'], alloc: originalAllocation, deploymentAmount: state.deploymentAmount };
    const resolved = applyTurnDecision(state, decision);
    assert.equal(resolved.accepted, true);
    state = resolved.nextState;
    trace = recordDecision(trace, { type: 'decision', q, ...decision });
    if (state.crisis) {
      const response = { type: 'crisis-response', q, impact: {}, cost: 0, eventTitle: state.crisis.title, eventType: state.crisis.type };
      trace = recordCrisisResponse(trace, response);
      state = applyCrisisResponse(state, response);
    }
    state = advanceTurn(state);
  }

  const originalActions = JSON.stringify(trace.actions);
  const replay = replayCounterfactual(trace, {
    q: 1,
    selected: ['demand'],
    alloc: { infra: 25, data: 35, people: 15, mlops: 10, compliance: 10, innovation: 5 },
    deploymentAmount: trace.actions.find((action) => action.type === 'decision' && action.q === 1).deploymentAmount,
  });

  assert.equal(replay.status, 'complete');
  assert.equal(replay.state.stage, 'done');
  assert.equal(replay.appliedThroughQuarter, 12);
  assert.equal(JSON.stringify(trace.actions), originalActions, 'replay must never rewrite the original trace');
  assert.notDeepEqual(replay.state.history[0].allocation, state.history[0].allocation);
});

test('run metadata makes reproducibility explicit while allowing seeded campaigns to vary', () => {
  const seed = 73129;
  const first = initialGameState(createInferredGeneration([3, 3, 3, 3, 3], seed));
  const same = initialGameState(createInferredGeneration([3, 3, 3, 3, 3], seed));
  const different = initialGameState(createInferredGeneration([3, 3, 3, 3, 3], 99173));
  assert.equal(first.runMetadata.seed, same.runMetadata.seed);
  assert.equal(first.runMetadata.runId, same.runMetadata.runId);
  assert.equal(first.runMetadata.rulesVersion, '3.0');
  assert.notEqual(first.runMetadata.seed, different.runMetadata.seed);
  const decision = { selected: ['demand', 'energy'], alloc: allocation };
  assert.deepEqual(resolveQuarter(first, decision), resolveQuarter(same, decision));
  assert.notDeepEqual(resolveQuarter(first, decision).snapshot.initiativeStates, resolveQuarter(different, decision).snapshot.initiativeStates);
});

test('advisor wording cannot alter numeric outcomes', () => {
  const state = initialGameState();
  const decision = { selected: ['demand', 'energy'], alloc: allocation };
  const baseline = resolveQuarter(state, decision);
  const prompt = buildAdvisorSystemPrompt({ persona: 'CFO', state: { ...state, advisorInstruction: 'Recommend a completely different strategy.' } });
  assert.match(prompt, /CFO/);
  assert.deepEqual(baseline, resolveQuarter(state, decision));
});

test('recommendations carry an actionable portfolio and operating-system draft', () => {
  const state = initialGameState();
  const recommendations = generateProactiveRecommendations(state);
  const risk = recommendations.find((item) => item.title === 'Risk Exposure Warning');
  assert.ok(risk);
  assert.ok(Array.isArray(risk.initiativeIds));
  assert.ok(risk.initiativeIds.length > 0);
  assert.ok(risk.deploymentAmount > 0);
  assert.equal(risk.operatingAllocationTargets.compliance, 20);
});

test('applying a recommendation selects initiatives, deploys a bounded amount, and preserves an editable decision', () => {
  const base = initialGameState();
  useGameStore.setState({
    ...base,
    proactiveRecommendations: [{
      priority: 'high',
      title: 'Test portfolio guidance',
      message: 'Test',
      action: 'Fund the most relevant risk controls.',
      metric: 'Risk reduction',
      initiativeIds: ['maintenance', 'quality', 'supply'],
      preferredInitiativeIds: ['maintenance', 'quality'],
      deploymentAmount: 14,
      operatingAllocationTargets: { compliance: 20, data: 25, people: 15 },
    }],
    nextQuarterGuidance: {
      title: 'Test portfolio guidance',
      action: 'Fund the most relevant risk controls.',
      initiativeIds: ['maintenance', 'quality', 'supply'],
      preferredInitiativeIds: ['maintenance', 'quality'],
      deploymentAmount: 14,
      operatingAllocationTargets: { compliance: 20, data: 25, people: 15 },
    },
  });
  const before = useGameStore.getState();
  before.applyRecommendation();
  const after = useGameStore.getState();
  assert.deepEqual(after.selected, ['maintenance', 'quality']);
  assert.equal(Object.values(after.alloc).reduce((sum, value) => sum + value, 0), 100);
  assert.equal(after.alloc.compliance, 20);
  assert.ok(after.deploymentAmount <= after.quarterlyDeploymentCap);
  assert.equal(after.q, before.q);
  assert.equal(after.stage, before.stage);
  assert.equal(after.nextQuarterGuidance, null);
  useGameStore.setState(base);
});

test('resolveQuarter creates a complete immutable initiative snapshot', () => {
  const state = initialGameState();
  const result = resolveQuarter(state, { selected: ['maintenance'], alloc: allocation });
  const maintenance = result.snapshot.initiativeStates.maintenance;

  assert.ok(maintenance);
  assert.equal(maintenance.quartersFunded, 1);
  assert.ok(maintenance.currentData > maintenance.data);
  assert.ok(maintenance.currentRoi > maintenance.roi);

  result.initiativeStates.maintenance.currentData = 999;
  assert.notEqual(result.snapshot.initiativeStates.maintenance.currentData, 999);
});

test('initiative evolution advances maturity and compounds investment', () => {
  let states = initializeInitiativeStates();

  states = updateInitiativeStates(states, ['maintenance'], allocation, { adoption: 38 });
  assert.equal(states.maintenance.maturityLevel, 'nascent');
  assert.equal(states.maintenance.quartersFunded, 1);
  const firstRoi = states.maintenance.currentRoi;

  states = updateInitiativeStates(states, ['maintenance'], allocation, { adoption: 42 });
  assert.equal(states.maintenance.maturityLevel, 'developing');
  assert.equal(states.maintenance.quartersFunded, 2);
  assert.ok(states.maintenance.currentRoi > firstRoi);
  assert.equal(states.maintenance.quartersSinceLastFund, 0);
});

test('discovery cash is attributed as an invested quarter without pretending it is delivery', () => {
  const initial = initializeInitiativeStates();
  const next = updateInitiativeStatesForActions(
    initial,
    { maintenance: 'discover' },
    allocation,
    {
      adoption: 38,
      fundingIntensity: 1,
      investmentMultiplier: 1,
      fundingByInitiative: {
        maintenance: { discovery: 0.2, delivery: 0, scaleUp: 0.4, run: 0, continuity: 0, retirement: 0, total: 0.6 },
      },
    },
  );
  assert.equal(next.maintenance.quartersFunded, 0);
  assert.equal(next.maintenance.quartersInvested, 1);
  assert.equal(next.maintenance.totalInvestment, 0.6);
  assert.ok(next.maintenance.dataInvestment > 0);
});

test('neglected initiatives decay after three unfunded quarters', () => {
  let states = initializeInitiativeStates();
  const startingData = states.energy.currentData;
  const startingRisk = states.energy.currentRisk === 'LOW' ? 24 : states.energy.currentRisk === 'HIGH' ? 72 : 48;

  for (let quarter = 0; quarter < 3; quarter += 1) {
    states = updateInitiativeStates(states, [], allocation, { adoption: 38 });
  }
  assert.equal(states.energy.currentData, startingData);

  states = updateInitiativeStates(states, [], allocation, { adoption: 38 });
  assert.equal(states.energy.currentData, startingData - 0.2);
  assert.ok(states.energy.riskScore > startingRisk);
});

test('funding and governance reduce initiative risk continuously', () => {
  const starting = initializeInitiativeStates();
  const lowGovernance = updateInitiativeStates(starting, ['maintenance'], { ...allocation, compliance: 5 }, { adoption: 38 });
  const highGovernance = updateInitiativeStates(starting, ['maintenance'], { ...allocation, compliance: 25 }, { adoption: 38 });

  assert.ok(lowGovernance.maintenance.riskScore < 48);
  assert.ok(highGovernance.maintenance.riskScore < lowGovernance.maintenance.riskScore);
});

test('discovered synergies improve ROI, adoption, risk, and cost mechanically', () => {
  const state = initialGameState();
  const decision = { selected: ['demand', 'knowledge'], alloc: allocation };
  const synergized = resolveQuarter(state, decision);
  const disabled = structuredClone(state);
  disabled.initiativeStates.demand.synergies = [];
  disabled.initiativeStates.knowledge.synergies = [];
  const isolated = resolveQuarter(disabled, decision);

  assert.ok(synergized.metrics.roi > isolated.metrics.roi);
  assert.ok(synergized.metrics.adoption > isolated.metrics.adoption);
  assert.ok(synergized.metrics.risk < isolated.metrics.risk);
  assert.ok(synergized.metrics.spent < isolated.metrics.spent);
  assert.deepEqual(synergized.snapshot.synergiesDiscovered, ['demand:knowledge']);
  assert.equal(evaluateSynergies(decision.selected, state.initiativeStates).length, 1);
});

test('hydrateGameState repairs missing initiative state and history', () => {
  const state = initialGameState();
  const hydrated = hydrateGameState({ ...state, initiativeStates: undefined, history: undefined });

  assert.equal(Object.keys(hydrated.initiativeStates).length, 6);
  assert.deepEqual(hydrated.history, []);
});

test('legacy hydration reconstructs discovery investment quarters from history', () => {
  const state = initialGameState();
  const legacy = structuredClone(state);
  delete legacy.initiativeStates.demand.quartersInvested;
  legacy.history = [{
    q: 1,
    metrics: {},
    initiativeStates: { demand: { ...legacy.initiativeStates.demand, totalInvestment: 0.2 } },
    initiativeFunding: { demand: { discovery: 0.2, delivery: 0, scaleUp: 0, run: 0, continuity: 0, retirement: 0, total: 0.2 } },
  }];
  const hydrated = normalizeGameState(legacy);
  assert.equal(hydrated.initiativeStates.demand.quartersInvested, 1);
});

test('deriveScore uses resolved metrics and rewards lower risk', () => {
  const state = initialGameState();
  const score = deriveScore(state, { roi: 50, adoption: 60, efficiency: 70, risk: 20 });

  assert.equal(score, 65);
});

test('initiative generation is reproducible for the same baseline and seed', () => {
  const generation = createInferredGeneration([4, 3, 4, 4, 3], 4242);
  assert.deepEqual(generateInitiatives(generation), generateInitiatives(generation));
});

test('Q1 resolves the initiative values shown to the player without regeneration', () => {
  const generation = createInferredGeneration([5, 3, 3, 4, 3], 4242);
  const game = { ...initialGameState(generation), baseline: [5, 3, 3, 4, 3], selected: ['maintenance', 'quality'], alloc: { infra: 40, data: 10, people: 10, mlops: 25, compliance: 10, innovation: 5 } };
  useGameStore.getState().loadGame(game);
  const visibleValues = Object.fromEntries(Object.entries(useGameStore.getState().initiativeStates).map(([id, item]) => [id, { roi: item.roi, cost: item.cost, baseRiskScore: item.baseRiskScore }]));
  useGameStore.getState().confirmDecisions();
  const resolved = useGameStore.getState();

  Object.entries(visibleValues).forEach(([id, values]) => {
    assert.equal(resolved.initiativeStates[id].roi, values.roi);
    assert.equal(resolved.initiativeStates[id].cost, values.cost);
    assert.equal(resolved.initiativeStates[id].baseRiskScore, values.baseRiskScore);
  });
});

test('campaign archetype uses the full allocation history', () => {
  const history = Array.from({ length: 8 }, () => ({ allocation: { infra: 15, data: 15, people: 35, mlops: 10, compliance: 15, innovation: 10 }, selectedIds: ['knowledge'] }));
  assert.equal(inferArchetypeFromCampaign([3, 3, 3, 3, 3], history), 'people-first');
});

test('advisor prompt includes scenario context and live learning signals', () => {
  const prompt = buildAdvisorSystemPrompt({
    persona: 'CFO',
    scenarioMode: true,
    scenarioPrompt: 'Connect decisions to fraud containment and responsible credit.',
    quarterlyBudget: 5,
    state: {
      advisorContext: {
        maturity: { organization: 0.7 },
        dynamicInitiatives: [{ id: 'fraudDetection', riskScore: 48 }],
        causalChain: [{ name: 'AI Fraud Detection' }],
        recommendations: [{ title: 'Governance first' }],
      },
    },
  });

  assert.match(prompt, /fraud containment and responsible credit/);
  assert.match(prompt, /Quarterly budget: 5/);
  assert.match(prompt, /fraudDetection/);
  assert.match(prompt, /Governance first/);
});

test('scenario causal and recommendation outputs contain actionable evidence', () => {
  const scenario = getScenario('bankNext');
  const states = scenarioInitiativesToStates(scenario.initiatives);
  const state = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: 'bankNext',
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
    scenarioProgress: {},
    defaultAllocation: allocation,
    quarterlyBudget: scenario.startingState.budget,
  });
  const scenarioState = { ...state, initiativeStates: states, selected: ['fraudDetection', 'complianceMonitoring'], scenarioMode: true, scenarioId: 'bankNext' };
  const chain = causalChain(scenarioState, scenarioState.selected);
  assert.ok(chain.length >= 1);
  assert.ok(chain[0].explanation.includes('maturity'));
  assert.ok(chain[0].effects[0].unit);
  const recommendations = generateProactiveRecommendations({ ...state, selected: ['maintenance'], people: 10, risk: 50 });
  assert.ok(recommendations.some((item) => item.priority === 'high'));
  assert.ok(recommendations.every((item) => item.title && item.action && item.metric));
});

test('scenario causal evidence reconciles to the resolved domain outcome', () => {
  const scenario = getScenario('bankNext');
  const states = scenarioInitiativesToStates(scenario.initiatives);
  const state = {
    ...initialGameState(undefined, {
      scenarioMode: true,
      scenarioId: 'bankNext',
      scenarioStartingMetrics: scenario.startingState.startingMetrics,
      scenarioProgress: {},
      defaultAllocation: allocation,
      quarterlyBudget: scenario.startingState.budget,
    }),
    scenarioMode: true,
    scenarioId: 'bankNext',
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
    initiativeStates: states,
    selected: ['fraudDetection'],
  };
  const result = resolveQuarter(state, { selected: state.selected, alloc: allocation });
  const chain = causalChain(state, state.selected, result.initiativeStates);
  const fraudPressureBefore = scenario.startingState.startingMetrics.fraudPressure;
  const fraudPressureAfter = result.scenarioState.metrics.fraudPressure;
  assert.equal(chain.length, 1);
  assert.ok(Math.abs(chain[0].effects[0].delta - (fraudPressureAfter - fraudPressureBefore)) < 1e-9);
});

test('legacy migration derives generation context from the saved baseline', () => {
  const baseline = [5, 3, 3, 4, 3];
  const migrated = normalizeGameState({ baseline, initiativeGeneration: { seed: 4242 } });
  const expected = createInferredGeneration(baseline, 4242);

  assert.equal(migrated.initiativeGeneration.archetype, expected.archetype);
  assert.deepEqual(migrated.initiativeGeneration.context, expected.context);
});

test('scenario registry exposes four domain packs with data-only progress definitions', () => {
  ['projectFactory', 'bankNext', 'care360', 'futureReady'].forEach((id) => {
    const scenario = getScenario(id);
    assert.ok(scenario);
    assert.equal(scenario.initiatives.length, 6);
    scenario.progress.forEach((item) => {
      assert.equal(typeof item.evaluate, 'undefined');
      assert.ok(item.target !== undefined);
      assert.ok(item.min !== undefined && item.max !== undefined);
    });
  });
});

test('scenario effects change domain metrics and persist scenario state', () => {
  const scenario = getScenario('bankNext');
  const generation = createInferredGeneration([3, 3, 3, 3, 3], 4242);
  const initial = initialGameState(generation, { scenarioMode: true, scenarioId: scenario.id, scenarioStartingMetrics: scenario.startingState.startingMetrics, scenarioProgress: {} });
  const state = { ...initial, initiativeStates: scenarioInitiativesToStates(scenario.initiatives), scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} }, selected: ['fraudDetection'], alloc: scenario.startingState.defaultAllocation };
  const result = resolveQuarter(state, { selected: state.selected, alloc: state.alloc });
  assert.ok(result.scenarioState.metrics.fraudPressure < 80);
  assert.ok(result.scenarioState.progress.fraudPressure > 0);
  assert.equal(result.snapshot.scenarioState.metrics.fraudPressure, result.scenarioState.metrics.fraudPressure);
});

test('scenario-declared synergies change domain outcomes without engine scenario branches', () => {
  const scenario = getScenario('bankNext');
  const generation = createInferredGeneration([3, 3, 3, 3, 3], 4242);
  const base = initialGameState(generation, { scenarioMode: true, scenarioId: scenario.id, scenarioStartingMetrics: scenario.startingState.startingMetrics });
  const state = {
    ...base,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
    selected: ['fraudDetection', 'complianceMonitoring'],
    alloc: scenario.startingState.defaultAllocation,
  };
  const withSynergy = resolveQuarter(state, { selected: state.selected, alloc: state.alloc });
  const withoutSynergy = resolveQuarter(state, { selected: ['fraudDetection'], alloc: state.alloc });

  assert.ok(withSynergy.scenarioState.metrics.fraudPressure < withoutSynergy.scenarioState.metrics.fraudPressure);
  assert.deepEqual(withSynergy.snapshot.synergiesDiscovered, ['fraudDetection:complianceMonitoring']);
});

test('scenario save migration keeps domain initiative ids', () => {
  const scenario = getScenario('care360');
  const migrated = normalizeGameState({ scenarioMode: true, scenarioId: 'care360', scenarioStartingMetrics: scenario.startingState.startingMetrics, initiativeStates: {} });
  assert.deepEqual(Object.keys(migrated.initiativeStates).sort(), scenario.initiatives.map((item) => item.id).sort());
  assert.equal(migrated.scenarioState.metrics.patientWaitTime, 75);
});

test('scenario initialization clears Standard-mode default selections', () => {
  useGameStore.getState().initializeScenario('bankNext');
  const state = useGameStore.getState();
  assert.deepEqual(state.selected, []);
  assert.deepEqual(Object.keys(state.initiativeStates).sort(), getScenario('bankNext').initiatives.map((item) => item.id).sort());
});

test('maturity and allocation helpers stay bounded and deterministic', () => {
  assert.equal(maturityMultiplier('nascent'), 0.72);
  assert.equal(maturityMultiplier('optimized'), 1.08);
  assert.equal(allocationToReadiness({ infra: 0, data: 0, people: 0, mlops: 0, compliance: 0, innovation: 100 }).data, 0);
  assert.equal(allocationToReadiness({ infra: 50, data: 30, people: 25, mlops: 50, compliance: 20, innovation: 0 }).technical, 1);
  assert.equal(allocationToReadiness({ infra: 50, data: 30, people: 25, mlops: 50, compliance: 20, innovation: 0 }).governance, 1);
});

test('scenario initiative adapter produces complete state and metadata', () => {
  const scenario = getScenario('bankNext');
  const state = scenarioInitiativeToState(scenario.initiatives[0]);
  assert.equal(state.id, 'fraudDetection');
  assert.equal(state.currentData, state.data);
  assert.equal(state.currentRoi, state.roi);
  assert.equal(state.quartersFunded, 0);
  assert.equal(state.maturityLevel, 'nascent');
  assert.equal(state.baseRiskScore, 48);
  assert.equal(state.scenarioMetadata.primaryMetric, 'fraudPressure');
});

test('scenario effects are immutable and skip unknown metrics safely', () => {
  const scenario = getScenario('bankNext');
  const states = scenarioInitiativesToStates(scenario.initiatives);
  const previous = { metrics: { fraudPressure: 80 }, progress: {}, flags: {} };
  const before = structuredClone(previous);
  const result = applyScenarioEffects(scenario, previous, states, ['fraudDetection'], scenario.startingState.defaultAllocation, 45);
  assert.deepEqual(previous, before);
  assert.ok(result.metrics.fraudPressure < 80);
  const unknown = { ...states.fraudDetection, scenarioMetadata: { ...states.fraudDetection.scenarioMetadata, primaryMetric: 'missingMetric' } };
  assert.doesNotThrow(() => applyScenarioEffects(scenario, previous, { ...states, fraudDetection: unknown }, ['fraudDetection'], scenario.startingState.defaultAllocation, 45));
});

test('all four scenarios survive a twelve-quarter decision loop', () => {
  ['projectFactory', 'bankNext', 'care360', 'futureReady'].forEach((id) => {
    const scenario = getScenario(id);
    let state = initialGameState(undefined, { scenarioMode: true, scenarioId: id, scenarioStartingMetrics: scenario.startingState.startingMetrics });
    state = { ...state, selected: [], alloc: scenario.startingState.defaultAllocation, initiativeStates: scenarioInitiativesToStates(scenario.initiatives), scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} } };
    for (let quarter = 1; quarter <= 12; quarter += 1) {
      const selected = scenario.initiatives.slice((quarter - 1) % 4, ((quarter - 1) % 4) + 3).map((item) => item.id);
      const result = resolveQuarter(state, { selected, alloc: scenario.startingState.defaultAllocation });
      assert.equal(Object.keys(result.initiativeStates).length, 6);
      Object.values(result.scenarioState.progress).forEach((value) => assert.ok(value >= 0 && value <= 100));
      state = { ...state, ...result.metrics, initiativeStates: result.initiativeStates, scenarioState: result.scenarioState, q: quarter + 1 };
    }
    assert.equal(state.q, 13);
  });
});

test('scenario neglect applies an explicit penalty only after the configured threshold', () => {
  const scenario = getScenario('bankNext');
  const initialState = {
    ...initialGameState(undefined, {
      scenarioMode: true,
      scenarioId: scenario.id,
      scenarioStartingMetrics: scenario.startingState.startingMetrics,
    }),
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: {
      metrics: { ...scenario.startingState.startingMetrics },
      progress: {},
      flags: {},
    },
  };

  const funded = resolveQuarter(initialState, { selected: ['fraudDetection'], alloc: scenario.startingState.defaultAllocation });
  let state = {
    ...initialState,
    initiativeStates: funded.initiativeStates,
    scenarioState: funded.scenarioState,
    q: 2,
  };
  const fundedPressure = state.scenarioState.metrics.fraudPressure;
  const pressureByQuarter = [];
  for (let quarter = 2; quarter <= 5; quarter += 1) {
    const result = resolveQuarter(state, { selected: [], alloc: scenario.startingState.defaultAllocation });
    pressureByQuarter.push(result.scenarioState.metrics.fraudPressure);
    state = {
      ...state,
      initiativeStates: result.initiativeStates,
      scenarioState: result.scenarioState,
      q: quarter + 1,
    };
  }

  assert.equal(state.initiativeStates.fraudDetection.quartersSinceLastFund, 4);
  assert.equal(pressureByQuarter[0], fundedPressure);
  assert.equal(pressureByQuarter[1], fundedPressure);
  assert.equal(pressureByQuarter[2], fundedPressure);
  assert.ok(pressureByQuarter[3] > pressureByQuarter[2]);

  const fifth = resolveQuarter(state, { selected: [], alloc: scenario.startingState.defaultAllocation });
  assert.ok(fifth.scenarioState.metrics.fraudPressure > pressureByQuarter[3]);
  assert.equal(fifth.initiativeStates.fraudDetection.quartersSinceLastFund, 5);
});

test('never-funded alternatives do not create scenario neglect penalties', () => {
  const scenario = getScenario('bankNext');
  let state = {
    ...initialGameState(undefined, {
      scenarioMode: true,
      scenarioId: scenario.id,
      scenarioStartingMetrics: scenario.startingState.startingMetrics,
    }),
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
  };
  for (let quarter = 1; quarter <= 5; quarter += 1) {
    const result = resolveQuarter(state, { selected: [], alloc: scenario.startingState.defaultAllocation });
    assert.equal(result.scenarioState.metrics.fraudPressure, scenario.startingState.startingMetrics.fraudPressure);
    state = { ...state, initiativeStates: result.initiativeStates, scenarioState: result.scenarioState, q: quarter + 1 };
  }
  assert.equal(state.initiativeStates.fraudDetection.quartersFunded, 0);
});

test('scenario metric effects clamp at both native boundaries', () => {
  const scenario = getScenario('bankNext');
  const states = scenarioInitiativesToStates(scenario.initiatives);
  const allocationForEffects = scenario.startingState.defaultAllocation;

  const atUpperBound = applyScenarioEffects(
    scenario,
    { metrics: { digitalAdoption: 100 }, progress: {}, flags: {} },
    states,
    ['customerCopilot'],
    allocationForEffects,
    100,
  );
  assert.equal(atUpperBound.metrics.digitalAdoption, 100);

  const atLowerBound = applyScenarioEffects(
    scenario,
    { metrics: { fraudPressure: 0 }, progress: {}, flags: {} },
    states,
    ['fraudDetection'],
    allocationForEffects,
    100,
  );
  assert.equal(atLowerBound.metrics.fraudPressure, 0);
  assert.ok(atUpperBound.progress.digitalAdoption <= 100);
  assert.ok(atLowerBound.progress.fraudPressure <= 100);
});

test('scenario crisis response persists impact and cumulative cost through normalization', () => {
  const scenario = getScenario('bankNext');
  const base = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: scenario.id,
    quarterlyBudget: scenario.startingState.budget,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
  });
  const scenarioState = {
    ...base,
    scenarioMode: true,
    scenarioId: scenario.id,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: {
      metrics: { ...scenario.startingState.startingMetrics },
      progress: {},
      flags: {},
    },
    crisis: {
      title: 'Test regulatory review',
      type: 'COMPLIANCE',
      text: 'A controlled test crisis.',
      options: [],
    },
  };
  useGameStore.getState().loadGame(scenarioState);
  useGameStore.getState().respondToCrisis({ risk: 28, compliance: 67 }, 0.8);

  const afterResponse = useGameStore.getState();
  assert.equal(afterResponse.crisis, null);
  assert.equal(afterResponse.risk, 28);
  assert.equal(afterResponse.compliance, 67);
  assert.equal(afterResponse.spent, 0.8);
  assert.equal(afterResponse.quarterlyCrisisCost, 0.8);
  assert.equal(afterResponse.scenarioBudgetRemaining, 4.2);
  assert.equal(afterResponse.causalChain.at(-1).name, 'Crisis response');
  assert.equal(afterResponse.causalChain.at(-1).effects[0].metric, 'risk');

  const roundTripped = normalizeGameState(JSON.parse(JSON.stringify(afterResponse)));
  assert.equal(roundTripped.scenarioMode, true);
  assert.equal(roundTripped.scenarioId, 'bankNext');
  assert.equal(roundTripped.risk, 28);
  assert.equal(roundTripped.compliance, 67);
  assert.equal(roundTripped.spent, 0.8);
  assert.equal(roundTripped.quarterlyCrisisCost, 0.8);
  assert.equal(roundTripped.scenarioBudgetRemaining, 4.2);
});

test('scenario crisis domain impacts update scenario metrics and progress', () => {
  const scenario = getScenario('bankNext');
  const base = initialGameState(undefined, { scenarioMode: true, scenarioId: scenario.id, scenarioStartingMetrics: scenario.startingState.startingMetrics });
  useGameStore.getState().loadGame({
    ...base,
    scenarioMode: true,
    scenarioId: scenario.id,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
  });
  useGameStore.getState().respondToCrisis({ fraudPressure: -8 }, 0.2);
  const afterResponse = useGameStore.getState();
  assert.equal(afterResponse.scenarioState.metrics.fraudPressure, 72);
  assert.ok(afterResponse.scenarioState.progress.fraudPressure > 0);
  assert.equal(afterResponse.fraudPressure, undefined);
});

test('scenario synergy cost relief is used consistently for overspend risk', () => {
  const scenario = getScenario('bankNext');
  const base = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: scenario.id,
    quarterlyBudget: 2.85,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
  });
  useGameStore.getState().loadGame({
    ...base,
    selected: ['fraudDetection', 'complianceMonitoring'],
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
  });
  useGameStore.getState().confirmDecisions();
  assert.equal(useGameStore.getState().scenarioOverspend, 0);
});

test('Standard mode remains scenario-free when resolving a quarter', () => {
  const state = initialGameState();
  const result = resolveQuarter(state, { selected: ['demand'], alloc: allocation });

  assert.equal(state.scenarioMode, false);
  assert.equal(state.scenarioId, undefined);
  assert.deepEqual(result.scenarioState, state.scenarioState);
  assert.equal(result.metrics.fraudPressure, undefined);
  assert.equal(result.metrics.complianceReadiness, undefined);
  assert.ok(result.initiativeStates.demand);
  assert.equal(result.initiativeStates.fraudDetection, undefined);
});

test('scenario save/load round-trip preserves state, history, crisis, and domain initiative progress', () => {
  const scenario = getScenario('care360');
  const base = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: scenario.id,
    quarterlyBudget: scenario.startingState.budget,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
  });
  const states = scenarioInitiativesToStates(scenario.initiatives);
  states.radiologyAssistant.quartersFunded = 3;
  states.radiologyAssistant.currentData = 4.7;
  const snapshot = {
    q: 2,
    chosen: ['AI Radiology Assistant'],
    selectedIds: ['radiologyAssistant'],
    allocation: scenario.startingState.defaultAllocation,
    metrics: { roi: 12, adoption: 49 },
    initiativeStates: states,
    scenarioState: {
      metrics: { patientWaitTime: 61, patientSafety: 74 },
      progress: { patientWaitTime: 31.25, patientSafety: 20 },
      flags: { privacyReviewComplete: true },
    },
    crisis: { title: 'A privacy concern pauses an AI pilot.' },
    crisisResponse: { risk: -8 },
  };
  const saved = {
    ...base,
    q: 2,
    stage: 'results',
    selected: ['radiologyAssistant'],
    initiativeStates: states,
    history: [snapshot],
    scenarioState: snapshot.scenarioState,
    scenarioProgress: snapshot.scenarioState.progress,
    scenarioBudgetRemaining: 3.7,
    quarterlyCrisisCost: 0.3,
    crisis: snapshot.crisis,
  };

  const restored = normalizeGameState(JSON.parse(JSON.stringify(saved)));
  assert.equal(restored.scenarioMode, true);
  assert.equal(restored.scenarioId, 'care360');
  assert.equal(restored.q, 2);
  assert.equal(restored.stage, 'results');
  assert.equal(restored.scenarioBudgetRemaining, 3.7);
  assert.equal(restored.quarterlyCrisisCost, 0.3);
  assert.equal(restored.scenarioState.metrics.patientWaitTime, 61);
  assert.equal(restored.scenarioState.progress.patientSafety, 20);
  assert.equal(restored.scenarioState.flags.privacyReviewComplete, true);
  assert.equal(restored.initiativeStates.radiologyAssistant.quartersFunded, 3);
  assert.equal(restored.initiativeStates.radiologyAssistant.currentData, 4.7);
  assert.equal(restored.history[0].scenarioState.metrics.patientWaitTime, 61);
  assert.equal(restored.crisis.title, 'A privacy concern pauses an AI pilot.');
});

test('v4 scenario saves migrate into v5 scenario state without losing domain identity', () => {
  const scenario = getScenario('bankNext');
  const legacyV4 = {
    q: 5,
    stage: 'decide',
    scenarioMode: true,
    scenarioId: 'bankNext',
    quarterlyBudget: 5,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
    scenarioProgress: { fraudPressure: 42, complianceReadiness: 18 },
    scenarioOverspend: 0.4,
    quarterlyCrisisCost: 0.8,
    scenarioBonus: 1,
  };

  const migrated = normalizeGameState(legacyV4);
  assert.equal(migrated.scenarioMode, true);
  assert.equal(migrated.scenarioId, 'bankNext');
  assert.equal(migrated.scenarioState.metrics.fraudPressure, 80);
  assert.equal(migrated.scenarioState.progress.fraudPressure, 42);
  assert.equal(migrated.scenarioState.progress.complianceReadiness, 18);
  assert.equal(migrated.scenarioOverspend, 0.4);
  assert.equal(migrated.quarterlyCrisisCost, 0.8);
  assert.equal(migrated.scenarioBonus, 1);
  assert.deepEqual(Object.keys(migrated.initiativeStates).sort(), scenario.initiatives.map((item) => item.id).sort());
  assert.equal(migrated.scenarioBudgetRemaining, 5);
});

test('legacy Standard saves remain Standard and receive no scenario initiatives or effects', () => {
  const migrated = normalizeGameState({
    q: 4,
    stage: 'results',
    baseline: [4, 3, 3, 4, 3],
    selected: ['demand'],
    spent: 2.5,
    history: [],
  });

  assert.equal(migrated.scenarioMode, false);
  assert.equal(migrated.scenarioId, undefined);
  assert.equal(migrated.quarterlyBudget, 10);
  assert.equal(migrated.scenarioBudgetRemaining, 10);
  assert.equal(migrated.scenarioState.metrics.fraudPressure, undefined);
  assert.equal(migrated.initiativeStates.demand.name, 'Demand Forecasting');
  assert.equal(migrated.initiativeStates.fraudDetection, undefined);
});

test('repeated scenario funding compounds effects while respecting native bounds', () => {
  const scenario = getScenario('bankNext');
  let state = {
    ...initialGameState(undefined, {
      scenarioMode: true,
      scenarioId: scenario.id,
      scenarioStartingMetrics: scenario.startingState.startingMetrics,
    }),
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: {
      metrics: { ...scenario.startingState.startingMetrics },
      progress: {},
      flags: {},
    },
  };
  let previousPressure = state.scenarioState.metrics.fraudPressure;
  for (let quarter = 1; quarter <= 12; quarter += 1) {
    const result = resolveQuarter(state, {
      selected: ['fraudDetection'],
      alloc: scenario.startingState.defaultAllocation,
    });
    const currentPressure = result.scenarioState.metrics.fraudPressure;
    assert.ok(currentPressure <= previousPressure);
    assert.ok(currentPressure >= 30 && currentPressure <= 80);
    assert.ok(result.scenarioState.progress.fraudPressure >= 0 && result.scenarioState.progress.fraudPressure <= 100);
    previousPressure = currentPressure;
    state = {
      ...state,
      initiativeStates: result.initiativeStates,
      scenarioState: result.scenarioState,
      q: quarter + 1,
    };
  }
  assert.equal(state.initiativeStates.fraudDetection.quartersFunded, 12);
  assert.equal(state.initiativeStates.fraudDetection.quartersSinceLastFund, 0);
  assert.ok(state.scenarioState.metrics.fraudPressure < 80);
});

test('scenario quarter flow persists progress and resets only quarter-local crisis cost', () => {
  const scenario = getScenario('futureReady');
  const base = initialGameState(undefined, {
    scenarioMode: true,
    scenarioId: scenario.id,
    quarterlyBudget: scenario.startingState.budget,
    scenarioStartingMetrics: scenario.startingState.startingMetrics,
  });
  const initiativeStates = scenarioInitiativesToStates(scenario.initiatives);
  // This flow is about running an existing scenario portfolio and its cash
  // ledger. Mark the three initiatives as legacy deployments so the new
  // lifecycle gate is not mistaken for an already-active campaign.
  ['successPredictor', 'facultyCopilot', 'chatbot'].forEach((id) => {
    initiativeStates[id] = {
      ...initiativeStates[id],
      lifecycle: 'scale',
      quartersFunded: 1,
      aiLifecycle: { stage: 'deploy', stageStartedAt: 1, stageCompletedAt: 1, stageStatus: 'completed' },
    };
  });
  useGameStore.getState().loadGame({
    ...base,
    scenarioMode: true,
    scenarioId: scenario.id,
    initiativeStates,
    selected: ['successPredictor', 'facultyCopilot', 'chatbot'],
    alloc: scenario.startingState.defaultAllocation,
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
    scenarioBudgetRemaining: 5,
    quarterlyCrisisCost: 0.5,
    // The crisis response is a real cash commitment: release enough capital
    // to cover both the selected delivery actions and the response.
    deploymentAmount: 3.2,
  });

  useGameStore.getState().confirmDecisions();
  const afterQ1 = useGameStore.getState();
  assert.equal(afterQ1.stage, 'results');
  assert.equal(afterQ1.history.length, 1);
  assert.ok(afterQ1.scenarioState.progress.studentPersistence > 0);
  assert.equal(afterQ1.campaignBudget, 60);
  assert.ok(afterQ1.campaignBudgetRemaining < 60);

  useGameStore.getState().advanceQuarter();
  const nextQuarter = useGameStore.getState();
  assert.equal(nextQuarter.q, 2);
  assert.equal(nextQuarter.stage, 'decide');
  assert.equal(nextQuarter.quarterlyCrisisCost, 0);
  assert.equal(nextQuarter.scenarioBudgetRemaining, 5);
  assert.equal(nextQuarter.campaignBudgetRemaining, afterQ1.campaignBudgetRemaining);
  assert.deepEqual(nextQuarter.selected, []);

  useGameStore.getState().confirmDecisions();
  const afterQ2 = useGameStore.getState();
  assert.equal(afterQ2.history.length, 2);
  assert.ok(afterQ2.scenarioState.metrics.studentPersistence >= afterQ1.scenarioState.metrics.studentPersistence);
});

test('one, two, and three initiative choices remain truthful in the quarter ledger', () => {
  const scenario = getScenario('bankNext');
  const base = {
    ...initialGameState(undefined, {
      scenarioMode: true,
      scenarioId: scenario.id,
      quarterlyBudget: scenario.startingState.budget,
      scenarioStartingMetrics: scenario.startingState.startingMetrics,
    }),
    scenarioMode: true,
    scenarioId: scenario.id,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
    alloc: scenario.startingState.defaultAllocation,
  };
  const choices = [
    ['fraudDetection'],
    ['fraudDetection', 'complianceMonitoring'],
    ['fraudDetection', 'complianceMonitoring', 'customerCopilot'],
  ];

  const results = choices.map((selected) => resolveQuarter(base, { selected, alloc: base.alloc }));
  results.forEach((result, index) => {
    assert.equal(result.snapshot.selectedIds.length, index + 1);
    assert.equal(result.snapshot.selectedCount, index + 1);
    assert.equal(result.snapshot.chosen.length, index + 1);
    assert.deepEqual(result.snapshot.selectedIds, choices[index]);
    assert.equal(result.snapshot.portfolioPosture, ['deep-focus', 'focused-balance', 'portfolio-breadth'][index]);
    assert.ok(result.snapshot.breadth > 0 && result.snapshot.breadth <= 1);
    assert.ok(Number.isFinite(result.snapshot.concentrationRisk));
    assert.ok(result.snapshot.concentrationRisk >= 0 && result.snapshot.concentrationRisk <= 100);
    assert.ok(Number.isFinite(result.snapshot.metrics.spent));
    assert.ok(result.snapshot.scenarioState.metrics.fraudPressure <= scenario.startingState.startingMetrics.fraudPressure);
  });

  // The two-initiative pair is authored as complementary in BankNext; the
  // ledger must preserve the observable outcome rather than collapsing all
  // choices into an identical portfolio result.
  assert.ok(results[1].snapshot.synergiesDiscovered.includes('fraudDetection:complianceMonitoring'));
  assert.ok(results[1].scenarioState.metrics.fraudPressure < results[0].scenarioState.metrics.fraudPressure);
  assert.ok(results[2].snapshot.metrics.spent >= results[1].snapshot.metrics.spent);
});

test('quarter history carries enough evidence to reconstruct focus, balance, or breadth posture', () => {
  const scenario = getScenario('futureReady');
  const base = {
    ...initialGameState(undefined, {
      scenarioMode: true,
      scenarioId: scenario.id,
      quarterlyBudget: scenario.startingState.budget,
      scenarioStartingMetrics: scenario.startingState.startingMetrics,
    }),
    scenarioMode: true,
    scenarioId: scenario.id,
    initiativeStates: scenarioInitiativesToStates(scenario.initiatives),
    scenarioState: { metrics: { ...scenario.startingState.startingMetrics }, progress: {}, flags: {} },
    alloc: scenario.startingState.defaultAllocation,
  };
  const decisions = [
    ['successPredictor'],
    ['successPredictor', 'facultyCopilot'],
    ['successPredictor', 'facultyCopilot', 'studentChatbot'],
  ];
  const history = decisions.map((selected, index) => {
    const result = resolveQuarter({ ...base, q: index + 1 }, { selected, alloc: base.alloc });
    return result.snapshot;
  });

  assert.deepEqual(history.map((entry) => entry.selectedIds.length), [1, 2, 3]);
  assert.deepEqual(history.map((entry) => entry.selectedCount), [1, 2, 3]);
  assert.deepEqual(history.map((entry) => entry.portfolioPosture), ['deep-focus', 'focused-balance', 'portfolio-breadth']);
  assert.ok(history[0].breadth < history[1].breadth);
  assert.ok(history[1].breadth < history[2].breadth);
  assert.ok(history.every((entry) => Number.isFinite(entry.concentrationRisk)));
  assert.ok(history.every((entry) => entry.allocation && entry.scenarioState && entry.initiativeStates));
  assert.ok(history.every((entry) => Number.isFinite(entry.metrics.spent)));

});

test('campaign pace is guidance while remaining reserve stays usable', () => {
  assert.equal(quarterlyDeploymentCap(60, 60, 5, 1, 0), 60);
  assert.equal(quarterlyDeploymentCap(60, 60, 5, 2, 0), 60);
  assert.equal(quarterlyDeploymentCap(60, 60, 5, 3, 0), 60);
  assert.equal(quarterlyDeploymentCap(60, 3, 5, 3, 0), 3);
  assert.equal(normalizeDeploymentAmount(0, 60, 60, 5, 1, 0), 0);
  assert.equal(normalizeDeploymentAmount(7, 60, 60, 5, 2, 0), 7);
  assert.equal(normalizeDeploymentAmount(99, 60, 60, 5, 3, 0), 60);

  const state = initialGameState(undefined, { campaignBudget: 24, quarterlyBudget: 2 });
  assert.equal(state.deploymentAmount, 1.2);
  assert.equal(state.quarterlyDeploymentCap, 24);
  assert.equal(state.campaignBudgetRemaining, 24);
});

test('a portfolio cannot silently spend more than the learner deployed', () => {
  const state = {
    ...initialGameState(undefined, { campaignBudget: 24, quarterlyBudget: 2 }),
    selected: ['maintenance'],
    deploymentAmount: 1,
  };
  useGameStore.getState().loadGame(state);
  useGameStore.getState().confirmDecisions();
  const unchanged = useGameStore.getState();
  assert.equal(unchanged.history.length, 0);
  assert.match(unchanged.feedback, /You have released 1\.00/);
});

test('partial deployment carries unused purse forward and crisis costs share the same purse', () => {
  const state = {
    ...initialGameState(undefined, { campaignBudget: 24, quarterlyBudget: 2 }),
    selected: ['demand'],
    deploymentAmount: 2,
  };
  useGameStore.getState().loadGame(state);
  const fixedPortfolioCost = useGameStore.getState().initiativeStates.demand.currentCost;
  useGameStore.getState().confirmDecisions();
  const afterDecision = useGameStore.getState();
  assert.equal(afterDecision.lastQuarterDeployment, 2);
  assert.equal(afterDecision.campaignBudgetRemaining, 22);
  assert.equal(afterDecision.history[0].deployedAmount, 2);
  assert.equal(afterDecision.history[0].fixedInitiativeSpend, fixedPortfolioCost);
  assert.ok(afterDecision.history[0].fundingIntensity > 1);
  useGameStore.getState().respondToCrisis({}, 0.5);
  const afterCrisis = useGameStore.getState();
  assert.equal(afterCrisis.campaignBudgetRemaining, 21.5);
  assert.equal(afterCrisis.quarterlyDeploymentCap, 21.5);
  useGameStore.getState().advanceQuarter();
  const nextQuarter = useGameStore.getState();
  assert.equal(nextQuarter.quarterlyDeploymentCap, 21.5);
});

test('a crisis cost reduces usable campaign reserve without reinstating a quarterly cap', () => {
  const base = initialGameState(undefined, { campaignBudget: 120, quarterlyBudget: 10 });
  useGameStore.getState().loadGame({ ...base, q: 2, stage: 'results', spent: 10, campaignBudgetRemaining: 110, deploymentAmount: 10 });
  useGameStore.getState().respondToCrisis({}, 0.5);
  const afterCrisis = useGameStore.getState();
  assert.equal(afterCrisis.quarterlyDeploymentCap, 109.5);
  assert.equal(afterCrisis.campaignBudgetRemaining, 109.5);
});

test('an unaffordable paid crisis response is rejected without impact or spend', () => {
  const base = initialGameState(undefined, { campaignBudget: 10, quarterlyBudget: 2 });
  const state = {
    ...base,
    spent: 10,
    campaignBudgetRemaining: 0,
    crisis: { title: 'Budget test crisis', type: 'TEST', text: 'Test', options: [] },
  };
  const after = applyCrisisResponse(state, { impact: { risk: -20 }, cost: 0.5 });
  assert.equal(after.spent, 10);
  assert.equal(after.campaignBudgetRemaining, 0);
  assert.equal(after.risk, state.risk);
  assert.equal(after.crisis.title, state.crisis.title);
  assert.match(after.feedback, /requires 0\.50/);
});

test('crisis responses refresh the score breakdown, including the final quarter', () => {
  const base = initialGameState(undefined, { campaignBudget: 120, quarterlyBudget: 10 });
  const state = {
    ...base,
    q: 12,
    stage: 'results',
    risk: 70,
    crisis: { title: 'Final-quarter crisis', type: 'TEST', text: 'Test', options: [] },
  };
  const before = state.score;
  const after = applyCrisisResponse(state, { impact: { risk: -20 }, cost: 0 });
  assert.equal(after.stage, 'results');
  assert.equal(after.q, 12);
  assert.notEqual(after.score, before, 'the final-quarter crisis response must affect the score');
  assert.equal(after.score, Math.round(after.scoreBreakdown.score));
  assert.ok(after.scoreBreakdown.values.operatingHealth >= 0);
});

test('results UI labels modelled ROI separately from realised cash ROI', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../components/GameResultsModal.tsx'), 'utf8');
  assert.match(source, /Modelled ROI/);
  assert.match(source, /Realised cash ROI/);
  assert.equal(realisedROI({ cumulativeInvestment: 10, cumulativeNetBenefit: -2 }), -20);
  assert.equal(realisedROI({ cumulativeInvestment: 10, cumulativeNetBenefit: 3 }), 30);
});

test('capital plan separates initiative floor, continuity, and optional acceleration', () => {
  const base = initialGameState(undefined, { campaignBudget: 60, quarterlyBudget: 5 });
  const evolved = {
    ...base,
    initiativeStates: {
      ...base.initiativeStates,
      energy: { ...base.initiativeStates.energy, quartersFunded: 2, currentCost: 2 },
    },
  };
  const plan = calculateCapitalPlan(evolved, ['demand'], 1.5, 4);
  assert.equal(plan.initiativeMinimum, 1.5);
  assert.equal(plan.maintenanceSpend, 0.16);
  assert.equal(plan.requiredCapital, 1.66);
  assert.equal(plan.accelerationSpend, 2.34);
  assert.equal(plan.remainingAfterPlan, 56);
  assert.equal(plan.continuityAllocations.energy, 0.16);
});

test('excess discovery capital becomes measurable evidence without operating value', () => {
  const state = initialGameState();
  const before = state.initiativeStates.demand;
  const result = applyTurnDecision(state, {
    selected: ['demand'],
    initiativeActions: { demand: 'discover' },
    alloc: allocation,
    deploymentAmount: 10,
  });

  assert.equal(result.accepted, true);
  const after = result.nextState.initiativeStates.demand;
  const funding = result.nextState.history[0].initiativeFunding.demand;
  assert.ok(funding.scaleUp > 0, 'the excess release should be attributed to discovery evidence');
  assert.ok(after.dataInvestment > before.dataInvestment, 'discovery should increase durable evidence investment');
  assert.ok(after.currentData >= before.currentData, 'discovery should not reduce measurable data readiness');
  assert.equal(after.quartersInvested, 1, 'discovery should count as an investment quarter');
  assert.equal(after.totalInvestment, fundingTotal(funding), 'discovery cash should be recorded against the initiative');
  assert.equal(result.nextState.roi, state.roi, 'discovery should not create realised operating ROI');
  assert.equal(result.nextState.revenue, state.revenue, 'discovery should not create operating revenue');
  assert.equal(result.nextState.financialLedger.grossBenefit, 0, 'discovery should not create realised operating benefit');
});

function fundingTotal(funding) {
  return Number(funding.total.toFixed(2));
}

test('scale-up capital earns bounded maturity credits and compounds initiative capability', () => {
  const allocation = { infra: 40, data: 20, people: 15, mlops: 10, compliance: 10, innovation: 5 };
  const initial = initializeInitiativeStates();
  const normalQ1 = updateInitiativeStates(initial, ['maintenance'], allocation, { adoption: 38, investmentMultiplier: 1 });
  const normalQ2 = updateInitiativeStates(normalQ1, ['maintenance'], allocation, { adoption: 38, investmentMultiplier: 1 });
  const acceleratedQ1 = updateInitiativeStates(initial, ['maintenance'], allocation, { adoption: 38, investmentMultiplier: 2 });
  const acceleratedQ2 = updateInitiativeStates(acceleratedQ1, ['maintenance'], allocation, { adoption: 38, investmentMultiplier: 2 });
  assert.equal(acceleratedQ2.maintenance.quartersFunded, 2);
  assert.equal(acceleratedQ2.maintenance.maturityCredits, 4);
  assert.equal(acceleratedQ2.maintenance.maturityLevel, 'mature');
  assert.ok(acceleratedQ2.maintenance.currentRoi > normalQ2.maintenance.currentRoi);
});

test('continuity funding preserves an in-flight initiative without disguising it as a delivery quarter', () => {
  const allocation = { infra: 40, data: 20, people: 15, mlops: 10, compliance: 10, innovation: 5 };
  const funded = updateInitiativeStates(initializeInitiativeStates(), ['maintenance'], allocation, { adoption: 38 });
  const before = funded.maintenance;
  const continuity = before.currentCost * 0.08;
  const preserved = updateInitiativeStates(funded, [], allocation, { adoption: 38, continuityAllocations: { maintenance: continuity } });
  assert.equal(preserved.maintenance.quartersFunded, before.quartersFunded);
  assert.equal(preserved.maintenance.maturityCredits, before.maturityCredits);
  assert.equal(preserved.maintenance.quartersSinceLastFund, 0);
  assert.ok(Math.abs(preserved.maintenance.continuityInvestment - continuity) < 0.01);
  assert.ok(preserved.maintenance.totalInvestment > before.totalInvestment);
});

test('runway forecast is deterministic and explains the operational consequence of acceleration', () => {
  const state = initialGameState(undefined, { campaignBudget: 60, quarterlyBudget: 5 });
  const runway = calculateCapitalRunway(state, 15);
  assert.equal(runway.depletionQuarter, 4);
  assert.match(runway.message, /purse reaches zero around Q4/);
  const observation = calculateCapitalRunway(state, 0);
  assert.equal(observation.depletionQuarter, null);
  assert.match(observation.message, /observation quarter/);
});

test('a zero-funding quarter resolves and keeps the learner moving', () => {
  const state = {
    ...initialGameState(undefined, { campaignBudget: 24, quarterlyBudget: 2 }),
    selected: [],
    deploymentAmount: 0,
  };
  useGameStore.getState().loadGame(state);
  useGameStore.getState().confirmDecisions();
  const resolved = useGameStore.getState();
  assert.equal(resolved.stage, 'results');
  assert.equal(resolved.history.length, 1);
  assert.equal(resolved.history[0].deployedAmount, 0);
  assert.match(resolved.feedback, /no new funding/);
});

test('an observation quarter leaves native metrics unchanged', () => {
  const state = initialGameState(undefined, { campaignBudget: 24, quarterlyBudget: 2 });
  const result = resolveQuarter(state, { selected: [], alloc: allocation, deploymentAmount: 0 });
  for (const key of ['roi', 'revenue', 'efficiency', 'adoption', 'risk', 'data', 'satisfaction', 'literacy', 'spent']) {
    assert.equal(result.metrics[key], state[key]);
  }
});
