import { deploymentCapacity, type GameState } from './state';

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
  initiativeMinimum: number;
  maintenanceSpend: number;
  continuityAllocations: Record<string, number>;
  accelerationSpend: number;
  deliveryCapital: number;
  crisisResponseSpend: number;
  requiredCapital: number;
  totalReleased: number;
  remainingAfterPlan: number;
};

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
