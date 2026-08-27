import type {
  AdaptationInput,
  AiAdaptationAction,
  AiAutonomyLevel,
  DeploymentImpact,
  InitiativeAction,
  DeploymentModeInput,
  LifecycleReviewInput,
} from './businessModel';
import type { GameState, QuarterSnapshot } from './state';
import type { InitiativeState } from './initiativeState';
import { updateFinancialLedger } from './economics';
import { refreshCampaignScore } from './scoring';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const round = (value: number) => Number(value.toFixed(2));

type LifecycleProfile = {
  dataReadiness?: number;
  experimentQuarters?: number;
  pilotQuarters?: number;
  evaluation?: { goThreshold?: number; conditionalThreshold?: number };
  deployment?: { modes?: Partial<Record<'augmentation' | 'automation', DeploymentImpact>> };
  drift?: { susceptibility?: number; quarterlyRate?: number; degradationThreshold?: number; monitoringRequired?: boolean };
  risks?: { model?: number; operational?: number; legal?: number };
  flywheel?: { active?: boolean; quality?: number; recipientIds?: string[] };
};

const profileFor = (initiative: InitiativeState): LifecycleProfile =>
  ((initiative.lifecycleProfile || (initiative.scenarioMetadata as any)?.lifecycleProfile || {}) as LifecycleProfile);

function hasExistingDeployment(initiative: Pick<InitiativeState, 'lifecycle' | 'quartersFunded' | 'aiLifecycle'>): boolean {
  return (initiative.quartersFunded > 0 && (initiative.lifecycle === 'scale' || initiative.lifecycle === 'run'))
    || initiative.aiLifecycle.stage === 'monitor'
    || (initiative.aiLifecycle.stage === 'deploy' && initiative.aiLifecycle.stageStatus === 'completed');
}

/**
 * Choose the next meaningful operating action for a scenario-backed AI
 * capability. This is presentation guidance, not a hidden state mutation;
 * the resolver below enforces the same material deployment boundaries.
 */
export function suggestedLifecycleAction(initiative: Pick<InitiativeState, 'aiLifecycle' | 'evaluation' | 'lifecycle' | 'quartersFunded' | 'lifecycleProfile' | 'scenarioMetadata'>, quarter: number): InitiativeAction {
  if (hasExistingDeployment(initiative)) return initiative.aiLifecycle.stage === 'monitor' || initiative.lifecycle === 'run' ? 'maintain' : 'scale';
  if (initiative.aiLifecycle.stage === 'data_readiness') return 'discover';
  if (initiative.aiLifecycle.stage === 'experiment') {
    const experimentQuarters = Math.max(1, Math.round(finite(profileFor(initiative as InitiativeState).experimentQuarters, 1)));
    return Math.max(0, Math.round(finite(quarter))) - initiative.aiLifecycle.stageStartedAt >= experimentQuarters ? 'pilot' : 'discover';
  }
  if (initiative.aiLifecycle.stage === 'pilot') return 'pilot';
  if (initiative.aiLifecycle.stage === 'evaluate') return initiative.evaluation.goNoGoDecision === 'pause' ? 'pilot' : 'pause';
  if (initiative.aiLifecycle.stage === 'deploy') return 'scale';
  return initiative.lifecycle === 'retired' ? 'retire' : 'discover';
}

/**
 * Reject only the lifecycle shortcuts that would turn an unproven scenario
 * initiative into a deployment. Standard/legacy play intentionally does not
 * call this guard, preserving its existing portfolio rules.
 */
export function lifecycleActionError(initiative: Pick<InitiativeState, 'name' | 'lifecycle' | 'quartersFunded' | 'aiLifecycle' | 'evaluation' | 'deploymentMode' | 'lifecycleProfile' | 'scenarioMetadata'>, action: InitiativeAction, quarter: number): string | undefined {
  if (hasExistingDeployment(initiative)) return undefined;
  const stage = initiative.aiLifecycle.stage;
  const experimentQuarters = Math.max(1, Math.round(finite(profileFor(initiative as InitiativeState).experimentQuarters, 1)));
  const experimentComplete = Math.max(0, Math.round(finite(quarter))) - initiative.aiLifecycle.stageStartedAt >= experimentQuarters;
  if (action === 'pilot' && !(
    (stage === 'experiment' && experimentComplete)
    || stage === 'pilot'
    || (stage === 'evaluate' && initiative.evaluation.goNoGoDecision === 'pause')
  )) {
    return `${initiative.name} needs the required discovery and experiment period before a pilot can begin.`;
  }
  if (action === 'scale') {
    if (initiative.evaluation.goNoGoDecision !== 'go') {
      return `Evaluation is required before deploying ${initiative.name}. Record a Go, No-Go, or Pause decision first.`;
    }
    if (initiative.deploymentMode === 'not_set') {
      return `Choose augmentation or automation for ${initiative.name} before deploying it.`;
    }
  }
  if (action === 'maintain' && stage !== 'deploy' && stage !== 'monitor') {
    return `${initiative.name} must be deployed before it can enter monitored operations.`;
  }
  return undefined;
}

function replaceLatestHistory(
  state: GameState,
  update: (snapshot: QuarterSnapshot) => QuarterSnapshot,
): GameState {
  const latest = state.history.at(-1);
  if (!latest || latest.q !== state.q) return state;
  return { ...state, history: [...state.history.slice(0, -1), update(latest)] };
}

function recordLifecycleDecision(
  state: GameState,
  kind: 'evaluationDecisions' | 'deploymentDecisions' | 'adaptationDecisions',
  value: Record<string, unknown>,
): GameState {
  return replaceLatestHistory(state, (snapshot) => {
    const existing = (snapshot[kind] || []) as Array<Record<string, unknown>>;
    const next = [...existing.filter((item) => item.initiativeId !== value.initiativeId), { ...value }];
    return {
      ...snapshot,
      [kind]: next,
      initiativeStates: state.initiativeStates,
      financialLedger: state.financialLedger,
      metrics: { ...snapshot.metrics, spent: state.spent },
    };
  });
}

function withInitiative(state: GameState, initiativeId: string, update: (initiative: InitiativeState) => InitiativeState, feedback: string): GameState {
  const current = state.initiativeStates?.[initiativeId];
  if (!current) return { ...state, feedback: `Initiative ${initiativeId} was not found.` };
  return {
    ...state,
    initiativeStates: { ...state.initiativeStates, [initiativeId]: update({ ...current }) },
    feedback,
  };
}

function validText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 1000) : '';
}

/**
 * Evaluation notes are useful debrief material, not a prerequisite for play.
 * Persist an explicit value rather than an ambiguous empty string so reports
 * and counterfactual replays can distinguish a deliberate blank from a
 * missing legacy field.
 */
export function normalizeLifecycleReviewInput(input: LifecycleReviewInput): LifecycleReviewInput {
  return {
    ...input,
    rationale: validText(input.rationale) || 'No Entry',
    owner: validText(input.owner).slice(0, 200) || 'No Entry',
  };
}

/** Record the evidence decision after a pilot. This is pure and replay-safe. */
export function applyLifecycleReview(state: GameState, input: LifecycleReviewInput): GameState {
  if (!['go', 'no_go', 'pause'].includes(input.decision)) return { ...state, feedback: 'Choose Go, No-Go, or Pause for the evaluation.' };
  const review = normalizeLifecycleReviewInput(input);
  const next = withInitiative(state, review.initiativeId, (initiative) => {
    const lifecycle = { ...initiative.aiLifecycle };
    const evaluation = {
      ...initiative.evaluation,
      goNoGoDecision: review.decision,
      decisionRationale: review.rationale,
      decisionOwner: review.owner,
    };
    if (review.decision === 'go') {
      lifecycle.stage = 'deploy';
      lifecycle.stageStatus = 'in_progress';
      lifecycle.stageStartedAt = state.q;
      lifecycle.stageCompletedAt = undefined;
    } else {
      lifecycle.stage = review.decision === 'pause' ? 'evaluate' : 'adapt';
      lifecycle.stageStatus = review.decision === 'pause' ? 'paused' : 'failed';
      lifecycle.stageStartedAt = state.q;
      lifecycle.stageCompletedAt = review.decision === 'no_go' ? state.q : undefined;
    }
    return { ...initiative, aiLifecycle: lifecycle, evaluation };
  }, `Evaluation recorded for ${review.initiativeId}: ${review.decision}.`);
  return next.initiativeStates?.[review.initiativeId]
    ? recordLifecycleDecision(refreshCampaignScore(next), 'evaluationDecisions', review)
    : next;
}

/** Record whether a deployed capability augments people or automates work. */
export function applyDeploymentMode(state: GameState, input: DeploymentModeInput): GameState {
  if (!['augmentation', 'automation'].includes(input.mode)) return { ...state, feedback: 'Choose augmentation or automation.' };
  const rationale = validText(input.rationale) || 'No Entry';
  const normalizedInput = { ...input, rationale };
  const next = withInitiative(state, input.initiativeId, (initiative) => {
    const mode = input.mode;
    const profile = profileFor(initiative);
    const impact: DeploymentImpact = {
      efficiencyDelta: finite(profile.deployment?.modes?.[mode]?.efficiencyDelta, mode === 'automation' ? 12 : 5),
      riskDelta: finite(profile.deployment?.modes?.[mode]?.riskDelta, mode === 'automation' ? 10 : -4),
      trustDelta: finite(profile.deployment?.modes?.[mode]?.trustDelta, mode === 'automation' ? -5 : 3),
      oversightUnits: Math.max(1, finite(profile.deployment?.modes?.[mode]?.oversightUnits, mode === 'automation' ? 3 : 1)),
    };
    const risks = { ...initiative.risks };
    // The profile owns the trade-off; the aggregate score remains a derived
    // compatibility surface rather than a second, hidden rule set.
    risks.operationalRisk = round(clamp(risks.operationalRisk + impact.riskDelta * .45, 0, 100));
    risks.legalRisk = round(clamp(risks.legalRisk + impact.riskDelta * .55, 0, 100));
    return {
      ...initiative,
      deploymentMode: mode,
      risks,
      deploymentImpact: impact,
      humanOversightRequired: impact.oversightUnits,
      autonomyBoundaries: initiative.autonomyBoundaries || (mode === 'augmentation' ? 'Human approval remains required for consequential actions.' : 'Automation is limited to defined, reversible workflow steps.'),
    };
  }, `Deployment mode recorded for ${input.initiativeId}: ${input.mode}.`);
  return next.initiativeStates?.[input.initiativeId]
    ? recordLifecycleDecision(refreshCampaignScore(next), 'deploymentDecisions', normalizedInput)
    : next;
}

/** Apply a deterministic monitoring/adaptation intervention. */
export function applyAdaptation(state: GameState, input: AdaptationInput): GameState {
  const actions: AiAdaptationAction[] = ['retrain', 'tune', 'rollback', 'deprecate'];
  if (!actions.includes(input.action)) return { ...state, feedback: 'Choose retrain, tune, rollback, or deprecate.' };
  const reason = validText(input.reason) || 'No Entry';
  const normalizedInput = { ...input, reason };
  const source = state.initiativeStates?.[input.initiativeId];
  if (!source) return { ...state, feedback: `Initiative ${input.initiativeId} was not found.` };
  const costMultiplier: Record<AiAdaptationAction, number> = { retrain: 1, tune: .4, rollback: .2, deprecate: .1 };
  const cost = round(Math.max(0, finite(source.retrainingCost) * costMultiplier[input.action]));
  const remaining = Math.max(0, Math.min(finite(state.campaignBudgetRemaining), Math.max(0, finite(state.campaignBudget) - finite(state.spent))));
  if (cost > remaining + 1e-9) {
    return { ...state, feedback: `${input.action[0].toUpperCase()}${input.action.slice(1)} for ${source.name} needs ${cost.toFixed(2)} of campaign capital; only ${remaining.toFixed(2)} remains.` };
  }
  const operated = withInitiative(state, input.initiativeId, (initiative) => {
    const history = [...(initiative.adaptationHistory || [])];
    const monitoring = { ...initiative.monitoring };
    const lifecycle = { ...initiative.aiLifecycle };
    const technicalDebt = finite(initiative.technicalDebt);
    let result = '';
    if (input.action === 'retrain') {
      monitoring.drift = round(clamp(monitoring.drift * .2, 0, 100));
      monitoring.performance = round(clamp(Math.max(monitoring.performance, 72), 0, 100));
      monitoring.isDegraded = false;
      initiative.lastRetrainedAt = state.q;
      initiative.technicalDebt = round(clamp(technicalDebt - 12, 0, 100));
      result = 'Drift reset and performance restored through retraining.';
    } else if (input.action === 'tune') {
      monitoring.drift = round(clamp(monitoring.drift - 8, 0, 100));
      monitoring.performance = round(clamp(monitoring.performance + 5, 0, 100));
      initiative.technicalDebt = round(clamp(technicalDebt - 4, 0, 100));
      result = 'Performance improved through a bounded tuning change.';
    } else if (input.action === 'rollback') {
      monitoring.drift = round(clamp(monitoring.drift - 15, 0, 100));
      monitoring.performance = round(clamp(monitoring.performance - 4, 0, 100));
      initiative.technicalDebt = round(clamp(technicalDebt + 2, 0, 100));
      result = 'The previous known-good version was restored; capability is safer but less effective.';
    } else {
      lifecycle.stage = 'adapt';
      lifecycle.stageStatus = 'completed';
      lifecycle.stageCompletedAt = state.q;
      initiative.lifecycle = 'retired';
      initiative.benefitRealization = 0;
      result = 'Capability deprecated and removed from active operations.';
    }
    history.push({ quarter: state.q, action: input.action, reason, result });
    monitoring.actionAvailable = false;
    monitoring.availableActions = undefined;
    return { ...initiative, monitoring, aiLifecycle: lifecycle, adaptationHistory: history };
  }, `Adaptation recorded for ${input.initiativeId}: ${input.action}.`);
  const financialLedger = updateFinancialLedger(operated.financialLedger, {
    investment: cost,
    quarter: state.q,
  });
  const charged: GameState = {
    ...operated,
    spent: round(Math.min(finite(operated.campaignBudget), finite(operated.spent) + cost)),
    campaignBudgetRemaining: round(Math.max(0, remaining - cost)),
    financialLedger,
    feedback: `${operated.feedback} ${cost > 0 ? `${cost.toFixed(2)} of campaign capital was used.` : 'No additional campaign capital was used.'}`,
  };
  return recordLifecycleDecision(refreshCampaignScore(charged), 'adaptationDecisions', normalizedInput);
}

/** Calculate oversight units for one deployed initiative. */
export function calculateHumanOversightRequirement(initiative: Pick<InitiativeState, 'autonomyLevel' | 'deploymentMode' | 'risks'>): number {
  let requirement = 1;
  if (initiative.autonomyLevel === ('semi_autonomous' as AiAutonomyLevel)) requirement += 1;
  if (initiative.autonomyLevel === ('autonomous' as AiAutonomyLevel)) requirement += 2;
  if (initiative.deploymentMode === 'automation') requirement += 1;
  if (initiative.risks.modelRisk > 60) requirement += 1;
  if (initiative.risks.operationalRisk > 60) requirement += 1;
  if (initiative.risks.legalRisk > 60) requirement += 1;
  return requirement;
}

/** Stable risk decomposition used by the aggregate risk score. */
export function calculateAiRiskDrivers(initiative: Pick<InitiativeState, 'currentData' | 'dataReadiness' | 'technicalDebt' | 'monitoring' | 'deploymentMode' | 'deploymentImpact' | 'autonomyLevel' | 'controlMaturity' | 'changeReadiness'>): InitiativeState['risks'] {
  const dataReadiness = Number.isFinite(Number(initiative.dataReadiness))
    ? clamp(finite(initiative.dataReadiness), 0, 100)
    : clamp(finite(initiative.currentData) / 5 * 100, 0, 100);
  const dataGap = 100 - dataReadiness;
  const drift = clamp(finite(initiative.monitoring?.drift), 0, 100);
  const performanceGap = 100 - clamp(finite(initiative.monitoring?.performance, 100), 0, 100);
  const profile = profileFor(initiative as InitiativeState);
  const modelBaseline = finite(profile?.risks?.model, 0);
  const operationalBaseline = finite(profile?.risks?.operational, 0);
  const legalBaseline = finite(profile?.risks?.legal, 0);
  const modelRisk = clamp((modelBaseline || finite(initiative.technicalDebt) * .35) + drift * .35 + performanceGap * .2 + dataGap * .1, 0, 100);
  const autonomyPressure = initiative.autonomyLevel === 'autonomous' ? 25 : initiative.autonomyLevel === 'semi_autonomous' ? 12 : 4;
  const modeRisk = finite(initiative.deploymentImpact?.riskDelta, initiative.deploymentMode === 'automation' ? 10 : 0);
  const operationalRisk = clamp((operationalBaseline || finite(initiative.technicalDebt) * .3) + (100 - clamp(finite(initiative.changeReadiness) * 100, 0, 100)) * .25 + autonomyPressure + modeRisk * .45, 0, 100);
  const legalRisk = clamp((legalBaseline || (initiative.deploymentMode === 'automation' ? 25 : 8)) + (initiative.autonomyLevel === 'autonomous' ? 20 : 0) + (100 - clamp(finite(initiative.controlMaturity) * 100, 0, 100)) * .45 + modeRisk * .55, 0, 100);
  return { modelRisk: round(modelRisk), operationalRisk: round(operationalRisk), legalRisk: round(legalRisk) };
}

/** Derive the legacy aggregate risk score without feeding risk back into itself. */
export function aggregateAiRiskScore(risks: InitiativeState['risks']): number {
  return round(clamp(finite(risks.modelRisk) * .45 + finite(risks.operationalRisk) * .3 + finite(risks.legalRisk) * .25, 0, 100));
}

/**
 * Advance the AI overlay alongside the existing operating action. It is
 * intentionally conservative: a legacy scale/run initiative is considered
 * already deployed, while a newly completed pilot waits for an explicit
 * evaluation review before it can become a new deployment.
 */
export function evolveInitiativeForQuarter(
  source: InitiativeState,
  action: string,
  quarter: number,
  allocation: { people?: number; compliance?: number; mlops?: number },
): InitiativeState {
  const initiative = { ...source, aiLifecycle: { ...source.aiLifecycle }, evaluation: { ...source.evaluation }, monitoring: { ...source.monitoring }, risks: { ...source.risks }, adaptationHistory: [...(source.adaptationHistory || [])] };
  const q = Math.max(0, Math.round(finite(quarter)));
  const ai = initiative.aiLifecycle;
  const hasLegacyDeployment = initiative.quartersFunded > 0 && (initiative.lifecycle === 'scale' || initiative.lifecycle === 'run');
  const setStage = (stage: InitiativeState['aiLifecycle']['stage'], status: InitiativeState['aiLifecycle']['stageStatus'] = 'in_progress') => {
    if (ai.stage !== stage) ai.stageStartedAt = q;
    ai.stage = stage;
    ai.stageStatus = status;
    if (status === 'completed') ai.stageCompletedAt = q;
  };

  const profile = profileFor(initiative);
  const readinessThreshold = clamp(finite(profile.dataReadiness, 60), 0, 100);
  const readiness = clamp(finite(initiative.dataReadiness, finite(initiative.currentData) / 5 * 100), 0, 100);
  if (action === 'discover') {
    if (ai.stage === 'data_readiness' && readiness >= readinessThreshold) setStage('experiment');
    else if (ai.stage === 'adapt' && initiative.lifecycle !== 'retired') setStage('experiment');
  } else if (action === 'pilot') {
    if (ai.stage === 'experiment') setStage('pilot');
    else if (ai.stage === 'pilot' && q - ai.stageStartedAt >= Math.max(0, Math.round(finite(profile.pilotQuarters, 2)) - 1)) setStage('evaluate');
    else if (ai.stage === 'evaluate' && initiative.evaluation.goNoGoDecision === 'pause') setStage('pilot');
  } else if (action === 'scale') {
    if (ai.stage === 'pilot' && q > ai.stageStartedAt && initiative.evaluation.goNoGoDecision === 'pending') {
      setStage('evaluate');
    } else if (initiative.evaluation.goNoGoDecision === 'go' || ai.stage === 'deploy' || hasLegacyDeployment) {
      setStage('deploy', 'completed');
    }
  } else if (action === 'maintain') {
    if (hasLegacyDeployment || ai.stage === 'deploy' || ai.stage === 'monitor') setStage('monitor');
  } else if (action === 'pause') {
    if (initiative.lifecycle !== 'retired') setStage('adapt', 'paused');
  } else if (action === 'retire') {
    setStage('adapt', 'completed');
  }

  const deployed = ai.stage === 'deploy' || ai.stage === 'monitor';
  if (deployed) {
    const mlopsRelief = clamp(finite(allocation.mlops) / 100, 0, .4);
    const baseDriftRate = finite(profile?.drift?.quarterlyRate, 1.5);
    const susceptibility = clamp(finite(profile?.drift?.susceptibility, 50) / 100, 0, 1);
    const driftIncrement = Math.max(0, baseDriftRate * (.5 + susceptibility) + finite(initiative.technicalDebt) * .03 - mlopsRelief * 3);
    initiative.monitoring.drift = round(clamp(finite(initiative.monitoring.drift) + driftIncrement, 0, 100));
    initiative.monitoring.performance = round(clamp(finite(initiative.monitoring.performance, 100) - driftIncrement * .25 + mlopsRelief * 2, 0, 100));
    initiative.monitoring.lastMonitoredAt = q;
    if (initiative.monitoring.performance < 50 && !initiative.monitoring.driftDetectedAt) initiative.monitoring.driftDetectedAt = q;
    initiative.monitoring.isDegraded = initiative.monitoring.performance < finite(profile?.drift?.degradationThreshold, 70);
    initiative.monitoring.actionAvailable = initiative.monitoring.isDegraded;
    initiative.monitoring.availableActions = initiative.monitoring.isDegraded ? ['retrain', 'tune', 'rollback', 'deprecate'] : undefined;
  }
  initiative.humanOversightRequired = calculateHumanOversightRequirement(initiative);
  initiative.humanOversightAllocated = Math.max(0, finite(allocation.people) / 20 + finite(allocation.compliance) / 30);
  initiative.risks = calculateAiRiskDrivers(initiative);
  return initiative;
}

/** Transfer high-quality operational data only along authored flywheel edges. */
export function applyDataFlywheel(states: Record<string, InitiativeState>): Record<string, InitiativeState> {
  const next = Object.fromEntries(Object.entries(states || {}).map(([id, item]) => [id, { ...item }])) as Record<string, InitiativeState>;
  Object.values(states || {}).forEach((source) => {
    const profile = profileFor(source);
    const quality = finite(source.dataFlywheelQuality || profile?.flywheel?.quality);
    const active = source.dataFlywheelActive || profile?.flywheel?.active === true;
    const recipients = profile?.flywheel?.recipientIds || [];
    if (!active || quality < 70 || !['scale', 'run'].includes(source.lifecycle) || !recipients.length) return;
    const transfer = Math.min(.15, quality / 100 * .08);
    recipients.forEach((id) => {
      const recipient = next[id];
      if (!recipient || recipient.id === source.id) return;
      recipient.currentData = round(clamp(finite(recipient.currentData) + transfer, 0, 5));
      recipient.dataReadiness = round(clamp(recipient.currentData / 5 * 100, 0, 100));
    });
  });
  return next;
}

/** Materialise deterministic pilot evidence against scenario-authored criteria. */
export function recordEvaluationEvidence(
  states: Record<string, InitiativeState>,
  previousMetrics: Record<string, number> = {},
  currentMetrics: Record<string, number> = {},
): Record<string, InitiativeState> {
  return Object.fromEntries(Object.entries(states || {}).map(([id, source]) => {
    if (!source.evaluation?.successCriteria?.length) return [id, source];
    const initiative = { ...source, evaluation: { ...source.evaluation, successCriteria: source.evaluation.successCriteria.map((criterion) => {
      const dataReadiness = clamp(finite(source.dataReadiness, finite(source.currentData) / 5 * 100), 0, 100);
      const controlEvidence = clamp(finite(source.controlMaturity) * 100, 0, 100);
      const changeEvidence = clamp(finite(source.changeReadiness) * 100, 0, 100);
      const monitoringEvidence = clamp(finite(source.monitoring?.performance, 100), 0, 100);
      // Negative authored thresholds represent a movement target (for example
      // reduce downtime by two points); positive thresholds are treated as an
      // absolute outcome target when the value is materially larger than one.
      const operationalEvidence = clamp(
        dataReadiness * .35 + controlEvidence * .3 + changeEvidence * .2 + monitoringEvidence * .15,
        0,
        100,
      );
      const safetyEvidence = clamp(
        dataReadiness * .2 + controlEvidence * .55 + changeEvidence * .15 + monitoringEvidence * .1,
        0,
        100,
      );
      const virtualMetrics: Record<string, number> = {
        operationalEvidence,
        safetyEvidence,
        dataReadiness,
        controlEvidence,
        changeEvidence,
        monitoringEvidence,
      };
      const hasVirtualMetric = Object.prototype.hasOwnProperty.call(virtualMetrics, criterion.metric);
      const current = hasVirtualMetric
        ? virtualMetrics[criterion.metric]
        : finite(currentMetrics[criterion.metric], finite(previousMetrics[criterion.metric]));
      const previous = hasVirtualMetric
        ? current
        : finite(previousMetrics[criterion.metric], current);
      const hasRecordedMetric = hasVirtualMetric
        || Object.prototype.hasOwnProperty.call(currentMetrics, criterion.metric)
        || Object.prototype.hasOwnProperty.call(previousMetrics, criterion.metric);
      const actual = hasRecordedMetric
        ? (hasVirtualMetric ? current : (criterion.threshold < 0 || Math.abs(criterion.threshold) <= 10 ? current - previous : current))
        : operationalEvidence;
      const direction = criterion.direction || (criterion.threshold < 0 ? 'lower-is-better' : 'higher-is-better');
      const met = direction === 'lower-is-better'
        ? actual <= criterion.threshold
        : actual >= criterion.threshold;
      return { ...criterion, actual: round(actual), met };
    }) } };
    if (initiative.aiLifecycle.stage === 'evaluate') {
      const criteria = initiative.evaluation.successCriteria;
      const passed = criteria.filter((criterion) => criterion.met).length;
      const ratio = criteria.length ? passed / criteria.length : 0;
      const profile = profileFor(source);
      const goThreshold = clamp(finite(profile.evaluation?.goThreshold, .5), 0, 1);
      const conditionalThreshold = clamp(finite(profile.evaluation?.conditionalThreshold, Math.min(.4, goThreshold)), 0, goThreshold);
      const requiredPassed = criteria.filter((criterion) => criterion.required).every((criterion) => criterion.met);
      initiative.evaluation.recommendedDecision = requiredPassed && ratio >= goThreshold
        ? 'go'
        : requiredPassed && ratio >= conditionalThreshold
          ? 'go_with_conditions'
          : 'no_go';
      initiative.evaluation.confidence = initiative.evaluation.recommendedDecision === 'go' || initiative.evaluation.recommendedDecision === 'no_go' ? 'high' : 'medium';
    }
    return [id, initiative];
  })) as Record<string, InitiativeState>;
}
