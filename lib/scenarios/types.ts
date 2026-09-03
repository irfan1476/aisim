import type { Initiative } from '../game/initiatives';
import type { Allocation } from '../game/state';
import type { MaturityLevel } from '../game/initiativeState';
import type { CapacityState, InitiativeAction, InitiativeRequirements } from '../game/businessModel';

export type CurrencyMode = '$' | '₹';
export type ScenarioDirection = 'higher-is-better' | 'lower-is-better';
/**
 * The role an outcome plays in the scenario mission.  Primary outcomes define
 * the campaign's main promise, supporting outcomes reward breadth, and
 * guardrails prevent a superficially successful strategy from creating an
 * unacceptable exposure.
 */
export type ScenarioOutcomeRole = 'primary' | 'supporting' | 'guardrail';
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
  /**
   * Optional for backwards compatibility with older scenario packs. When no
   * role is authored, mission calculation treats the outcome as supporting
   * (and promotes the first outcome to primary only when a pack has no primary
   * outcomes at all).
   */
  role?: ScenarioOutcomeRole;
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

/**
 * The six operating capabilities a learner can deliberately fund.  These
 * names match Allocation so the profile can be carried through the engine,
 * preview and replay without a translation layer.
 */
export type OperatingLever = 'infra' | 'data' | 'people' | 'mlops' | 'compliance' | 'innovation';

/**
 * Operating profiles are authored against the learner-facing lifecycle
 * actions.  The AI lifecycle stages remain useful to consumers that need a
 * finer-grained view; the resolver supplies both vocabularies consistently.
 */
export type ScenarioOperatingStage = InitiativeAction | ScenarioLifecycleStage;
export type OperatingWeightSet = Partial<Record<OperatingLever, number>>;

export type ScenarioOperatingCapacitySensitivity = {
  integration: number;
  delivery: number;
  change: number;
  data: number;
  governance: number;
};

/**
 * Stable, serialisable operating model contract.  `revision` is intentionally
 * explicit so future profile changes can be migrated without changing the
 * meaning of historical campaign snapshots.
 */
export type ScenarioOperatingProfile = {
  revision: 1;
  bottleneckOrder: OperatingLever[];
  stageWeights: Record<ScenarioOperatingStage, OperatingWeightSet>;
  capacitySensitivity: ScenarioOperatingCapacitySensitivity;
};

/** Partial authoring is the public scenario-pack surface. */
export type ScenarioOperatingProfileOverride = {
  revision?: 1;
  bottleneckOrder?: OperatingLever[];
  stageWeights?: Partial<Record<ScenarioOperatingStage, OperatingWeightSet>>;
  capacitySensitivity?: Partial<ScenarioOperatingCapacitySensitivity>;
};

export type ScenarioEvaluationCriterion = {
  id: string;
  label: string;
  metric: string;
  threshold: number;
  direction: ScenarioDirection;
  /** What the learner is validating at this point in the lifecycle. */
  kind?: 'outcome' | 'evidence' | 'safety';
  /** A failed mandatory criterion cannot receive a Go recommendation. */
  required?: boolean;
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
    /** Evidence threshold for a conditional Go when mandatory checks pass. */
    conditionalThreshold?: number;
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
  /** Optional operating-model facts; resolved to a complete profile by the adapter. */
  operatingProfile?: ScenarioOperatingProfileOverride;
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
