export type Allocation = { infra: number; data: number; people: number; mlops: number; compliance: number; innovation: number };
export type InitiativeAllocationMode = 'shared' | 'custom';
export type InitiativeAllocationSet = Record<string, Allocation>;
export type AccelerationAllocationMode = 'proportional' | 'focused';
export type AccelerationAllocationSet = Record<string, number>;
export type Effect = { metric: string; delta: number; color: string; unit?: string; explanation?: string };
export type CausalItem = { name: string; effects: Effect[]; explanation?: string };
export type Recommendation = {
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action: string;
  metric: string;
  initiativeIds?: string[];
  preferredInitiativeIds?: string[];
  deploymentAmount?: number;
  operatingAllocationTargets?: Partial<Allocation>;
};
export type UserReflections = {
  q1?: 'yes' | 'partial' | 'no';
  q6?: string;
  /** Learner-owned assessment of the quality of an experiment, never a game penalty. */
  experimentRatings?: Record<string, 1 | 2 | 3 | 4 | 5>;
  experimentNotes?: Record<string, string>;
};
export type ScenarioState = {
  metrics: Record<string, number>;
  progress: Record<string, number>;
  flags: Record<string, boolean>;
};
export type ScenarioStateOptions = { scenarioMode?: boolean; scenarioId?: string; currencyMode?: CurrencyMode; quarterlyBudget?: number; campaignBudget?: number; scenarioStartingMetrics?: Record<string, number>; scenarioProgress?: Record<string, number>; defaultAllocation?: Allocation; startingMetrics?: Partial<Record<'efficiency' | 'adoption' | 'data' | 'satisfaction', number>> };
export type RunMetadata = { runId: string; seed: number; scenarioId?: string; rulesVersion: string };
import type { PortfolioPosture } from './portfolio';
export type PortfolioSnapshot = {
  selectedCount: number;
  availableInitiatives: number;
  portfolioPosture: PortfolioPosture;
  breadth: number;
  focusMultiplier: number;
  concentrationRisk: number;
  coordinationPressure: number;
  neglectedCount: number;
  provenance: 'calculated-from-portfolio-choice';
};
import type { InitiativeState } from './initiativeState';
import { initializeInitiativeStates } from './initiativeState';
import { createInitiativeGeneration, generateInitiatives, type InitiativeGeneration } from './generator';
import type { CurrencyMode } from '../scenarios/types';
import type { AdaptationInput, AdaptationSet, CapacityState, DeploymentModeInput, DeploymentModeSet, FinancialLedger, InitiativeAccelerationAllocation, InitiativeActionSet, InitiativeFunding, LifecycleReviewInput, LifecycleReviewSet } from './businessModel';
import type { CampaignScoreBreakdown } from './scoring';
export type MetricKey = 'roi' | 'revenue' | 'efficiency' | 'adoption' | 'risk' | 'data' | 'satisfaction' | 'literacy' | 'turnover' | 'compliance' | 'innovation' | 'spent' | 'score';
export type MetricsSnapshot = Partial<Record<MetricKey, number>>;
export type OperatingEvidenceSignal = {
  allocation: number;
  target: number;
  delta: number;
  explanation: string;
};
export type OperatingEvidence = {
  initiativeId: string;
  action: string;
  localAllocation: Allocation;
  effectivePortfolioAllocation: Allocation;
  bottleneck: string;
  signals: Record<string, OperatingEvidenceSignal>;
  outcomeEffects: Effect[];
  tradeOffs: string[];
};
export type QuarterSnapshot = {
  q: number;
  chosen: string[];
  /** All deliberately funded/operated initiatives this quarter, including discovery. */
  selectedIds?: string[];
  /** New evidence work; it is recorded as portfolio work but never as delivered value. */
  discoveryIds?: string[];
  /** Pilot/scale work that can create this quarter's delivery effects. */
  deliveryIds?: string[];
  portfolio?: PortfolioSnapshot;
  selectedCount?: number;
  portfolioPosture?: PortfolioPosture;
  breadth?: number;
  concentrationRisk?: number;
  portfolioProvenance?: 'calculated-from-portfolio-choice';
  provenance?: 'calculated-from-portfolio-choice';
  allocation?: Allocation;
  allocationMode?: InitiativeAllocationMode;
  initiativeAllocations?: InitiativeAllocationSet;
  /** Learner-directed split of discretionary scale-up capital by initiative. */
  accelerationAllocations?: InitiativeAccelerationAllocation;
  metrics: MetricsSnapshot;
  /** Deterministic explanation of how this quarter's operating mix shaped each initiative. */
  operatingEvidence?: OperatingEvidence[];
  initiativeStates?: Record<string, InitiativeState>;
  scenarioState?: ScenarioState;
  synergiesDiscovered?: string[];
  crisis?: unknown;
  crisisResponse?: Record<string, number>;
  causalChain?: CausalItem[];
  recommendations?: Recommendation[];
  approvedRecommendations?: string[];
  portfolioBreadth?: number;
  deployedAmount?: number;
  fixedInitiativeSpend?: number;
  maintenanceSpend?: number;
  accelerationSpend?: number;
  crisisResponseSpend?: number;
  remainingReserve?: number;
  fundingIntensity?: number;
  initiativeActions?: InitiativeActionSet;
  lifecycleReviews?: LifecycleReviewSet;
  deploymentModes?: DeploymentModeSet;
  adaptations?: AdaptationSet;
  evaluationDecisions?: LifecycleReviewInput[];
  deploymentDecisions?: DeploymentModeInput[];
  adaptationDecisions?: AdaptationInput[];
  initiativeFunding?: Record<string, InitiativeFunding>;
  financialLedger?: FinancialLedger;
  capacity?: CapacityState;
  budgetProvenance?: 'campaign-purse-with-two-quarter-cap' | 'campaign-purse-with-carry-forward-cap' | 'campaign-purse-with-guided-acceleration';
};
export type GameState = {
  q: number; stage: 'decide' | 'results' | 'done'; selected: string[]; initiativeActions: InitiativeActionSet; alloc: Allocation; initiativeAllocationMode: InitiativeAllocationMode; initiativeAllocations: InitiativeAllocationSet; accelerationAllocationMode?: AccelerationAllocationMode; accelerationAllocations?: AccelerationAllocationSet;
  roi: number; revenue: number; efficiency: number; adoption: number; risk: number; data: number;
  satisfaction: number; literacy: number; turnover: number; compliance: number; innovation: number;
  spent: number; score: number; scoreBreakdown?: CampaignScoreBreakdown; financialLedger: FinancialLedger; history: QuarterSnapshot[]; initiativeStates: Record<string, InitiativeState>; achievements: string[]; crisis: any; feedback: string;
  initiativeGeneration: InitiativeGeneration; userReflections: UserReflections;
  scenarioMode: boolean; scenarioId?: string; currencyMode: CurrencyMode; quarterlyBudget: number; campaignBudget: number; campaignBudgetRemaining: number; scenarioBudgetRemaining: number; deploymentAmount: number; quarterlyDeploymentCap: number; lastQuarterDeployment: number; scenarioStartingMetrics?: Record<string, number>; scenarioProgress?: Record<string, number>; scenarioState: ScenarioState; quarterlyCrisisCost: number; scenarioOverspend: number; scenarioBonus: number; portfolio?: PortfolioSnapshot;
  baseline: number[]; experimental: boolean; causalChain: CausalItem[]; proactiveRecommendations: Recommendation[]; approvedRecommendations: string[]; discoveredSynergies: string[]; nextQuarterGuidance: { title: string; action: string; allocationKey?: string; target?: string; initiativeIds?: string[]; preferredInitiativeIds?: string[]; deploymentAmount?: number; operatingAllocationTargets?: Partial<Allocation> } | null;
  selectedCount: number; portfolioPosture: PortfolioPosture; portfolioBreadth: number; concentrationRisk: number;
  runMetadata: RunMetadata;
};

export function initialGameState(generation?: InitiativeGeneration, options: ScenarioStateOptions = {}): GameState {
  const initiativeGeneration = generation || createInitiativeGeneration('balanced', [3, 3, 3, 3, 3], 2030);
  const standardAllocation = { infra: 35, data: 25, people: 15, mlops: 10, compliance: 10, innovation: 5 };
  const standardMetrics = { efficiency: 8, adoption: 38, data: 54, satisfaction: 61 };
  const startingMetrics = { ...standardMetrics, ...(options.startingMetrics || {}) };
  const quarterlyBudget = options.quarterlyBudget ?? 10;
  const campaignBudget = options.campaignBudget ?? quarterlyBudget * 12;
  const deploymentCap = quarterlyDeploymentCap(campaignBudget, campaignBudget, quarterlyBudget, 1, 0);
  const runMetadata: RunMetadata = { runId: `run-${initiativeGeneration.seed}-${options.scenarioId || 'standard'}`, seed: initiativeGeneration.seed, scenarioId: options.scenarioId, rulesVersion: '3.0' };
  return { q: 1, stage: 'decide', selected: ['demand', 'energy'], initiativeActions: {}, initiativeAllocationMode: 'shared', initiativeAllocations: {}, selectedCount: 2, portfolioPosture: 'focused-balance', portfolioBreadth: 2 / 3, concentrationRisk: 3, alloc: options.defaultAllocation || standardAllocation, roi: 0, revenue: 0, efficiency: startingMetrics.efficiency ?? 8, adoption: startingMetrics.adoption ?? 38, risk: 36, data: startingMetrics.data ?? 54, satisfaction: startingMetrics.satisfaction ?? 61, literacy: 35, turnover: 14, compliance: 62, innovation: 42, spent: 0, score: 0, financialLedger: { investment: 0, runCost: 0, crisisCost: 0, grossBenefit: 0, netBenefit: 0, cumulativeInvestment: 0, cumulativeNetBenefit: 0, realisedROI: 0 }, history: [], initiativeStates: initializeInitiativeStates(generateInitiatives(initiativeGeneration)), achievements: [], crisis: null, feedback: 'The board is watching for a balanced portfolio. You have room to build momentum.', initiativeGeneration, userReflections: {}, scenarioMode: Boolean(options.scenarioMode), scenarioId: options.scenarioId, currencyMode: options.currencyMode || '$', quarterlyBudget, campaignBudget, campaignBudgetRemaining: campaignBudget, scenarioBudgetRemaining: quarterlyBudget, deploymentAmount: Math.min(quarterlyBudget * 0.6, deploymentCap), quarterlyDeploymentCap: deploymentCap, lastQuarterDeployment: 0, scenarioStartingMetrics: options.scenarioStartingMetrics, scenarioProgress: options.scenarioProgress, scenarioState: { metrics: { ...(options.scenarioStartingMetrics || {}) }, progress: { ...(options.scenarioProgress || {}) }, flags: {} }, quarterlyCrisisCost: 0, scenarioOverspend: 0, scenarioBonus: 0, causalChain: [], proactiveRecommendations: [], approvedRecommendations: [], discoveredSynergies: [], nextQuarterGuidance: null, baseline: [], experimental: false, runMetadata };
}

export type DeploymentCapacity = {
  campaignBudget: number;
  campaignRemaining: number;
  basePace: number;
  carriedAuthority: number;
  /** A planning reference: base pace plus unused pace from earlier quarters. */
  recommendedAuthority: number;
  /** A soft reserve recommendation, never a release restriction. */
  recommendedReserve: number;
  /** Kept for saved-state and UI compatibility; it is now the available reserve. */
  hardCap: number;
  maximumDeployment: number;
};

/**
 * The base pace is a planning reference, not a release gate. Learners can
 * accelerate in any quarter as long as the campaign has cash left and no more
 * than the campaign reserve. This preserves a real choice between early
 * acceleration and holding reserve; the recommended pace is visible guidance,
 * never a hard release gate.
 */
export function deploymentCapacity(
  campaignBudget: number,
  campaignRemaining: number,
  suggestedPace: number,
  q = 1,
  spent = 0,
): DeploymentCapacity {
  const pace = Math.max(0, Number(suggestedPace) || 0);
  const total = Math.max(pace * 12, Number(campaignBudget) || 0);
  const remaining = Math.max(0, Number(campaignRemaining) || 0);
  const currentQuarter = Math.max(1, Math.round(Number(q) || 1));
  const completedQuarters = currentQuarter - 1;
  const priorSpend = Math.max(0, Number(spent) || 0);
  const carriedAuthority = Math.max(0, completedQuarters * pace - priorSpend);
  const recommendedAuthority = Math.min(remaining, Math.max(0, pace + carriedAuthority));
  const recommendedReserve = Math.min(remaining, Math.max(0, pace * 2));
  const maximumDeployment = remaining;
  return {
    campaignBudget: total,
    campaignRemaining: remaining,
    basePace: pace,
    carriedAuthority,
    recommendedAuthority,
    recommendedReserve,
    hardCap: maximumDeployment,
    maximumDeployment,
  };
}

export function quarterlyDeploymentCap(campaignBudget: number, campaignRemaining: number, suggestedPace: number, q = 1, spent = 0): number {
  return deploymentCapacity(campaignBudget, campaignRemaining, suggestedPace, q, spent).maximumDeployment;
}

export function normalizeDeploymentAmount(value: number | undefined, campaignBudget: number, campaignRemaining: number, suggestedPace: number, q = 1, spent = 0): number {
  const cap = quarterlyDeploymentCap(campaignBudget, campaignRemaining, suggestedPace, q, spent);
  const requested = value === undefined || !Number.isFinite(value) ? suggestedPace * 0.6 : value;
  return Math.min(cap, Math.max(0, Number(requested) || 0));
}
