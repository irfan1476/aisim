import type { Initiative } from '../game/initiatives';
import type { Allocation } from '../game/state';
import type { MaturityLevel } from '../game/initiativeState';
import type { CapacityState, InitiativeRequirements } from '../game/businessModel';

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
  unit: string;
  start: number;
  target: number;
  min: number;
  max: number;
  direction: ScenarioDirection;
};

export type ScenarioNeglectConfig = {
  decayRate: number;
  penaltyThreshold: number;
  penaltyAmount: number;
};

/**
 * Scenario-authored AI lifecycle policy.  This is deliberately descriptive:
 * the engine can opt into these facts incrementally without making the
 * historical operating lifecycle or existing scenario packs invalid.
 */
export type ScenarioLifecycleStage = 'data_readiness' | 'experiment' | 'pilot' | 'evaluate' | 'deploy' | 'monitor' | 'adapt';

export type ScenarioEvaluationCriterion = {
  id: string;
  label: string;
  metric: string;
  threshold: number;
  direction: ScenarioDirection;
};

export type ScenarioDeploymentModeEffects = {
  efficiencyDelta: number;
  riskDelta: number;
  trustDelta: number;
  oversightUnits: number;
};

export type ScenarioLifecycleProfile = {
  dataReadiness: number;
  experimentQuarters: number;
  pilotQuarters: number;
  evaluation: {
    criteria: ScenarioEvaluationCriterion[];
    goThreshold: number;
  };
  deployment: {
    defaultMode: 'augmentation' | 'automation';
    modes: {
      augmentation: ScenarioDeploymentModeEffects;
      automation: ScenarioDeploymentModeEffects;
    };
  };
  risks: {
    model: number;
    operational: number;
    legal: number;
  };
  drift: {
    susceptibility: number;
    quarterlyRate: number;
    degradationThreshold: number;
    monitoringRequired: boolean;
  };
  oversight: {
    baseUnits: number;
    automationUnits: number;
  };
  autonomy: 'advisory' | 'semi_autonomous' | 'autonomous';
  autonomyBoundaries: string;
  flywheel?: {
    active: boolean;
    quality: number;
    recipientIds: string[];
  };
};

/**
 * Optional delivery constraints authored by a scenario pack.  All fields are
 * partial so existing scenarios retain the historical, allocation-derived
 * capacity behaviour until they opt into a more specific operating model.
 */
export type ScenarioCapacityConfig = {
  capacity?: Partial<CapacityState>;
  initiativeRequirements?: Record<string, Partial<InitiativeRequirements>>;
};

/** Explicit 0-100 capability coverage authored by each scenario pack. */
export type FrameworkContribution = {
  peopleChange: number;
  processWorkflow: number;
  techData: number;
  algorithmModel: number;
};

/**
 * A scenario-declared relationship between two initiatives.
 *
 * These values intentionally mirror the engine's existing synergy vocabulary
 * so a future generic resolver can consume them without knowing scenario IDs.
 */
export type ScenarioSynergyDefinition = {
  key: string;
  initiativeIds: [string, string];
  label: string;
  description: string;
  roiBoost: number;
  riskReduction: number;
  adoptionBoost: number;
  costReduction: number;
};

export type ScenarioInitiative = Initiative & {
  baseEffect: number;
  primaryMetric: string;
  effectUnit: string;
  initialMaturity?: MaturityLevel;
  baseRiskScore?: number;
  neglect?: ScenarioNeglectConfig;
  frameworkContribution?: FrameworkContribution;
  provisional?: boolean;
  /** Optional, initiative-specific lifecycle facts; filled by the adapter when omitted. */
  lifecycleProfile?: Partial<ScenarioLifecycleProfile>;
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
  /** Optional capacity and gate rules; omitted for backwards compatibility. */
  capacity?: ScenarioCapacityConfig;
  progress: ScenarioProgressDefinition[];
  initiatives?: ScenarioInitiative[];
  synergies?: ScenarioSynergyDefinition[];
  crises: CrisisTemplate[];
  currency: { defaultSymbol: CurrencyMode; defaultLabel: string };
  frameworkContext: { advisorPrompt: string; industryBenchmarks: Record<string, number> };
}
