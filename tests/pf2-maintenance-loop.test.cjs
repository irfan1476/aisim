const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText, filename);
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

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'v3', 'project-factory-v3.json'), 'utf8'));
const { createV3State } = require('../lib/game/state.ts');
const { resolveV3Decision } = require('../lib/game/v3Runtime.ts');
const { projectV3Analytics } = require('../lib/game/analyticsProjection.ts');

test('PF2 predictive-maintenance loop stays evidence-led from plan through sidecar projection', () => {
  const v3State = createV3State('projectFactory', 4242, 5, ['maintenance'], fixture);
  v3State.capacity.pools.technicians = 4;
  const input = {
    gameState: { v3State },
    pack: fixture,
    plan: [{ initiativeId: 'maintenance', lifecycle: 'research', cost: 1, capacity: { technicians: 2 } }],
    ledger: {
      id: 'window-1', quarter: 1, initiativeIds: ['maintenance'],
      rationale: 'Validate asset data before exposing technicians to a pilot workflow.',
      prediction: 'Reviewed asset evidence will support an uptime improvement.',
      assumption: 'Telemetry coverage is sufficient for research.',
      evidenceIds: ['asset-data'], gateIds: ['asset-evidence'],
    },
    evidenceIds: ['asset-data'],
    metrics: { uptime: 70 },
    gateChecks: [{ gateId: 'asset-evidence', evidenceIds: ['asset-data'] }],
  };
  const before = JSON.stringify(v3State);
  const resolution = resolveV3Decision(input);
  assert.equal(resolution.accepted, true, JSON.stringify(resolution.errors));
  assert.equal(resolution.state.initiatives.maintenance.lifecycle, 'research');
  assert.equal(resolution.state.gates['asset-evidence'].status, 'met');
  assert.equal(resolution.metrics.uptime, 70, 'Research must not produce operating benefit.');
  assert.equal(resolution.state.ledger[0].evidenceIds[0], 'asset-data');
  assert.equal(JSON.stringify(v3State), before, 'resolver must not mutate the pre-resolution state');

  const projection = projectV3Analytics(resolution.state, fixture, [{ metrics: resolution.metrics }], { score: 99, roi: 99, revenue: 99, efficiency: 99, adoption: 99 });
  assert.ok(projection);
  assert.equal(projection.ledger[0].initiativeIds[0], 'maintenance');
  assert.equal(projection.ledger[0].evidenceIds[0], 'asset-data');
  assert.equal(projection.metrics.uptime.current, 70);
  assert.deepEqual(projection.metrics.uptime.sourceRuleIds, ['maintenance-signal']);
  assert.deepEqual(projection.metrics.uptime.sourceEvidenceIds, ['asset-data']);
  assert.equal(projection.gates['asset-evidence'].status, 'met');
  assert.equal(projection.dashboard.activeInitiatives, 1);
  assert.equal(projection.hiddenLegacyResult.score, 99, 'legacy score is only a hidden compatibility input');
});
