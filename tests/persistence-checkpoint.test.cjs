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

const storage = new Map();
let failuresRemaining = 0;
global.window = {
  localStorage: {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => {
      if (failuresRemaining > 0) {
        failuresRemaining -= 1;
        throw new Error('QuotaExceededError');
      }
      storage.set(key, String(value));
    },
    removeItem: (key) => storage.delete(key),
  },
};

const { initialGameState } = require('../lib/game/state.ts');
const {
  CAMPAIGN_CHECKPOINTS_STORAGE_KEY,
  saveCampaignCheckpoint,
} = require('../lib/game/persistence.ts');

test('checkpoint writes progressively prune after quota errors', () => {
  storage.clear();
  failuresRemaining = 0;
  const state = initialGameState();
  saveCampaignCheckpoint(state, 'Existing checkpoint');
  failuresRemaining = 1;

  const checkpoint = saveCampaignCheckpoint(state, 'Quota test');

  assert.ok(checkpoint);
  assert.ok(storage.has(CAMPAIGN_CHECKPOINTS_STORAGE_KEY));
  assert.equal(JSON.parse(storage.get(CAMPAIGN_CHECKPOINTS_STORAGE_KEY)).length, 1);
});

test('checkpoint quota exhaustion never blocks the current campaign', () => {
  storage.clear();
  failuresRemaining = Number.POSITIVE_INFINITY;

  assert.doesNotThrow(() => saveCampaignCheckpoint(initialGameState(), 'Unwritable test'));
  assert.equal(storage.has(CAMPAIGN_CHECKPOINTS_STORAGE_KEY), false);
});
