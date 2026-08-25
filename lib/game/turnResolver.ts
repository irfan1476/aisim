import { calculateCapitalPlan } from './capital';
import { resolveQuarter, deriveScore } from './engine';
import { describeSynergies } from './generator';
import { generateCrisis } from './crises';
import { causalChain } from './metrics';
import { normalizeGameState } from './persistence';
import { generateProactiveRecommendations } from './recommendations';
import { calculateProgressPercentages, calculateScenarioProgress } from '../scenarios/progress';
import { getScenario } from '../scenarios/registry';
import { quarterlyDeploymentCap, type Allocation, type GameState } from './state';

export type TurnDecision = {
  selected: string[];
  alloc: Allocation;
  deploymentAmount: number;
};

export type CrisisResponse = {
  impact: Record<string, number>;
  cost?: number;
};

export type TurnResolution =
  | { accepted: false; nextState: GameState; reason: string }
  | { accepted: true; nextState: GameState; decision: TurnDecision };

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
  const state = normalizeGameState(source);
  const selected = Array.from(new Set(input.selected)).slice(0, 3);
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const discovery = describeSynergies(selected, state.initiativeStates, scenario?.synergies);
  const synergyCostReduction = Math.min(0.15, discovery?.effects.reduce((sum, effect) => sum + effect.costReduction, 0) || 0);
  const selectedCost = selected.reduce((sum, id) => {
    const initiative = state.initiativeStates[id];
    return sum + Number(initiative?.currentCost ?? initiative?.baseCost ?? initiative?.cost ?? 0);
  }, 0) * (1 - synergyCostReduction);
  const campaignRemaining = Number(state.campaignBudgetRemaining ?? state.campaignBudget ?? state.quarterlyBudget * 12);
  const deploymentCap = quarterlyDeploymentCap(state.campaignBudget, campaignRemaining, state.quarterlyBudget, state.q, state.spent);
  const deploymentAmount = Math.min(deploymentCap, Math.max(0, Number(input.deploymentAmount) || 0));
  const capitalPlan = calculateCapitalPlan(state, selected, selectedCost, deploymentAmount);

  if (selected.length > 0 && capitalPlan.requiredCapital > deploymentAmount + 1e-9) {
    const reason = `This portfolio needs ${capitalPlan.requiredCapital.toFixed(2)} this quarter: ${selectedCost.toFixed(2)} for the initiatives and ${capitalPlan.maintenanceSpend.toFixed(2)} to continue existing work. You have released ${deploymentAmount.toFixed(2)}. Increase deployment, choose fewer initiatives, or keep the reserve.`;
    return { accepted: false, nextState: { ...state, feedback: reason }, reason };
  }

  const actualDeployment = selected.length ? deploymentAmount : 0;
  const deliveryCapital = selected.length ? capitalPlan.deliveryCapital : 0;
  const result = resolveQuarter(state, {
    selected,
    alloc: input.alloc,
    deploymentAmount: deliveryCapital,
    continuityAllocations: selected.length ? capitalPlan.continuityAllocations : undefined,
  });
  const adjustedMetrics = {
    ...result.metrics,
    spent: state.spent + actualDeployment,
    risk: Math.min(95, Number(result.metrics.risk ?? state.risk)),
  };
  const resolvedState = { ...state, ...adjustedMetrics, initiativeStates: result.initiativeStates, scenarioState: result.scenarioState };
  const discoveredSynergies = Array.from(new Set([
    ...state.discoveredSynergies,
    ...(discovery?.effects.map((effect) => effect.key) || []),
  ]));
  const resolvedRisk = Number(adjustedMetrics.risk ?? state.risk);
  const crisisProbability = Math.max(.08, Math.min(.7, (resolvedRisk - 15) / 75));
  const scenarioProgress = scenario
    ? (result.scenarioState?.progress || calculateScenarioProgress(resolvedState, scenario)?.values)
    : state.scenarioProgress;
  const scenarioBonus = state.scenarioMode && state.q >= 12 && scenario
    ? Math.round((calculateScenarioProgress(resolvedState, scenario)?.overall || 0) / 20)
    : state.scenarioBonus;
  const scenarioCrisis = scenario && state.q % 3 === 0 && crisisRoll(state.initiativeGeneration.seed, state.q) < crisisProbability
    ? scenario.crises[Math.abs(state.initiativeGeneration.seed + state.q) % scenario.crises.length]
    : null;
  const nextCrisis = scenarioCrisis
    ? { ...scenarioCrisis, options: scenarioCrisis.options.map((option) => [option.label, option.description, option.impacts, option.cost] as [string, string, Record<string, number>, number?]) }
    : state.q % 3 === 0 && crisisRoll(state.initiativeGeneration.seed, state.q) < crisisProbability
      ? generateCrisis(state.initiativeGeneration.seed + state.q)
      : null;
  const nextCausalChain = causalChain(state, selected, result.initiativeStates, deliveryCapital);
  const nextRecommendations = generateProactiveRecommendations(resolvedState);
  const nextState: GameState = {
    ...resolvedState,
    score: Math.min(100, deriveScore(state, adjustedMetrics) + scenarioBonus),
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
    scenarioBonus,
    stage: 'results',
    crisis: nextCrisis,
    causalChain: nextCausalChain,
    proactiveRecommendations: nextRecommendations,
    discoveredSynergies,
    feedback: discovery?.message || (selected.length === 0
      ? `Quarter ${state.q} resolved with no new funding. Reserve was preserved; previously funded initiatives will now be tested by neglect dynamics.`
      : `Quarter ${state.q} resolved. ${capitalPlan.accelerationSpend > 0 ? `Scale-up capital increased delivery intensity to ${result.snapshot.fundingIntensity?.toFixed(2)}×.` : 'Your portfolio is now showing the consequences of this allocation.'}`),
    history: [...state.history, {
      ...result.snapshot,
      deployedAmount: actualDeployment,
      fixedInitiativeSpend: selectedCost,
      maintenanceSpend: selected.length ? capitalPlan.maintenanceSpend : 0,
      accelerationSpend: selected.length ? capitalPlan.accelerationSpend : 0,
      crisisResponseSpend: state.quarterlyCrisisCost,
      remainingReserve: Math.max(0, campaignRemaining - actualDeployment),
      budgetProvenance: 'campaign-purse-with-guided-acceleration',
      metrics: adjustedMetrics,
      crisis: nextCrisis,
      causalChain: nextCausalChain,
      recommendations: nextRecommendations,
    }],
  };
  return { accepted: true, nextState, decision: { selected, alloc: { ...input.alloc }, deploymentAmount } };
}

/** Apply a learner-selected response to the crisis created by a resolved turn. */
export function applyCrisisResponse(source: GameState, response: CrisisResponse): GameState {
  const state = normalizeGameState(source);
  const cost = Math.max(0, Number(response.cost) || 0);
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
  const remaining = Math.max(0, Number(state.campaignBudgetRemaining ?? state.campaignBudget ?? state.quarterlyBudget * 12) - cost);
  const next = {
    ...state,
    ...nativeImpact,
    spent: state.spent + cost,
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
        causalChain: nextCausalChain,
        metrics: { ...next.history[next.history.length - 1].metrics, spent: next.spent },
      }]
    : next.history;
  return {
    ...next,
    history,
    scenarioProgress: scenario ? calculateScenarioProgress(next, scenario)?.values : next.scenarioProgress,
    scenarioState: nextScenarioState,
  };
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
