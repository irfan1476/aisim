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

test('decision screen keeps first-time controls progressive and explains lifecycle choices', () => {
  const decision = read('components', 'GameDecisionView.tsx');
  const controls = read('components', 'OperatingSystemControls.tsx');

  assert.match(decision, /Select this initiative to choose its next action/, 'unselected cards should not expose an active lifecycle selector');
  assert.match(decision, /not ready/, 'invalid lifecycle actions should be labelled rather than silently offered');
  assert.match(decision, /Build evidence and data readiness now/, 'discovery must explain that it is evidence work');
  assert.match(decision, /Paused this quarter · no new investment/, 'default persisted pauses should have neutral card copy');
  assert.match(decision, /Revisit, revise, or retire next quarter/, 'selected pause should explain its next decision');
  assert.match(decision, /monitor performance and risk before changing course/, 'maintain should explain its next decision');
  assert.doesNotMatch(decision, /follow the decision path below/, 'initiative cards should not use generic next-step copy');
  assert.match(decision, /Advanced: tailor each initiative/, 'per-initiative allocation should be behind an advanced disclosure');
  assert.match(controls, /Advanced controls: change the team support mix/, 'opening allocation controls should be progressive');
  assert.match(controls, /Money to invest/, 'capital labels should use learner language');
});

test('final verdict rewards meaningful progress instead of collapsing every result into B', () => {
  const report = read('components', 'GameDoneScreen.tsx');

  assert.match(report, /if \(score >= 82\)/, 'A+ should be attainable from the full campaign score');
  assert.match(report, /if \(score >= 66\)/, 'strong strategic campaigns should reach A');
  assert.match(report, /if \(score >= 52\)/, 'meaningful investment and delivery should reach B+');
  assert.match(report, /Foundation Builder/, 'mid-range results should be framed as constructive progress');
  assert.match(report, /Early Explorer/, 'low outcomes should remain distinct from a generic B');
  assert.doesNotMatch(report, /Developing Practitioner/, 'the old discouraging default verdict should be retired');
});
