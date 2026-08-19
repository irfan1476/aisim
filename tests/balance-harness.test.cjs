const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveTypeScriptImports(
  request,
  parent,
  isMain,
  options,
) {
  if (request.startsWith(".") && !path.extname(request)) {
    try {
      return resolveFilename.call(this, request, parent, isMain, options);
    } catch (error) {
      const candidate = path.resolve(
        path.dirname(parent.filename),
        `${request}.ts`,
      );
      if (fs.existsSync(candidate)) return candidate;
      throw error;
    }
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};

const { deriveScore, resolveQuarter } = require("../lib/game/engine.ts");
const {
  createInferredGeneration,
  inferArchetypeFromCampaignDetailed,
} = require("../lib/game/generator.ts");
const { initialGameState } = require("../lib/game/state.ts");

const strategies = [
  {
    id: "balanced",
    expected: "balanced",
    baseline: [3, 3, 3, 4, 3],
    allocation: {
      infra: 25,
      data: 25,
      people: 18,
      mlops: 10,
      compliance: 12,
      innovation: 10,
    },
    rotations: [
      ["demand", "energy", "quality"],
      ["knowledge", "maintenance", "supply"],
    ],
  },
  {
    id: "data-driven",
    expected: "data-driven",
    baseline: [3, 3, 3, 5, 4],
    allocation: {
      infra: 18,
      data: 36,
      people: 15,
      mlops: 10,
      compliance: 12,
      innovation: 9,
    },
    rotations: [
      ["demand", "supply", "quality"],
      ["demand", "maintenance", "supply"],
    ],
  },
  {
    id: "people-first",
    expected: "people-first",
    baseline: [5, 3, 3, 4, 3],
    allocation: {
      infra: 20,
      data: 20,
      people: 25,
      mlops: 10,
      compliance: 10,
      innovation: 15,
    },
    rotations: [
      ["knowledge", "demand", "maintenance"],
      ["knowledge", "quality", "energy"],
    ],
  },
  {
    id: "tech-first",
    expected: "tech-first",
    baseline: [2, 4, 2, 2, 5],
    allocation: {
      infra: 30,
      data: 30,
      people: 12,
      mlops: 15,
      compliance: 8,
      innovation: 5,
    },
    rotations: [
      ["maintenance", "quality", "energy"],
      ["maintenance", "quality", "supply"],
    ],
  },
  {
    id: "risk-tolerant",
    expected: "risk-tolerant",
    baseline: [2, 5, 2, 2, 5],
    allocation: {
      infra: 25,
      data: 25,
      people: 12,
      mlops: 10,
      compliance: 8,
      innovation: 20,
    },
    rotations: [
      ["knowledge", "maintenance", "supply"],
      ["maintenance", "supply", "quality"],
    ],
  },
  {
    id: "risk-averse",
    expected: "risk-averse",
    baseline: [3, 1, 5, 3, 2],
    allocation: {
      infra: 18,
      data: 25,
      people: 20,
      mlops: 10,
      compliance: 20,
      innovation: 7,
    },
    rotations: [
      ["quality", "energy", "demand"],
      ["quality", "energy", "knowledge"],
    ],
  },
];

function grade(result) {
  if (
    result.score >= 88 &&
    result.adoption >= 70 &&
    result.risk <= 20 &&
    result.people >= 20
  )
    return "A+";
  if (result.score >= 80 && result.adoption >= 55 && result.risk <= 25)
    return "A";
  if (result.score > 65) return "B+";
  if (result.score >= 50) return "B";
  return "C";
}

function mean(values) {
  return (
    values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)
  );
}

function deviation(values) {
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function rounded(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function simulate(strategy, seed) {
  const generation = createInferredGeneration(strategy.baseline, seed);
  let state = {
    ...initialGameState(generation),
    baseline: [...strategy.baseline],
    selected: [],
  };

  for (let quarter = 1; quarter <= 12; quarter += 1) {
    const selected =
      strategy.rotations[(quarter + seed) % strategy.rotations.length];
    const result = resolveQuarter(state, {
      selected,
      alloc: strategy.allocation,
    });
    const score = deriveScore(state, result.metrics);
    state = {
      ...state,
      ...result.metrics,
      q: quarter + 1,
      score,
      initiativeStates: result.initiativeStates,
      history: [...state.history, result.snapshot],
    };
  }

  const inference = inferArchetypeFromCampaignDetailed(
    strategy.baseline,
    state.history,
  );
  return {
    seed,
    strategy: strategy.id,
    expected: strategy.expected,
    archetype: inference.archetype,
    confidence: inference.confidence,
    score: state.score,
    roi: state.roi,
    adoption: state.adoption,
    risk: state.risk,
    spent: state.spent,
    people: strategy.allocation.people,
    initiativesSelected: Array.from(
      new Set(state.history.flatMap((item) => item.selectedIds || [])),
    ),
    grade: grade({ ...state, people: strategy.allocation.people }),
  };
}

function summarize(results) {
  const gradeDistribution = { "A+": 0, A: 0, "B+": 0, B: 0, C: 0 };
  const archetypeFrequency = {};
  results.forEach((result) => {
    gradeDistribution[result.grade] =
      (gradeDistribution[result.grade] || 0) + 1;
    archetypeFrequency[result.archetype] =
      (archetypeFrequency[result.archetype] || 0) + 1;
  });
  const scores = results.map((result) => result.score);
  const correct = results.filter(
    (result) => result.archetype === result.expected,
  ).length;
  return {
    campaigns: results.length,
    averageScore: rounded(mean(scores)),
    scoreStandardDeviation: rounded(deviation(scores)),
    averageRoi: rounded(mean(results.map((result) => result.roi))),
    averageAdoption: rounded(mean(results.map((result) => result.adoption))),
    averageRisk: rounded(mean(results.map((result) => result.risk))),
    averageSpend: rounded(mean(results.map((result) => result.spent))),
    averageConfidence: rounded(
      mean(results.map((result) => result.confidence)),
    ),
    gradeDistribution,
    archetypeFrequency,
    classificationAccuracy: rounded((correct / results.length) * 100),
  };
}

test("organic simulation remains balanced and archetypes stay discoverable", () => {
  const resultsByStrategy = Object.fromEntries(
    strategies.map((strategy) => {
      const results = Array.from({ length: 100 }, (_, index) =>
        simulate(strategy, 10_000 + index * 97),
      );
      return [strategy.id, { ...summarize(results), results }];
    }),
  );
  const summaries = Object.fromEntries(
    Object.entries(resultsByStrategy).map(([id, value]) => [
      id,
      Object.fromEntries(
        Object.entries(value).filter(([key]) => key !== "results"),
      ),
    ]),
  );
  const averages = Object.values(summaries).map(
    (summary) => summary.averageScore,
  );
  const allResults = Object.values(resultsByStrategy).flatMap(
    (value) => value.results,
  );
  const overall = summarize(allResults);
  const scoreSpread = Math.max(...averages) - Math.min(...averages);
  const warnings = [];

  Object.entries(summaries).forEach(([strategy, summary]) => {
    if (summary.classificationAccuracy < 80)
      warnings.push(
        `${strategy} classification accuracy is ${summary.classificationAccuracy}%`,
      );
  });
  if (scoreSpread > 10)
    warnings.push(`Average score spread is ${rounded(scoreSpread)} points`);
  Object.keys(overall.archetypeFrequency).forEach((archetype) => {
    const share =
      (overall.archetypeFrequency[archetype] / overall.campaigns) * 100;
    if (share < 5)
      warnings.push(
        `${archetype} appears in only ${rounded(share)}% of campaigns`,
      );
  });

  const report = {
    generatedAt: new Date().toISOString(),
    campaignsPerStrategy: 100,
    strategies: summaries,
    overall,
    findings: {
      bestAverageStrategy: Object.entries(summaries).sort(
        (left, right) => right[1].averageScore - left[1].averageScore,
      )[0][0],
      highestVarianceStrategy: Object.entries(summaries).sort(
        (left, right) =>
          right[1].scoreStandardDeviation - left[1].scoreStandardDeviation,
      )[0][0],
      allArchetypesAchievable:
        Object.keys(overall.archetypeFrequency).length === 6,
      anyStrategyDominating: scoreSpread > 10,
    },
    balance: {
      averageScoreSpread: rounded(scoreSpread),
      maximumAllowedSpread: 10,
    },
    visualizations: {
      averageScoreBars: Object.fromEntries(
        Object.entries(summaries).map(([id, summary]) => [
          id,
          `${"█".repeat(Math.round(summary.averageScore / 5))} ${summary.averageScore}`,
        ]),
      ),
      gradeDistribution: overall.gradeDistribution,
      archetypeFrequency: overall.archetypeFrequency,
    },
    warnings,
  };

  fs.writeFileSync(
    path.resolve(__dirname, "..", "balance-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  strategies.forEach((strategy) => {
    assert.ok(
      summaries[strategy.id].classificationAccuracy >= 80,
      `${strategy.id} should classify correctly in at least 80% of campaigns`,
    );
  });
  assert.ok(
    scoreSpread <= 10,
    `No strategy should dominate by more than 10 average score points; observed ${rounded(scoreSpread)}`,
  );
  assert.equal(warnings.length, 0, warnings.join("; "));
});
