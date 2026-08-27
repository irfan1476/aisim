import { initialGameState, normalizeDeploymentAmount, quarterlyDeploymentCap, type Allocation, type GameState, type InitiativeAllocationSet, type MetricKey, type PortfolioSnapshot, type QuarterSnapshot } from './state';
import { initializeInitiativeStates, migrateInitiativeState, type InitiativeState } from './initiativeState';
import { createInitiativeGeneration, generateInitiatives, inferArchetypeFromDecisions, type InitiativeGeneration, type ScenarioArchetype } from './generator';
import { getScenario } from '../scenarios/registry';
import { scenarioInitiativesToStates } from './initiativeAdapter';
import { emptyFinancialLedger } from './economics';
import { isInitiativeAction } from './initiativeState';
import { allocationTotal, rebalanceOperatingAllocation } from './initiativeAllocation';
import type { AdaptationSet, DeploymentModeSet, InitiativeActionSet, LifecycleReviewSet, AdaptationInput, DeploymentModeInput, LifecycleReviewInput } from './businessModel';

export const GAME_STORAGE_KEY = 'ai-investment-game';
export const LEGACY_GAME_STORAGE_KEY = 'ai-investment-save';
export const WHAT_IF_STORAGE_KEY = 'ai-whatif-applied';
export const LEADERBOARD_STORAGE_KEY = 'ai_simulation_leaderboard';
export const LEGACY_MIGRATION_KEY = 'ai-investment-legacy-migrated';
export const CAMPAIGN_CHECKPOINTS_STORAGE_KEY = 'ai-investment-campaign-checkpoints';
export const GAME_PERSISTENCE_VERSION = 9;

export type CampaignCheckpoint = {
  id: string;
  label: string;
  createdAt: string;
  q: number;
  state: GameState;
};

export type WhatIfDraft = {
  name?: string;
  selected: string[];
  alloc: Allocation;
  deploymentAmount?: number;
  initiativeActions?: InitiativeActionSet;
  projection?: Record<string, unknown>;
  quarter?: number;
};

const metricKeys: MetricKey[] = [
  'roi', 'revenue', 'efficiency', 'adoption', 'risk', 'data', 'satisfaction',
  'literacy', 'turnover', 'compliance', 'innovation', 'spent', 'score',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numberOr(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function stringArrayOr(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [...fallback];
}

function normalizePortfolio(value: unknown): PortfolioSnapshot | undefined {
  if (!isRecord(value)) return undefined;
  const posture = value.portfolioPosture ?? value.posture;
  if (posture !== 'pause' && posture !== 'deep-focus' && posture !== 'focused-balance' && posture !== 'portfolio-breadth') return undefined;
  return {
    selectedCount: Math.max(0, Math.min(3, Math.round(numberOr(value.selectedCount, 0)))),
    availableInitiatives: Math.max(0, Math.round(numberOr(value.availableInitiatives, 0))),
    portfolioPosture: posture,
    breadth: numberOr(value.breadth, 0),
    focusMultiplier: numberOr(value.focusMultiplier, 1),
    concentrationRisk: numberOr(value.concentrationRisk, 0),
    coordinationPressure: numberOr(value.coordinationPressure, 0),
    neglectedCount: Math.max(0, Math.round(numberOr(value.neglectedCount, 0))),
    provenance: 'calculated-from-portfolio-choice',
  };
}

function normalizeGeneration(value: unknown, baseline: number[]): InitiativeGeneration {
  const source = isRecord(value) ? value : {};
  const archetypes: ScenarioArchetype[] = ['balanced', 'data-driven', 'people-first', 'tech-first', 'risk-tolerant', 'risk-averse'];
  const archetype = archetypes.includes(source.archetype as ScenarioArchetype) ? source.archetype as ScenarioArchetype : inferArchetypeFromDecisions(baseline);
  const seed = numberOr(source.seed, 2030);
  const context = isRecord(source.context) ? source.context : {};
  const generated = createInitiativeGeneration(archetype, baseline, seed);
  return { ...generated, context: { organization: numberOr(context.organization, generated.context.organization), data: numberOr(context.data, generated.context.data), team: numberOr(context.team, generated.context.team) } };
}

function normalizeAllocation(value: unknown, fallback: Allocation): Allocation {
  const source = isRecord(value) ? value : {};
  return {
    infra: numberOr(source.infra, fallback.infra),
    data: numberOr(source.data, fallback.data),
    people: numberOr(source.people, fallback.people),
    mlops: numberOr(source.mlops, fallback.mlops),
    compliance: numberOr(source.compliance, fallback.compliance),
    innovation: numberOr(source.innovation, fallback.innovation),
  };
}

function normalizeInitiativeAllocations(value: unknown, fallback: Allocation, initiativeIds?: Set<string>): InitiativeAllocationSet {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([id, allocation]) => (!initiativeIds || initiativeIds.has(id)) && isRecord(allocation))
    .map(([id, allocation]) => {
      const normalized = normalizeAllocation(allocation, fallback);
      return [id, allocationTotal(normalized) === 100 ? normalized : rebalanceOperatingAllocation(normalized, 'infra', normalized.infra)];
    }));
}

function normalizeInitiativeStates(value: unknown, fallback: Record<string, InitiativeState>): Record<string, InitiativeState> {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(Object.entries(fallback).map(([id, base]) => {
    const saved = isRecord(source[id]) ? source[id] : {};
    const migrated = migrateInitiativeState(saved as Partial<InitiativeState>, base);
    return [id, {
      ...migrated,
      currentData: numberOr(saved.currentData, base.currentData),
      currentRoi: numberOr(saved.currentRoi, base.currentRoi),
      currentCost: numberOr(saved.currentCost, base.currentCost),
      currentHuman: numberOr(saved.currentHuman, base.currentHuman),
      quartersFunded: numberOr(saved.quartersFunded, base.quartersFunded),
      quartersInvested: numberOr(saved.quartersInvested, numberOr(saved.quartersFunded, base.quartersInvested)),
      maturityCredits: numberOr(saved.maturityCredits, numberOr(saved.quartersFunded, base.maturityCredits)),
      quartersSinceLastFund: numberOr(saved.quartersSinceLastFund, base.quartersSinceLastFund),
      totalInvestment: numberOr(saved.totalInvestment, base.totalInvestment),
      continuityInvestment: numberOr(saved.continuityInvestment, base.continuityInvestment),
      dataInvestment: numberOr(saved.dataInvestment, base.dataInvestment),
      governanceInvestment: numberOr(saved.governanceInvestment, base.governanceInvestment),
      trainingInvestment: numberOr(saved.trainingInvestment, base.trainingInvestment),
      maturityLevel: saved.maturityLevel === 'developing' || saved.maturityLevel === 'mature' || saved.maturityLevel === 'optimized'
        ? saved.maturityLevel
        : base.maturityLevel,
      currentRisk: saved.currentRisk === 'LOW' || saved.currentRisk === 'MED' || saved.currentRisk === 'HIGH'
        ? saved.currentRisk
        : base.currentRisk,
    } as InitiativeState];
  }));
}

function normalizeSnapshot(
  value: unknown,
  fallbackMetrics: GameState,
  fallbackStates: Record<string, InitiativeState>,
): QuarterSnapshot | null {
  if (!isRecord(value)) return null;
  const metricsSource = isRecord(value.metrics) ? value.metrics : {};
  const metrics = Object.fromEntries(metricKeys.map((key) => [key, numberOr(metricsSource[key], fallbackMetrics[key])]));
  const snapshot: QuarterSnapshot = {
    q: Math.max(1, Math.round(numberOr(value.q, fallbackMetrics.q))),
    chosen: stringArrayOr(value.chosen, []),
    selectedIds: stringArrayOr(value.selectedIds, []),
    metrics,
    initiativeStates: normalizeInitiativeStates(value.initiativeStates, fallbackStates),
    synergiesDiscovered: stringArrayOr(value.synergiesDiscovered, []),
  };
  if (isRecord(value.allocation)) snapshot.allocation = normalizeAllocation(value.allocation, fallbackMetrics.alloc);
  if (value.allocationMode === 'shared' || value.allocationMode === 'custom') snapshot.allocationMode = value.allocationMode;
  if (isRecord(value.initiativeAllocations)) snapshot.initiativeAllocations = normalizeInitiativeAllocations(value.initiativeAllocations, fallbackMetrics.alloc);
  if (value.crisis !== undefined) snapshot.crisis = value.crisis;
  if (isRecord(value.crisisResponse)) {
    const crisisResponse: Record<string, number> = {};
    Object.entries(value.crisisResponse).forEach(([key, impact]) => {
      if (typeof impact === 'number' && Number.isFinite(impact)) crisisResponse[key] = impact;
    });
    snapshot.crisisResponse = crisisResponse;
  }
  if (isRecord(value.scenarioState)) {
    snapshot.scenarioState = {
      metrics: isRecord(value.scenarioState.metrics) ? Object.fromEntries(Object.entries(value.scenarioState.metrics).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))) as Record<string, number> : {},
      progress: isRecord(value.scenarioState.progress) ? Object.fromEntries(Object.entries(value.scenarioState.progress).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))) as Record<string, number> : {},
      flags: isRecord(value.scenarioState.flags) ? Object.fromEntries(Object.entries(value.scenarioState.flags).filter(([, item]) => typeof item === 'boolean')) as Record<string, boolean> : {},
    };
  }
  snapshot.portfolio = normalizePortfolio(value.portfolio);
  const snapshotPortfolio = snapshot.portfolio;
  if (snapshotPortfolio) {
    snapshot.selectedCount = snapshotPortfolio.selectedCount;
    snapshot.portfolioPosture = snapshotPortfolio.portfolioPosture;
    snapshot.breadth = snapshotPortfolio.breadth;
    snapshot.concentrationRisk = snapshotPortfolio.concentrationRisk;
    snapshot.portfolioProvenance = snapshotPortfolio.provenance;
    snapshot.provenance = snapshotPortfolio.provenance;
  }
  if (Array.isArray(value.causalChain)) snapshot.causalChain = value.causalChain as QuarterSnapshot['causalChain'];
  if (Array.isArray(value.recommendations)) snapshot.recommendations = value.recommendations as QuarterSnapshot['recommendations'];
  if (Array.isArray(value.approvedRecommendations)) snapshot.approvedRecommendations = stringArrayOr(value.approvedRecommendations, []);
  if (value.deployedAmount !== undefined) snapshot.deployedAmount = Math.max(0, numberOr(value.deployedAmount, 0));
  if (value.fixedInitiativeSpend !== undefined) snapshot.fixedInitiativeSpend = Math.max(0, numberOr(value.fixedInitiativeSpend, snapshot.deployedAmount || 0));
  if (value.maintenanceSpend !== undefined) snapshot.maintenanceSpend = Math.max(0, numberOr(value.maintenanceSpend, 0));
  if (value.accelerationSpend !== undefined) snapshot.accelerationSpend = Math.max(0, numberOr(value.accelerationSpend, 0));
  if (value.crisisResponseSpend !== undefined) snapshot.crisisResponseSpend = Math.max(0, numberOr(value.crisisResponseSpend, 0));
  if (value.remainingReserve !== undefined) snapshot.remainingReserve = Math.max(0, numberOr(value.remainingReserve, 0));
  if (value.fundingIntensity !== undefined) snapshot.fundingIntensity = Math.max(1, numberOr(value.fundingIntensity, 1));
  if (isRecord(value.initiativeActions)) {
    snapshot.initiativeActions = Object.fromEntries(Object.entries(value.initiativeActions).filter(([, action]) => isInitiativeAction(action))) as InitiativeActionSet;
  }
  if (isRecord(value.lifecycleReviews)) snapshot.lifecycleReviews = value.lifecycleReviews as LifecycleReviewSet;
  if (isRecord(value.deploymentModes)) snapshot.deploymentModes = value.deploymentModes as DeploymentModeSet;
  if (isRecord(value.adaptations)) snapshot.adaptations = value.adaptations as AdaptationSet;
  if (Array.isArray(value.evaluationDecisions)) snapshot.evaluationDecisions = value.evaluationDecisions as LifecycleReviewInput[];
  if (Array.isArray(value.deploymentDecisions)) snapshot.deploymentDecisions = value.deploymentDecisions as DeploymentModeInput[];
  if (Array.isArray(value.adaptationDecisions)) snapshot.adaptationDecisions = value.adaptationDecisions as AdaptationInput[];
  if (isRecord(value.initiativeFunding)) snapshot.initiativeFunding = value.initiativeFunding as QuarterSnapshot['initiativeFunding'];
  if (isRecord(value.financialLedger)) snapshot.financialLedger = value.financialLedger as QuarterSnapshot['financialLedger'];
  if (isRecord(value.capacity)) snapshot.capacity = value.capacity as QuarterSnapshot['capacity'];
  if (
    value.budgetProvenance === 'campaign-purse-with-two-quarter-cap'
    || value.budgetProvenance === 'campaign-purse-with-carry-forward-cap'
    || value.budgetProvenance === 'campaign-purse-with-guided-acceleration'
  ) snapshot.budgetProvenance = value.budgetProvenance;
  return snapshot;
}

/** Normalize both current saves and older `ai-investment-save` payloads. */
export function normalizeGameState(value: unknown): GameState {
  const defaults = initialGameState();
  const source = isRecord(value) && isRecord(value.state) ? value.state : (isRecord(value) ? value : {});
  const next = { ...defaults } as GameState;

  next.q = Math.max(1, Math.round(numberOr(source.q, defaults.q)));
  next.stage = source.stage === 'results' || source.stage === 'done' ? source.stage : defaults.stage;
  next.selected = stringArrayOr(source.selected, defaults.selected);
  next.alloc = normalizeAllocation(source.alloc, defaults.alloc);
  metricKeys.forEach((key) => { next[key] = numberOr(source[key], defaults[key]) as never; });
  next.baseline = Array.isArray(source.baseline)
    ? source.baseline.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
    : [...defaults.baseline];
  next.initiativeGeneration = normalizeGeneration(source.initiativeGeneration, next.baseline);
  const savedRun = isRecord(source.runMetadata) ? source.runMetadata : {};
  next.runMetadata = {
    runId: typeof savedRun.runId === 'string' && savedRun.runId ? savedRun.runId : `run-${next.initiativeGeneration.seed}-${typeof source.scenarioId === 'string' ? source.scenarioId : 'standard'}`,
    seed: numberOr(savedRun.seed, next.initiativeGeneration.seed),
    scenarioId: typeof savedRun.scenarioId === 'string' ? savedRun.scenarioId : (typeof source.scenarioId === 'string' ? source.scenarioId : undefined),
    rulesVersion: typeof savedRun.rulesVersion === 'string' ? savedRun.rulesVersion : '2.0',
  };
  const persistedScenarioMode = source.scenarioMode === true;
  const persistedScenarioId = typeof source.scenarioId === 'string' ? source.scenarioId : undefined;
  const persistedScenario = persistedScenarioMode ? getScenario(persistedScenarioId) : undefined;
  const generatedDefaults = persistedScenario?.initiatives
    ? scenarioInitiativesToStates(persistedScenario.initiatives)
    : initializeInitiativeStates(generateInitiatives(next.initiativeGeneration));

  let previousMetrics = defaults;
  let previousStates = generatedDefaults;
  next.history = Array.isArray(source.history)
    ? source.history
      .map((entry) => normalizeSnapshot(entry, previousMetrics, previousStates))
      .filter((entry): entry is QuarterSnapshot => entry !== null)
      .map((entry) => {
        previousMetrics = { ...previousMetrics, ...entry.metrics };
        previousStates = entry.initiativeStates || previousStates;
        return entry;
      })
    : [];

  const hasCurrentInitiativeStates = isRecord(source.initiativeStates) && Object.keys(source.initiativeStates).length > 0;
  next.initiativeStates = hasCurrentInitiativeStates
    ? normalizeInitiativeStates(source.initiativeStates, generatedDefaults)
    : (next.history.at(-1)?.initiativeStates || generatedDefaults);
  next.initiativeAllocationMode = source.initiativeAllocationMode === 'custom' ? 'custom' : 'shared';
  next.initiativeAllocations = normalizeInitiativeAllocations(source.initiativeAllocations, next.alloc, new Set(Object.keys(next.initiativeStates)));
  next.initiativeActions = isRecord(source.initiativeActions)
    ? Object.fromEntries(Object.entries(source.initiativeActions).filter(([, action]) => isInitiativeAction(action))) as InitiativeActionSet
    : Object.fromEntries(next.selected.map((id) => [id, 'scale']));
  const financialSource = isRecord(source.financialLedger) ? source.financialLedger : {};
  next.financialLedger = {
    ...emptyFinancialLedger(),
    investment: Math.max(0, numberOr(financialSource.investment, 0)),
    runCost: Math.max(0, numberOr(financialSource.runCost, 0)),
    crisisCost: Math.max(0, numberOr(financialSource.crisisCost, 0)),
    grossBenefit: Math.max(0, numberOr(financialSource.grossBenefit, 0)),
    netBenefit: numberOr(financialSource.netBenefit, 0),
    cumulativeInvestment: Math.max(0, numberOr(financialSource.cumulativeInvestment, 0)),
    cumulativeNetBenefit: numberOr(financialSource.cumulativeNetBenefit, 0),
    paybackQuarter: financialSource.paybackQuarter === undefined ? undefined : Math.max(0, Math.round(numberOr(financialSource.paybackQuarter, 0))) || undefined,
    realisedROI: numberOr(financialSource.realisedROI, 0),
  };
  next.achievements = stringArrayOr(source.achievements, defaults.achievements);
  next.crisis = source.crisis ?? defaults.crisis;
  next.feedback = typeof source.feedback === 'string' ? source.feedback : defaults.feedback;
  next.experimental = typeof source.experimental === 'boolean' ? source.experimental : defaults.experimental;
  const reflections = isRecord(source.userReflections) ? source.userReflections : {};
  next.userReflections = {
    q1: reflections.q1 === 'yes' || reflections.q1 === 'partial' || reflections.q1 === 'no' ? reflections.q1 : undefined,
    q6: typeof reflections.q6 === 'string' ? reflections.q6.slice(0, 500) : undefined,
    experimentRatings: isRecord(reflections.experimentRatings)
      ? Object.fromEntries(Object.entries(reflections.experimentRatings).flatMap(([quarter, rating]) => {
          const value = Math.round(numberOr(rating, 0));
          return value >= 1 && value <= 5 ? [[quarter, value as 1 | 2 | 3 | 4 | 5]] : [];
        }))
      : {},
    experimentNotes: isRecord(reflections.experimentNotes)
      ? Object.fromEntries(Object.entries(reflections.experimentNotes).flatMap(([quarter, note]) =>
          typeof note === 'string' ? [[quarter, note.slice(0, 500)]] : []))
      : {},
  };
  next.scenarioMode = source.scenarioMode === true;
  next.scenarioId = typeof source.scenarioId === 'string' ? source.scenarioId : undefined;
  const scenarioDefinition = next.scenarioMode ? getScenario(next.scenarioId) : undefined;
  if (scenarioDefinition?.initiatives && !hasCurrentInitiativeStates) {
    next.initiativeStates = scenarioInitiativesToStates(scenarioDefinition.initiatives);
  }
  next.currencyMode = source.currencyMode === '₹' ? '₹' : '$';
  next.quarterlyBudget = numberOr(source.quarterlyBudget, next.scenarioMode ? 5 : 10);
  const legacyCampaignBudget = next.quarterlyBudget * 12;
  next.campaignBudget = numberOr(source.campaignBudget, legacyCampaignBudget);
  next.campaignBudgetRemaining = numberOr(source.campaignBudgetRemaining, Math.max(0, next.campaignBudget - next.spent));
  next.scenarioBudgetRemaining = numberOr(source.scenarioBudgetRemaining, next.quarterlyBudget);
  next.quarterlyDeploymentCap = quarterlyDeploymentCap(next.campaignBudget, next.campaignBudgetRemaining, next.quarterlyBudget, next.q, next.spent);
  next.deploymentAmount = normalizeDeploymentAmount(
    source.deploymentAmount === undefined ? undefined : numberOr(source.deploymentAmount, next.quarterlyBudget),
    next.campaignBudget,
    next.campaignBudgetRemaining,
    next.quarterlyBudget,
    next.q,
    next.spent,
  );
  next.lastQuarterDeployment = Math.max(0, numberOr(source.lastQuarterDeployment, next.history.at(-1)?.deployedAmount ?? 0));
  next.scenarioStartingMetrics = isRecord(source.scenarioStartingMetrics) ? Object.fromEntries(Object.entries(source.scenarioStartingMetrics).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))) as Record<string, number> : undefined;
  next.scenarioProgress = isRecord(source.scenarioProgress) ? Object.fromEntries(Object.entries(source.scenarioProgress).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))) as Record<string, number> : undefined;
  const savedScenarioState = isRecord(source.scenarioState) ? source.scenarioState : {};
  next.scenarioState = {
    metrics: isRecord(savedScenarioState.metrics) ? Object.fromEntries(Object.entries(savedScenarioState.metrics).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))) as Record<string, number> : { ...(next.scenarioStartingMetrics || {}) },
    progress: isRecord(savedScenarioState.progress) ? Object.fromEntries(Object.entries(savedScenarioState.progress).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))) as Record<string, number> : { ...(next.scenarioProgress || {}) },
    flags: isRecord(savedScenarioState.flags) ? Object.fromEntries(Object.entries(savedScenarioState.flags).filter(([, item]) => typeof item === 'boolean')) as Record<string, boolean> : {},
  };
  next.quarterlyCrisisCost = numberOr(source.quarterlyCrisisCost, 0);
  next.scenarioOverspend = numberOr(source.scenarioOverspend, 0);
  next.scenarioBonus = numberOr(source.scenarioBonus, 0);
  next.causalChain = Array.isArray(source.causalChain) ? source.causalChain as GameState['causalChain'] : defaults.causalChain;
  next.proactiveRecommendations = Array.isArray(source.proactiveRecommendations)
    ? source.proactiveRecommendations as GameState['proactiveRecommendations']
    : defaults.proactiveRecommendations;
  next.approvedRecommendations = stringArrayOr(source.approvedRecommendations, defaults.approvedRecommendations);
  next.discoveredSynergies = stringArrayOr(source.discoveredSynergies, defaults.discoveredSynergies);
  next.nextQuarterGuidance = isRecord(source.nextQuarterGuidance) && typeof source.nextQuarterGuidance.title === 'string' && typeof source.nextQuarterGuidance.action === 'string'
    ? { title: source.nextQuarterGuidance.title, action: source.nextQuarterGuidance.action, allocationKey: typeof source.nextQuarterGuidance.allocationKey === 'string' ? source.nextQuarterGuidance.allocationKey : undefined, target: typeof source.nextQuarterGuidance.target === 'string' ? source.nextQuarterGuidance.target : undefined, initiativeIds: stringArrayOr(source.nextQuarterGuidance.initiativeIds, []), preferredInitiativeIds: stringArrayOr(source.nextQuarterGuidance.preferredInitiativeIds, []), deploymentAmount: typeof source.nextQuarterGuidance.deploymentAmount === 'number' ? source.nextQuarterGuidance.deploymentAmount : undefined, operatingAllocationTargets: isRecord(source.nextQuarterGuidance.operatingAllocationTargets) ? source.nextQuarterGuidance.operatingAllocationTargets as GameState['alloc'] : undefined }
    : defaults.nextQuarterGuidance;
  next.portfolio = normalizePortfolio(source.portfolio) || next.history.at(-1)?.portfolio;
  next.selectedCount = Math.max(0, Math.min(3, Math.round(numberOr(source.selectedCount, next.portfolio?.selectedCount ?? defaults.selectedCount))));
  next.portfolioPosture = source.portfolioPosture === 'pause' || source.portfolioPosture === 'deep-focus' || source.portfolioPosture === 'focused-balance' || source.portfolioPosture === 'portfolio-breadth'
    ? source.portfolioPosture
    : (next.portfolio?.portfolioPosture ?? defaults.portfolioPosture);
  next.portfolioBreadth = numberOr(source.portfolioBreadth, next.portfolio?.breadth ?? defaults.portfolioBreadth);
  next.concentrationRisk = numberOr(source.concentrationRisk, next.portfolio?.concentrationRisk ?? defaults.concentrationRisk);
  return next;
}

export function hasCampaignProgress(value: unknown): boolean {
  const state = normalizeGameState(value);
  const defaults = initialGameState();
  return state.q > 1
    || state.stage !== 'decide'
    || state.history.length > 0
    || state.spent > 0
    || state.score > 0
    || JSON.stringify(state.selected) !== JSON.stringify(defaults.selected)
    || metricKeys.some((key) => state[key] !== defaults[key]);
}

export function normalizeWhatIfDraft(value: unknown): WhatIfDraft | null {
  if (!isRecord(value)) return null;
  const defaults = initialGameState();
  const selected = stringArrayOr(value.selected, []);
  if (!selected.length) return null;
  return {
    name: typeof value.name === 'string' ? value.name : undefined,
    selected,
    alloc: normalizeAllocation(value.alloc, defaults.alloc),
    deploymentAmount: typeof value.deploymentAmount === 'number' && Number.isFinite(value.deploymentAmount) ? Math.max(0, value.deploymentAmount) : undefined,
    initiativeActions: isRecord(value.initiativeActions)
      ? Object.fromEntries(Object.entries(value.initiativeActions).filter(([, action]) => isInitiativeAction(action))) as InitiativeActionSet
      : undefined,
    projection: isRecord(value.projection) ? value.projection : undefined,
    quarter: typeof value.quarter === 'number' && Number.isFinite(value.quarter) ? value.quarter : undefined,
  };
}

export function readLegacyGameState(): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_GAME_STORAGE_KEY);
    if (!raw) return null;
    const state = normalizeGameState(JSON.parse(raw));
    const draft = readWhatIfDraft();
    return draft ? { ...state, selected: draft.selected, alloc: draft.alloc, ...(draft.initiativeActions ? { initiativeActions: draft.initiativeActions } : {}) } : state;
  } catch {
    return null;
  }
}

export function readPersistedGameState(): GameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GAME_STORAGE_KEY);
    return raw ? normalizeGameState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function clearPersistedGameData(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GAME_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_GAME_STORAGE_KEY);
  window.localStorage.removeItem(WHAT_IF_STORAGE_KEY);
  window.localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_MIGRATION_KEY);
  window.localStorage.removeItem(CAMPAIGN_CHECKPOINTS_STORAGE_KEY);
}

export function clearPersistedCampaign(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GAME_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_GAME_STORAGE_KEY);
  window.localStorage.removeItem(WHAT_IF_STORAGE_KEY);
  window.localStorage.removeItem(CAMPAIGN_CHECKPOINTS_STORAGE_KEY);
}

function checkpointState(state: unknown): GameState {
  return normalizeGameState(JSON.parse(JSON.stringify(state ?? {})));
}

export function readCampaignCheckpoints(): CampaignCheckpoint[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CAMPAIGN_CHECKPOINTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => isRecord(item) && isRecord(item.state))
      .map((item) => ({
        id: typeof item.id === 'string' ? item.id : `checkpoint-${Date.now()}`,
        label: typeof item.label === 'string' ? item.label : 'Campaign checkpoint',
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date(0).toISOString(),
        q: Math.max(1, Math.round(numberOr(item.q, 1))),
        state: checkpointState(item.state),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export function saveCampaignCheckpoint(state: GameState, label = `Quarter ${state.q} decision point`): CampaignCheckpoint | null {
  if (typeof window === 'undefined') return null;
  const snapshot = checkpointState(state);
  const checkpoint: CampaignCheckpoint = {
    id: `${snapshot.runMetadata.runId}-q${snapshot.q}-${Date.now()}`,
    label,
    createdAt: new Date().toISOString(),
    q: snapshot.q,
    state: snapshot,
  };
  const existing = readCampaignCheckpoints().filter((item) => !(
    item.state.runMetadata.runId === snapshot.runMetadata.runId
    && item.q === snapshot.q
    && item.label === label
  ));
  window.localStorage.setItem(
    CAMPAIGN_CHECKPOINTS_STORAGE_KEY,
    JSON.stringify([checkpoint, ...existing].slice(0, 18)),
  );
  return checkpoint;
}

export function readLatestViableCampaignCheckpoint(state: GameState): CampaignCheckpoint | null {
  return readCampaignCheckpoints().find((checkpoint) => (
    checkpoint.state.runMetadata.runId === state.runMetadata.runId
    && checkpoint.q < state.q
    && checkpoint.state.stage === 'decide'
    && checkpoint.state.campaignBudgetRemaining > 0
  )) || null;
}

export function readWhatIfDraft(): WhatIfDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WHAT_IF_STORAGE_KEY);
    return raw ? normalizeWhatIfDraft(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeWhatIfDraft(draft: WhatIfDraft): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WHAT_IF_STORAGE_KEY, JSON.stringify(draft));
}

export function removeWhatIfDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(WHAT_IF_STORAGE_KEY);
}

export function removeLegacySaveAfterMigration(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_GAME_STORAGE_KEY);
  window.localStorage.setItem(LEGACY_MIGRATION_KEY, 'true');
}
