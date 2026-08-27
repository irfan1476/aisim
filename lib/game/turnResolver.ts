import { calculateActionCapitalPlan } from './capital';
import { resolveQuarter } from './engine';
import { describeSynergies } from './generator';
import { generateCrisis } from './crises';
import { causalChain } from './metrics';
import { normalizeGameState } from './persistence';
import { generateProactiveRecommendations } from './recommendations';
import { calculateProgressPercentages, calculateScenarioProgress } from '../scenarios/progress';
import { getScenario } from '../scenarios/registry';
import { quarterlyDeploymentCap, type Allocation, type GameState, type InitiativeAllocationMode, type InitiativeAllocationSet } from './state';
import type { InitiativeActionSet } from './businessModel';
import type { AdaptationInput, AdaptationSet, DeploymentModeInput, DeploymentModeSet, LifecycleReviewInput, LifecycleReviewSet } from './businessModel';
import { validatePortfolioCapacity } from './capacity';
import { updateFinancialLedger } from './economics';
import { composeCampaignScore, realisedFinancialValueScore, refreshCampaignScore, validatedLearningScore } from './scoring';
import { applyAdaptation, applyDeploymentMode, applyLifecycleReview, lifecycleActionError, normalizeLifecycleReviewInput } from './lifecycleResolver';
import { allocationForInitiative, allocationTotal, derivePortfolioAllocation } from './initiativeAllocation';

export type TurnDecision = {
  selected: string[];
  initiativeActions?: InitiativeActionSet;
  lifecycleReviews?: LifecycleReviewSet;
  deploymentModes?: DeploymentModeSet;
  adaptations?: AdaptationSet;
  /** Array aliases are used by the executable counterfactual trace format. */
  evaluationDecisions?: LifecycleReviewInput[];
  deploymentDecisions?: DeploymentModeInput[];
  adaptationDecisions?: AdaptationInput[];
  alloc: Allocation;
  initiativeAllocationMode?: InitiativeAllocationMode;
  initiativeAllocations?: InitiativeAllocationSet;
  deploymentAmount: number;
};

export type CrisisResponse = {
  impact: Record<string, number>;
  cost?: number;
};

export type TurnResolution =
  | { accepted: false; nextState: GameState; reason: string }
  | { accepted: true; nextState: GameState; decision: TurnDecision };

/** Return the maximum crisis-response cost that can be charged to the purse. */
export function affordableCrisisResponseCost(source: GameState, requestedCost: number | undefined): number {
  const state = normalizeGameState(source);
  const requested = Math.max(0, Number(requestedCost) || 0);
  const campaignBudget = Math.max(0, Number(state.campaignBudget) || 0);
  const spent = Math.max(0, Number(state.spent) || 0);
  const recordedRemaining = Math.max(0, Number(state.campaignBudgetRemaining) || 0);
  const remaining = Math.max(0, Math.min(recordedRemaining, campaignBudget - spent));
  return Math.min(requested, remaining);
}

function crisisRoll(seed: number, quarter: number): number {
  let value = ((seed >>> 0) + quarter * 2654435761) >>> 0;
  value = (value * 1664525 + 1013904223) >>> 0;
  return value / 4294967296;
}

/**
 * Resolve one board decision without touching browser state or React. Both
 * live play and counterfactual replay use this function so their rules cannot
 * drift apart.
 */
export function applyTurnDecision(source: GameState, input: TurnDecision): TurnResolution {
  let state = normalizeGameState(source);
  const lifecycleReviews = input.lifecycleReviews
    ? Object.fromEntries(Object.entries(input.lifecycleReviews).map(([initiativeId, review]) => {
      const normalized = normalizeLifecycleReviewInput({ initiativeId, ...review });
      const { initiativeId: _ignored, ...record } = normalized;
      return [initiativeId, record];
    })) as LifecycleReviewSet
    : undefined;
  const evaluationDecisions = input.evaluationDecisions?.map(normalizeLifecycleReviewInput);
  // Lifecycle operations are part of the deterministic decision payload. The
  // pure GameState helpers are also exposed for stores that want to commit one
  // operation before the quarter is submitted.
  Object.entries(lifecycleReviews || {}).forEach(([initiativeId, review]) => {
    state = applyLifecycleReview(state, { initiativeId, ...review });
  });
  (evaluationDecisions || []).forEach((review) => { state = applyLifecycleReview(state, review); });
  Object.entries(input.deploymentModes || {}).forEach(([initiativeId, mode]) => {
    state = applyDeploymentMode(state, { initiativeId, ...mode });
  });
  (input.deploymentDecisions || []).forEach((mode) => { state = applyDeploymentMode(state, mode); });
  Object.entries(input.adaptations || {}).forEach(([initiativeId, adaptation]) => {
    state = applyAdaptation(state, { initiativeId, ...adaptation });
  });
  (input.adaptationDecisions || []).forEach((adaptation) => { state = applyAdaptation(state, adaptation); });
  const selected = Array.from(new Set(input.selected || [])).slice(0, 3);
  const rawInitiativeActions: InitiativeActionSet = Object.keys(input.initiativeActions || {}).length
    ? { ...input.initiativeActions }
    : Object.keys(state.initiativeActions || {}).length
      ? { ...state.initiativeActions }
      : Object.fromEntries(selected.map((id) => [id, 'scale']));
  // `selected` is authoritative for new work. A stale discover/pilot/scale
  // action must not survive after its card is deselected (legacy saves and
  // older clients can still submit that mismatched pair).
  const selectedSet = new Set(selected);
  const initiativeActions: InitiativeActionSet = Object.fromEntries(
    Object.entries(rawInitiativeActions).filter(([id, action]) =>
      selectedSet.has(id) || !['discover', 'pilot', 'scale'].includes(action),
    ),
  );
  selected.forEach((id) => { initiativeActions[id] = initiativeActions[id] || 'scale'; });
  const lifecycleBlock = state.scenarioMode
    ? Object.entries(initiativeActions).flatMap(([id, action]) => {
      const initiative = state.initiativeStates[id];
      const reason = initiative ? lifecycleActionError(initiative, action, state.q) : undefined;
      return reason ? [reason] : [];
    })[0]
    : undefined;
  if (lifecycleBlock) {
    const reason = lifecycleBlock;
    return { accepted: false, nextState: { ...state, feedback: reason }, reason };
  }
  const deliveryIds = Object.entries(initiativeActions)
    .filter(([id, action]) => Boolean(state.initiativeStates[id]) && (action === 'pilot' || action === 'scale'))
    .map(([id]) => id)
    .slice(0, 3);
  const discoveryIds = selected.filter((id) => initiativeActions[id] === 'discover');
  const portfolioIds = selected.filter((id) => initiativeActions[id] !== 'pause');
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const campaignRemaining = Number(state.campaignBudgetRemaining ?? state.campaignBudget ?? state.quarterlyBudget * 12);
  const deploymentCap = quarterlyDeploymentCap(state.campaignBudget, campaignRemaining, state.quarterlyBudget, state.q, state.spent);
  const deploymentAmount = Math.min(deploymentCap, Math.max(0, Number(input.deploymentAmount) || 0));
  const capitalPlan = calculateActionCapitalPlan(state, initiativeActions, deploymentAmount);

  if (capitalPlan.requiredCapital > deploymentAmount + 1e-9) {
    const reason = `This lifecycle plan needs ${capitalPlan.requiredCapital.toFixed(2)} this quarter, including delivery, run, and exit commitments. You have released ${deploymentAmount.toFixed(2)}. Increase deployment or change the initiative actions.`;
    return { accepted: false, nextState: { ...state, feedback: reason }, reason };
  }

  const initiativeAllocationMode = input.initiativeAllocationMode === 'custom' ? 'custom' : state.initiativeAllocationMode;
  const initiativeAllocations = input.initiativeAllocations || state.initiativeAllocations;
  if (initiativeAllocationMode === 'custom') {
    const unbalanced = Object.entries(capitalPlan.byInitiative)
      .filter(([, funding]) => Number(funding.total || 0) > 0)
      .filter(([id]) => allocationTotal(allocationForInitiative(id, 'custom', initiativeAllocations, input.alloc)) !== 100)
      .map(([id]) => state.initiativeStates[id]?.name || id);
    if (unbalanced.length > 0) {
      const reason = `${unbalanced.join(', ')} ${unbalanced.length === 1 ? 'has' : 'have'} an operating mix below or above 100%. Adjust each initiative's controls before confirming this quarter.`;
      return { accepted: false, nextState: { ...state, feedback: reason }, reason };
    }
  }
  const effectiveAllocation = derivePortfolioAllocation(input.alloc, initiativeAllocationMode, initiativeAllocations, capitalPlan.byInitiative);
  const capacityValidation = validatePortfolioCapacity(initiativeActions, state.initiativeStates, effectiveAllocation, scenario);
  // Capacity is a hard operating limit. Readiness is deliberately not: a
  // learner may run a constrained experiment and see the slower, riskier
  // result rather than being prevented from learning by the interface.
  if (capacityValidation.issues.length > 0) {
    const reason = capacityValidation.issues[0]?.message || 'This delivery plan exceeds the available operating capacity.';
    return { accepted: false, nextState: { ...state, feedback: reason }, reason };
  }
  const discovery = describeSynergies(deliveryIds, state.initiativeStates, scenario?.synergies);
  const constrainedExperiments = Object.entries(capacityValidation.gates)
    .filter(([, gate]) => gate.status !== 'ready')
    .map(([id]) => state.initiativeStates[id]?.name || id);

  const actualDeployment = capitalPlan.totalReleased;
  const deliveryCapital = capitalPlan.deliveryCapital;
  const result = resolveQuarter(state, {
    // Preserve discovery as a resolved portfolio choice. `resolveQuarter`
    // separately limits operating effects to pilot/scale actions.
    selected: portfolioIds,
    initiativeActions,
    lifecycleReviews,
    deploymentModes: input.deploymentModes,
    adaptations: input.adaptations,
    evaluationDecisions,
    deploymentDecisions: input.deploymentDecisions,
    adaptationDecisions: input.adaptationDecisions,
    alloc: effectiveAllocation,
    initiativeAllocationMode,
    initiativeAllocations,
    deploymentAmount: deliveryCapital,
    fundingByInitiative: capitalPlan.byInitiative,
    gateResults: capacityValidation.gates,
  });
  const adjustedMetrics = {
    ...result.metrics,
    spent: state.spent + actualDeployment,
    risk: Math.min(95, Number(result.metrics.risk ?? state.risk)),
  };
  const grossBenefit = Object.values(result.initiativeStates)
    .filter((initiative) => ['pilot', 'scale', 'run'].includes(initiative.lifecycle))
    .reduce((sum, initiative) => sum + Number(initiative.currentCost || 0) * (Number(initiative.currentRoi || 0) / 100) * Number(initiative.benefitRealization || 0), 0);
  const financialLedger = updateFinancialLedger(state.financialLedger, {
    investment: Math.max(0, actualDeployment - capitalPlan.maintenanceSpend),
    runCost: capitalPlan.maintenanceSpend,
    grossBenefit,
    quarter: state.q,
  });
  const resolvedState = { ...state, ...adjustedMetrics, selected: portfolioIds, initiativeActions, initiativeAllocationMode, initiativeAllocations, financialLedger, initiativeStates: result.initiativeStates, scenarioState: result.scenarioState };
  const discoveredSynergies = Array.from(new Set([
    ...state.discoveredSynergies,
    ...(discovery?.effects.map((effect) => effect.key) || []),
  ]));
  const resolvedRisk = Number(adjustedMetrics.risk ?? state.risk);
  const crisisProbability = Math.max(.08, Math.min(.7, (resolvedRisk - 15) / 75));
  // Persist progress as percentages against each declared target. Scenario
  // metric values (PPM, index points, etc.) are intentionally kept in
  // scenarioState.metrics and must never be averaged as score percentages.
  const scenarioProgress = scenario
    ? calculateProgressPercentages(result.scenarioState?.metrics || {}, scenario)
    : state.scenarioProgress;
  const scenarioOverall = scenario
    ? Object.values(scenarioProgress || {}).reduce((sum, value) => sum + Number(value || 0), 0) / Math.max(1, Object.keys(scenarioProgress || {}).length)
    : 0;
  const operatingHealth = (Number(adjustedMetrics.adoption ?? state.adoption) + Number(adjustedMetrics.efficiency ?? state.efficiency) + Number(adjustedMetrics.data ?? state.data) + (100 - Number(adjustedMetrics.risk ?? state.risk))) / 4;
  const executionDiscipline = Math.min(100, (capacityValidation.status === 'valid' ? 65 : 40) + Math.min(25, state.q * 2) + Math.min(10, deliveryIds.length * 3));
  const responsibleAI = (Number(effectiveAllocation.compliance || 0) * 2 + (Object.values(result.initiativeStates).reduce((sum, item) => sum + Number(item.controlMaturity || 0), 0) / Math.max(1, Object.keys(result.initiativeStates).length)) * 30);
  const scoreModel = composeCampaignScore({
    scenarioMode: Boolean(scenario), scenarioTargetProgress: scenarioOverall,
    realisedFinancialValue: realisedFinancialValueScore(financialLedger), operatingHealth,
    executionDiscipline, responsibleAI, validatedLearning: validatedLearningScore(resolvedState),
  });
  const scenarioCrisis = scenario && state.q % 3 === 0 && crisisRoll(state.initiativeGeneration.seed, state.q) < crisisProbability
    ? scenario.crises[Math.abs(state.initiativeGeneration.seed + state.q) % scenario.crises.length]
    : null;
  const nextCrisis = scenarioCrisis
    ? { ...scenarioCrisis, options: scenarioCrisis.options.map((option) => [option.label, option.description, option.impacts, option.cost] as [string, string, Record<string, number>, number?]) }
    : state.q % 3 === 0 && crisisRoll(state.initiativeGeneration.seed, state.q) < crisisProbability
      ? generateCrisis(state.initiativeGeneration.seed + state.q)
      : null;
  const nextCausalChain = causalChain(state, deliveryIds, result.initiativeStates, deliveryCapital, result.snapshot.portfolio);
  const nextRecommendations = generateProactiveRecommendations(resolvedState);
  const nextState: GameState = {
    ...resolvedState,
    score: Math.round(scoreModel.score),
    scoreBreakdown: scoreModel,
    scenarioProgress,
    scenarioState: result.scenarioState,
    portfolio: result.snapshot.portfolio,
    selectedCount: result.snapshot.selectedCount ?? result.snapshot.selectedIds?.length ?? 0,
    portfolioPosture: result.snapshot.portfolioPosture ?? 'pause',
    portfolioBreadth: result.snapshot.breadth ?? 0,
    concentrationRisk: result.snapshot.concentrationRisk ?? 0,
    scenarioOverspend: capitalPlan.accelerationSpend,
    campaignBudgetRemaining: Math.max(0, campaignRemaining - actualDeployment),
    deploymentAmount,
    quarterlyDeploymentCap: quarterlyDeploymentCap(state.campaignBudget, Math.max(0, campaignRemaining - actualDeployment), state.quarterlyBudget, state.q, state.spent + actualDeployment),
    lastQuarterDeployment: actualDeployment,
    scenarioBudgetRemaining: state.scenarioMode
      ? Math.max(0, state.quarterlyBudget - actualDeployment)
      : state.scenarioBudgetRemaining,
    scenarioBonus: 0,
    stage: 'results',
    crisis: nextCrisis,
    causalChain: nextCausalChain,
    proactiveRecommendations: nextRecommendations,
    discoveredSynergies,
    feedback: constrainedExperiments.length
      ? `Experiment recorded: ${constrainedExperiments.join(', ')} moved ahead before all readiness conditions were met. The outcome includes slower delivery and additional risk—use the result to refine the next hypothesis.`
      : discovery?.message || (deliveryIds.length === 0 && discoveryIds.length > 0
      ? `Quarter ${state.q} recorded discovery for ${discoveryIds.map((id) => state.initiativeStates[id]?.name || id).join(', ')}. Evidence and data readiness advanced; operating value will begin only after a later pilot or scale decision.`
      : deliveryIds.length === 0
      ? `Quarter ${state.q} resolved with no new funding for delivery. Run, pause, and retirement actions were recorded.`
      : `Quarter ${state.q} resolved. ${capitalPlan.accelerationSpend > 0 ? `Scale-up capital increased delivery intensity to ${result.snapshot.fundingIntensity?.toFixed(2)}×.` : 'Your portfolio is now showing the consequences of this allocation.'}`),
    history: [...state.history, {
      ...result.snapshot,
      initiativeActions,
      allocationMode: initiativeAllocationMode,
      initiativeAllocations,
      initiativeFunding: capitalPlan.byInitiative,
      financialLedger,
      capacity: capacityValidation.capacity,
      deployedAmount: actualDeployment,
      fixedInitiativeSpend: capitalPlan.initiativeMinimum,
      maintenanceSpend: capitalPlan.maintenanceSpend,
      accelerationSpend: capitalPlan.accelerationSpend,
      crisisResponseSpend: state.quarterlyCrisisCost,
      remainingReserve: Math.max(0, campaignRemaining - actualDeployment),
      budgetProvenance: 'campaign-purse-with-guided-acceleration',
      metrics: adjustedMetrics,
      crisis: nextCrisis,
      causalChain: nextCausalChain,
      recommendations: nextRecommendations,
    }],
  };
  return {
    accepted: true,
    nextState,
    decision: {
      selected: deliveryIds,
      initiativeActions,
      lifecycleReviews: lifecycleReviews ? { ...lifecycleReviews } : undefined,
      deploymentModes: input.deploymentModes ? { ...input.deploymentModes } : undefined,
      adaptations: input.adaptations ? { ...input.adaptations } : undefined,
      evaluationDecisions: evaluationDecisions ? evaluationDecisions.map((item) => ({ ...item })) : undefined,
      deploymentDecisions: input.deploymentDecisions ? input.deploymentDecisions.map((item) => ({ ...item })) : undefined,
      adaptationDecisions: input.adaptationDecisions ? input.adaptationDecisions.map((item) => ({ ...item })) : undefined,
      alloc: { ...input.alloc },
      initiativeAllocationMode,
      initiativeAllocations: JSON.parse(JSON.stringify(initiativeAllocations || {})),
      deploymentAmount,
    },
  };
}

/** Apply a learner-selected response to the crisis created by a resolved turn. */
export function applyCrisisResponse(source: GameState, response: CrisisResponse): GameState {
  const state = normalizeGameState(source);
  const requestedCost = Math.max(0, Number(response.cost) || 0);
  const cost = affordableCrisisResponseCost(state, requestedCost);
  if (requestedCost > cost + 1e-9) {
    return {
      ...state,
      feedback: `That response requires ${requestedCost.toFixed(2)} of campaign capital, but only ${cost.toFixed(2)} is available. Choose an affordable response or preserve the remaining purse.`,
    };
  }
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const scenarioKeys = new Set(scenario?.progress.map((definition) => definition.key) || []);
  const nativeImpact = Object.fromEntries(Object.entries(response.impact).filter(([key]) => !scenarioKeys.has(key)));
  const scenarioMetrics = scenario ? { ...(state.scenarioState?.metrics || {}) } : undefined;
  if (scenarioMetrics) {
    for (const [key, delta] of Object.entries(response.impact)) {
      const definition = scenario?.progress.find((item) => item.key === key);
      if (definition) {
        scenarioMetrics[key] = Math.min(
          definition.max,
          Math.max(definition.min, (scenarioMetrics[key] || definition.start) + Number(delta)),
        );
      }
    }
  }
  const crisisCausalItem = {
    name: 'Crisis response',
    explanation: cost > 0
      ? `The chosen response changed this quarter's operating outcome and used ${cost.toFixed(2)} of campaign capital.`
      : 'The chosen response changed this quarter\'s operating outcome without an additional capital charge.',
    effects: Object.entries(response.impact).map(([key, delta]) => {
      const definition = scenario?.progress.find((item) => item.key === key);
      const improves = definition
        ? (definition.direction === 'higher-is-better' ? Number(delta) >= 0 : Number(delta) <= 0)
        : key === 'risk' ? Number(delta) <= 0 : Number(delta) >= 0;
      return {
        metric: definition?.label || key,
        delta: Number(delta),
        color: improves ? 'emerald' : 'crimson',
        unit: definition?.unit,
        explanation: 'Recorded impact of the crisis response selected by the learner.',
      };
    }),
  };
  const nextCausalChain = [...(state.causalChain || []), crisisCausalItem];
  const campaignRemaining = Math.max(
    0,
    Math.min(Number(state.campaignBudgetRemaining) || 0, (Number(state.campaignBudget) || 0) - (Number(state.spent) || 0)),
  );
  const remaining = Math.max(0, campaignRemaining - cost);
  const nextSpent = Math.min(Number(state.campaignBudget) || 0, state.spent + cost);
  const financialLedger = updateFinancialLedger(state.financialLedger, { crisisCost: cost, quarter: state.q });
  const next = {
    ...state,
    ...nativeImpact,
    spent: nextSpent,
    financialLedger,
    campaignBudgetRemaining: remaining,
    scenarioBudgetRemaining: state.scenarioMode ? Math.max(0, state.scenarioBudgetRemaining - cost) : state.scenarioBudgetRemaining,
    quarterlyDeploymentCap: quarterlyDeploymentCap(state.campaignBudget, remaining, state.quarterlyBudget, state.q, state.spent + cost),
    quarterlyCrisisCost: state.quarterlyCrisisCost + cost,
    crisis: null,
    stage: 'results' as const,
    causalChain: nextCausalChain,
    ...(scenarioMetrics ? { scenarioState: { ...state.scenarioState, metrics: scenarioMetrics } } : {}),
  };
  const nextScenarioState = scenarioMetrics && scenario
    ? { ...next.scenarioState, progress: calculateProgressPercentages(scenarioMetrics, scenario) }
    : next.scenarioState;
  const history = next.history.length
    ? [...next.history.slice(0, -1), {
        ...next.history[next.history.length - 1],
        scenarioState: nextScenarioState,
        crisisResponse: response.impact,
        crisisResponseSpend: cost,
        financialLedger,
        causalChain: nextCausalChain,
        metrics: { ...next.history[next.history.length - 1].metrics, spent: next.spent },
      }]
    : next.history;
  const withProgress = {
    ...next,
    history,
    scenarioProgress: scenario ? calculateScenarioProgress(next, scenario)?.values : next.scenarioProgress,
    scenarioState: nextScenarioState,
  };
  return refreshCampaignScore(withProgress);
}

/** Move a completed quarter to the next decision point without persistence side effects. */
export function advanceTurn(source: GameState): GameState {
  const state = normalizeGameState(source);
  if (state.q >= 12) return { ...state, stage: 'done' };
  return {
    ...state,
    q: state.q + 1,
    stage: 'decide',
    selected: [],
    initiativeActions: Object.fromEntries(Object.values(state.initiativeStates || {}).flatMap<[string, 'maintain' | 'pause']>((initiative) => {
      if (initiative.lifecycle === 'run') return [[initiative.id, 'maintain']];
      if (initiative.lifecycle === 'paused') return [[initiative.id, 'pause']];
      return [];
    })),
    crisis: null,
    causalChain: [],
    proactiveRecommendations: [],
    quarterlyCrisisCost: 0,
    scenarioBudgetRemaining: state.scenarioBudgetRemaining === undefined ? state.quarterlyBudget : state.quarterlyBudget,
    quarterlyDeploymentCap: quarterlyDeploymentCap(state.campaignBudget, state.campaignBudgetRemaining, state.quarterlyBudget, state.q + 1, state.spent),
    deploymentAmount: Math.min(state.quarterlyBudget * 0.6, quarterlyDeploymentCap(state.campaignBudget, state.campaignBudgetRemaining, state.quarterlyBudget, state.q + 1, state.spent)),
    scenarioOverspend: 0,
    feedback: `Quarter ${state.q + 1} is ready. You can invest, accelerate deliberately, or take an observation quarter.`,
  };
}
