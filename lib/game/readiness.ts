import type { Allocation } from './state';
import { allocationToReadiness } from './allocation';
import type {
  CapacityState,
  GateResult,
  InitiativeRequirements,
} from './businessModel';

export type ReadinessState = ReturnType<typeof allocationToReadiness>;

export type GateIssue = {
  code: 'DATA_READINESS' | 'CONTROL_MATURITY' | 'DELIVERY_CAPACITY' | 'CHANGE_CAPACITY' | 'DATA_CAPACITY' | 'GOVERNANCE_CAPACITY';
  message: string;
  severity: 'warning' | 'blocking';
  actual?: number;
  required?: number;
};

export type GateEvaluation = GateResult & {
  issues: GateIssue[];
  readiness: ReadinessState;
  requirements: InitiativeRequirements;
};

type InitiativeLike = {
  id?: string;
  data?: number;
  human?: number;
  currentData?: number;
  dataReadiness?: number;
  currentHuman?: number;
  risk?: string;
  currentRisk?: string;
  baseRiskScore?: number;
  riskScore?: number;
};

/** Persistent initiative data asset readiness, expressed as a percentage for
 * gates and as the existing 1–5 currentData value in the state model. */
export function initiativeDataReadiness(initiative: InitiativeLike): number {
  const authoredOrPersisted = Number(initiative.dataReadiness);
  if (Number.isFinite(authoredOrPersisted)) return clamp01(authoredOrPersisted / 100);
  const currentData = Number(initiative.currentData);
  if (Number.isFinite(currentData)) return clamp01(currentData / 5);
  return allocationToReadiness({ infra: 0, data: finite(initiative.data, 0) * 6, people: 0, mlops: 0, compliance: 0, innovation: 0 }).data;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

/** Safe, scenario-independent gate defaults for legacy initiatives. */
export function defaultInitiativeRequirements(initiative: InitiativeLike): InitiativeRequirements {
  const dataNeed = Math.max(1, Math.min(5, finite(initiative.data, finite(initiative.currentData, 3))));
  const peopleNeed = Math.max(1, Math.min(5, finite(initiative.human, finite(initiative.currentHuman, 3))));
  const risk = String(initiative.currentRisk || initiative.risk || '').toUpperCase();
  const riskScore = finite(initiative.riskScore, finite(initiative.baseRiskScore, risk === 'HIGH' ? 72 : risk === 'MED' ? 48 : 24));
  const highRisk = risk === 'HIGH' || riskScore >= 65;
  const mediumRisk = risk === 'MED' || riskScore >= 35;
  return {
    deliveryLoad: clamp01(0.25 + peopleNeed * 0.07),
    changeLoad: clamp01(0.18 + peopleNeed * 0.07),
    dataLoad: clamp01(0.18 + dataNeed * 0.08),
    governanceLoad: clamp01(0.15 + (highRisk ? 0.25 : mediumRisk ? 0.14 : 0.08)),
    // These are intentionally requirements, not a universal readiness floor.
    minimumDataReadiness: clamp01(0.25 + dataNeed * 0.1),
    minimumControlMaturity: clamp01(highRisk ? 0.7 : mediumRisk ? 0.5 : 0.3),
  };
}

export function normalizeInitiativeRequirements(
  initiative: InitiativeLike,
  requirements?: Partial<InitiativeRequirements>,
): InitiativeRequirements {
  const defaults = defaultInitiativeRequirements(initiative);
  const supplied = requirements || {};
  return {
    deliveryLoad: clamp01(finite(supplied.deliveryLoad, defaults.deliveryLoad)),
    changeLoad: clamp01(finite(supplied.changeLoad, defaults.changeLoad)),
    dataLoad: clamp01(finite(supplied.dataLoad, defaults.dataLoad)),
    governanceLoad: clamp01(finite(supplied.governanceLoad, defaults.governanceLoad)),
    minimumDataReadiness: clamp01(finite(supplied.minimumDataReadiness, defaults.minimumDataReadiness)),
    minimumControlMaturity: clamp01(finite(supplied.minimumControlMaturity, defaults.minimumControlMaturity)),
  };
}

const isCapacity = (value: unknown): value is CapacityState => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return 'deliveryTeams' in candidate || 'changeCapacity' in candidate || 'dataEngineeringCapacity' in candidate || 'governanceReviewCapacity' in candidate;
};

const emptyReadiness = (): ReadinessState => ({ data: 1, people: 1, governance: 1, technical: 1 });

/**
 * Evaluate one initiative without throwing. The third argument may be an
 * Allocation or CapacityState; pass both when checking both readiness and
 * portfolio capacity. `issues` is structured for UI and advisor consumers,
 * while the shared GateResult fields keep this compatible with the model lane.
 */
export function evaluateInitiativeGate(
  initiative: InitiativeLike,
  requirements?: Partial<InitiativeRequirements>,
  allocationOrCapacity?: Allocation | CapacityState,
  capacityOverride?: CapacityState,
): GateEvaluation {
  const normalized = normalizeInitiativeRequirements(initiative, requirements);
  const allocation = allocationOrCapacity && !isCapacity(allocationOrCapacity) ? allocationOrCapacity as Allocation : undefined;
  const capacity = capacityOverride || (allocationOrCapacity && isCapacity(allocationOrCapacity) ? allocationOrCapacity : undefined);
  const readiness = allocation ? allocationToReadiness(allocation) : emptyReadiness();
  const issues: GateIssue[] = [];

  const persistentDataReadiness = initiativeDataReadiness(initiative);
  const dataRatio = normalized.minimumDataReadiness > 0 ? persistentDataReadiness / normalized.minimumDataReadiness : 1;
  const controlRatio = normalized.minimumControlMaturity > 0 ? readiness.governance / normalized.minimumControlMaturity : 1;
  if (persistentDataReadiness + 1e-9 < normalized.minimumDataReadiness) {
    issues.push({ code: 'DATA_READINESS', message: `Data readiness ${(persistentDataReadiness * 100).toFixed(0)}% is below the ${(normalized.minimumDataReadiness * 100).toFixed(0)}% gate.`, severity: dataRatio < 0.5 ? 'blocking' : 'warning', actual: persistentDataReadiness, required: normalized.minimumDataReadiness });
  }
  if (readiness.governance + 1e-9 < normalized.minimumControlMaturity) {
    issues.push({ code: 'CONTROL_MATURITY', message: `Control maturity ${(readiness.governance * 100).toFixed(0)}% is below the ${(normalized.minimumControlMaturity * 100).toFixed(0)}% gate.`, severity: controlRatio < 0.5 ? 'blocking' : 'warning', actual: readiness.governance, required: normalized.minimumControlMaturity });
  }

  if (capacity) {
    const checks: Array<[GateIssue['code'], string, number, number]> = [
      ['DELIVERY_CAPACITY', 'Delivery capacity', normalized.deliveryLoad, capacity.deliveryTeams],
      ['CHANGE_CAPACITY', 'Change capacity', normalized.changeLoad, capacity.changeCapacity],
      ['DATA_CAPACITY', 'Data engineering capacity', normalized.dataLoad, capacity.dataEngineeringCapacity],
      ['GOVERNANCE_CAPACITY', 'Governance review capacity', normalized.governanceLoad, capacity.governanceReviewCapacity],
    ];
    checks.forEach(([code, label, demand, available]) => {
      if (demand > finite(available) + 1e-9) {
        issues.push({ code, message: `${label} demand ${(demand * 100).toFixed(0)}% exceeds available ${(finite(available) * 100).toFixed(0)}%.`, severity: 'blocking', actual: demand, required: finite(available) });
      }
    });
  }

  const hasBlocking = issues.some(issue => issue.severity === 'blocking');
  const hasWarning = issues.some(issue => issue.severity === 'warning');
  const readinessRatio = Math.max(0, Math.min(1, dataRatio, controlRatio));
  const status = hasBlocking ? 'blocked' : hasWarning ? 'conditional' : 'ready';
  return {
    status,
    reasons: issues.map(issue => issue.message),
    // A readiness gap is an intentionally permitted learning experiment, not
    // a dead end. It has a visibly weaker result and higher exposure, so the
    // learner can inspect why the hypothesis did or did not travel.
    deliveryMultiplier: status === 'blocked' ? Math.max(0.15, readinessRatio * 0.4) : status === 'conditional' ? Math.max(0.5, readinessRatio) : 1,
    // Positive values represent additional risk exposure created by weak gates.
    riskAdjustment: Number(((1 - readinessRatio) * 20 + (hasBlocking ? 8 : 0)).toFixed(2)),
    issues,
    readiness,
    requirements: normalized,
  };
}
