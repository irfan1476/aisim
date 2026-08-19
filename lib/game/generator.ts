import { initiatives, type Initiative } from './initiatives';

// Archetype is an internal diagnosis. It is intentionally not a player-facing mode.
export type ScenarioArchetype = 'balanced' | 'data-driven' | 'people-first' | 'tech-first' | 'risk-tolerant' | 'risk-averse';
export type MaturityContext = { organization: number; data: number; team: number };
export type InitiativeGeneration = { seed: number; archetype: ScenarioArchetype; context: MaturityContext };
export type DynamicInitiative = Initiative & { baseRoi: number; baseCost: number; baseData: number; baseHuman: number; baseRiskScore: number; riskScore: number; synergies: string[] };

const synergyMap: Record<string, string[]> = { knowledge: ['demand', 'maintenance'], demand: ['knowledge', 'supply'], maintenance: ['quality', 'energy'], quality: ['maintenance'], energy: ['maintenance'], supply: ['demand'] };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const riskBand = (score: number): 'LOW' | 'MED' | 'HIGH' => score < 35 ? 'LOW' : score < 65 ? 'MED' : 'HIGH';

function seededRandom(seed: number) { let value = (seed >>> 0) || 1; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; }; }

export function inferArchetypeFromDecisions(baseline: number[] = [], allocation?: Record<string, number>, selected: string[] = []): ScenarioArchetype {
  const answers = baseline.length ? baseline : [3, 3, 3, 3, 3];
  const people = answers[0] || 3; const riskAppetite = answers[1] || 3; const governance = answers[2] || 3; const balance = answers[3] || 3; const payback = answers[4] || 3;
  if (allocation) {
    if ((allocation.people || 0) >= 22) return 'people-first';
    if ((allocation.infra || 0) + (allocation.mlops || 0) >= 48) return 'tech-first';
    if ((allocation.compliance || 0) >= 20 || riskAppetite <= 2) return 'risk-averse';
    if ((allocation.data || 0) >= 32) return 'data-driven';
    if ((allocation.innovation || 0) >= 15 && selected.includes('knowledge')) return 'risk-tolerant';
  }
  if (riskAppetite >= 4 && payback >= 4) return 'risk-tolerant';
  if (people >= 4 && balance >= 3) return 'people-first';
  if (governance >= 4 || riskAppetite <= 2) return 'risk-averse';
  if (payback >= 4 && people <= 3) return 'tech-first';
  if (balance >= 4 || governance >= 3) return 'data-driven';
  return 'balanced';
}

export function createInitiativeGeneration(archetype: ScenarioArchetype = 'balanced', baseline: number[] = [], seed = Date.now()): InitiativeGeneration {
  const answers = baseline.length ? baseline : [3, 3, 3, 3, 3];
  return { seed: Math.abs(Math.trunc(seed)) || 1, archetype, context: { organization: clamp(((answers[2] || 3) + (answers[3] || 3) + (answers[4] || 3)) / 15, .2, 1), data: clamp(((answers[3] || 3) + (answers[4] || 3)) / 10, .2, 1), team: clamp(((answers[0] || 3) + (answers[3] || 3)) / 10, .2, 1) } };
}

export function createInferredGeneration(baseline: number[], seed = Date.now()): InitiativeGeneration { return createInitiativeGeneration(inferArchetypeFromDecisions(baseline), baseline, seed); }
export function refineGeneration(generation: InitiativeGeneration, allocation: Record<string, number>, selected: string[]): InitiativeGeneration { return { ...generation, archetype: inferArchetypeFromDecisions([], allocation, selected) }; }

function archetypeBias(archetype: ScenarioArchetype) {
  return { balanced: { roi: 1, cost: 1, data: 1, human: 1, risk: 0 }, 'data-driven': { roi: 1.12, cost: 1.08, data: 1.3, human: .82, risk: 0 }, 'people-first': { roi: .9, cost: 1.12, data: 1, human: 1.35, risk: -.65 }, 'tech-first': { roi: 1.28, cost: .9, data: 1.2, human: .72, risk: .65 }, 'risk-tolerant': { roi: 1.38, cost: 1, data: 1, human: 1, risk: 1 }, 'risk-averse': { roi: .82, cost: 1, data: 1, human: 1, risk: -1 } }[archetype];
}

export function generateInitiatives(generation: InitiativeGeneration): DynamicInitiative[] {
  const random = seededRandom(generation.seed); const bias = archetypeBias(generation.archetype); const { context } = generation;
  return initiatives.map((base) => {
    const roiVariation = .7 + random() * .6; const costVariation = .8 + random() * .4; const dataVariation = random() * 2 - 1; const humanVariation = random() * 2 - 1;
    const baseRiskScore = base.risk === 'LOW' ? 24 : base.risk === 'MED' ? 48 : 72;
    const riskScore = clamp(baseRiskScore + bias.risk * 18 + (1 - context.organization) * 18 + (1 - context.data) * 13 + (1 - context.team) * 13 + (random() - .5) * 10, 8, 96);
    const roi = Math.round(clamp(base.roi * roiVariation * bias.roi * (.82 + context.organization * .1 + context.data * .08 + context.team * .08), 55, 320));
    const cost = Number(clamp(base.cost * costVariation * bias.cost * (1 + (1 - context.organization) * .12), .5, 5).toFixed(2));
    const data = Number(clamp(base.data + dataVariation * bias.data + (context.data - .5) * .6, 1, 5).toFixed(1));
    const human = Number(clamp(base.human + humanVariation * bias.human + (context.team - .5) * .6, 1, 5).toFixed(1));
    return { ...base, roi, cost, data, human, risk: riskBand(riskScore), baseRoi: base.roi, baseCost: base.cost, baseData: base.data, baseHuman: base.human, baseRiskScore, riskScore: Number(riskScore.toFixed(1)), synergies: synergyMap[base.id] || [] };
  });
}

export function describeSynergies(selected: string[], states: Record<string, { name: string; synergies?: string[] }>) {
  const pairs: string[][] = [];
  selected.forEach((id, index) => selected.slice(index + 1).forEach(other => { if (states[id]?.synergies?.includes(other)) pairs.push([states[id].name, states[other]?.name || other]); }));
  if (!pairs.length) return null;
  const names = pairs.map(pair => pair.join(' and '));
  return { pairs, message: `A capability flywheel is forming: ${names.join('; ')} are reinforcing one another. The combination is improving operational value and lowering delivery friction.` };
}

export function archetypeReveal(archetype: ScenarioArchetype) {
  return ({ balanced: ['Pragmatic Builder', 'You balanced value, capability, and governance without overextending the portfolio.'], 'data-driven': ['Evidence-Led Operator', 'You built around data and measurable payback, creating a strong analytical foundation.'], 'people-first': ['Capability Builder', 'You treated people and adoption as the engine of sustainable transformation.'], 'tech-first': ['Scale Accelerator', 'You moved quickly on technical capability and accepted more operating-model pressure.'], 'risk-tolerant': ['Bold Experimenter', 'You pursued ambitious upside and learned to pair speed with stronger safeguards.'], 'risk-averse': ['Trust Steward', 'You prioritised governance and resilience, creating a safer path to durable adoption.'] }[archetype]);
}
