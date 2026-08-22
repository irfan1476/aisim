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
    try { return resolveFilename.call(this, request, parent, isMain, options); }
    catch (error) {
      const candidate = path.resolve(path.dirname(parent.filename), `${request}.ts`);
      if (fs.existsSync(candidate)) return candidate;
      throw error;
    }
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

const { buildBoardAdvisorBrief, answerBoardAdvisorQuestion } = require('../lib/game/boardAdvisor.ts');

function context(overrides = {}) {
  return {
    q: 3, spent: 18, risk: 62, adoption: 42, data: 48,
    alloc: { people: 12, compliance: 8 }, selected: ['fraud', 'credit'],
    campaignBudgetRemaining: 42, deploymentAmount: 10, quarterlyBudget: 10,
    scenarioMode: false, scenarioId: undefined, ...overrides,
  };
}

test('board advisor is deterministic and uses the selected portfolio as evidence', () => {
  const first = buildBoardAdvisorBrief(context(), 'RISK');
  const second = buildBoardAdvisorBrief(context(), 'RISK');
  assert.deepEqual(first, second);
  assert.equal(first.posture, 'focused balance');
  assert.equal(first.evidence.find((item) => item.label === 'Portfolio').value, '2 initiatives · focused balance');
  assert.match(first.lens, /Risk is the binding constraint/);
});

test('board advisor changes lens and bottleneck from recorded scenario context', () => {
  const brief = buildBoardAdvisorBrief(context({
    scenarioMode: true,
    scenarioId: 'bankNext',
    scenarioProgress: { fraudPressure: 72, creditApprovalTime: 65, complianceReadiness: 45, customerTrustIndex: 66, digitalAdoption: 58 },
    selected: ['fraud'],
    deploymentAmount: 0,
  }), 'CFO');
  assert.equal(brief.posture, 'reserve');
  assert.match(brief.scenarioLabel, /BankNext/);
  assert.equal(brief.bottleneck, 'Compliance readiness');
  assert.match(brief.headline, /waiting/);
  assert.ok(brief.suggestedQuestions.length >= 3);
});

test('suggested questions represent distinct evidence and decision prompts', () => {
  const brief = buildBoardAdvisorBrief(context({
    selected: ['fraud', 'credit'],
    deploymentAmount: 8,
    campaignBudgetRemaining: 37,
  }), 'RISK');

  assert.equal(new Set(brief.suggestedQuestions).size, brief.suggestedQuestions.length);
  assert.match(brief.suggestedQuestions[0], /constraint/);
  assert.match(brief.suggestedQuestions[1], /reinforce|compete/i);
  assert.match(brief.suggestedQuestions[2], /change course|reserve/i);
});

test('question-specific answers use recorded evidence rather than a shared persona fallback', () => {
  const current = context();
  const bottleneckAnswer = answerBoardAdvisorQuestion(current, 'RISK', 'What evidence says risk exposure is the next constraint?');
  const reserveAnswer = answerBoardAdvisorQuestion(current, 'RISK', 'What future event would justify releasing the reserve?');
  const peopleAnswer = answerBoardAdvisorQuestion(current, 'CHRO', 'What should we do about people adoption?');

  assert.notEqual(bottleneckAnswer, reserveAnswer);
  assert.notEqual(reserveAnswer, peopleAnswer);
  assert.match(bottleneckAnswer, /62%/);
  assert.match(reserveAnswer, /\$10\.0M/);
  assert.match(reserveAnswer, /\$42\.0M/);
  assert.match(peopleAnswer, /Adoption is 42%/);
  assert.match(bottleneckAnswer, /Evidence\n[\s\S]*Trade-off\n[\s\S]*Next check/);
});

test('scenario answers only surface recorded scenario relationships', () => {
  const bankContext = context({
    scenarioMode: true,
    scenarioId: 'bankNext',
    selected: ['fraudDetection', 'complianceMonitoring'],
    scenarioProgress: {
      fraudPressure: 72,
      creditApprovalTime: 65,
      complianceReadiness: 45,
      customerTrustIndex: 66,
      digitalAdoption: 58,
    },
  });
  const answer = answerBoardAdvisorQuestion(bankContext, 'CFO', 'Do these initiatives reinforce one another?');
  assert.match(answer, /Control tower/);
  assert.match(answer, /Fraud detection/i);
  assert.match(answer, /Compliance monitoring/i);
  assert.match(answer, /Compliance readiness/);
});
