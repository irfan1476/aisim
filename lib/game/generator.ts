import { initiatives, type Initiative } from './initiatives';

export type ScenarioArchetype = 'balanced' | 'data-driven' | 'people-first' | 'tech-first' | 'risk-tolerant' | 'risk-averse';

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

export const scenarioArchetypes: Array<{ id: ScenarioArchetype; label: string; description: string }> = [
  { id: 'balanced', label: 'Balanced', description: 'A measured portfolio with no single dominant bias.' },
  { id: 'data-driven', label: 'Data-Driven', description: 'Better data upside, but weak adoption becomes your constraint.' },
  { id: 'people-first', label: 'People-First', description: 'Capability and adoption are your strongest multipliers.' },
  { id: 'tech-first', label: 'Tech-First', description: 'Faster technical returns with greater operating-model risk.' },
  { id: 'risk-tolerant', label: 'Risk-Tolerant', description: 'More upside from ambitious bets, with sharper downside.' },
  { id: 'risk-averse', label: 'Risk-Averse', description: 'Safer compounding, but slower headline returns.' },
];

const synergyMap: Record<string, string[]> = {
  knowledge: ['demand', 'maintenance'],
  demand: ['knowledge', 'supply'],
  maintenance: ['quality', 'energy'],
  quality: ['maintenance'],
  energy: ['maintenance'],
  supply: ['demand'],
};

function seededRandom(seed: number) {
  let value = (seed >>> 0) || 1;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function riskBand(score: number): 'LOW' | 'MED' | 'HIGH' { return score < 35 ? 'LOW' : score < 65 ? 'MED' : 'HIGH'; }

export function createInitiativeGeneration(archetype: ScenarioArchetype = 'balanced', baseline: number[] = [], seed = Date.now()): InitiativeGeneration {
  const answers = baseline.length ? baseline : [3, 3, 3, 3, 3];
  return {
    seed: Math.abs(Math.trunc(seed)) || 1,
    archetype,
    context: {
      organization: clamp((answers[2] + answers[3] + answers[4]) / 15, .2, 1),
      data: clamp((answers[3] + answers[4]) / 10, .2, 1),
      team: clamp((answers[0] + answers[3]) / 10, .2, 1),
    },
  };
}

export function generateInitiatives(generation: InitiativeGeneration): DynamicInitiative[] {
  const random = seededRandom(generation.seed);
  const { archetype, context } = generation;
  const bias = {
    roi: 0, cost: 0, risk: 0, data: 0, human: 0,
    ...(archetype === 'data-driven' ? { roi: 7, data: .7, human: -.2 } : {}),
    ...(archetype === 'people-first' ? { roi: 2, data: -.2, human: .8, risk: -5 } : {}),
    ...(archetype === 'tech-first' ? { roi: 10, data: .5, risk: 8, cost: .08 } : {}),
    ...(archetype === 'risk-tolerant' ? { roi: 14, risk: 12, cost: .12 } : {}),
    ...(archetype === 'risk-averse' ? { roi: -5, risk: -14, cost: -.05 } : {}),
  };

  return initiatives.map((base) => {
    const noise = (random() - .5);
    const maturity = context.organization * 7 + context.data * 7 + context.team * 7;
    const baseRiskScore = base.risk === 'LOW' ? 24 : base.risk === 'MED' ? 48 : 72;
    const riskScore = clamp(baseRiskScore + (1 - context.organization) * 16 + (1 - context.data) * 12 + (1 - context.team) * 12 + bias.risk + noise * 8, 8, 96);
    const roi = Math.round(clamp(base.roi + bias.roi + maturity * .35 + noise * 12, 70, 280));
    const cost = Number(clamp(base.cost * (1 + bias.cost + (1 - context.organization) * .08 + noise * .05), .6, 4).toFixed(2));
    const data = Number(clamp(base.data + bias.data + context.data * .8 + noise * .35, 1, 5).toFixed(1));
    const human = Number(clamp(base.human + bias.human + context.team * .7 + noise * .35, 1, 5).toFixed(1));
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

