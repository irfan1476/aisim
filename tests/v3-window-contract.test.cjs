const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  fileName: filename,
}).outputText, filename);

const { createV3State } = require('../lib/game/state.ts');
const { normalizeGameState } = require('../lib/game/persistence.ts');
const { resolveV3Window } = require('../lib/game/v3Runtime.ts');
const { projectFactoryV3Pack } = require('../lib/scenarios/projectFactoryV3.ts');

function inputs(baselineResponses = []) {
  const v3State = createV3State('project-factory-2030', 2030, 5, projectFactoryV3Pack.initiatives.map((item) => item.id), projectFactoryV3Pack);
  v3State.baseline = { version: 'v1', responses: baselineResponses.map((response, index) => ({ questionId: `baseline-${index + 1}`, version: 'v1', response })) };
  const metrics = Object.fromEntries([...projectFactoryV3Pack.metrics, ...projectFactoryV3Pack.reportedMetrics]
    .filter((metric) => metric.start !== undefined)
    .map((metric) => [metric.key, metric.start]));
  return {
    gameState: { v3State },
    pack: projectFactoryV3Pack,
    window: projectFactoryV3Pack.windowOne,
    plan: [{ initiativeId: 'maintenance', lifecycle: 'research', cost: 0.25, capacity: { data_engineering: 1, governance_assurance: 1 } }],
    ledger: { id: 'window-1-maintenance', quarter: 1, initiativeIds: ['maintenance'], rationale: 'Test the reliability evidence boundary.', prediction: 'Research will support a constrained pilot.', assumption: 'The named owner and review capacity can be confirmed.', evidenceIds: ['PF-E01', 'PF-E02'], gateIds: [] },
    metrics,
  };
}

test('Window 1 resolves Q1–Q3 with a branch, snapshots, and no Research operating benefit', () => {
  const result = resolveV3Window(inputs());
  assert.equal(result.accepted, true, JSON.stringify(result.errors));
  assert.equal(result.metrics.unplanned_downtime_share, 12);
  assert.equal(result.metrics.first_pass_yield, 91.2);
  assert.equal(result.metrics.workforce_readiness, 52);
  assert.equal(result.researchReview.branch, 'pilot-ready-with-conditions');
  assert.equal(result.researchReview.outcome.id, 'PF-R01-A');
  assert.equal(result.state.researchReviews.maintenance.status, 'pilot-ready-with-conditions');
  assert.deepEqual(result.state.capacity.schedule['1'], { data_engineering: 1, governance_assurance: 1 });
  assert.equal(result.state.windowHistory.length, 1);
  assert.deepEqual(result.state.windowHistory[0].quarterSnapshots.map((item) => item.quarter), [1, 2, 3]);
  assert.equal(result.state.ledger[0].outcome.status, 'pilot-ready-with-conditions');
  assert.equal(result.state.ledger[0].outcome.researchOutcomeArtifactId, 'PF-R01-A');
  assert.match(result.state.ledger[0].outcome.uncertainty.join(' '), /Technician disposition|safe maintenance/);
  assert.equal(result.value.find((item) => item.metric === 'unplanned_downtime_share').status, 'not-yet-observable');
});

test('Baseline responses are persisted for reflection and cannot change the same seeded outcome', () => {
  const first = resolveV3Window(inputs(['1', '1', '1', '1', '1']));
  const second = resolveV3Window(inputs(['5', '5', '5', '5', '5']));
  assert.deepEqual(first.metrics, second.metrics);
  assert.deepEqual(first.researchReview, second.researchReview);
  assert.deepEqual(first.state.windowHistory, second.state.windowHistory);
  assert.notDeepEqual(first.state.baseline, second.state.baseline);
});

test('Window history and Research review survive V3 save normalization', () => {
  const result = resolveV3Window(inputs(['3', '3', '3', '3', '3']));
  const restored = normalizeGameState({ scenarioMode: true, scenarioId: 'project-factory-2030', baseline: [3, 3, 3, 3, 3], v3State: result.state });
  assert.equal(restored.v3State.windowHistory.length, 1);
  assert.equal(restored.v3State.researchReviews.maintenance.outcomeArtifactId, 'PF-R01-A');
  assert.deepEqual(restored.v3State.capacity.schedule['1'], { data_engineering: 1, governance_assurance: 1 });
});
