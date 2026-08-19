import { initiatives, type Initiative } from "./initiatives";

// Archetype is an internal diagnosis. It is intentionally not a player-facing mode.
export type ScenarioArchetype =
  | "balanced"
  | "data-driven"
  | "people-first"
  | "tech-first"
  | "risk-tolerant"
  | "risk-averse";
export type MaturityContext = {
  organization: number;
  data: number;
  team: number;
};
export type InitiativeGeneration = {
  seed: number;
  archetype: ScenarioArchetype;
  context: MaturityContext;
};
export type DynamicInitiative = Initiative & {
  baseRoi: number;
  baseCost: number;
  baseData: number;
  baseHuman: number;
  baseRiskScore: number;
  riskScore: number;
  synergies: string[];
};
export type CampaignDecision = {
  allocation?: Record<string, number>;
  selectedIds?: string[];
  chosen?: string[];
  metrics?: Record<string, number>;
  synergiesDiscovered?: string[];
};
export type CampaignArchetypeInference = {
  archetype: ScenarioArchetype;
  confidence: number;
  runnerUp: ScenarioArchetype;
  scores: Record<ScenarioArchetype, number>;
  evidence: string[];
};
export type SynergyEffect = {
  key: string;
  ids: [string, string];
  roiBoost: number;
  riskReduction: number;
  adoptionBoost: number;
  costReduction: number;
  message: string;
};

const synergyEffects: SynergyEffect[] = [
  {
    key: "demand:knowledge",
    ids: ["demand", "knowledge"],
    roiBoost: 0.08,
    riskReduction: 1,
    adoptionBoost: 2,
    costReduction: 0.01,
    message:
      "Forecasting evidence is making frontline knowledge easier to apply.",
  },
  {
    key: "knowledge:maintenance",
    ids: ["knowledge", "maintenance"],
    roiBoost: 0.05,
    riskReduction: 1,
    adoptionBoost: 2,
    costReduction: 0.02,
    message: "Technician knowledge is accelerating maintenance learning.",
  },
  {
    key: "maintenance:quality",
    ids: ["maintenance", "quality"],
    roiBoost: 0.08,
    riskReduction: 1.5,
    adoptionBoost: 1,
    costReduction: 0.03,
    message:
      "Asset and quality signals are reinforcing the same operating loop.",
  },
  {
    key: "energy:maintenance",
    ids: ["energy", "maintenance"],
    roiBoost: 0.06,
    riskReduction: 1,
    adoptionBoost: 0,
    costReduction: 0.02,
    message:
      "Energy and asset telemetry are reducing delivery friction together.",
  },
  {
    key: "demand:supply",
    ids: ["demand", "supply"],
    roiBoost: 0.07,
    riskReduction: 1.5,
    adoptionBoost: 1,
    costReduction: 0.02,
    message:
      "Demand and supplier signals are creating an end-to-end planning advantage.",
  },
];
const synergyMap = synergyEffects.reduce<Record<string, string[]>>(
  (map, effect) => {
    const [left, right] = effect.ids;
    map[left] = [...(map[left] || []), right];
    map[right] = [...(map[right] || []), left];
    return map;
  },
  {},
);
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const riskBand = (score: number): "LOW" | "MED" | "HIGH" =>
  score < 35 ? "LOW" : score < 65 ? "MED" : "HIGH";

function seededRandom(seed: number) {
  let value = seed >>> 0 || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function inferArchetypeFromDecisions(
  baseline: number[] = [],
  allocation?: Record<string, number>,
  selected: string[] = [],
): ScenarioArchetype {
  const answers = baseline.length ? baseline : [3, 3, 3, 3, 3];
  const people = answers[0] || 3;
  const riskAppetite = answers[1] || 3;
  const governance = answers[2] || 3;
  const balance = answers[3] || 3;
  const payback = answers[4] || 3;
  if (allocation) {
    if ((allocation.people || 0) >= 22) return "people-first";
    if ((allocation.infra || 0) + (allocation.mlops || 0) >= 48)
      return "tech-first";
    if ((allocation.compliance || 0) >= 20 || riskAppetite <= 2)
      return "risk-averse";
    if ((allocation.data || 0) >= 32) return "data-driven";
    if ((allocation.innovation || 0) >= 15 && selected.includes("knowledge"))
      return "risk-tolerant";
  }
  if (riskAppetite >= 4 && payback >= 4) return "risk-tolerant";
  if (people >= 4 && balance >= 3) return "people-first";
  if (governance >= 4 || riskAppetite <= 2) return "risk-averse";
  if (payback >= 4 && people <= 3) return "tech-first";
  if (balance >= 4 || governance >= 3) return "data-driven";
  return "balanced";
}

export function createInitiativeGeneration(
  archetype: ScenarioArchetype = "balanced",
  baseline: number[] = [],
  seed = Date.now(),
): InitiativeGeneration {
  const answers = baseline.length ? baseline : [3, 3, 3, 3, 3];
  return {
    seed: Math.abs(Math.trunc(seed)) || 1,
    archetype,
    context: {
      organization: clamp(
        ((answers[2] || 3) + (answers[3] || 3) + (answers[4] || 3)) / 15,
        0.2,
        1,
      ),
      data: clamp(((answers[3] || 3) + (answers[4] || 3)) / 10, 0.2, 1),
      team: clamp(((answers[0] || 3) + (answers[3] || 3)) / 10, 0.2, 1),
    },
  };
}

export function createInferredGeneration(
  baseline: number[],
  seed = Date.now(),
): InitiativeGeneration {
  return createInitiativeGeneration(
    inferArchetypeFromDecisions(baseline),
    baseline,
    seed,
  );
}

const campaignProfiles: Record<ScenarioArchetype, Record<string, number>> = {
  balanced: {
    infra: 25,
    data: 25,
    people: 18,
    mlops: 10,
    compliance: 12,
    innovation: 10,
  },
  "data-driven": {
    infra: 18,
    data: 36,
    people: 15,
    mlops: 10,
    compliance: 12,
    innovation: 9,
  },
  "people-first": {
    infra: 20,
    data: 20,
    people: 25,
    mlops: 10,
    compliance: 10,
    innovation: 15,
  },
  "tech-first": {
    infra: 30,
    data: 30,
    people: 12,
    mlops: 15,
    compliance: 8,
    innovation: 5,
  },
  "risk-tolerant": {
    infra: 25,
    data: 25,
    people: 12,
    mlops: 10,
    compliance: 8,
    innovation: 20,
  },
  "risk-averse": {
    infra: 18,
    data: 25,
    people: 20,
    mlops: 10,
    compliance: 20,
    innovation: 7,
  },
};

const campaignSelectionSignals: Record<ScenarioArchetype, string[]> = {
  balanced: ["demand", "energy", "quality"],
  "data-driven": ["demand", "supply", "quality"],
  "people-first": ["knowledge", "demand", "maintenance"],
  "tech-first": ["maintenance", "quality", "energy"],
  "risk-tolerant": ["knowledge", "maintenance", "supply"],
  "risk-averse": ["quality", "energy", "demand"],
};

function baselineSignal(
  archetype: ScenarioArchetype,
  answers: number[],
): number {
  const [people, risk, governance, balance, payback] = answers;
  return {
    balanced: 8 - Math.abs(balance - 4) * 1.5 - Math.abs(risk - 3),
    "data-driven": balance * 1.2 + payback * 0.8,
    "people-first": people * 1.8 + balance * 0.5,
    "tech-first": payback * 1.7 + (6 - people) * 0.5,
    "risk-tolerant": risk * 1.7 + payback * 0.8,
    "risk-averse": (6 - risk) * 1.7 + governance * 1.2,
  }[archetype];
}

export function inferArchetypeFromCampaignDetailed(
  baseline: number[] = [],
  history: CampaignDecision[] = [],
): CampaignArchetypeInference {
  const answers = baseline.length
    ? baseline.map((value) => Number(value || 3))
    : [3, 3, 3, 3, 3];
  const allocationKeys = [
    "infra",
    "data",
    "people",
    "mlops",
    "compliance",
    "innovation",
  ];
  const allocationHistory = history.filter((item) => item.allocation);
  if (!allocationHistory.length) {
    const archetype = inferArchetypeFromDecisions(answers);
    const scores = Object.fromEntries(
      (Object.keys(campaignProfiles) as ScenarioArchetype[]).map((item) => [
        item,
        item === archetype ? 60 : 40 + baselineSignal(item, answers),
      ]),
    ) as Record<ScenarioArchetype, number>;
    const ranked = (
      Object.entries(scores) as [ScenarioArchetype, number][]
    ).sort((left, right) => right[1] - left[1]);
    return {
      archetype,
      confidence: 55,
      runnerUp: ranked.find(([item]) => item !== archetype)?.[0] || "balanced",
      scores,
      evidence: [
        "Baseline instincts only; confidence will strengthen as campaign decisions accumulate.",
      ],
    };
  }
  const averages = Object.fromEntries(
    allocationKeys.map((key) => [
      key,
      allocationHistory.reduce(
        (sum, item) => sum + Number(item.allocation?.[key] || 0),
        0,
      ) / allocationHistory.length,
    ]),
  );
  const initiativeIdByName = new Map(
    initiatives.map((item) => [item.name, item.id]),
  );
  const selected = history.flatMap((item) =>
    item.selectedIds?.length
      ? item.selectedIds
      : (item.chosen || [])
          .map((name) => initiativeIdByName.get(name))
          .filter((id): id is string => Boolean(id)),
  );
  const selectionTotal = Math.max(1, selected.length);
  const metricHistory = history
    .map((item) => item.metrics)
    .filter((metrics): metrics is Record<string, number> => Boolean(metrics));
  const firstRisk = Number(metricHistory[0]?.risk || 36);
  const finalRisk = Number(metricHistory.at(-1)?.risk || firstRisk);
  const discovered = new Set(
    history.flatMap((item) => item.synergiesDiscovered || []),
  ).size;
  const scores = Object.fromEntries(
    (Object.keys(campaignProfiles) as ScenarioArchetype[]).map((archetype) => {
      const profile = campaignProfiles[archetype];
      const allocationDistance =
        allocationKeys.reduce(
          (sum, key) => sum + Math.abs(Number(averages[key]) - profile[key]),
          0,
        ) / allocationKeys.length;
      const selectionMatches =
        selected.filter((id) =>
          campaignSelectionSignals[archetype].includes(id),
        ).length / selectionTotal;
      let behavioralSignal = 0;
      if (archetype === "risk-averse")
        behavioralSignal += clamp((firstRisk - finalRisk) * 0.25, -5, 7);
      if (archetype === "risk-tolerant")
        behavioralSignal += clamp((finalRisk - firstRisk) * 0.18, -4, 5);
      if (archetype === "balanced") behavioralSignal += discovered * 0.8;
      return [
        archetype,
        100 -
          allocationDistance * 3.2 +
          selectionMatches * 10 +
          baselineSignal(archetype, answers) +
          behavioralSignal,
      ];
    }),
  ) as Record<ScenarioArchetype, number>;
  const ranked = (Object.entries(scores) as [ScenarioArchetype, number][]).sort(
    (left, right) => right[1] - left[1],
  );
  const [winner, runnerUp] = ranked;
  const gap = Math.max(0, (winner?.[1] || 0) - (runnerUp?.[1] || 0));
  const confidence = Math.round(
    clamp(52 + gap * 3 + Math.min(12, allocationHistory.length), 52, 98),
  );
  const topAllocation = Object.entries(averages).sort(
    (left, right) => Number(right[1]) - Number(left[1]),
  )[0];
  const evidence = [
    `${topAllocation?.[0] || "portfolio"} averaged ${Number(topAllocation?.[1] || 0).toFixed(0)}% of quarterly allocation.`,
    `${selected.length} initiative selections across ${allocationHistory.length} resolved quarters informed the pattern.`,
    `${discovered} capability ${discovered === 1 ? "combination was" : "combinations were"} discovered; risk moved ${Math.abs(finalRisk - firstRisk).toFixed(1)} points ${finalRisk <= firstRisk ? "down" : "up"}.`,
  ];
  return {
    archetype: winner?.[0] || "balanced",
    confidence,
    runnerUp: runnerUp?.[0] || "balanced",
    scores,
    evidence,
  };
}

export function inferArchetypeFromCampaign(
  baseline: number[] = [],
  history: CampaignDecision[] = [],
): ScenarioArchetype {
  return inferArchetypeFromCampaignDetailed(baseline, history).archetype;
}

function archetypeBias(archetype: ScenarioArchetype) {
  return {
    balanced: { roi: 1, cost: 1, data: 1, human: 1, risk: 0 },
    "data-driven": { roi: 1.12, cost: 1.08, data: 1.3, human: 0.82, risk: 0 },
    "people-first": { roi: 0.9, cost: 1.12, data: 1, human: 1.35, risk: -0.65 },
    "tech-first": { roi: 1.28, cost: 0.9, data: 1.2, human: 0.72, risk: 0.65 },
    "risk-tolerant": { roi: 1.38, cost: 1, data: 1, human: 1, risk: 1 },
    "risk-averse": { roi: 0.82, cost: 1, data: 1, human: 1, risk: -1 },
  }[archetype];
}

export function generateInitiatives(
  generation: InitiativeGeneration,
): DynamicInitiative[] {
  const random = seededRandom(generation.seed);
  const bias = archetypeBias(generation.archetype);
  const { context } = generation;
  return initiatives.map((base) => {
    const roiVariation = 0.7 + random() * 0.6;
    const costVariation = 0.8 + random() * 0.4;
    const dataVariation = random() * 2 - 1;
    const humanVariation = random() * 2 - 1;
    const baseRiskScore =
      base.risk === "LOW" ? 24 : base.risk === "MED" ? 48 : 72;
    const riskScore = clamp(
      baseRiskScore +
        bias.risk * 18 +
        (1 - context.organization) * 18 +
        (1 - context.data) * 13 +
        (1 - context.team) * 13 +
        (random() - 0.5) * 10,
      8,
      96,
    );
    const roi = Math.round(
      clamp(
        base.roi *
          roiVariation *
          bias.roi *
          (0.82 +
            context.organization * 0.1 +
            context.data * 0.08 +
            context.team * 0.08),
        55,
        320,
      ),
    );
    const cost = Number(
      clamp(
        base.cost *
          costVariation *
          bias.cost *
          (1 + (1 - context.organization) * 0.12),
        0.5,
        5,
      ).toFixed(2),
    );
    const data = Number(
      clamp(
        base.data + dataVariation * bias.data + (context.data - 0.5) * 0.6,
        1,
        5,
      ).toFixed(1),
    );
    const human = Number(
      clamp(
        base.human + humanVariation * bias.human + (context.team - 0.5) * 0.6,
        1,
        5,
      ).toFixed(1),
    );
    return {
      ...base,
      roi,
      cost,
      data,
      human,
      risk: riskBand(riskScore),
      baseRoi: base.roi,
      baseCost: base.cost,
      baseData: base.data,
      baseHuman: base.human,
      baseRiskScore,
      riskScore: Number(riskScore.toFixed(1)),
      synergies: synergyMap[base.id] || [],
    };
  });
}

export function describeSynergies(
  selected: string[],
  states: Record<string, { name: string; synergies?: string[] }>,
) {
  const effects = evaluateSynergies(selected, states);
  if (!effects.length) return null;
  const pairs = effects.map((effect) =>
    effect.ids.map((id) => states[id]?.name || id),
  );
  const names = pairs.map((pair) => pair.join(" and "));
  return {
    pairs,
    effects,
    message: `A capability flywheel is forming: ${names.join("; ")}. ${effects.map((effect) => effect.message).join(" ")}`,
  };
}

export function evaluateSynergies(
  selected: string[],
  states: Record<string, { name: string; synergies?: string[] }>,
): SynergyEffect[] {
  const selectedSet = new Set(selected);
  return synergyEffects.filter((effect) => {
    const [left, right] = effect.ids;
    return (
      selectedSet.has(left) &&
      selectedSet.has(right) &&
      Boolean(
        states[left]?.synergies?.includes(right) ||
          states[right]?.synergies?.includes(left),
      )
    );
  });
}

export function archetypeReveal(archetype: ScenarioArchetype) {
  return {
    balanced: [
      "Pragmatic Builder",
      "You balanced value, capability, and governance without overextending the portfolio.",
    ],
    "data-driven": [
      "Evidence-Led Operator",
      "You built around data and measurable payback, creating a strong analytical foundation.",
    ],
    "people-first": [
      "Capability Builder",
      "You treated people and adoption as the engine of sustainable transformation.",
    ],
    "tech-first": [
      "Scale Accelerator",
      "You moved quickly on technical capability and accepted more operating-model pressure.",
    ],
    "risk-tolerant": [
      "Bold Experimenter",
      "You pursued ambitious upside and learned to pair speed with stronger safeguards.",
    ],
    "risk-averse": [
      "Trust Steward",
      "You prioritised governance and resilience, creating a safer path to durable adoption.",
    ],
  }[archetype];
}
