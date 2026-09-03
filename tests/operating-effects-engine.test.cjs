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
const { scenarioInitiativesToStates } = require('../lib/game/initiativeAdapter.ts');
const { updateInitiativeStatesForActions } = require('../lib/game/initiativeState.ts');
const { deriveOperatingSignal } = require('../lib/game/operatingEffects.ts');

const allocation = (overrides = {}) => ({ infra: 15, data: 20, people: 20, mlops: 15, compliance: 20, innovation: 10, ...overrides });

test('operating profile identifies a stage-specific bottleneck without changing the mix', () => {
  const initiative = scenarioInitiativesToStates(getScenario('projectFactory').initiatives).maintenance;
  const signal = deriveOperatingSignal(initiative.operatingProfile, 'discover', allocation({ data: 5, innovation: 35 }));
  assert.equal(signal.stage, 'data_readiness');
  assert.equal(signal.bottleneck, 'data');
  assert.equal(allocation({ data: 5, innovation: 35 }).data, 5);
});

test('local operating choices build different capabilities while discovery creates no ROI', () => {
  const states = scenarioInitiativesToStates(getScenario('projectFactory').initiatives);
  const funding = { maintenance: { discovery: 2, delivery: 0, scaleUp: 0, run: 0, continuity: 0, retirement: 0, total: 2 } };
  const actions = { maintenance: 'discover' };
  const dataHeavy = updateInitiativeStatesForActions(states, actions, allocation({ data: 40, innovation: 5 }), {
    adoption: 38, fundingIntensity: 1, investmentMultiplier: 1, fundingByInitiative: funding, initiativeAllocationMode: 'shared', initiativeAllocations: {},
  }).maintenance;
  const innovationHeavy = updateInitiativeStatesForActions(states, actions, allocation({ data: 5, innovation: 40 }), {
    adoption: 38, fundingIntensity: 1, investmentMultiplier: 1, fundingByInitiative: funding, initiativeAllocationMode: 'shared', initiativeAllocations: {},
  }).maintenance;
  assert.ok(dataHeavy.dataReadiness > states.maintenance.dataReadiness);
  assert.ok(dataHeavy.evidenceQuality > 0);
  assert.ok(innovationHeavy.hypothesisBreadth > dataHeavy.hypothesisBreadth);
  assert.equal(dataHeavy.benefitRealization, 0);
});

test('delivery choices separate integration readiness from evidence investment', () => {
  const states = scenarioInitiativesToStates(getScenario('projectFactory').initiatives);
  const funding = { maintenance: { discovery: 0, delivery: 2, scaleUp: 0, run: 0, continuity: 0, retirement: 0, total: 2 } };
  const actions = { maintenance: 'pilot' };
  const infraHeavy = updateInitiativeStatesForActions(states, actions, allocation({ infra: 40, data: 5 }), {
    adoption: 38, fundingIntensity: 1, investmentMultiplier: 1, fundingByInitiative: funding, initiativeAllocationMode: 'shared', initiativeAllocations: {},
  }).maintenance;
  const dataHeavy = updateInitiativeStatesForActions(states, actions, allocation({ infra: 5, data: 40 }), {
    adoption: 38, fundingIntensity: 1, investmentMultiplier: 1, fundingByInitiative: funding, initiativeAllocationMode: 'shared', initiativeAllocations: {},
  }).maintenance;
  assert.ok(infraHeavy.integrationReadiness > dataHeavy.integrationReadiness);
  assert.ok(dataHeavy.evidenceQuality > infraHeavy.evidenceQuality);
});
