import type { Initiative } from '../game/initiatives';
import type { Allocation } from '../game/state';
import type { MaturityLevel } from '../game/initiativeState';

export type CurrencyMode = '$' | '₹';
export type ScenarioDirection = 'higher-is-better' | 'lower-is-better';
export type ScenarioV3Version = `v${number}` | `${number}.${number}.${number}` | string;
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

/** Additive V3 authoring contract. V2 packs do not need to provide this. */
export type V3MetricAuthority = {
  [key: string]: unknown;
  id?: string;
  key: string;
  label?: string;
  unit: string;
  timeBasis: string;
  ownerRole: string;
  scope?: 'generic' | 'scenario' | 'core';
  min?: number;
  max?: number;
  start?: number;
  target?: number;
  direction?: ScenarioDirection;
  currency?: string;
  sourceRuleIds?: string[];
  sourceEvidenceIds?: string[];
};

export type V3EvidenceArtifact = {
  [key: string]: unknown;
  id: string;
  title?: string;
  sourceType?: string;
  sourceStatus?: string;
  claimStatus?: string;
  authorRole?: string;
  version?: string;
  availableFrom?: string;
  informs?: string[];
  facts?: string[];
  limitations?: string[];
};

export type V3LifecycleState = 'deferred' | 'research' | 'pilot' | 'scale' | 'sustain' | 'pause' | 'stop';
export type V3InitiativeProfile = {
  [key: string]: unknown;
  id: string;
  valueHypothesis?: string;
  whyNotNow?: { status: string; evidence?: string[]; explanation?: string };
  lifecycle?: { allowedTransitions: string[]; timeToSignalQuarters?: number };
  dependencies?: string[];
  evidenceRequired?: string[];
  ownerRole?: string;
  controlBoundary?: string;
  pilotSuccessCriteria?: string[];
  scaleGate?: string[];
  stopOrPauseCriteria?: string[];
  affectedStakeholders?: string[];
  valueMetric?: string;
  effect?: { metric: string; delta: number; unit: string; sourceRuleId?: string; sourceEvidenceIds?: string[] };
  capacityRequired?: Record<string, Record<string, number>>;
  operatingChangePlan?: Record<string, unknown>;
  costInrCr?: { researchCapital?: number; pilotCapital?: number; scaleCapital?: number; quarterlyRunCost?: number; changeAssuranceEffort?: number };
};

export type V3Stakeholder = {
  [key: string]: unknown;
  id: string;
  role?: string;
  priorities?: string[];
  redLines?: string[];
  influence?: 'low' | 'medium' | 'high' | string;
  signals?: string[];
};

export type V3GovernanceGate = {
  [key: string]: unknown;
  id: string;
  appliesTo?: string[];
  ownerRole?: string;
  requiredEvidence?: string[];
  conditions?: string[];
  onFailure?: string;
  explanation?: string;
};

export type V3Event = {
  [key: string]: unknown;
  id: string;
  trigger?: string;
  triggerMetric?: string;
  triggerInitiative?: string;
  effects?: Array<{ metric: string; delta: number; unit?: string; sourceRuleId?: string; sourceEvidenceIds?: string[] }>;
};

export type V3WindowPriority = {
  id: string;
  displayName: string;
  problem: string;
  whyNow: string;
  knownFacts: string[];
  researchQuestions: string[];
  boundary: string;
  owner: string;
  costInrCr: number;
  capacity: Record<string, number>;
  evidenceIds: string[];
  signalQuarter: number;
  deferral: string;
  terms?: string[];
};

export type V3WindowDefinition = {
  id: string;
  quarterRange: [number, number];
  boardQuestion: string;
  headlineSignals: Array<{ label: string; value: string; target?: string; tone?: 'risk' | 'context' }>;
  monitoredContext: string;
  laterPriorities: string[];
  priorities: V3WindowPriority[];
};

export type V3ResearchBranch = 'pilot-ready-with-conditions' | 'remediation-required' | 'priority-not-supported';

export type V3ResearchOutcomeDefinition = {
  id: string;
  initiativeId: string;
  branch: V3ResearchBranch;
  sourceType: string;
  sourceStatus: string;
  authorRole: string;
  version: string;
  producedInWindow: string;
  basedOnEvidence: string[];
  facts: string[];
  limitations: string[];
  decisionUse: string;
  unresolvedConditions: string[];
};

export type V3ResearchReviewDefinition = {
  initiativeId: string;
  signalQuarter: number;
  defaultBranch: V3ResearchBranch;
  outcomes: V3ResearchOutcomeDefinition[];
};

export type V3CausalRule = {
  [key: string]: unknown;
  id: string;
  evidenceIds?: string[];
  metric?: string;
  effects?: Array<{ metric: string; delta: number; unit?: string }>;
  stakeholderIds?: string[];
};

export type V3ScenarioPack = {
  [key: string]: unknown;
  version?: ScenarioV3Version;
  compatibilityVersion?: string;
  owner?: string;
  metrics?: V3MetricAuthority[];
  reportedMetrics?: V3MetricAuthority[];
  evidence?: V3EvidenceArtifact[];
  initiatives?: V3InitiativeProfile[];
  stakeholders?: V3Stakeholder[];
  governanceGates?: V3GovernanceGate[];
  gates?: V3GovernanceGate[];
  causalRules?: V3CausalRule[];
  events?: V3Event[];
  portfolioPolicy?: { lifecycleStates?: V3LifecycleState[]; budgetPosture?: string; budget?: { currency?: string; capitalEnvelope?: number; annualRunEnvelope?: number }; capacityPools?: Record<string, number> };
  currency?: { code?: string; unit?: string };
  report?: { changes?: Array<{ metric: string; ruleId?: string; evidenceIds?: string[] }> };
  learning?: Record<string, unknown>;
  evidencePolicy?: Record<string, unknown>;
  timeHorizonQuarters?: number;
  nonNegotiables?: string[];
  boardMemo?: Record<string, unknown>;
  responsibleImpact?: Record<string, unknown>;
  eventCoverage?: Record<string, unknown>;
  windowOne?: V3WindowDefinition;
  windows?: V3WindowDefinition[];
  researchReviews?: V3ResearchReviewDefinition[];
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
  provisional?: boolean;
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
  /** Optional pack metadata. Existing V2 scenarios intentionally omit it. */
  schemaVersion?: ScenarioV3Version;
  packVersion?: string;
  name: string;
  industry: string;
  icon: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  company: { name: string; revenue: string; employees: string; locations: string; description: string };
  challenges: ScenarioChallenge[];
  startingState: { budget: number; defaultAllocation: Allocation; startingMetrics: ScenarioMetrics };
  progress: ScenarioProgressDefinition[];
  initiatives?: ScenarioInitiative[];
  synergies?: ScenarioSynergyDefinition[];
  crises: CrisisTemplate[];
  currency: { defaultSymbol: CurrencyMode; defaultLabel: string };
  frameworkContext: { advisorPrompt: string; industryBenchmarks: Record<string, number> };
  /** Present only for opted-in V3 packs; omitted from all V2 packs. */
  v3?: V3ScenarioPack;
}
