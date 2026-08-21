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

const { normalizeGameState } = require('../lib/game/persistence.ts');

const fixtureDir = path.join(__dirname, 'fixtures', 'v2');
const fixtures = [
  ['standard-q2.json', false, undefined],
  ['project-factory-q2.json', true, 'projectFactory'],
  ['bank-next-q2.json', true, 'bankNext'],
  ['care360-q2.json', true, 'care360'],
  ['future-ready-q2.json', true, 'futureReady'],
];

for (const [filename, scenarioMode, scenarioId] of fixtures) {
  test(`V2 fixture remains loadable: ${filename}`, () => {
    const payload = JSON.parse(fs.readFileSync(path.join(fixtureDir, filename), 'utf8'));
    // These inputs deliberately remain frozen at the pre-V3 persistence version.
    assert.equal(payload.version, 5);

    const normalized = normalizeGameState(payload);
    assert.equal(normalized.q, 2);
    assert.equal(normalized.scenarioMode, scenarioMode);
    assert.equal(normalized.scenarioId, scenarioId);
    assert.equal(normalized.v3State, undefined, `${filename} must not opt into V3 state without pack metadata`);
    assert.equal(normalized.history.length, 1);
    assert.equal(normalized.history[0].q, 1);
    assert.deepEqual(normalizeGameState(payload), normalized, 'normalization must be idempotent');
  });
}

test('V2 fixtures are compact source-shaped saves, not generated artifacts', () => {
  const files = fs.readdirSync(fixtureDir).filter((name) => name.endsWith('.json'));
  assert.deepEqual(files.sort(), fixtures.map(([name]) => name).sort());
  for (const filename of files) {
    const payload = JSON.parse(fs.readFileSync(path.join(fixtureDir, filename), 'utf8'));
    assert.equal(payload.version, 5);
    assert.ok(!payload.state.initiativeStates, `${filename} should not embed generated defaults`);
  }
});
