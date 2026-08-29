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
const { calculateScenarioMissionProgress, scenarioOutcomeRole } = require('../lib/scenarios/progress.ts');

test('all scenario packs author primary, supporting, and guardrail outcomes', () => {
  ['projectFactory', 'care360', 'bankNext', 'futureReady'].forEach((id) => {
    const scenario = getScenario(id);
    const roles = new Set(scenario.progress.map(scenarioOutcomeRole));
    assert.deepEqual([...roles].sort(), ['guardrail', 'primary', 'supporting']);
  });
});

test('mission progress weights primary outcomes and does not require supporting targets', () => {
  const scenario = getScenario('projectFactory');
  const metrics = { ...scenario.startingState.startingMetrics, downtimePressure: 35, defectRate: 200, supplyContinuity: 65 };
  const mission = calculateScenarioMissionProgress(metrics, scenario);
  assert.equal(mission.primaryProgress, 100);
  assert.equal(mission.supportingProgress, 0);
  assert.equal(mission.guardrailProtection, 100);
  assert.equal(mission.missionReady, true);
  assert.ok(mission.missionProgress >= 60 && mission.missionProgress < 75);
});

test('deteriorating guardrails are explicit mission blockers', () => {
  const scenario = getScenario('bankNext');
  const metrics = { ...scenario.startingState.startingMetrics, fraudPressure: 30, creditApprovalTime: 24, complianceReadiness: 20 };
  const mission = calculateScenarioMissionProgress(metrics, scenario);
  assert.ok(mission.primaryProgress >= 99);
  assert.ok(mission.guardrailProtection < 100);
  assert.equal(mission.missionReady, false);
  assert.ok(mission.blockers.some((blocker) => blocker.includes('guardrail')));
});

test('legacy untyped packs get a primary fallback for mission calculation', () => {
  const scenario = {
    ...getScenario('projectFactory'),
    progress: getScenario('projectFactory').progress.map(({ role, ...definition }) => definition),
  };
  const mission = calculateScenarioMissionProgress(scenario.startingState.startingMetrics, scenario);
  assert.equal(mission.roles.primary.outcomeKeys.length, 1);
  assert.equal(mission.roles.supporting.outcomeKeys.length, 4);
});
