import { initiatives, type Initiative } from './initiatives';
import type { DynamicInitiative } from './generator';
import type { FrameworkContribution } from '../scenarios/types';
import type {
  AiAdaptationAction,
  AiAutonomyLevel,
  AiDeploymentMode,
  AiEvaluationState,
  AiLifecycleState,
  AiMonitoringState,
  AiRiskDrivers,
  InitiativeAction,
  InitiativeActionSet,
  InitiativeFunding,
  InitiativeLifecycle,
} from './businessModel';
import type { Allocation, InitiativeAllocationMode, InitiativeAllocationSet } from './state';
import { allocationForInitiative } from './initiativeAllocation';
import { aggregateAiRiskScore, evolveInitiativeForQuarter } from './lifecycleResolver';

export type MaturityLevel = 'nascent' | 'developing' | 'mature' | 'optimized';
export interface InitiativeState extends Initiative {
  currentData: number; currentRoi: number; currentRisk: 'LOW' | 'MED' | 'HIGH'; currentCost: number; currentHuman: number;
  quartersFunded: number; /** Delivery-equivalent funding quarters; scale-up capital can add bounded extra progress. */
  /** Calendar quarters in which this initiative received any attributable cash (discovery, delivery, run, or exit). */
  quartersInvested: number;
  maturityCredits: number;
  quartersSinceLastFund: number; totalInvestment: number; /** Spend used to preserve an active capability without advancing it. */ continuityInvestment: number;
  maturityLevel: MaturityLevel; dataInvestment: number; governanceInvestment: number; trainingInvestment: number;
  /** Explicit operating lifecycle. Legacy saves are migrated from quartersFunded. */ lifecycle: InitiativeLifecycle;
  lifecycleQuarter: number; benefitRealization: number; controlMaturity: number; changeReadiness: number; technicalDebt: number; runCost: number;
  baseRoi?: number; baseCost?: number; baseData?: number; baseHuman?: number; baseRiskScore?: number; riskScore?: number; synergies?: string[];
  scenarioMetadata?: { primaryMetric: string; baseEffect: number; effectUnit: string; neglect: { decayRate: number; penaltyThreshold: number; penaltyAmount: number }; frameworkContribution?: FrameworkContribution };
  /** AI lifecycle overlay; operating lifecycle remains the source of truth for legacy UI. */
  aiLifecycle: AiLifecycleState;
  evaluation: AiEvaluationState;
  deploymentMode: AiDeploymentMode;
  risks: AiRiskDrivers;
  monitoring: AiMonitoringState;
  humanOversightRequired: number;
  humanOversightAllocated: number;
  autonomyLevel: AiAutonomyLevel;
  autonomyBoundaries: string;
  dataFlywheelActive: boolean;
  dataFlywheelQuality: number;
  lastRetrainedAt: number;
  retrainingCost: number;
  adaptationHistory: Array<{ quarter: number; action: AiAdaptationAction; reason: string; result: string }>;
  /** The scenario-authored effect selected by the learner at deployment. */
  deploymentImpact?: import('./businessModel').DeploymentImpact;
  /** UI-friendly percentage view of currentData / 5; retained for authored profiles. */
  dataReadiness?: number;
  /** Scenario-authored lifecycle profile, kept opaque to the generic engine. */
  lifecycleProfile?: unknown;
}
const roundMetric = (value: number) => Number(value.toFixed(2));
const riskScoreFor = (item: InitiativeState) => item.riskScore ?? (item.currentRisk === 'LOW' ? 24 : item.currentRisk === 'MED' ? 48 : 72);
const riskBandFor = (score: number): 'LOW' | 'MED' | 'HIGH' => score < 35 ? 'LOW' : score < 65 ? 'MED' : 'HIGH';
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const safeRiskScore = (init: Initiative): number => {
  const risk = String(init.risk || '').toUpperCase();
  return risk === 'HIGH' ? 72 : risk === 'MED' ? 48 : 24;
};

export function initialAiLifecycleState(quarter = 0): AiLifecycleState {
  return { stage: 'data_readiness', stageStartedAt: Math.max(0, quarter), stageStatus: 'in_progress' };
}

export function initialEvaluationState(): AiEvaluationState {
  return { successCriteria: [], goNoGoDecision: 'pending', decisionRationale: '', decisionOwner: '' };
}

export function initialRiskDrivers(initiative: InitiativeState | Initiative): AiRiskDrivers {
  const base = clamp(Number((initiative as InitiativeState).baseRiskScore ?? safeRiskScore(initiative)), 0, 100);
  return { modelRisk: base, operationalRisk: clamp(base * .8, 0, 100), legalRisk: clamp(base * .7, 0, 100) };
}

export function initialMonitoringState(initiative: InitiativeState | Initiative): AiMonitoringState {
  const debt = clamp(Number((initiative as InitiativeState).technicalDebt || 0), 0, 100);
  return { lastMonitoredAt: 0, performance: Number((100 - debt * .25).toFixed(2)), drift: 0, isDegraded: false };
}

function migratedAiLifecycle(item: InitiativeState, source: Partial<InitiativeState>): AiLifecycleState {
  if (source.aiLifecycle && typeof source.aiLifecycle === 'object') {
    const candidate = source.aiLifecycle as AiLifecycleState;
    const validStages: AiLifecycleState['stage'][] = ['data_readiness', 'experiment', 'pilot', 'evaluate', 'deploy', 'monitor', 'adapt'];
    const validStatuses: AiLifecycleState['stageStatus'][] = ['not_started', 'in_progress', 'completed', 'failed', 'paused'];
    return {
      stage: validStages.includes(candidate.stage) ? candidate.stage : 'data_readiness',
      stageStartedAt: Math.max(0, Number(candidate.stageStartedAt) || 0),
      stageCompletedAt: Number.isFinite(Number(candidate.stageCompletedAt)) ? Math.max(0, Number(candidate.stageCompletedAt)) : undefined,
      stageStatus: validStatuses.includes(candidate.stageStatus) ? candidate.stageStatus : 'in_progress',
    };
  }
  // Existing scale/run saves already represent a deployed capability. They
  // must not be forced back through a new evaluation gate on restore.
  if (item.lifecycle === 'run') return { stage: 'monitor', stageStartedAt: item.lifecycleQuarter, stageCompletedAt: item.lifecycleQuarter, stageStatus: 'completed' };
  if (item.lifecycle === 'scale') return { stage: 'deploy', stageStartedAt: item.lifecycleQuarter, stageCompletedAt: item.lifecycleQuarter, stageStatus: 'completed' };
  if (item.lifecycle === 'pilot') return { stage: 'pilot', stageStartedAt: item.lifecycleQuarter, stageStatus: 'in_progress' };
  if (item.lifecycle === 'paused') return { stage: 'adapt', stageStartedAt: item.lifecycleQuarter, stageStatus: 'paused' };
  if (item.lifecycle === 'retired') return { stage: 'adapt', stageStartedAt: item.lifecycleQuarter, stageCompletedAt: item.lifecycleQuarter, stageStatus: 'completed' };
  return initialAiLifecycleState(item.lifecycleQuarter);
}
export const maturityFor = (funded: number, neglected: number): MaturityLevel => {
  const levels: MaturityLevel[] = ['nascent', 'developing', 'mature', 'optimized'];
  const earned = funded >= 6 ? 3 : funded >= 4 ? 2 : funded >= 2 ? 1 : 0;
  const decay = neglected >= 6 ? 2 : neglected >= 3 ? 1 : 0;
  return levels[Math.max(0, earned - decay)];
};

/**
 * Count completed quarters with real attributable investment. The persisted
 * counter is retained for fast reads, but history reconciles it so tiles and
 * analytics cannot disagree after migration or an older save.
 */
export function investmentQuarterCount(
  snapshots: Array<{ initiativeFunding?: Record<string, { total?: number }>; initiativeStates?: Record<string, { totalInvestment?: number }> }>,
  initiativeId: string,
  current?: Pick<InitiativeState, 'quartersInvested'>,
): number {
  const persisted = Number(current?.quartersInvested);
  const historical = snapshots.filter((snapshot, index) => {
    const funding = Number(snapshot.initiativeFunding?.[initiativeId]?.total || 0);
    const total = Number(snapshot.initiativeStates?.[initiativeId]?.totalInvestment || 0);
    const previous = Number(snapshots[index - 1]?.initiativeStates?.[initiativeId]?.totalInvestment || 0);
    return funding > 0 || total > previous;
  }).length;
  return Math.max(Number.isFinite(persisted) ? Math.max(0, persisted) : 0, historical);
}

export function initializeInitiativeStates(generated: DynamicInitiative[] = initiatives as DynamicInitiative[]): Record<string, InitiativeState> {
  return Object.fromEntries(generated.map(init => {
    const seed = {
      ...init,
      currentData: init.data,
      dataReadiness: roundMetric(init.data / 5 * 100),
      currentRoi: init.roi,
      currentRisk: init.risk as 'LOW' | 'MED' | 'HIGH',
      currentCost: init.cost,
      currentHuman: init.human,
      quartersFunded: 0,
      quartersInvested: 0,
      maturityCredits: 0,
      quartersSinceLastFund: 0,
      totalInvestment: 0,
      continuityInvestment: 0,
      maturityLevel: 'nascent' as MaturityLevel,
      lifecycle: 'discovery' as InitiativeLifecycle,
      lifecycleQuarter: 0,
      benefitRealization: 0,
      controlMaturity: 0,
      changeReadiness: 0,
      technicalDebt: 0,
      runCost: roundMetric(init.cost * .08),
      dataInvestment: 0,
      governanceInvestment: 0,
      trainingInvestment: 0,
    } as InitiativeState;
    return [init.id, {
      ...seed,
      aiLifecycle: initialAiLifecycleState(),
      evaluation: initialEvaluationState(),
      deploymentMode: 'not_set',
      risks: initialRiskDrivers(seed),
      monitoring: initialMonitoringState(seed),
      humanOversightRequired: 0,
      humanOversightAllocated: 0,
      autonomyLevel: 'advisory',
      autonomyBoundaries: '',
      dataFlywheelActive: false,
      dataFlywheelQuality: 0,
      lastRetrainedAt: 0,
      retrainingCost: roundMetric(init.cost * .12),
      adaptationHistory: [],
    } as InitiativeState];
  })) as Record<string, InitiativeState>;
}

const lifecycleActions: InitiativeAction[] = ['discover', 'pilot', 'scale', 'maintain', 'pause', 'retire'];
const lifecycleValues: InitiativeLifecycle[] = ['discovery', 'pilot', 'scale', 'run', 'paused', 'retired'];

export function isInitiativeAction(value: unknown): value is InitiativeAction {
  return typeof value === 'string' && lifecycleActions.includes(value as InitiativeAction);
}

export function isInitiativeLifecycle(value: unknown): value is InitiativeLifecycle {
  return typeof value === 'string' && lifecycleValues.includes(value as InitiativeLifecycle);
}

/** Hydrate a state record while retaining every historic metric unchanged. */
export function migrateInitiativeState(saved: Partial<InitiativeState> | undefined, base: InitiativeState): InitiativeState {
  const source = saved && typeof saved === 'object' ? saved : {};
  const quartersFunded = Number.isFinite(Number(source.quartersFunded)) ? Math.max(0, Number(source.quartersFunded)) : base.quartersFunded;
  const lifecycle = isInitiativeLifecycle(source.lifecycle)
    ? source.lifecycle
    : (quartersFunded > 0 ? 'run' : base.lifecycle);
  const currentCost = Number.isFinite(Number(source.currentCost)) ? Math.max(0, Number(source.currentCost)) : base.currentCost;
  const currentHuman = Number.isFinite(Number(source.currentHuman)) ? Math.max(0, Number(source.currentHuman)) : base.currentHuman;
  const bounded = (value: unknown, fallback: number, min = 0, max = 1) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(min, Math.min(max, numeric)) : fallback;
  };
  const migrated: InitiativeState = {
    ...base,
    ...source,
    quartersFunded,
    quartersInvested: Number.isFinite(Number(source.quartersInvested))
      ? Math.max(0, Number(source.quartersInvested))
      : quartersFunded,
    currentCost,
    lifecycle,
    lifecycleQuarter: Math.max(0, Number.isFinite(Number(source.lifecycleQuarter)) ? Number(source.lifecycleQuarter) : (quartersFunded > 0 ? quartersFunded : base.lifecycleQuarter)),
    benefitRealization: bounded(source.benefitRealization, quartersFunded > 0 ? 1 : base.benefitRealization),
    controlMaturity: bounded(source.controlMaturity, base.controlMaturity),
    changeReadiness: bounded(source.changeReadiness, bounded(currentHuman / 5, base.changeReadiness)),
    technicalDebt: bounded(source.technicalDebt, base.technicalDebt, 0, 100),
    runCost: Math.max(0, Number.isFinite(Number(source.runCost)) ? Number(source.runCost) : (base.runCost || currentCost * .08)),
    aiLifecycle: migratedAiLifecycle({ ...base, ...source, lifecycle, lifecycleQuarter: Math.max(0, Number.isFinite(Number(source.lifecycleQuarter)) ? Number(source.lifecycleQuarter) : (quartersFunded > 0 ? quartersFunded : base.lifecycleQuarter)) } as InitiativeState, source),
    evaluation: source.evaluation && typeof source.evaluation === 'object'
      ? {
          successCriteria: Array.isArray((source.evaluation as any).successCriteria)
            ? (source.evaluation as any).successCriteria.flatMap((criterion: any) => typeof criterion?.metric === 'string' && Number.isFinite(Number(criterion.threshold))
              ? [{
                  ...(typeof criterion.id === 'string' ? { id: criterion.id.slice(0, 120) } : {}),
                  ...(typeof criterion.label === 'string' ? { label: criterion.label.slice(0, 240) } : {}),
                  ...(criterion.direction === 'higher-is-better' || criterion.direction === 'lower-is-better' ? { direction: criterion.direction } : {}),
                  ...(criterion.kind === 'outcome' || criterion.kind === 'evidence' || criterion.kind === 'safety' ? { kind: criterion.kind } : {}),
                  ...(criterion.required === true ? { required: true } : {}),
                  metric: criterion.metric,
                  threshold: Number(criterion.threshold),
                  actual: Number.isFinite(Number(criterion.actual)) ? Number(criterion.actual) : 0,
                  met: criterion.met === true,
                }]
              : [])
            : [],
          goNoGoDecision: ['go', 'go_with_conditions', 'no_go', 'pause', 'pending'].includes((source.evaluation as any).goNoGoDecision) ? (source.evaluation as any).goNoGoDecision : 'pending',
          decisionRationale: typeof (source.evaluation as any).decisionRationale === 'string' ? (source.evaluation as any).decisionRationale.slice(0, 1000) : '',
          decisionOwner: typeof (source.evaluation as any).decisionOwner === 'string' ? (source.evaluation as any).decisionOwner.slice(0, 200) : '',
          ...( ['go', 'go_with_conditions', 'no_go'].includes((source.evaluation as any).recommendedDecision) ? { recommendedDecision: (source.evaluation as any).recommendedDecision } : {}),
          ...( ['high', 'medium'].includes((source.evaluation as any).confidence) ? { confidence: (source.evaluation as any).confidence } : {}),
        }
      : initialEvaluationState(),
    deploymentMode: source.deploymentMode === 'augmentation' || source.deploymentMode === 'automation' ? source.deploymentMode : 'not_set',
    risks: {
      modelRisk: bounded((source.risks as any)?.modelRisk, base.risks?.modelRisk ?? riskScoreFor({ ...base, currentRisk: base.currentRisk } as InitiativeState), 0, 100),
      operationalRisk: bounded((source.risks as any)?.operationalRisk, base.risks?.operationalRisk ?? riskScoreFor({ ...base, currentRisk: base.currentRisk } as InitiativeState) * .8, 0, 100),
      legalRisk: bounded((source.risks as any)?.legalRisk, base.risks?.legalRisk ?? riskScoreFor({ ...base, currentRisk: base.currentRisk } as InitiativeState) * .7, 0, 100),
    },
    monitoring: {
      lastMonitoredAt: Math.max(0, Number((source.monitoring as any)?.lastMonitoredAt) || base.monitoring?.lastMonitoredAt || 0),
      performance: bounded((source.monitoring as any)?.performance, base.monitoring?.performance ?? 100, 0, 100),
      drift: bounded((source.monitoring as any)?.drift, base.monitoring?.drift ?? 0, 0, 100),
      driftDetectedAt: Number.isFinite(Number((source.monitoring as any)?.driftDetectedAt)) ? Math.max(0, Number((source.monitoring as any).driftDetectedAt)) : base.monitoring?.driftDetectedAt,
      isDegraded: (source.monitoring as any)?.isDegraded === true,
      actionAvailable: (source.monitoring as any)?.actionAvailable === true,
      availableActions: Array.isArray((source.monitoring as any)?.availableActions)
        ? (source.monitoring as any).availableActions.filter((action: unknown): action is AiAdaptationAction => ['retrain', 'tune', 'rollback', 'deprecate'].includes(String(action)))
        : undefined,
    },
    humanOversightRequired: bounded(source.humanOversightRequired, base.humanOversightRequired, 0, 100),
    humanOversightAllocated: bounded(source.humanOversightAllocated, base.humanOversightAllocated, 0, 100),
    autonomyLevel: source.autonomyLevel === 'semi_autonomous' || source.autonomyLevel === 'autonomous' ? source.autonomyLevel : (base.autonomyLevel || 'advisory'),
    autonomyBoundaries: typeof source.autonomyBoundaries === 'string' ? source.autonomyBoundaries.slice(0, 500) : (base.autonomyBoundaries || ''),
    dataFlywheelActive: source.dataFlywheelActive === true,
    dataFlywheelQuality: bounded(source.dataFlywheelQuality, base.dataFlywheelQuality, 0, 100),
    lastRetrainedAt: Math.max(0, Number.isFinite(Number(source.lastRetrainedAt)) ? Number(source.lastRetrainedAt) : base.lastRetrainedAt),
    retrainingCost: Math.max(0, Number.isFinite(Number(source.retrainingCost)) ? Number(source.retrainingCost) : base.retrainingCost),
    adaptationHistory: Array.isArray(source.adaptationHistory)
      ? source.adaptationHistory.flatMap((entry: any) => ['retrain', 'tune', 'rollback', 'deprecate'].includes(entry?.action) && typeof entry?.reason === 'string'
        ? [{ quarter: Math.max(0, Number(entry.quarter) || 0), action: entry.action, reason: entry.reason.slice(0, 500), result: typeof entry.result === 'string' ? entry.result.slice(0, 500) : '' }]
        : [])
      : [...(base.adaptationHistory || [])],
    deploymentImpact: source.deploymentImpact && typeof source.deploymentImpact === 'object'
      ? {
          efficiencyDelta: Number.isFinite(Number((source.deploymentImpact as any).efficiencyDelta)) ? Number((source.deploymentImpact as any).efficiencyDelta) : 0,
          riskDelta: Number.isFinite(Number((source.deploymentImpact as any).riskDelta)) ? Number((source.deploymentImpact as any).riskDelta) : 0,
          trustDelta: Number.isFinite(Number((source.deploymentImpact as any).trustDelta)) ? Number((source.deploymentImpact as any).trustDelta) : 0,
          oversightUnits: Math.max(0, Number.isFinite(Number((source.deploymentImpact as any).oversightUnits)) ? Number((source.deploymentImpact as any).oversightUnits) : 0),
        }
      : base.deploymentImpact,
    dataReadiness: Number.isFinite(Number(source.dataReadiness)) ? clamp(Number(source.dataReadiness), 0, 100) : roundMetric((Number(source.currentData) || base.currentData) / 5 * 100),
    lifecycleProfile: source.lifecycleProfile ?? base.lifecycleProfile,
  };
  return migrated;
}

/** Pure transition table used by both the UI and the resolver integration. */
export function transitionInitiativeLifecycle(current: InitiativeLifecycle, action: InitiativeAction): InitiativeLifecycle {
  if (action === 'discover') return current === 'retired' ? 'retired' : 'discovery';
  if (action === 'pilot') return current === 'retired' ? 'retired' : 'pilot';
  if (action === 'scale') return current === 'retired' ? 'retired' : 'scale';
  if (action === 'maintain') return current === 'retired' ? 'retired' : 'run';
  if (action === 'pause') return current === 'retired' ? 'retired' : 'paused';
  return 'retired';
}

export type LifecycleUpdateMetrics = {
  adoption: number;
  fundingIntensity?: number;
  investmentMultiplier?: number;
  fundingByInitiative?: Record<string, InitiativeFunding>;
  initiativeAllocationMode?: InitiativeAllocationMode;
  initiativeAllocations?: InitiativeAllocationSet;
};

const emptyFunding = (): InitiativeFunding => ({ discovery: 0, delivery: 0, scaleUp: 0, run: 0, continuity: 0, retirement: 0, total: 0 });

/**
 * Evolves initiatives from explicit lifecycle actions. This is additive to
 * updateInitiativeStates, which remains the compatibility path for old saves.
 */
export function updateInitiativeStatesForActions(
  states: Record<string, InitiativeState>,
  actions: InitiativeActionSet,
  allocation: Allocation,
  metrics: LifecycleUpdateMetrics,
): Record<string, InitiativeState> {
  const next = Object.fromEntries(Object.entries(states || {}).map(([id, value]) => [id, { ...value }])) as Record<string, InitiativeState>;
  const intensity = Math.max(0, Math.min(1.35, Number(metrics.fundingIntensity) || 1));
  const investmentMultiplier = Math.max(0, Number(metrics.investmentMultiplier) || 1);
  Object.values(next).forEach((item) => {
    const initiativeAllocation = allocationForInitiative(
      item.id,
      metrics.initiativeAllocationMode || 'shared',
      metrics.initiativeAllocations,
      allocation,
    );
    // An initiative with no explicit action is paused for this quarter. This
    // prevents an unselected initiative from silently receiving discovery
    // progress merely because the action map omitted it.
    const action = isInitiativeAction(actions[item.id]) ? actions[item.id] : (item.lifecycle === 'run' ? 'maintain' : 'pause');
    const funding = metrics.fundingByInitiative?.[item.id] || emptyFunding();
    const attributableInvestment = Math.max(0, Number(funding.total) || 0);
    if (attributableInvestment > 0) item.quartersInvested = Math.max(0, Number(item.quartersInvested) || 0) + 1;
    const priorLifecycle = isInitiativeLifecycle(item.lifecycle) ? item.lifecycle : (item.quartersFunded > 0 ? 'run' : 'discovery');
    const lifecycle = transitionInitiativeLifecycle(priorLifecycle, action);
    item.lifecycle = lifecycle;
    item.lifecycleQuarter = Math.max(0, Number(item.lifecycleQuarter) || 0) + 1;
    item.runCost = roundMetric(Number(item.runCost) > 0 ? item.runCost : item.currentCost * .08);
    item.benefitRealization = Math.max(0, Math.min(1, Number(item.benefitRealization) || 0));
    item.controlMaturity = Math.max(0, Math.min(1, Number(item.controlMaturity) || 0));
    item.changeReadiness = Math.max(0, Math.min(1, Number(item.changeReadiness) || 0));
    item.technicalDebt = Math.max(0, Math.min(100, Number(item.technicalDebt) || 0));

    if (action === 'discover') {
      item.benefitRealization = roundMetric(item.benefitRealization * .95);
      item.technicalDebt = roundMetric(Math.min(100, item.technicalDebt + .5));
      // Discovery funds the evidence base. It can improve persistent data
      // readiness, but it never creates realised operating value on its own.
      const discoveryCapital = Math.max(0, Number(funding.discovery) || 0);
      const evidenceCapital = Math.max(0, Number(funding.scaleUp) || 0);
      // Excess release is still a discovery investment: convert it into
      // durable evidence/data readiness instead of leaving it unrepresented.
      item.dataInvestment = roundMetric(item.dataInvestment + (Number(initiativeAllocation.data || 0) / 14 + evidenceCapital / 10) * intensity);
      item.currentData = roundMetric(Math.min(5, item.currentData + (.04 + Number(initiativeAllocation.data || 0) / 110 + discoveryCapital / 100 + evidenceCapital / 20) * intensity));
      item.totalInvestment = roundMetric(item.totalInvestment + attributableInvestment);
      item.quartersSinceLastFund += 1;
    } else if (action === 'pilot' || action === 'scale') {
      const delivery = Math.max(0, Number(funding.delivery) || Number(funding.total) || 0);
      const progress = action === 'pilot' ? .5 : 1;
      item.quartersFunded += 1;
      item.quartersSinceLastFund = 0;
      item.totalInvestment = roundMetric(item.totalInvestment + Math.max(delivery, funding.total || 0));
      item.maturityCredits = roundMetric((Number(item.maturityCredits) || 0) + progress + Math.min(1, Math.max(0, investmentMultiplier - 1)));
      item.benefitRealization = roundMetric(Math.min(1, item.benefitRealization + (action === 'pilot' ? .18 : .3) * intensity));
      item.controlMaturity = roundMetric(Math.min(1, item.controlMaturity + (Number(initiativeAllocation.compliance) || 0) / 1000 * intensity));
      item.changeReadiness = roundMetric(Math.min(1, item.changeReadiness + (Number(initiativeAllocation.people) || 0) / 500 * intensity));
      item.dataInvestment = roundMetric(item.dataInvestment + Number(initiativeAllocation.data || 0) / 10 * intensity);
      item.currentData = roundMetric(Math.min(5, item.currentData + (.05 + Number(initiativeAllocation.data || 0) / 100) * intensity));
      item.technicalDebt = roundMetric(Math.max(0, item.technicalDebt - (Number(initiativeAllocation.mlops) || 0) / 20));
      item.maturityLevel = maturityFor(item.maturityCredits, 0);
    } else if (action === 'maintain') {
      item.quartersSinceLastFund = 0;
      item.totalInvestment = roundMetric(item.totalInvestment + Math.max(0, Number(funding.run) || Number(funding.continuity) || 0));
      item.continuityInvestment = roundMetric(item.continuityInvestment + Math.max(0, Number(funding.continuity) || Number(funding.run) || 0));
      item.benefitRealization = roundMetric(Math.min(1, item.benefitRealization + .02 * intensity));
      item.technicalDebt = roundMetric(Math.max(0, item.technicalDebt - .5));
      item.maturityLevel = maturityFor(Number(item.maturityCredits) || item.quartersFunded, 0);
    } else if (action === 'pause') {
      item.quartersSinceLastFund += 1;
      item.benefitRealization = roundMetric(item.benefitRealization * .9);
      item.technicalDebt = roundMetric(Math.min(100, item.technicalDebt + 2));
      item.maturityLevel = maturityFor(Number(item.maturityCredits) || item.quartersFunded, item.quartersSinceLastFund);
    } else {
      item.quartersSinceLastFund += 1;
      item.benefitRealization = 0;
      item.technicalDebt = roundMetric(Math.min(100, item.technicalDebt + 1));
      // Retirement is still an attributable investment quarter: record the
      // exit cost even though it produces no delivery progress.
      if (action === 'retire') item.totalInvestment = roundMetric(item.totalInvestment + attributableInvestment);
    }
    item.dataReadiness = roundMetric(clamp(Number(item.currentData || 0) / 5 * 100, 0, 100));
    Object.assign(item, evolveInitiativeForQuarter(item, action, item.lifecycleQuarter, initiativeAllocation));
    item.riskScore = roundMetric(Math.max(8, Math.min(96, aggregateAiRiskScore(item.risks))));
    item.currentRisk = riskBandFor(item.riskScore);
  });
  return next;
}

export function updateInitiativeStates(states: Record<string, InitiativeState>, selected: string[], allocation: any, metrics: { adoption: number; fundingIntensity?: number; investmentMultiplier?: number; continuityAllocations?: Record<string, number> }): Record<string, InitiativeState> {
  const next = Object.fromEntries(Object.entries(states || initializeInitiativeStates()).map(([id, value]) => [id, { ...value }]));
  const fundingIntensity = Math.max(1, Math.min(1.35, Number(metrics.fundingIntensity) || 1));
  const investmentMultiplier = Math.max(0, Number(metrics.investmentMultiplier) || 1);
  Object.values(next).forEach(item => {
    if (!selected.includes(item.id)) {
      const continuitySpend = Math.max(0, Number(metrics.continuityAllocations?.[item.id]) || 0);
      if (continuitySpend > 0) {
        // Continuity is preservation, not a disguised new delivery quarter.
        // It prevents neglect while leaving new capability progress to selected work.
        item.quartersSinceLastFund = 0;
        item.totalInvestment = roundMetric(item.totalInvestment + continuitySpend);
        item.quartersInvested = Math.max(0, Number(item.quartersInvested) || 0) + 1;
        item.continuityInvestment = roundMetric((item.continuityInvestment || 0) + continuitySpend);
        item.maturityCredits = Number.isFinite(item.maturityCredits) ? item.maturityCredits : item.quartersFunded;
        item.maturityLevel = maturityFor(item.maturityCredits, 0);
        item.currentRisk = riskBandFor(riskScoreFor(item));
        return;
      }
      item.quartersSinceLastFund += 1;
      const neglectRisk = item.quartersSinceLastFund > 3 ? 3 : .75;
      item.riskScore = roundMetric(Math.min(96, riskScoreFor(item) + neglectRisk));
      if (item.quartersSinceLastFund > 3) { item.currentData = roundMetric(Math.max(1, item.currentData - .2)); item.currentRoi = Math.round(Math.max(item.roi * .7, item.currentRoi * .98)); }
      item.maturityCredits = Number.isFinite(item.maturityCredits) ? item.maturityCredits : item.quartersFunded;
      item.currentRisk = riskBandFor(riskScoreFor(item)); item.maturityLevel = maturityFor(item.maturityCredits, item.quartersSinceLastFund); return;
    }
    // Charge the same live quarterly cost the learner saw before confirming.
    // The next-quarter estimate may improve with maturity, but it cannot
    // retroactively change the cost of this quarter's decision.
    const fundedCost = item.currentCost * investmentMultiplier;
    item.quartersSinceLastFund = 0; item.quartersFunded += 1; item.quartersInvested = Math.max(0, Number(item.quartersInvested) || 0) + 1;
    const priorCredits = Number.isFinite(item.maturityCredits) ? item.maturityCredits : item.quartersFunded - 1;
    // At floor cost this is one delivery quarter. At 2x the floor (or more),
    // it earns at most one additional credit: fast, but never instant maturity.
    const accelerationCredit = Math.min(1, Math.max(0, investmentMultiplier - 1));
    item.maturityCredits = roundMetric(priorCredits + 1 + accelerationCredit);
    item.dataInvestment = roundMetric(item.dataInvestment + Number(allocation.data || 0) / 10 * fundingIntensity); item.governanceInvestment = roundMetric(item.governanceInvestment + Number(allocation.compliance || 0) / 10 * fundingIntensity); item.trainingInvestment = roundMetric(item.trainingInvestment + Number(allocation.people || 0) / 10 * fundingIntensity);
    item.currentData = roundMetric(Math.min(5, item.currentData + (Number(allocation.data || 0) / 50 + .12) * fundingIntensity));
    item.currentHuman = roundMetric(Math.min(5, item.currentHuman + (Number(allocation.people || 0) / 75 + metrics.adoption / 1000) * fundingIntensity));
    // Maturity credits affect the next and subsequent quarters' economics,
    // so accelerated delivery compounds instead of disappearing after one turn.
    const evolutionBonus = Math.min(.15, item.maturityCredits * .02);
    item.currentRoi = Math.round(Math.min(item.roi * 1.15, Math.max(item.roi, item.currentRoi) * (1 + Math.min(.03, evolutionBonus) * fundingIntensity)));
    item.currentCost = roundMetric(item.cost * (1 - Math.min(.2, item.quartersFunded * .03)));
    item.riskScore = roundMetric(Math.max(8, riskScoreFor(item) - 4 * fundingIntensity - Number(allocation.compliance || 0) / 12)); item.currentRisk = riskBandFor(item.riskScore); item.totalInvestment = roundMetric(item.totalInvestment + fundedCost); item.maturityLevel = maturityFor(item.maturityCredits, 0);
  });
  return next;
}
