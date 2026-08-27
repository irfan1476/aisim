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
    try { return resolveFilename.call(this, request, parent, isMain, options); }
    catch (error) {
      const candidate = path.resolve(path.dirname(parent.filename), `${request}.ts`);
      if (fs.existsSync(candidate)) return candidate;
      throw error;
    }
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

const { firstQuarterPlan, hasCompletedBaseline } = require('../lib/game/firstQuarter.ts');
const { initialGameState } = require('../lib/game/state.ts');

test('baseline completion requires five valid answers rather than a sparse array length', () => {
  assert.equal(hasCompletedBaseline([1, 2, 3, 4, 5]), true);
  assert.equal(hasCompletedBaseline([1, 2, 3, 4, 0]), false);
  assert.equal(hasCompletedBaseline([1, 2, 3, 4, 6]), false);
  assert.equal(hasCompletedBaseline([1, 2, 3, 4, , 5]), false);
});

test('first-quarter plan is actionable, lifecycle-valid guidance with three bounded capital paces', () => {
  const state = initialGameState(undefined, { campaignBudget: 60, quarterlyBudget: 5 });
  const plan = firstQuarterPlan(state);
  assert.ok(plan);
  assert.ok(state.initiativeStates[plan.initiativeId]);
  assert.equal(plan.action, 'discover');
  assert.deepEqual(plan.allocation, state.alloc);
  assert.ok(plan.deploymentByPace.cautious > 0);
  assert.ok(plan.deploymentByPace.cautious < plan.deploymentByPace.recommended);
  assert.ok(plan.deploymentByPace.recommended < plan.deploymentByPace.accelerated);
  assert.ok(plan.deploymentByPace.accelerated <= state.quarterlyDeploymentCap);
});
