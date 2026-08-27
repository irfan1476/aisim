import type { Allocation } from './state';
import type {
  CapacityState,
  GateResult,
  InitiativeAction,
  InitiativeActionSet,
  InitiativeRequirements,
} from './businessModel';
import type { ScenarioDefinition, ScenarioCapacityConfig } from '../scenarios/types';
import {
  defaultInitiativeRequirements,
  evaluateInitiativeGate,
  type GateEvaluation,
} from './readiness';
import { calculateHumanOversightRequirement } from './lifecycleResolver';

export type CapacityDemand = CapacityState;

export type CapacityIssue = {
  code: 'DELIVERY_CAPACITY' | 'CHANGE_CAPACITY' | 'DATA_CAPACITY' | 'GOVERNANCE_CAPACITY' | 'HUMAN_OVERSIGHT_CAPACITY';
  message: string;
  demand: number;
  available: number;
};

export type PortfolioValidationResult = {
  valid: boolean;
  status: 'valid' | 'conditional' | 'blocked';
  issues: CapacityIssue[];
  demand: CapacityDemand;
  capacity: CapacityState;
  gates: Record<string, GateEvaluation>;
};

type InitiativeLike = {
  id?: string;
  data?: number;
  human?: number;
  currentData?: number;
  currentHuman?: number;
  risk?: string;
  currentRisk?: string;
  baseRiskScore?: number;
  riskScore?: number;
  requirements?: Partial<InitiativeRequirements>;
  aiLifecycle?: { stage?: string };
  deploymentMode?: 'augmentation' | 'automation' | 'not_set';
  autonomyLevel?: 'advisory' | 'semi_autonomous' | 'autonomous';
  risks?: { modelRisk: number; operationalRisk: number; legalRisk: number };
  humanOversightRequired?: number;
};

type ScenarioCapacitySource = Pick<ScenarioDefinition, 'capacity'> | ScenarioCapacityConfig | Partial<CapacityState> | undefined;

const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const nonNegative = (value: unknown, fallback = 0) => Math.max(0, finite(value, fallback));
const allocationValue = (allocation: Allocation, key: keyof Allocation) => nonNegative(allocation?.[key]);

function capacityOverrides(source?: ScenarioCapacitySource): Partial<CapacityState> {
  if (!source) return {};
  const candidate = source as { capacity?: ScenarioCapacityConfig['capacity'] };
  // Accept both a full scenario (`{ capacity: ... }`) and a direct capacity
  // object for small callers/tests.
  return candidate.capacity || source as Partial<CapacityState>;
}

/**
 * Convert the operating allocation into finite capacity pools. Scenario packs
 * may override any pool; omitted values preserve the allocation-derived model.
 */
export function deriveCapacityState(allocation: Allocation, scenario?: ScenarioCapacitySource): CapacityState {
  const overrides = capacityOverrides(scenario);
  return {
    // Teams are discrete in the UI but remain fractional here for planning.
    deliveryTeams: nonNegative(overrides.deliveryTeams, Math.max(0.5, 1 + allocationValue(allocation, 'people') / 10)),
    changeCapacity: nonNegative(overrides.changeCapacity, allocationValue(allocation, 'people') / 10),
    dataEngineeringCapacity: nonNegative(overrides.dataEngineeringCapacity, allocationValue(allocation, 'data') / 10),
    governanceReviewCapacity: nonNegative(overrides.governanceReviewCapacity, allocationValue(allocation, 'compliance') / 8),
    humanOversightCapacity: nonNegative(overrides.humanOversightCapacity, 1 + allocationValue(allocation, 'people') / 10 + allocationValue(allocation, 'compliance') / 20),
    humanOversightDemand: 0,
  };
}

const actionMultiplier: Record<InitiativeAction, number> = {
  discover: 0.35,
  pilot: 0.8,
  scale: 1,
  maintain: 0.2,
  pause: 0.15,
  retire: 0.25,
};

function asInitiativeMap(initiatives: InitiativeLike[] | Record<string, InitiativeLike>): Record<string, InitiativeLike> {
  if (Array.isArray(initiatives)) return Object.fromEntries(initiatives.map((initiative, index) => [initiative.id || String(index), initiative]));
  return initiatives || {};
}

function asActionMap(actions: InitiativeActionSet | Record<string, InitiativeAction> | string[]): Record<string, InitiativeAction> {
  if (Array.isArray(actions)) return Object.fromEntries(actions.map(id => [id, 'scale' as InitiativeAction]));
  return actions || {};
}

/** Calculate aggregate demand for the actions in a portfolio. */
export function calculateCapacityDemand(
  actions: InitiativeActionSet | Record<string, InitiativeAction> | string[],
  initiatives: InitiativeLike[] | Record<string, InitiativeLike>,
): CapacityDemand {
  const actionMap = asActionMap(actions);
  const initiativeMap = asInitiativeMap(initiatives);
  const demand: CapacityDemand = { deliveryTeams: 0, changeCapacity: 0, dataEngineeringCapacity: 0, governanceReviewCapacity: 0 };
  let humanOversightDemand = 0;
  Object.entries(actionMap).forEach(([id, action]) => {
    const initiative = initiativeMap[id];
    if (!initiative || !actionMultiplier[action]) return;
    const requirements = initiative.requirements
      ? { ...defaultInitiativeRequirements(initiative), ...initiative.requirements }
      : defaultInitiativeRequirements(initiative);
    const multiplier = actionMultiplier[action];
    demand.deliveryTeams += requirements.deliveryLoad * multiplier;
    demand.changeCapacity += requirements.changeLoad * multiplier;
    demand.dataEngineeringCapacity += requirements.dataLoad * multiplier;
    demand.governanceReviewCapacity += requirements.governanceLoad * multiplier;
    const stage = initiative.aiLifecycle?.stage;
    // Old campaigns have no recorded deployment-mode decision. They remain
    // playable after migration and are not retroactively charged against the
    // new oversight pool; newly governed deployments always record a mode.
    if ((action === 'scale' || action === 'maintain') && initiative.deploymentMode && initiative.deploymentMode !== 'not_set' && initiative.risks && initiative.autonomyLevel && (stage === 'deploy' || stage === 'monitor')) {
      humanOversightDemand += Number.isFinite(Number(initiative.humanOversightRequired))
        ? Math.max(0, Number(initiative.humanOversightRequired))
        : calculateHumanOversightRequirement({
            autonomyLevel: initiative.autonomyLevel,
            deploymentMode: initiative.deploymentMode,
            risks: initiative.risks,
          });
    }
  });
  return {
    ...Object.fromEntries(Object.entries(demand).map(([key, value]) => [key, Number(value.toFixed(4))])),
    humanOversightDemand: Number(humanOversightDemand.toFixed(4)),
  } as CapacityDemand;
}

function capacityIssues(demand: CapacityDemand, capacity: CapacityState): CapacityIssue[] {
  const checks: Array<[CapacityIssue['code'], string, keyof CapacityState]> = [
    ['DELIVERY_CAPACITY', 'Delivery capacity', 'deliveryTeams'],
    ['CHANGE_CAPACITY', 'Change capacity', 'changeCapacity'],
    ['DATA_CAPACITY', 'Data engineering capacity', 'dataEngineeringCapacity'],
    ['GOVERNANCE_CAPACITY', 'Governance review capacity', 'governanceReviewCapacity'],
  ];
  return checks.flatMap(([code, label, key]) => {
    const required = nonNegative(demand[key]);
    const available = nonNegative(capacity[key]);
    return required > available + 1e-9
      ? [{ code, demand: required, available, message: `${label} demand ${(required * 100).toFixed(0)}% exceeds available ${(available * 100).toFixed(0)}%.` }]
      : [];
  });
}

/**
 * Validate an action portfolio against both capacity pools and initiative
 * readiness gates. Returns issues for callers to explain or render; it never
 * throws for malformed/partial legacy input.
 */
export function validatePortfolioCapacity(
  actions: InitiativeActionSet | Record<string, InitiativeAction> | string[],
  initiatives: InitiativeLike[] | Record<string, InitiativeLike>,
  allocationOrCapacity: Allocation | CapacityState,
  scenario?: ScenarioCapacitySource,
): PortfolioValidationResult {
  const allocation = 'infra' in (allocationOrCapacity || {}) ? allocationOrCapacity as Allocation : undefined;
  const capacity = allocation ? deriveCapacityState(allocation, scenario) : allocationOrCapacity as CapacityState;
  const actionMap = asActionMap(actions);
  const initiativeMap = asInitiativeMap(initiatives);
  const demand = calculateCapacityDemand(actionMap, initiativeMap);
  const issues = capacityIssues(demand, capacity);
  if (Number.isFinite(Number(capacity.humanOversightCapacity)) && Number(demand.humanOversightDemand || 0) > Number(capacity.humanOversightCapacity) + 1e-9) {
    issues.push({
      code: 'HUMAN_OVERSIGHT_CAPACITY',
      message: `Human oversight demand ${Number(demand.humanOversightDemand).toFixed(1)} exceeds available ${Number(capacity.humanOversightCapacity).toFixed(1)} units.`,
      demand: Number(demand.humanOversightDemand || 0),
      available: Number(capacity.humanOversightCapacity),
    });
  }
  const configuredRequirements = (scenario && 'capacity' in scenario ? (scenario as ScenarioDefinition).capacity?.initiativeRequirements : undefined) || {};
  const gates = Object.fromEntries(Object.entries(actionMap).flatMap(([id, action]) => {
    const initiative = initiativeMap[id];
    // Paused/retired initiatives have no delivery gate this quarter.
    if (!initiative || action === 'pause' || action === 'retire') return [];
    const result = evaluateInitiativeGate(initiative, { ...initiative.requirements, ...(configuredRequirements[id] || {}) }, allocation, capacity);
    return [[id, result]] as [string, GateEvaluation][];
  }));
  const hasBlockedGate = Object.values(gates).some(gate => gate.status === 'blocked');
  const hasConditionalGate = Object.values(gates).some(gate => gate.status === 'conditional');
  return {
    valid: issues.length === 0 && !hasBlockedGate,
    status: issues.length > 0 || hasBlockedGate ? 'blocked' : hasConditionalGate ? 'conditional' : 'valid',
    issues,
    demand,
    capacity,
    gates,
  };
}

// Short alias for callers that treat readiness/capacity as one portfolio rule.
export const validatePortfolio = validatePortfolioCapacity;
