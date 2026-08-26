import type { GameState } from './state';
import { averageFrameworkContribution } from '../scenarios/framework';
import type { FinancialLedger } from './businessModel';
import { realisedROI } from './economics';

export type ScoreInputs = {
  /** 0–100 progress against the active scenario's domain targets. */
  scenarioTargetProgress?: number;
  /** 0–100 realised financial-value score, not a forecast. */
  realisedFinancialValue?: number;
  /** 0–100 operating health (adoption, data, reliability, and risk). */
  operatingHealth?: number;
  /** 0–100 execution discipline (sequencing, pacing, and delivery follow-through). */
  executionDiscipline?: number;
  /** 0–100 responsible-AI health (governance, human impact, transparency). */
  responsibleAI?: number;
  /** When false, scenario progress is excluded and remaining weights renormalise. */
  scenarioMode?: boolean;
};

export type CampaignScoreBreakdown = {
  score: number;
  scenarioMode: boolean;
  weights: Record<'scenarioTargetProgress' | 'realisedFinancialValue' | 'operatingHealth' | 'executionDiscipline' | 'responsibleAI', number>;
  values: Record<'scenarioTargetProgress' | 'realisedFinancialValue' | 'operatingHealth' | 'executionDiscipline' | 'responsibleAI', number>;
  contributions: Record<'scenarioTargetProgress' | 'realisedFinancialValue' | 'operatingHealth' | 'executionDiscipline' | 'responsibleAI', number>;
};

const clampScore = (value: unknown) => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 0));
const scoreKeys = ['scenarioTargetProgress', 'realisedFinancialValue', 'operatingHealth', 'executionDiscipline', 'responsibleAI'] as const;
const scenarioWeights = {
  scenarioTargetProgress: 40,
  realisedFinancialValue: 25,
  operatingHealth: 20,
  executionDiscipline: 10,
  responsibleAI: 5,
} as const;

/**
 * Turns an observed ledger return into a 0–100 financial-value score. Zero or
 * negative realised ROI earns zero; `targetROI` (100% by default) earns 100.
 * This makes the score an explicit target-normalisation, not an extra forecast.
 */
export function realisedFinancialValueScore(ledger: Pick<FinancialLedger, 'cumulativeInvestment' | 'cumulativeNetBenefit'>, targetROI = 100): number {
  const target = Math.max(0.0001, Number(targetROI) || 100);
  return clampScore((Math.max(0, realisedROI(ledger)) / target) * 100);
}

/**
 * Composes the agreed campaign score. Scenario runs use 40/25/20/10/5. In
 * Standard mode the scenario dimension is omitted and the other weights are
 * proportionally renormalised to 100, preserving the relative priorities.
 */
export function composeCampaignScore(input: ScoreInputs): CampaignScoreBreakdown {
  const scenarioMode = Boolean(input.scenarioMode);
  const values = {
    scenarioTargetProgress: clampScore(input.scenarioTargetProgress),
    realisedFinancialValue: clampScore(input.realisedFinancialValue),
    operatingHealth: clampScore(input.operatingHealth),
    executionDiscipline: clampScore(input.executionDiscipline),
    responsibleAI: clampScore(input.responsibleAI),
  };
  const activeWeight = scenarioMode ? 100 : 60;
  const weights = Object.fromEntries(scoreKeys.map((key) => [
    key,
    scenarioMode || key !== 'scenarioTargetProgress' ? Number((scenarioWeights[key] / activeWeight * 100).toFixed(6)) : 0,
  ])) as CampaignScoreBreakdown['weights'];
  const contributions = Object.fromEntries(scoreKeys.map((key) => [key, Number((values[key] * weights[key] / 100).toFixed(4))])) as CampaignScoreBreakdown['contributions'];
  const score = Number(Object.values(contributions).reduce((total, value) => total + value, 0).toFixed(2));
  return { score, scenarioMode, weights, values, contributions };
}

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
  const selectedIds = new Set([
    ...(state.selected || []),
    ...(state.history || []).flatMap((entry: any) => entry.selectedIds || []),
  ]);
  const selectedInitiatives = Object.values(state.initiativeStates || {}).filter((item: any) => selectedIds.has(item.id)) as any[];
  const authoredContribution = averageFrameworkContribution(selectedInitiatives);
  if (authoredContribution) {
    const alignment = authoredContribution.peopleChange * .4 + authoredContribution.processWorkflow * .3 + authoredContribution.techData * .2 + authoredContribution.algorithmModel * .1;
    return alignment > 80 ? 5 : alignment > 60 ? 3 : alignment > 40 ? 1 : 0;
  }
  const processSignals = selectedInitiatives.filter((item) => /workflow|process|operations|service|throughput|planning|capacity/i.test(`${item.impact || ''} ${item.desc || ''}`)).length;
  const process = selectedInitiatives.length ? Math.min(100, (processSignals / selectedInitiatives.length) * 70 + ((state.alloc?.innovation || 0) > 10 ? 10 : 0)) : 30;
  const tech = Math.min(100, (((state.alloc?.infra || 0) + (state.alloc?.data || 0)) / 80) * 100 + ((state.data || 0) > 70 ? 10 : 0));
  const model = Math.min(100, Number(state.roi || 0) / 2);
  const alignment = people * .4 + process * .3 + tech * .2 + model * .1;
  return alignment > 80 ? 5 : alignment > 60 ? 3 : alignment > 40 ? 1 : 0;
}
export function bcgProfile(state: any) {
  const people = state.alloc?.people || 0; const tech = (state.alloc?.infra || 0) + (state.alloc?.data || 0) + (state.alloc?.mlops || 0); const process = (state.alloc?.compliance || 0) + (state.alloc?.innovation || 0);
  return { people, tech, process, score: calculateBCGScore(state) };
}
