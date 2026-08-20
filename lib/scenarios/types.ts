import type { Allocation, GameState } from '../game/state';
import type { Initiative } from '../game/initiatives';

export type CurrencyMode = '$' | '₹';
export type ScenarioDirection = 'higher-is-better' | 'lower-is-better';
export type ScenarioMetrics = Partial<Record<'roi' | 'revenue' | 'efficiency' | 'adoption' | 'risk' | 'data' | 'satisfaction' | 'literacy' | 'turnover' | 'compliance' | 'innovation', number>> & Record<string, number>;

export type ScenarioChallenge = {
  id: string;
  label: string;
  severity: string;
  metric: string;
  direction: ScenarioDirection;
  description: string;
};

export type ScenarioProgressDefinition = {
  key: string;
  label: string;
  start: number;
  direction: ScenarioDirection;
  evaluate: (state: GameState) => number;
};

export type ScenarioCrisisOption = {
  label: string;
  description: string;
  cost?: number;
  impacts: Record<string, number>;
};

export type CrisisTemplate = {
  title: string;
  type: string;
  text: string;
  options: ScenarioCrisisOption[];
};

export interface ScenarioDefinition {
  id: string;
  name: string;
  industry: string;
  icon: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  company: { name: string; revenue: string; employees: string; locations: string; description: string };
  challenges: ScenarioChallenge[];
  startingState: { budget: number; defaultAllocation: Allocation; startingMetrics: ScenarioMetrics };
  progress: ScenarioProgressDefinition[];
  initiatives?: Initiative[];
  crises: CrisisTemplate[];
  currency: { defaultSymbol: CurrencyMode; defaultLabel: string };
  frameworkContext: { advisorPrompt: string; industryBenchmarks: Record<string, number> };
}
