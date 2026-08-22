export type Allocation = { infra: number; data: number; people: number; mlops: number; compliance: number; innovation: number };
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
export type UserReflections = { q1?: 'yes' | 'partial' | 'no'; q6?: string };
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
export type MetricKey = 'roi' | 'revenue' | 'efficiency' | 'adoption' | 'risk' | 'data' | 'satisfaction' | 'literacy' | 'turnover' | 'compliance' | 'innovation' | 'spent' | 'score';
export type MetricsSnapshot = Partial<Record<MetricKey, number>>;
export type QuarterSnapshot = {
  q: number;
  chosen: string[];
  selectedIds?: string[];
  portfolio?: PortfolioSnapshot;
  selectedCount?: number;
  portfolioPosture?: PortfolioPosture;
  breadth?: number;
  concentrationRisk?: number;
  portfolioProvenance?: 'calculated-from-portfolio-choice';
  provenance?: 'calculated-from-portfolio-choice';
  allocation?: Allocation;
  metrics: MetricsSnapshot;
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
  budgetProvenance?: 'campaign-purse-with-two-quarter-cap';
};
export type GameState = {
  q: number; stage: 'decide' | 'results' | 'done'; selected: string[]; alloc: Allocation;
  roi: number; revenue: number; efficiency: number; adoption: number; risk: number; data: number;
  satisfaction: number; literacy: number; turnover: number; compliance: number; innovation: number;
  spent: number; score: number; history: QuarterSnapshot[]; initiativeStates: Record<string, InitiativeState>; achievements: string[]; crisis: any; feedback: string;
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
  const deploymentCap = Math.min(campaignBudget, quarterlyBudget * 2);
  const runMetadata: RunMetadata = { runId: `run-${initiativeGeneration.seed}-${options.scenarioId || 'standard'}`, seed: initiativeGeneration.seed, scenarioId: options.scenarioId, rulesVersion: '2.0' };
  return { q: 1, stage: 'decide', selected: ['demand', 'energy'], selectedCount: 2, portfolioPosture: 'focused-balance', portfolioBreadth: 2 / 3, concentrationRisk: 3, alloc: options.defaultAllocation || standardAllocation, roi: 0, revenue: 0, efficiency: startingMetrics.efficiency ?? 8, adoption: startingMetrics.adoption ?? 38, risk: 36, data: startingMetrics.data ?? 54, satisfaction: startingMetrics.satisfaction ?? 61, literacy: 35, turnover: 14, compliance: 62, innovation: 42, spent: 0, score: 0, history: [], initiativeStates: initializeInitiativeStates(generateInitiatives(initiativeGeneration)), achievements: [], crisis: null, feedback: 'The board is watching for a balanced portfolio. You have room to build momentum.', initiativeGeneration, userReflections: {}, scenarioMode: Boolean(options.scenarioMode), scenarioId: options.scenarioId, currencyMode: options.currencyMode || '$', quarterlyBudget, campaignBudget, campaignBudgetRemaining: campaignBudget, scenarioBudgetRemaining: quarterlyBudget, deploymentAmount: Math.min(quarterlyBudget, deploymentCap), quarterlyDeploymentCap: deploymentCap, lastQuarterDeployment: 0, scenarioStartingMetrics: options.scenarioStartingMetrics, scenarioProgress: options.scenarioProgress, scenarioState: { metrics: { ...(options.scenarioStartingMetrics || {}) }, progress: { ...(options.scenarioProgress || {}) }, flags: {} }, quarterlyCrisisCost: 0, scenarioOverspend: 0, scenarioBonus: 0, causalChain: [], proactiveRecommendations: [], approvedRecommendations: [], discoveredSynergies: [], nextQuarterGuidance: null, baseline: [], experimental: false, runMetadata };
}

/** The learner can keep a reserve, but no quarter can deploy more than two
 * suggested paces. This keeps timing meaningful without making the purse
 * unusable after a cautious quarter. */
export function quarterlyDeploymentCap(campaignRemaining: number, suggestedPace: number): number {
  const remaining = Math.max(0, Number(campaignRemaining) || 0);
  const pace = Math.max(0, Number(suggestedPace) || 0);
  return Math.min(remaining, pace * 2);
}

export function normalizeDeploymentAmount(value: number | undefined, campaignRemaining: number, suggestedPace: number): number {
  const cap = quarterlyDeploymentCap(campaignRemaining, suggestedPace);
  const requested = value === undefined || !Number.isFinite(value) ? suggestedPace : value;
  return Math.min(cap, Math.max(0, Number(requested) || 0));
}
