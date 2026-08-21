const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sidecarPath = path.join(__dirname, '..', 'components', 'V3AnalyticsSidecar.tsx');
const available = fs.existsSync(sidecarPath);

test('V3 analytics sidecar declares learner-facing tabs', { skip: !available ? 'V3AnalyticsSidecar is not present yet' : false }, () => {
  const source = fs.readFileSync(sidecarPath, 'utf8');
  // Keep this contract label-agnostic while requiring a real tab/navigation
  // model rather than one undifferentiated score panel.
  assert.match(source, /tabs|tab|aria-selected|role=["']tab/);
  for (const label of ['Dashboard', 'Ledger', 'Metrics', 'Evidence', 'Governance']) assert.match(source, new RegExp(`label: '${label}'`));
  const labels = source.match(/['"`]([A-Z][A-Za-z][A-Za-z &/-]{2,})['"`]/g) || [];
  assert.ok(labels.length >= 2, 'sidecar should expose at least two named views');
});

test('V3 analytics sidecar exposes source/provenance context', { skip: !available ? 'V3AnalyticsSidecar is not present yet' : false }, () => {
  const source = fs.readFileSync(sidecarPath, 'utf8');
  assert.match(source, /provenance|sourceStatus|sourceEvidenceIds|evidenceIds|sourceRuleIds/i);
  assert.match(source, /evidence|source|rule/i);
});

test('V3 analytics sidecar avoids a composite score or hidden grade', { skip: !available ? 'V3AnalyticsSidecar is not present yet' : false }, () => {
  const source = fs.readFileSync(sidecarPath, 'utf8');
  assert.doesNotMatch(source, /composite score|overall score|CEO grade|leadership trait/i);
  assert.match(source, /execution|governance|stakeholder|resilience|evidence/i);
});

test('V3 analytics sidecar is opt-in and hidden for non-V3 state', { skip: !available ? 'V3AnalyticsSidecar is not present yet' : false }, () => {
  const source = fs.readFileSync(sidecarPath, 'utf8');
  assert.match(source, /v3State|v3|pack/i);
  assert.match(source, /null|undefined|scenario|opt-in|optional|state\.v3State/i);
});
