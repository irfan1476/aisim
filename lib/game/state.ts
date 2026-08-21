export type Allocation = { infra: number; data: number; people: number; mlops: number; compliance: number; innovation: number };
export type Effect = { metric: string; delta: number; color: string; unit?: string; explanation?: string };
export type CausalItem = { name: string; effects: Effect[]; explanation?: string };
export type Recommendation = { priority: 'high' | 'medium' | 'low'; title: string; message: string; action: string; metric: string };
export type UserReflections = { q1?: 'yes' | 'partial' | 'no'; q6?: string };
export type ScenarioState = {
  metrics: Record<string, number>;
  progress: Record<string, number>;
  flags: Record<string, boolean>;
};
export type ScenarioStateOptions = { scenarioMode?: boolean; scenarioId?: string; currencyMode?: CurrencyMode; quarterlyBudget?: number; scenarioStartingMetrics?: Record<string, number>; scenarioProgress?: Record<string, number>; defaultAllocation?: Allocation; startingMetrics?: Partial<Record<'efficiency' | 'adoption' | 'data' | 'satisfaction', number>> };

/**
 * Serializable state owned by an opted-in scenario-depth (V3) pack.
 *
 * This is deliberately separate from the generic V2 scenario state.  The
 * legacy engine can therefore continue to read/write its state without
 * acquiring V3 lifecycle or scoring semantics.
 */
export type V3Lifecycle = 'deferred' | 'research' | 'pilot' | 'scale' | 'sustain' | 'pause' | 'stop';
export type V3InitiativeState = {
  lifecycle: V3Lifecycle;
  ownerId?: string;
  gateIds: string[];
  capacity: Record<string, number>;
  rationale?: string;
  reviewQuarter?: number;
};
export type V3LedgerEntry = {
  id: string;
  quarter: number;
  initiativeIds: string[];
  rationale: string;
  prediction: string;
  assumption?: string;
  evidenceIds: string[];
  ownerId?: string;
  gateIds: string[];
  stopCriterion?: string;
  outcome?: Record<string, unknown>;
  reflection?: string;
};
export type V3GateRecord = { id: string; status: 'pending' | 'met' | 'failed' | 'repaired'; history: Array<{ quarter: number; status: 'pending' | 'met' | 'failed' | 'repaired'; evidenceIds: string[] }> };
export type V3EventRecord = { id: string; quarter: number; optionId?: string; impacts: Record<string, number> };
export type V3StakeholderRecord = { id: string; sentiment: number; history: Array<{ quarter: number; delta: number; reason?: string }> };
export type V3ScorecardState = { execution: number; governance: number; stakeholderHealth: number; resilience: number; evidenceQuality: number; evidence: string[] };
export type V3BaselineResponse = { questionId: string; version: string; response: string };
export type V3BaselineState = { version: string; responses: V3BaselineResponse[] };
export type V3ScenarioState = {
  schemaVersion: 1;
  scenarioId: string;
  seed: number;
  currentQuarter: number;
  budget: { envelope: number; spent: number; remaining: number };
  capacity: { pools: Record<string, number>; used: Record<string, number>; activeDeliveryLimit: number };
  initiatives: Record<string, V3InitiativeState>;
  ledger: V3LedgerEntry[];
  gates: Record<string, V3GateRecord>;
  eventLog: V3EventRecord[];
  stakeholders: Record<string, V3StakeholderRecord>;
  scorecard: V3ScorecardState;
  baseline: V3BaselineState;
};
import type { InitiativeState } from './initiativeState';
import { initializeInitiativeStates } from './initiativeState';
import { createInitiativeGeneration, generateInitiatives, type InitiativeGeneration } from './generator';
import type { CurrencyMode, V3ScenarioPack } from '../scenarios/types';
export type MetricKey = 'roi' | 'revenue' | 'efficiency' | 'adoption' | 'risk' | 'data' | 'satisfaction' | 'literacy' | 'turnover' | 'compliance' | 'innovation' | 'spent' | 'score';
export type MetricsSnapshot = Partial<Record<MetricKey, number>>;
export type QuarterSnapshot = {
  q: number;
  chosen: string[];
  selectedIds?: string[];
  allocation?: Allocation;
  metrics: MetricsSnapshot;
  initiativeStates?: Record<string, InitiativeState>;
  scenarioState?: ScenarioState;
  synergiesDiscovered?: string[];
  crisis?: unknown;
  crisisResponse?: Record<string, number>;
};
export type GameState = {
  q: number; stage: 'decide' | 'results' | 'done'; selected: string[]; alloc: Allocation;
  roi: number; revenue: number; efficiency: number; adoption: number; risk: number; data: number;
  satisfaction: number; literacy: number; turnover: number; compliance: number; innovation: number;
  spent: number; score: number; history: QuarterSnapshot[]; initiativeStates: Record<string, InitiativeState>; achievements: string[]; crisis: any; feedback: string;
  initiativeGeneration: InitiativeGeneration; userReflections: UserReflections;
  scenarioMode: boolean; scenarioId?: string; currencyMode: CurrencyMode; quarterlyBudget: number; scenarioBudgetRemaining: number; scenarioStartingMetrics?: Record<string, number>; scenarioProgress?: Record<string, number>; scenarioState: ScenarioState; quarterlyCrisisCost: number; scenarioOverspend: number; scenarioBonus: number;
  baseline: number[]; experimental: boolean; causalChain: CausalItem[]; proactiveRecommendations: Recommendation[]; approvedRecommendations: string[]; discoveredSynergies: string[]; nextQuarterGuidance: { title: string; action: string; allocationKey?: string; target?: string } | null;
  /** Present only for packs that explicitly opt into V3 depth mechanics. */
  v3State?: V3ScenarioState;
};

/** Pure, deterministic defaults for a V3 scenario run. */
export function createV3State(scenarioId: string, seed = 2030, budget = 5, initiativeIds: string[] = [], pack?: V3ScenarioPack): V3ScenarioState {
  const profiles = pack?.initiatives || [];
  const initiatives = Object.fromEntries((initiativeIds.length ? initiativeIds : profiles.map((item) => item.id)).map((id) => {
    const profile = profiles.find((item) => item.id === id);
    return [id, {
    lifecycle: 'deferred' as const,
    gateIds: (pack?.gates || pack?.governanceGates || []).filter((gate) => (gate.appliesTo || []).some((target) => target.split('.')[0] === id)).map((gate) => gate.id),
    capacity: Object.fromEntries(Object.entries(profile?.capacityRequired || {}).map(([pool, values]) => [pool, values.research || values.pilot || values.scale || 0])),
  }];
  }));
  const gates = Object.fromEntries((pack?.gates || pack?.governanceGates || []).map((gate) => [gate.id, { id: gate.id, status: 'pending' as const, history: [] }]));
  const stakeholders = Object.fromEntries((pack?.stakeholders || []).map((stakeholder) => [stakeholder.id, { id: stakeholder.id, sentiment: 0, history: [] }]));
  const declaredPools = pack?.portfolioPolicy?.capacityPools || {};
  const pools = Object.fromEntries(profiles.flatMap((profile) => Object.keys(profile.capacityRequired || {})).map((pool) => [pool, declaredPools[pool] ?? 0]));
  return {
    schemaVersion: 1,
    scenarioId,
    seed,
    currentQuarter: 1,
    budget: { envelope: budget, spent: 0, remaining: budget },
    capacity: { pools, used: {}, activeDeliveryLimit: 2 },
    initiatives,
    ledger: [],
    gates,
    eventLog: [],
    stakeholders,
    scorecard: { execution: 0, governance: 0, stakeholderHealth: 0, resilience: 0, evidenceQuality: 0, evidence: [] },
    baseline: { version: 'v1', responses: [] },
  };
}

export function initialGameState(generation?: InitiativeGeneration, options: ScenarioStateOptions = {}): GameState {
  const initiativeGeneration = generation || createInitiativeGeneration('balanced', [3, 3, 3, 3, 3], 2030);
  const standardAllocation = { infra: 35, data: 25, people: 15, mlops: 10, compliance: 10, innovation: 5 };
  const standardMetrics = { efficiency: 8, adoption: 38, data: 54, satisfaction: 61 };
  const startingMetrics = { ...standardMetrics, ...(options.startingMetrics || {}) };
  return { q: 1, stage: 'decide', selected: ['demand', 'energy'], alloc: options.defaultAllocation || standardAllocation, roi: 0, revenue: 0, efficiency: startingMetrics.efficiency ?? 8, adoption: startingMetrics.adoption ?? 38, risk: 36, data: startingMetrics.data ?? 54, satisfaction: startingMetrics.satisfaction ?? 61, literacy: 35, turnover: 14, compliance: 62, innovation: 42, spent: 0, score: 0, history: [], initiativeStates: initializeInitiativeStates(generateInitiatives(initiativeGeneration)), achievements: [], crisis: null, feedback: 'The board is watching for a balanced portfolio. You have room to build momentum.', initiativeGeneration, userReflections: {}, scenarioMode: Boolean(options.scenarioMode), scenarioId: options.scenarioId, currencyMode: options.currencyMode || '$', quarterlyBudget: options.quarterlyBudget ?? 10, scenarioBudgetRemaining: options.quarterlyBudget ?? 10, scenarioStartingMetrics: options.scenarioStartingMetrics, scenarioProgress: options.scenarioProgress, scenarioState: { metrics: { ...(options.scenarioStartingMetrics || {}) }, progress: { ...(options.scenarioProgress || {}) }, flags: {} }, quarterlyCrisisCost: 0, scenarioOverspend: 0, scenarioBonus: 0, causalChain: [], proactiveRecommendations: [], approvedRecommendations: [], discoveredSynergies: [], nextQuarterGuidance: null, baseline: [], experimental: false };
}
