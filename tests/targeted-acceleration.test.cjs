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
const { calculateActionCapitalPlan } = require('../lib/game/capital.ts');

test('explicit acceleration split routes the full pool to the chosen initiative', () => {
  const state = initialGameState();
  const actions = { demand: 'pilot', energy: 'scale', maintenance: 'maintain' };
  const floor = calculateActionCapitalPlan(state, actions, 100).requiredCapital;
  const plan = calculateActionCapitalPlan(state, actions, floor + 6, state.quarterlyCrisisCost, {
    demand: 100,
    energy: 0,
    maintenance: 0,
  });

  assert.equal(plan.accelerationSpend, 6);
  assert.equal(plan.byInitiative.demand.scaleUp, 6);
  assert.equal(plan.byInitiative.energy.scaleUp, 0);
  assert.equal(plan.byInitiative.maintenance.scaleUp, 0);
  assert.deepEqual(plan.accelerationAllocations, { demand: 100 });
});

test('missing split preserves proportional acceleration and never funds pause or retire', () => {
  const state = initialGameState();
  const actions = { demand: 'pilot', energy: 'pause', maintenance: 'retire' };
  const floor = calculateActionCapitalPlan(state, actions, 100).requiredCapital;
  const plan = calculateActionCapitalPlan(state, actions, floor + 4);

  assert.equal(plan.accelerationSpend, 4);
  assert.equal(plan.byInitiative.energy.scaleUp, 0);
  assert.equal(plan.byInitiative.maintenance.scaleUp, 0);
  assert.equal(plan.byInitiative.demand.scaleUp, 4);
});
