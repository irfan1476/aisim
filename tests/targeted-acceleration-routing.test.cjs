const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
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
const { normalizeAccelerationAllocations, accelerationAllocationTotal } = require('../lib/game/accelerationAllocation.ts');

test('focused acceleration helper normalizes a proportional default', () => {
  const split = normalizeAccelerationAllocations(['a', 'b'], undefined, { a: 3, b: 1 });
  assert.equal(accelerationAllocationTotal(split), 100);
  assert.equal(split.a, 75);
  assert.equal(split.b, 25);
});

test('focused acceleration helper leaves incomplete raw edits visible to the UI', () => {
  const split = normalizeAccelerationAllocations(['a', 'b'], { a: 70, b: 20 });
  assert.equal(accelerationAllocationTotal(split), 100);
  assert.equal(split.a, 77.78);
  assert.equal(split.b, 22.22);
});
