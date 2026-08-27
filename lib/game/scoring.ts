import type { GameState } from './state';
import { averageFrameworkContribution } from '../scenarios/framework';
import type { FinancialLedger } from './businessModel';
import { realisedROI } from './economics';
import { getScenario } from '../scenarios/registry';
import { calculateProgressPercentages } from '../scenarios/progress';

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
  /** 0–100 validated leading evidence from deliberately progressed initiatives. */
  validatedLearning?: number;
  /** When false, scenario progress is excluded and remaining weights renormalise. */
  scenarioMode?: boolean;
};

export type CampaignScoreBreakdown = {
  score: number;
  scenarioMode: boolean;
  weights: Record<'scenarioTargetProgress' | 'realisedFinancialValue' | 'operatingHealth' | 'executionDiscipline' | 'responsibleAI' | 'validatedLearning', number>;
  values: Record<'scenarioTargetProgress' | 'realisedFinancialValue' | 'operatingHealth' | 'executionDiscipline' | 'responsibleAI' | 'validatedLearning', number>;
  contributions: Record<'scenarioTargetProgress' | 'realisedFinancialValue' | 'operatingHealth' | 'executionDiscipline' | 'responsibleAI' | 'validatedLearning', number>;
};

const clampScore = (value: unknown) => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 0));
const scoreKeys = ['scenarioTargetProgress', 'realisedFinancialValue', 'operatingHealth', 'executionDiscipline', 'responsibleAI', 'validatedLearning'] as const;
const scenarioWeights = {
  scenarioTargetProgress: 35,
  realisedFinancialValue: 20,
  operatingHealth: 20,
  executionDiscipline: 10,
  responsibleAI: 5,
  validatedLearning: 10,
} as const;

/**
 * Return target progress from scenario metrics, never from the raw metric
 * values themselves. Older saves persisted `scenarioProgress` inconsistently
 * (sometimes as values such as 100 or 500), so score refreshes must derive the
 * contract from the authoritative domain metrics and scenario definitions.
 */
function scenarioTargetProgressFor(state: Pick<GameState, 'scenarioMode' | 'scenarioId' | 'scenarioState' | 'scenarioProgress'>): number {
  if (!state.scenarioMode) return 0;
  const scenario = getScenario(state.scenarioId);
  const metrics = state.scenarioState?.metrics;
  const progress = scenario && metrics
    ? calculateProgressPercentages(metrics, scenario)
    : state.scenarioProgress || {};
  const values = Object.values(progress).map(Number).filter(Number.isFinite);
  return values.length ? values.reduce((sum, value) => sum + clampScore(value), 0) / values.length : 0;
}

/**
 * Credit a deliberate early-stage initiative for validated evidence without
 * pretending that it has already produced a production ROI. Only initiatives
 * with a recorded action participate, so passive starting readiness is not a
 * free score.
 */
export function validatedLearningScore(state: Pick<GameState, 'initiativeStates' | 'history' | 'initiativeActions'>): number {
  const intentionalIds = new Set<string>();
  (state.history || []).forEach((snapshot) => {
    Object.entries(snapshot.initiativeActions || {}).forEach(([id, action]) => {
      if (action === 'discover' || action === 'pilot' || action === 'scale' || action === 'maintain') intentionalIds.add(id);
    });
  });
  Object.entries(state.initiativeActions || {}).forEach(([id, action]) => {
    if (action === 'discover' || action === 'pilot' || action === 'scale' || action === 'maintain') intentionalIds.add(id);
  });
  const initiatives = Object.values(state.initiativeStates || {}).filter((initiative) => intentionalIds.has(initiative.id));
  if (!initiatives.length) return 0;
  const total = initiatives.reduce((sum, initiative) => {
    const data = clampScore(initiative.dataReadiness ?? Number(initiative.currentData || 0) * 20);
    const controls = clampScore(Number(initiative.controlMaturity || 0) * 100);
    const change = clampScore(Number(initiative.changeReadiness || 0) * 100);
    const criteria = initiative.evaluation?.successCriteria || [];
    const reviewEvidence = criteria.length
      ? criteria.filter((criterion) => criterion.met).length / criteria.length * 100
      : 0;
    const stageCredit = ['experiment', 'pilot', 'evaluate', 'deploy', 'monitor'].includes(initiative.aiLifecycle?.stage) ? 100 : 0;
    return sum + data * .4 + controls * .2 + change * .15 + reviewEvidence * .15 + stageCredit * .1;
  }, 0);
  return Number((total / initiatives.length).toFixed(2));
}

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
 * Composes the agreed campaign score. Scenario runs use 35/20/20/10/5/10 across
 * scenario progress, realised value, operating health, execution discipline,
 * responsible AI, and validated learning. In
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
    validatedLearning: clampScore(input.validatedLearning),
  };
  const activeWeight = scenarioMode ? 100 : 65;
  const weights = Object.fromEntries(scoreKeys.map((key) => [
    key,
    scenarioMode || key !== 'scenarioTargetProgress' ? Number((scenarioWeights[key] / activeWeight * 100).toFixed(6)) : 0,
  ])) as CampaignScoreBreakdown['weights'];
  const contributions = Object.fromEntries(scoreKeys.map((key) => [key, Number((values[key] * weights[key] / 100).toFixed(4))])) as CampaignScoreBreakdown['contributions'];
  const score = Number(Object.values(contributions).reduce((total, value) => total + value, 0).toFixed(2));
  return { score, scenarioMode, weights, values, contributions };
}

/**
 * Fallback explanation for legacy saves that pre-date the persisted score
 * breakdown. New turns persist the exact composition used to calculate score.
 */
export function explainScore(state: GameState, metrics: Partial<GameState> = state): CampaignScoreBreakdown {
  const operatingHealth = (Number(metrics.adoption ?? state.adoption) + Number(metrics.efficiency ?? state.efficiency) + Number(metrics.data ?? state.data) + (100 - Number(metrics.risk ?? state.risk))) / 4;
  const executionDiscipline = Math.min(100, 65 + Math.min(25, state.q * 2) + Math.min(10, (state.selected || []).length * 3));
  const responsibleAI = Number(state.alloc?.compliance || 0) * 2 + (Object.values(state.initiativeStates || {}).reduce((sum, item) => sum + Number(item.controlMaturity || 0), 0) / Math.max(1, Object.keys(state.initiativeStates || {}).length)) * 30;
  return composeCampaignScore({
    scenarioMode: state.scenarioMode,
    scenarioTargetProgress: scenarioTargetProgressFor(state),
    realisedFinancialValue: realisedFinancialValueScore(state.financialLedger || { cumulativeInvestment: 0, cumulativeNetBenefit: 0 }),
    operatingHealth,
    executionDiscipline,
    responsibleAI,
    validatedLearning: validatedLearningScore(state),
  });
}

/** Recalculate score after a post-quarter mutation such as a crisis response
 * or lifecycle decision, which otherwise leaves the persisted breakdown stale. */
export function refreshCampaignScore(state: GameState): GameState {
  const scenarioTargetProgress = scenarioTargetProgressFor(state);
  const operatingHealth = (Number(state.adoption || 0) + Number(state.efficiency || 0) + Number(state.data || 0) + (100 - Number(state.risk || 0))) / 4;
  const executionDiscipline = Math.min(100, 65 + Math.min(25, state.q * 2) + Math.min(10, (state.selected || []).length * 3));
  const responsibleAI = Number(state.alloc?.compliance || 0) * 2 + (Object.values(state.initiativeStates || {}).reduce((sum, item) => sum + Number(item.controlMaturity || 0), 0) / Math.max(1, Object.keys(state.initiativeStates || {}).length)) * 30;
  const scoreBreakdown = composeCampaignScore({ scenarioMode: state.scenarioMode, scenarioTargetProgress, realisedFinancialValue: realisedFinancialValueScore(state.financialLedger), operatingHealth, executionDiscipline, responsibleAI, validatedLearning: validatedLearningScore(state) });
  return { ...state, score: Math.round(scoreBreakdown.score), scoreBreakdown };
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
