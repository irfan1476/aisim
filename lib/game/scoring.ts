import type { GameState } from './state';

export type ScoreBreakdown = {
  outcome: number;
  sustainedExecution: number;
  capabilityConsistency: number;
  baseScore: number;
  scenarioBonus: number;
  finalScore: number;
};

export function explainScore(state: GameState, metrics: Partial<GameState> = state): ScoreBreakdown {
  const outcome = (Number(metrics.roi ?? state.roi) + Number(metrics.adoption ?? state.adoption) + Number(metrics.efficiency ?? state.efficiency) + (100 - Number(metrics.risk ?? state.risk))) / 4;
  const sustainedExecution = Math.min(10, Math.max(0, state.q - 2));
  const establishedCapabilities = Object.values(state.initiativeStates || {}).filter((item) => item.quartersFunded >= 4).length;
  const capabilityConsistency = Math.min(4, establishedCapabilities * 1.34);
  const baseScore = Math.min(100, Math.round(outcome + sustainedExecution + capabilityConsistency));
  const scenarioBonus = state.scenarioMode ? Number(state.scenarioBonus || 0) : 0;
  return { outcome, sustainedExecution, capabilityConsistency, baseScore, scenarioBonus, finalScore: Math.min(100, baseScore + scenarioBonus) };
}

export function calculateBCGScore(state: any) {
  const people = Math.min(100, (state.alloc?.people || 0) * 2 + ((state.alloc?.people || 0) > 20 ? 10 : 0) + ((state.adoption || 0) > 60 ? 10 : 0));
  const process = (state.selected || []).some((id: string) => ['energy', 'supply', 'maintenance'].includes(id)) ? 70 : 30;
  const tech = Math.min(100, (((state.alloc?.infra || 0) + (state.alloc?.data || 0)) / 80) * 100 + ((state.data || 0) > 70 ? 10 : 0));
  const model = Math.min(100, Number(state.roi || 0) / 2);
  const alignment = people * .4 + process * .3 + tech * .2 + model * .1;
  return alignment > 80 ? 5 : alignment > 60 ? 3 : alignment > 40 ? 1 : 0;
}
export function bcgProfile(state: any) {
  const people = state.alloc?.people || 0; const tech = (state.alloc?.infra || 0) + (state.alloc?.data || 0) + (state.alloc?.mlops || 0); const process = (state.alloc?.compliance || 0) + (state.alloc?.innovation || 0);
  return { people, tech, process, score: calculateBCGScore(state) };
}
