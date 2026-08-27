/**
 * Shared contracts for the versioned business-model redesign.  These types
 * deliberately contain no rules so independent model lanes can build against
 * one stable vocabulary before the turn resolver is rewired.
 */

export type InitiativeLifecycle = 'discovery' | 'pilot' | 'scale' | 'run' | 'paused' | 'retired';

/** Learner-facing lifecycle overlay. The operating lifecycle above remains the
 * compatibility contract used by the board and scenario engine. */
export type AiLifecycleStage = 'data_readiness' | 'experiment' | 'pilot' | 'evaluate' | 'deploy' | 'monitor' | 'adapt';
export type AiLifecycleStatus = 'not_started' | 'in_progress' | 'completed' | 'failed' | 'paused';
export type AiEvaluationDecision = 'go' | 'no_go' | 'pause' | 'pending';
export type AiDeploymentMode = 'augmentation' | 'automation' | 'not_set';
export type AiAutonomyLevel = 'advisory' | 'semi_autonomous' | 'autonomous';
export type AiAdaptationAction = 'retrain' | 'tune' | 'rollback' | 'deprecate';

export type AiSuccessCriterion = {
  /** Stable scenario-authored identity and learner-facing label when available. */
  id?: string;
  label?: string;
  metric: string;
  threshold: number;
  actual: number;
  met: boolean;
  direction?: 'higher-is-better' | 'lower-is-better';
  kind?: 'outcome' | 'evidence' | 'safety';
  required?: boolean;
};

export type AiEvaluationState = {
  successCriteria: AiSuccessCriterion[];
  goNoGoDecision: AiEvaluationDecision;
  decisionRationale: string;
  decisionOwner: string;
  /** Evidence-led guidance; the learner remains accountable for the decision. */
  recommendedDecision?: 'go' | 'go_with_conditions' | 'no_go';
  confidence?: 'high' | 'medium';
};

export type AiRiskDrivers = {
  modelRisk: number;
  operationalRisk: number;
  legalRisk: number;
};

export type AiMonitoringState = {
  lastMonitoredAt: number;
  performance: number;
  drift: number;
  driftDetectedAt?: number;
  isDegraded: boolean;
  /** A degraded capability needs a visible, deterministic adaptation choice. */
  actionAvailable?: boolean;
  availableActions?: AiAdaptationAction[];
};

export type DeploymentImpact = {
  efficiencyDelta: number;
  riskDelta: number;
  trustDelta: number;
  oversightUnits: number;
};

export type AiLifecycleState = {
  stage: AiLifecycleStage;
  stageStartedAt: number;
  stageCompletedAt?: number;
  stageStatus: AiLifecycleStatus;
};

export type LifecycleReviewInput = {
  initiativeId: string;
  decision: Exclude<AiEvaluationDecision, 'pending'>;
  rationale: string;
  owner: string;
};

export type DeploymentModeInput = {
  initiativeId: string;
  mode: Exclude<AiDeploymentMode, 'not_set'>;
  rationale: string;
};

export type AdaptationInput = {
  initiativeId: string;
  action: AiAdaptationAction;
  reason: string;
};

export type LifecycleReviewSet = Record<string, Omit<LifecycleReviewInput, 'initiativeId'>>;
export type DeploymentModeSet = Record<string, Omit<DeploymentModeInput, 'initiativeId'>>;
export type AdaptationSet = Record<string, Omit<AdaptationInput, 'initiativeId'>>;

export type InitiativeAction = 'discover' | 'pilot' | 'scale' | 'maintain' | 'pause' | 'retire';

export type InitiativeFunding = {
  discovery: number;
  delivery: number;
  scaleUp: number;
  run: number;
  continuity: number;
  retirement: number;
  total: number;
};

export type FinancialLedger = {
  investment: number;
  runCost: number;
  crisisCost: number;
  grossBenefit: number;
  netBenefit: number;
  cumulativeInvestment: number;
  cumulativeNetBenefit: number;
  paybackQuarter?: number;
  realisedROI?: number;
};

export type CapacityState = {
  deliveryTeams: number;
  changeCapacity: number;
  dataEngineeringCapacity: number;
  governanceReviewCapacity: number;
  /** Oversight units available this quarter for deployed AI capabilities. */
  humanOversightCapacity?: number;
  /** Oversight units consumed by the proposed portfolio. */
  humanOversightDemand?: number;
};

export type InitiativeRequirements = {
  deliveryLoad: number;
  changeLoad: number;
  dataLoad: number;
  governanceLoad: number;
  minimumDataReadiness: number;
  minimumControlMaturity: number;
};

export type GateStatus = 'blocked' | 'conditional' | 'ready';

export type GateResult = {
  status: GateStatus;
  reasons: string[];
  deliveryMultiplier: number;
  riskAdjustment: number;
};

export type InitiativeActionSet = Record<string, InitiativeAction>;
