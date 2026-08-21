import { createV3State, initialGameState, type Allocation, type GameState, type MetricKey, type QuarterSnapshot, type V3ScenarioState } from './state';
import { initializeInitiativeStates, type InitiativeState } from './initiativeState';
import { createInitiativeGeneration, generateInitiatives, inferArchetypeFromDecisions, type InitiativeGeneration, type ScenarioArchetype } from './generator';
import { getScenario } from '../scenarios/registry';
import { scenarioInitiativesToStates } from './initiativeAdapter';

export const GAME_STORAGE_KEY = 'ai-investment-game';
export const LEGACY_GAME_STORAGE_KEY = 'ai-investment-save';
export const WHAT_IF_STORAGE_KEY = 'ai-whatif-applied';
export const LEADERBOARD_STORAGE_KEY = 'ai_simulation_leaderboard';
export const LEGACY_MIGRATION_KEY = 'ai-investment-legacy-migrated';
export const GAME_PERSISTENCE_VERSION = 6;
export const PREVIOUS_GAME_PERSISTENCE_VERSION = 5;

export type WhatIfDraft = {
  name?: string;
  selected: string[];
  alloc: Allocation;
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

function normalizeV3State(value: unknown, fallback: V3ScenarioState): V3ScenarioState {
  if (!isRecord(value)) return fallback;
  const source = value;
  const budget = isRecord(source.budget) ? source.budget : {};
  const capacity = isRecord(source.capacity) ? source.capacity : {};
  const scorecard = isRecord(source.scorecard) ? source.scorecard : {};
  const numberMap = (input: unknown): Record<string, number> => isRecord(input)
    ? Object.fromEntries(Object.entries(input).filter(([, item]) => typeof item === 'number' && Number.isFinite(item)) as Array<[string, number]>)
    : {};
  const initiatives = isRecord(source.initiatives) ? source.initiatives : {};
  const normalizedInitiatives = Object.fromEntries(Object.entries(fallback.initiatives).map(([id, base]) => {
    const saved = isRecord(initiatives[id]) ? initiatives[id] : {};
    const lifecycle = ['deferred', 'research', 'pilot', 'scale', 'sustain', 'pause', 'stop'].includes(String(saved.lifecycle))
      ? saved.lifecycle as V3ScenarioState['initiatives'][string]['lifecycle'] : base.lifecycle;
    return [id, { ...base, lifecycle, ownerId: typeof saved.ownerId === 'string' ? saved.ownerId : base.ownerId, gateIds: stringArrayOr(saved.gateIds, base.gateIds), capacity: numberMap(saved.capacity), rationale: typeof saved.rationale === 'string' ? saved.rationale : base.rationale, reviewQuarter: typeof saved.reviewQuarter === 'number' ? saved.reviewQuarter : base.reviewQuarter }];
  }));
  return {
    ...fallback,
    schemaVersion: 1,
    scenarioId: typeof source.scenarioId === 'string' ? source.scenarioId : fallback.scenarioId,
    seed: numberOr(source.seed, fallback.seed),
    currentQuarter: Math.max(1, Math.round(numberOr(source.currentQuarter, fallback.currentQuarter))),
    budget: { envelope: numberOr(budget.envelope, fallback.budget.envelope), spent: numberOr(budget.spent, 0), remaining: numberOr(budget.remaining, fallback.budget.remaining) },
    capacity: { pools: numberMap(capacity.pools), used: numberMap(capacity.used), activeDeliveryLimit: Math.max(0, Math.round(numberOr(capacity.activeDeliveryLimit, 2))) },
    initiatives: normalizedInitiatives,
    ledger: Array.isArray(source.ledger) ? source.ledger.filter(isRecord).map((entry) => entry as V3ScenarioState['ledger'][number]) : [],
    gates: isRecord(source.gates) ? source.gates as V3ScenarioState['gates'] : {},
    eventLog: Array.isArray(source.eventLog) ? source.eventLog.filter(isRecord).map((entry) => entry as V3ScenarioState['eventLog'][number]) : [],
    stakeholders: isRecord(source.stakeholders) ? source.stakeholders as V3ScenarioState['stakeholders'] : {},
    scorecard: {
      execution: numberOr(scorecard.execution, 0), governance: numberOr(scorecard.governance, 0), stakeholderHealth: numberOr(scorecard.stakeholderHealth, 0), resilience: numberOr(scorecard.resilience, 0), evidenceQuality: numberOr(scorecard.evidenceQuality, 0), evidence: stringArrayOr(scorecard.evidence, []),
    },
    baseline: isRecord(source.baseline) ? {
      version: typeof source.baseline.version === 'string' ? source.baseline.version : fallback.baseline.version,
      responses: Array.isArray(source.baseline.responses) ? source.baseline.responses.filter(isRecord).map((response) => ({ questionId: typeof response.questionId === 'string' ? response.questionId : '', version: typeof response.version === 'string' ? response.version : fallback.baseline.version, response: typeof response.response === 'string' ? response.response : '' })).filter((response) => response.questionId && response.response) : [],
    } : fallback.baseline,
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

function normalizeInitiativeStates(value: unknown, fallback: Record<string, InitiativeState>): Record<string, InitiativeState> {
  const source = isRecord(value) ? value : {};
  return Object.fromEntries(Object.entries(fallback).map(([id, base]) => {
    const saved = isRecord(source[id]) ? source[id] : {};
    return [id, {
      ...base,
      ...saved,
      currentData: numberOr(saved.currentData, base.currentData),
      currentRoi: numberOr(saved.currentRoi, base.currentRoi),
      currentCost: numberOr(saved.currentCost, base.currentCost),
      currentHuman: numberOr(saved.currentHuman, base.currentHuman),
      quartersFunded: numberOr(saved.quartersFunded, base.quartersFunded),
      quartersSinceLastFund: numberOr(saved.quartersSinceLastFund, base.quartersSinceLastFund),
      totalInvestment: numberOr(saved.totalInvestment, base.totalInvestment),
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
  next.achievements = stringArrayOr(source.achievements, defaults.achievements);
  next.crisis = source.crisis ?? defaults.crisis;
  next.feedback = typeof source.feedback === 'string' ? source.feedback : defaults.feedback;
  next.experimental = typeof source.experimental === 'boolean' ? source.experimental : defaults.experimental;
  const reflections = isRecord(source.userReflections) ? source.userReflections : {};
  next.userReflections = {
    q1: reflections.q1 === 'yes' || reflections.q1 === 'partial' || reflections.q1 === 'no' ? reflections.q1 : undefined,
    q6: typeof reflections.q6 === 'string' ? reflections.q6.slice(0, 500) : undefined,
  };
  next.scenarioMode = source.scenarioMode === true;
  next.scenarioId = typeof source.scenarioId === 'string' ? source.scenarioId : undefined;
  const scenarioDefinition = next.scenarioMode ? getScenario(next.scenarioId) : undefined;
  if (scenarioDefinition?.initiatives && !hasCurrentInitiativeStates) {
    next.initiativeStates = scenarioInitiativesToStates(scenarioDefinition.initiatives);
  }
  next.currencyMode = source.currencyMode === '₹' ? '₹' : '$';
  next.quarterlyBudget = numberOr(source.quarterlyBudget, next.scenarioMode ? 5 : 10);
  next.scenarioBudgetRemaining = numberOr(source.scenarioBudgetRemaining, next.quarterlyBudget);
  next.scenarioStartingMetrics = isRecord(source.scenarioStartingMetrics) ? Object.fromEntries(Object.entries(source.scenarioStartingMetrics).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))) as Record<string, number> : undefined;
  next.scenarioProgress = isRecord(source.scenarioProgress) ? Object.fromEntries(Object.entries(source.scenarioProgress).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))) as Record<string, number> : undefined;
  const savedScenarioState = isRecord(source.scenarioState) ? source.scenarioState : {};
  next.scenarioState = {
    metrics: isRecord(savedScenarioState.metrics) ? Object.fromEntries(Object.entries(savedScenarioState.metrics).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))) as Record<string, number> : { ...(next.scenarioStartingMetrics || {}) },
    progress: isRecord(savedScenarioState.progress) ? Object.fromEntries(Object.entries(savedScenarioState.progress).filter(([, item]) => typeof item === 'number' && Number.isFinite(item))) as Record<string, number> : { ...(next.scenarioProgress || {}) },
    flags: isRecord(savedScenarioState.flags) ? Object.fromEntries(Object.entries(savedScenarioState.flags).filter(([, item]) => typeof item === 'boolean')) as Record<string, boolean> : {},
  };
  // V3 state is opt-in and additive. Legacy Standard/v1/v2 saves, including
  // legacy Project Factory saves, never gain V3 state without pack metadata.
  const v3Defaults = scenarioDefinition?.v3
    ? createV3State(next.scenarioId as string, next.initiativeGeneration.seed, next.quarterlyBudget, Object.keys(next.initiativeStates), scenarioDefinition?.v3)
    : undefined;
  next.v3State = v3Defaults ? normalizeV3State(source.v3State, v3Defaults) : undefined;
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
    ? { title: source.nextQuarterGuidance.title, action: source.nextQuarterGuidance.action, allocationKey: typeof source.nextQuarterGuidance.allocationKey === 'string' ? source.nextQuarterGuidance.allocationKey : undefined, target: typeof source.nextQuarterGuidance.target === 'string' ? source.nextQuarterGuidance.target : undefined }
    : defaults.nextQuarterGuidance;
  return next;
}

/**
 * Explicit persistence migration seam for callers that keep the envelope
 * version outside Zustand. V5 is structurally compatible; normalization adds
 * only the opt-in V3 defaults and retains all existing history snapshots.
 */
export function migrateV5ToV6(value: unknown): GameState {
  return normalizeGameState(value);
}

export function migrateGameState(value: unknown, _fromVersion = PREVIOUS_GAME_PERSISTENCE_VERSION): GameState {
  return normalizeGameState(value);
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
    return draft ? { ...state, selected: draft.selected, alloc: draft.alloc } : state;
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
}

export function clearPersistedCampaign(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GAME_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_GAME_STORAGE_KEY);
  window.localStorage.removeItem(WHAT_IF_STORAGE_KEY);
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
