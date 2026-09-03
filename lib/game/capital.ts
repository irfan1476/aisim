import { deploymentCapacity, type GameState } from './state';
import type { InitiativeAccelerationAllocation, InitiativeAction, InitiativeActionSet, InitiativeFunding } from './businessModel';
import { isAccelerableAction } from './fundingDynamics';

/**
 * Continuity is deliberately modest. It represents keeping previously funded
 * work operational, not buying additional delivery intensity. The engine still
 * models neglect if the learner chooses not to fund the next quarter at all.
 */
export const CONTINUITY_RATE = 0.08;

type CapitalState = Pick<
  GameState,
  'initiativeStates' | 'campaignBudget' | 'campaignBudgetRemaining' | 'quarterlyBudget' | 'q' | 'spent' | 'quarterlyCrisisCost'
>;

const finite = (value: unknown) => Math.max(0, Number(value) || 0);

export type CapitalPlan = {
  /** Per-initiative cash attribution. This is additive to the legacy aggregates. */
  byInitiative: Record<string, InitiativeFunding>;
  initiativeMinimum: number;
  maintenanceSpend: number;
  continuityAllocations: Record<string, number>;
  accelerationSpend: number;
  /** Exact learner-directed percentages used for discretionary acceleration. */
  accelerationAllocations?: InitiativeAccelerationAllocation;
  deliveryCapital: number;
  crisisResponseSpend: number;
  requiredCapital: number;
  totalReleased: number;
  remainingAfterPlan: number;
};

const emptyFunding = (): InitiativeFunding => ({ discovery: 0, delivery: 0, scaleUp: 0, run: 0, continuity: 0, retirement: 0, total: 0 });
const round = (value: number) => Number(value.toFixed(2));

function fundingFor(state: CapitalState, id: string): InitiativeFunding {
  const initiative = state.initiativeStates?.[id];
  const currentCost = finite(initiative?.currentCost ?? initiative?.baseCost ?? initiative?.cost);
  return { ...emptyFunding(), delivery: currentCost, total: currentCost };
}

/**
 * Action-aware capital planning. `requestedDeployment` is the total campaign
 * release for the quarter, including the current crisis response cost. Unlike
 * the compatibility API below, continuity is created only for explicit
 * `maintain` actions; paused/discovery initiatives receive no hidden charge.
 */
export function calculateActionCapitalPlan(
  state: CapitalState,
  actions: InitiativeActionSet,
  requestedDeployment: number,
  crisisResponseSpend = state.quarterlyCrisisCost,
  accelerationAllocations?: InitiativeAccelerationAllocation,
): CapitalPlan {
  const remaining = finite(state.campaignBudgetRemaining);
  const hasInitiativeAction = Object.values(actions || {}).some((action) => action === 'discover' || action === 'pilot' || action === 'scale' || action === 'maintain' || action === 'retire');
  // A no-op/observation action cannot release unallocated initiative cash.
  // Crisis spend may still consume the purse when explicitly present.
  const totalReleased = Math.min(remaining, finite(requestedDeployment), hasInitiativeAction ? Number.POSITIVE_INFINITY : finite(crisisResponseSpend));
  const crisis = Math.min(totalReleased, finite(crisisResponseSpend));
  const initiativeCapacity = Math.max(0, totalReleased - crisis);
  const byInitiative: Record<string, InitiativeFunding> = {};
  let fixedCapital = 0;
  const deliveryIds: string[] = [];
  const accelerableIds: string[] = [];
  Object.entries(state.initiativeStates || {}).forEach(([id, initiative]) => {
    const action = actions[id] as InitiativeAction | undefined;
    const cost = finite(initiative.currentCost ?? initiative.baseCost ?? initiative.cost);
    const funding = emptyFunding();
    if (action === 'discover') funding.discovery = round(cost * .1);
    else if (action === 'pilot') { funding.delivery = round(cost * .6); deliveryIds.push(id); }
    else if (action === 'scale') { funding.delivery = round(cost); deliveryIds.push(id); }
    else if (action === 'maintain') funding.run = round(finite(initiative.runCost) || cost * CONTINUITY_RATE);
    else if (action === 'retire') funding.retirement = round(cost * .15);
    funding.total = round(funding.discovery + funding.delivery + funding.run + funding.retirement);
    fixedCapital += funding.total;
    byInitiative[id] = funding;
    if (isAccelerableAction(action) && funding.total > 0) accelerableIds.push(id);
  });
  // Keep the unscaled commitment for the decision gate. Scaling the
  // attribution below is useful only after a valid release is known; using it
  // for validation would silently make an underfunded plan look affordable.
  const requiredCommitment = round(fixedCapital + crisis);
  // A plan can be underfunded; fixed commitments are reduced proportionally
  // rather than inventing spend. Any remaining release is explicit scale-up.
  if (fixedCapital > initiativeCapacity && fixedCapital > 0) {
    const factor = initiativeCapacity / fixedCapital;
    Object.values(byInitiative).forEach((funding) => {
      funding.discovery = round(funding.discovery * factor);
      funding.delivery = round(funding.delivery * factor);
      funding.run = round(funding.run * factor);
      funding.retirement = round(funding.retirement * factor);
      funding.total = round(funding.discovery + funding.delivery + funding.run + funding.retirement);
    });
    fixedCapital = Object.values(byInitiative).reduce((sum, funding) => sum + funding.total, 0);
  }
  const scaleUp = Math.max(0, initiativeCapacity - fixedCapital);
  const accelerationBase = accelerableIds.reduce((sum, id) => {
    const funding = byInitiative[id];
    return sum + funding.discovery + funding.delivery + funding.run;
  }, 0);
  const explicitWeights = accelerableIds
    .map((id) => [id, Math.max(0, Number(accelerationAllocations?.[id]) || 0)] as const)
    .filter(([, weight]) => weight > 0);
  const explicitWeightTotal = explicitWeights.reduce((sum, [, weight]) => sum + weight, 0);
  // An explicit split is only applied to eligible initiatives. If it is
  // missing or contains no eligible positive weight, retain the transparent
  // legacy proportional allocation. Normalising here also tolerates callers
  // using amounts instead of percentages while preserving the same split.
  const weights = explicitWeightTotal > 0
    ? new Map(explicitWeights)
    : new Map(accelerableIds.map((id) => {
      const funding = byInitiative[id];
      return [id, funding.discovery + funding.delivery + funding.run] as const;
    }));
  const weightTotal = Array.from(weights.values()).reduce((sum, weight) => sum + weight, 0);
  if (scaleUp > 0 && accelerationBase > 0 && weightTotal > 0) {
    accelerableIds.forEach((id) => {
      const funding = byInitiative[id];
      const weight = weights.get(id) || 0;
      funding.scaleUp = round(scaleUp * (weight / weightTotal));
      funding.total = round(funding.total + funding.scaleUp);
    });
  }
  // Rounding can leave a cent-level discrepancy. Allocate it to the first
  // delivery action so the ledger is exactly reconciled for reporting/tests.
  const targetInitiativeSpend = round(Math.max(0, initiativeCapacity));
  const actualInitiativeSpend = Object.values(byInitiative).reduce((sum, funding) => sum + funding.total, 0);
  const correction = round(targetInitiativeSpend - actualInitiativeSpend);
  const correctionId = accelerableIds[0] || Object.keys(byInitiative).find((id) => byInitiative[id].total > 0);
  if (correctionId && correction !== 0) {
    byInitiative[correctionId].scaleUp = round(Math.max(0, byInitiative[correctionId].scaleUp + correction));
    byInitiative[correctionId].total = round(byInitiative[correctionId].total + correction);
  }
  const initiativeMinimum = round(Object.values(byInitiative).reduce((sum, funding) => sum + funding.discovery + funding.delivery, 0));
  const maintenanceSpend = round(Object.values(byInitiative).reduce((sum, funding) => sum + funding.run, 0));
  const accelerationSpend = round(Object.values(byInitiative).reduce((sum, funding) => sum + funding.scaleUp, 0));
  const retirementSpend = round(Object.values(byInitiative).reduce((sum, funding) => sum + funding.retirement, 0));
  return {
    byInitiative,
    initiativeMinimum,
    maintenanceSpend,
    continuityAllocations: Object.fromEntries(Object.entries(byInitiative).filter(([, funding]) => funding.continuity > 0).map(([id, funding]) => [id, funding.continuity])),
    accelerationSpend,
    accelerationAllocations: explicitWeightTotal > 0
      ? Object.fromEntries(explicitWeights.map(([id, weight]) => [id, round(weight / explicitWeightTotal * 100)]))
      : undefined,
    // Only pilot/scale capital changes immediate operating outcomes.
    // Discovery and maintenance still get durable, stage-specific benefits,
    // but cannot manufacture same-quarter operating ROI.
    deliveryCapital: round(deliveryIds.reduce((sum, id) => {
      const funding = byInitiative[id];
      return sum + funding.delivery + funding.scaleUp;
    }, 0)),
    crisisResponseSpend: crisis,
    requiredCapital: requiredCommitment,
    totalReleased: round(totalReleased),
    remainingAfterPlan: round(Math.max(0, remaining - totalReleased)),
  };
}

export function calculateContinuityAllocations(state: CapitalState, selectedIds: string[]): Record<string, number> {
  const selected = new Set(selectedIds);
  return Object.fromEntries(Object.entries(state.initiativeStates || {}).flatMap(([id, initiative]) => {
    if (selected.has(id) || finite(initiative?.quartersFunded) <= 0) return [];
    const recurringCost = finite(initiative?.currentCost ?? initiative?.baseCost ?? initiative?.cost);
    const commitment = recurringCost * CONTINUITY_RATE;
    return commitment > 0 ? [[id, commitment]] : [];
  }));
}

export function calculateMaintenanceCommitment(state: CapitalState, selectedIds: string[]): number {
  return Object.values(calculateContinuityAllocations(state, selectedIds)).reduce((total, amount) => total + amount, 0);
}

export function calculateCapitalPlan(
  state: CapitalState,
  selectedIds: string[],
  initiativeMinimum: number,
  requestedDeployment: number,
): CapitalPlan {
  const initiativeFloor = finite(initiativeMinimum);
  const continuityAllocations = calculateContinuityAllocations(state, selectedIds);
  const maintenanceSpend = Object.values(continuityAllocations).reduce((total, amount) => total + amount, 0);
  const requiredCapital = initiativeFloor + maintenanceSpend;
  const totalReleased = Math.min(
    finite(state.campaignBudgetRemaining),
    finite(requestedDeployment),
  );
  const deliveryCapital = Math.max(0, totalReleased - maintenanceSpend);
  return {
    byInitiative: Object.fromEntries(Object.entries(state.initiativeStates || {}).map(([id, initiative]) => {
      const funding = fundingFor(state, id);
      if (!selectedIds.includes(id)) {
        const continuity = continuityAllocations[id] || 0;
        funding.delivery = 0;
        funding.continuity = continuity;
        funding.total = continuity;
      }
      return [id, funding];
    })),
    initiativeMinimum: initiativeFloor,
    maintenanceSpend,
    continuityAllocations,
    accelerationSpend: Math.max(0, totalReleased - requiredCapital),
    deliveryCapital,
    crisisResponseSpend: finite(state.quarterlyCrisisCost),
    requiredCapital,
    totalReleased,
    remainingAfterPlan: Math.max(0, finite(state.campaignBudgetRemaining) - totalReleased),
  };
}

export type CapitalRunway = {
  recommendedAuthority: number;
  recommendedReserve: number;
  depletionQuarter: number | null;
  message: string;
};

/** A deterministic, explanatory forecast. It does not modify simulation outcomes. */
export function calculateCapitalRunway(
  state: CapitalState,
  plannedDeployment: number,
): CapitalRunway {
  const capacity = deploymentCapacity(
    state.campaignBudget,
    state.campaignBudgetRemaining,
    state.quarterlyBudget,
    state.q,
    state.spent,
  );
  const pace = finite(plannedDeployment);
  const activeInitiatives = Object.values(state.initiativeStates || {})
    .filter((initiative) => finite(initiative?.quartersFunded) > 0)
    .map((initiative) => initiative.name)
    .slice(0, 2);
  if (pace <= 0) {
    return {
      recommendedAuthority: capacity.recommendedAuthority,
      recommendedReserve: capacity.recommendedReserve,
      depletionQuarter: null,
      message: activeInitiatives.length
        ? `No capital is planned. Reserve is preserved, but ${activeInitiatives.join(' and ')} will receive no continuation and may move into neglect.`
        : 'No capital is planned. Reserve is preserved; this is a deliberate observation quarter.',
    };
  }
  const quartersCovered = Math.ceil(capacity.campaignRemaining / pace);
  const depletionQuarter = state.q + quartersCovered - 1;
  return {
    recommendedAuthority: capacity.recommendedAuthority,
    recommendedReserve: capacity.recommendedReserve,
    depletionQuarter: depletionQuarter > 12 ? null : depletionQuarter,
    message: depletionQuarter > 12
      ? 'At this release pace, the campaign reserve covers the remaining transformation horizon.'
      : `At this release pace, the purse reaches zero around Q${depletionQuarter}. Future quarters would rely on observation only, and active capability may decay without continuation.`,
  };
}
