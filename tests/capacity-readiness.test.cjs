const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: filename }).outputText;
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

const { allocationToReadiness } = require('../lib/game/allocation.ts');
const { deriveCapacityState, calculateCapacityDemand, validatePortfolioCapacity } = require('../lib/game/capacity.ts');
const { evaluateInitiativeGate } = require('../lib/game/readiness.ts');

const allocation = { infra: 35, data: 25, people: 15, mlops: 10, compliance: 10, innovation: 5 };
const initiatives = {
  safe: { id: 'safe', name: 'Safe', cost: 1, roi: 100, risk: 'LOW', data: 2, human: 2 },
  risky: { id: 'risky', name: 'Risky', cost: 1, roi: 100, risk: 'HIGH', data: 5, human: 5 },
};

test('readiness reflects actual allocation and can be zero', () => {
  assert.deepEqual(allocationToReadiness({ infra: 0, data: 0, people: 0, mlops: 0, compliance: 0, innovation: 100 }), { data: 0, people: 0, governance: 0, technical: 0 });
});

test('capacity derives from allocation and supports scenario overrides', () => {
  const derived = deriveCapacityState(allocation);
  assert.ok(derived.deliveryTeams > 1);
  assert.equal(deriveCapacityState(allocation, { capacity: { deliveryTeams: 4 } }).deliveryTeams, 4);
});

test('portfolio demand aggregates action loads and reports capacity issues', () => {
  const demand = calculateCapacityDemand({ safe: 'scale', risky: 'scale' }, initiatives);
  assert.ok(demand.deliveryTeams > 0);
  const result = validatePortfolioCapacity({ safe: 'scale', risky: 'scale' }, initiatives, { deliveryTeams: 0.5, changeCapacity: 0.5, dataEngineeringCapacity: 0.5, governanceReviewCapacity: 0.5 });
  assert.equal(result.valid, false);
  assert.ok(result.issues.length > 0 || Object.values(result.gates).some(gate => gate.status === 'blocked'));
});

test('high-risk initiative gets a gate when data or controls are insufficient', () => {
  const result = evaluateInitiativeGate(initiatives.risky, undefined, { infra: 10, data: 5, people: 5, mlops: 5, compliance: 5, innovation: 70 });
  assert.notEqual(result.status, 'ready');
  assert.ok(result.issues.some(issue => issue.code === 'DATA_READINESS' || issue.code === 'CONTROL_MATURITY'));
});

