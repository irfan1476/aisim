import type { InitiativeState } from '../lib/game/initiativeState';
import type { InitiativeGeneration } from '../lib/game/generator';
import type { UserReflections } from '../lib/game/state';
import type { CurrencyMode } from '../lib/scenarios/types';

export type MetricColor = 'gold' | 'emerald' | 'blue' | 'purple' | 'red' | 'cyan';

export interface GameInitiative {
  id: string;
  name: string;
  desc: string;
  cost: number;
  roi: number;
  risk: 'LOW' | 'MED' | 'HIGH';
  data: number;
  human: number;
  impact: string;
}

export interface GameCrisis {
  title: string;
  type: string;
  text: string;
  options: Array<[string, string, Record<string, number>, number?]>;
}

export interface GameViewState {
  q: number;
  stage: 'decide' | 'results' | 'done';
  selected: string[];
  alloc: Record<string, number>;
  roi: number;
  revenue: number;
  efficiency: number;
  adoption: number;
  risk: number;
  data: number;
  satisfaction: number;
  literacy: number;
  turnover: number;
  compliance: number;
  innovation: number;
  spent: number;
  score: number;
  history: unknown[];
  achievements: string[];
  crisis: GameCrisis | null;
  feedback: string;
  causalChain: unknown[];
  proactiveRecommendations: unknown[];
  approvedRecommendations: string[];
  discoveredSynergies: string[];
  nextQuarterGuidance?: { title: string; action: string; allocationKey?: string; target?: string } | null;
  baseline: unknown[];
  experimental: boolean;
  initiativeStates: Record<string, InitiativeState>;
  initiativeGeneration?: InitiativeGeneration;
  userReflections: UserReflections;
  scenarioMode: boolean;
  scenarioId?: string;
  currencyMode: CurrencyMode;
  quarterlyBudget: number;
  campaignBudget: number;
  campaignBudgetRemaining: number;
  deploymentAmount: number;
  quarterlyDeploymentCap: number;
  lastQuarterDeployment: number;
  scenarioBudgetRemaining: number;
  scenarioStartingMetrics?: Record<string, number>;
  scenarioProgress?: Record<string, number>;
  quarterlyCrisisCost: number;
  scenarioOverspend: number;
  scenarioBonus: number;
  runMetadata?: { runId: string; seed: number; scenarioId?: string; rulesVersion: string };
}

export interface Metric {
  label: string;
  value: number;
  unit?: string;
  color: MetricColor;
}
