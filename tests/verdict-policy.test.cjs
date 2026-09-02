const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
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

const { deriveCampaignVerdict } = require('../lib/game/verdict.ts');

const baseline = { adoption: 70, risk: 30, validatedLearning: 70, deliveryQuarters: 6, discoveryQuarters: 2 };

test('shared verdict policy mirrors player-facing A and A+ thresholds', () => {
  assert.equal(deriveCampaignVerdict({ ...baseline, score: 82, scenarioMode: true, missionReady: true, masteryReady: true }).grade, 'A+');
  assert.equal(deriveCampaignVerdict({ ...baseline, score: 62, scenarioMode: true, missionReady: true, masteryReady: false }).grade, 'A');
  assert.equal(deriveCampaignVerdict({ ...baseline, score: 50, scenarioMode: true, missionReady: false, masteryReady: false }).grade, 'B+');
  assert.equal(deriveCampaignVerdict({ ...baseline, score: 35, scenarioMode: true, missionReady: false, masteryReady: false }).grade, 'B');
});

test('a scenario score cannot earn A without its authored mission gate', () => {
  const guarded = deriveCampaignVerdict({ ...baseline, score: 80, scenarioMode: true, missionReady: false, masteryReady: false });
  assert.equal(guarded.grade, 'B+');
  const standard = deriveCampaignVerdict({ ...baseline, score: 80, scenarioMode: false });
  assert.equal(standard.grade, 'A');
});
