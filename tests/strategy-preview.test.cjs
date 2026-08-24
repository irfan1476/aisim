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
const { getScenario } = require('../lib/scenarios/registry.ts');

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
    state.initiativeStates = Object.fromEntries(scenario.initiatives.map((item) => [item.id, { ...state.initiativeStates[item.id], ...item, scenarioMetadata: { primaryMetric: item.primaryMetric, baseEffect: item.baseEffect, effectUnit: item.effectUnit, neglect: item.neglect || { decayRate: 1, penaltyThreshold: 3, penaltyAmount: 1 } } }]));
    const result = previewStrategy(state, { selected: scenario.initiatives.slice(0, 1).map((item) => item.id), alloc: state.alloc, deploymentAmount: state.quarterlyBudget });
    assert.ok(result.alternative.scenarioState);
    assert.ok(Object.keys(result.alternative.scenarioState.metrics).length > 0);
    assert.ok(Array.isArray(result.uncoveredPressures));
    assert.match(result.alternative.spend.provenance, /engine-preview/);
  });
}

test('preview exposes trade-offs for a materially different portfolio', () => {
  const state = initialGameState();
  const result = previewStrategy(state, [], allocation, 0);
  assert.ok(result.tradeoffs.length > 0);
  assert.ok(Object.hasOwn(result.deltas, 'initiativeSpend'));
  assert.match(result.learningInsight, /pause/);
});
