const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8');

test('landing copy preserves scenario discovery instead of naming initiative spoilers', () => {
  const landingCopy = [
    read('app', 'page.tsx'),
    read('components', 'TransparencyFlow.tsx'),
    read('components', 'HowToPlayGuide.tsx'),
  ].join('\n');

  [
    'Predictive Maintenance',
    'AI Visual Quality',
    'AI Fraud Detection',
    'AI Radiology Assistant',
    'AI Student Success Predictor',
  ].forEach((initiative) => {
    assert.ok(!landingCopy.includes(initiative), `landing copy should not reveal ${initiative}`);
  });
});

test('landing page makes the final report and deliberate replay visible', () => {
  const landing = read('app', 'page.tsx');
  const replayVisual = read('components', 'CampaignEvidenceReplayVisual.tsx');

  assert.match(landing, /CampaignEvidenceReplayVisual/, 'homepage must include the outcome-loop visual');
  assert.match(replayVisual, /Final strategy report/, 'the visual must name the final report');
  assert.match(replayVisual, /Replay and compare/, 'the visual must name replay and comparison');
  assert.match(replayVisual, /saved locally/i, 'the visual must explain campaign persistence');
});

test('final report visual keeps its evidence caption within the report card', () => {
  const visual = read('components', 'CampaignEvidenceReplayVisual.tsx');

  assert.match(visual, /What worked · what constrained value/);
  assert.match(visual, /What to test on your next run/);
  assert.doesNotMatch(visual, /What worked · what constrained value · what to test next/);
});
