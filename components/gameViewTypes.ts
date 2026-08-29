import type { InitiativeState } from '../lib/game/initiativeState';
import type { InitiativeGeneration } from '../lib/game/generator';
import type { UserReflections } from '../lib/game/state';
import type { CurrencyMode } from '../lib/scenarios/types';
import type { FinancialLedger, InitiativeActionSet } from '../lib/game/businessModel';
import type { Allocation, InitiativeAllocationMode, InitiativeAllocationSet } from '../lib/game/state';
import type { CampaignScoreBreakdown } from '../lib/game/scoring';

export type MetricColor = 'gold' | 'emerald' | 'blue' | 'purple' | 'red' | 'cyan';

/**
 * Learner-facing AI lifecycle contracts. These are intentionally structural
 * and optional: old campaigns and standard-mode initiatives predate the AI
 * lifecycle layer and must remain renderable.
 */
export type AiEvaluationDecision = 'go' | 'no_go' | 'pause';
export type AiDeploymentMode = 'augmentation' | 'automation' | 'not_set';
export type AiAdaptationAction = 'retrain' | 'tune' | 'rollback' | 'deprecate';
export type AiLifecycleStage = 'data_readiness' | 'experiment' | 'pilot' | 'evaluate' | 'deploy' | 'monitor' | 'adapt';

export type AiLifecycleEvaluation = {
  successCriteria?: Array<{ id?: string; label?: string; metric: string; threshold: number; actual?: number; met?: boolean; direction?: 'higher-is-better' | 'lower-is-better'; kind?: 'outcome' | 'evidence' | 'safety'; required?: boolean }>;
  goNoGoDecision?: AiEvaluationDecision | 'pending' | 'go_with_conditions';
  decisionRationale?: string;
  decisionOwner?: string;
  recommendedDecision?: 'go' | 'go_with_conditions' | 'no_go';
  confidence?: 'high' | 'medium';
};

export type AiLifecycleMonitoring = {
  performance?: number;
  drift?: number;
  isDegraded?: boolean;
  actionAvailable?: boolean;
  availableActions?: AiAdaptationAction[];
  lastMonitoredAt?: number;
};

export type AiLifecycleSignals = {
  aiLifecycle?: { stage?: AiLifecycleStage | string; stageStatus?: string; stageStartedAt?: number; stageCompletedAt?: number };
  evaluation?: AiLifecycleEvaluation;
  deploymentMode?: AiDeploymentMode;
  riskProfile?: { modelRisk?: number; operationalRisk?: number; legalRisk?: number };
  risks?: { modelRisk?: number; operationalRisk?: number; legalRisk?: number };
  monitoring?: AiLifecycleMonitoring;
  oversight?: { required?: number; allocated?: number };
  humanOversightRequired?: number;
  humanOversightAllocated?: number;
  dataReadiness?: number;
  lastRetrainedAt?: number;
};

export type LifecycleEvaluationPayload = {
  initiativeId: string;
  decision: AiEvaluationDecision;
  rationale: string;
  owner: string;
};

export type LifecycleDeploymentPayload = {
  initiativeId: string;
  mode: Exclude<AiDeploymentMode, 'not_set'>;
  rationale: string;
};

export type LifecycleAdaptationPayload = {
  initiativeId: string;
  action: AiAdaptationAction;
  reason: string;
};

export interface GameInitiative {
  id: string;
  name: string;
  desc: string;
  cost: number;
  roi: number;
  risk: 'LOW' | 'MED' | 'HIGH';
  data: number;
  human: number;
  impact: string;
}

export interface GameCrisis {
  title: string;
  type: string;
  text: string;
  options: Array<[string, string, Record<string, number>, number?]>;
}

export interface GameViewState {
  q: number;
  stage: 'decide' | 'results' | 'done';
  selected: string[];
  initiativeActions: InitiativeActionSet;
  alloc: Allocation;
  initiativeAllocationMode: InitiativeAllocationMode;
  initiativeAllocations: InitiativeAllocationSet;
  roi: number;
  revenue: number;
  efficiency: number;
  adoption: number;
  risk: number;
  data: number;
  satisfaction: number;
  literacy: number;
  turnover: number;
  compliance: number;
  innovation: number;
  spent: number;
  score: number;
  scoreBreakdown?: CampaignScoreBreakdown;
  financialLedger: FinancialLedger;
  history: unknown[];
  achievements: string[];
  crisis: GameCrisis | null;
  feedback: string;
  causalChain: unknown[];
  proactiveRecommendations: unknown[];
  approvedRecommendations: string[];
  discoveredSynergies: string[];
  nextQuarterGuidance?: { title: string; action: string; allocationKey?: string; target?: string } | null;
  baseline: unknown[];
  experimental: boolean;
  initiativeStates: Record<string, InitiativeState>;
  initiativeGeneration?: InitiativeGeneration;
  userReflections: UserReflections;
  scenarioMode: boolean;
  scenarioId?: string;
  currencyMode: CurrencyMode;
  quarterlyBudget: number;
  campaignBudget: number;
  campaignBudgetRemaining: number;
  deploymentAmount: number;
  quarterlyDeploymentCap: number;
  lastQuarterDeployment: number;
  scenarioBudgetRemaining: number;
  scenarioStartingMetrics?: Record<string, number>;
  scenarioState?: {
    metrics?: Record<string, number>;
    progress?: Record<string, number>;
    flags?: Record<string, boolean>;
  };
  scenarioProgress?: Record<string, number>;
  quarterlyCrisisCost: number;
  scenarioOverspend: number;
  scenarioBonus: number;
  runMetadata?: { runId: string; seed: number; scenarioId?: string; rulesVersion: string };
}

export interface Metric {
  label: string;
  value: number;
  unit?: string;
  color: MetricColor;
}
