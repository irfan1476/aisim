import type { InitiativeFunding } from './businessModel';
import type { Allocation, InitiativeAllocationMode, InitiativeAllocationSet } from './state';

export const OPERATING_ALLOCATION_KEYS: (keyof Allocation)[] = ['infra', 'data', 'people', 'mlops', 'compliance', 'innovation'];

const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value: number, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value));
const round = (value: number) => Number(value.toFixed(2));

export function allocationTotal(allocation: Partial<Allocation> | undefined): number {
  return OPERATING_ALLOCATION_KEYS.reduce((sum, key) => sum + finite(allocation?.[key]), 0);
}

export function normalizeOperatingAllocation(value: unknown, fallback: Allocation): Allocation {
  const source = value && typeof value === 'object' ? value as Partial<Allocation> : {};
  return Object.fromEntries(OPERATING_ALLOCATION_KEYS.map((key) => [key, finite(source[key], fallback[key])])) as Allocation;
}

/**
 * Keep an initiative mix executable while the learner changes a single lever.
 * The selected lever retains the requested value; the other levers absorb the
 * difference within the same bounded 5–50% range used by the shared controls.
 */
export function rebalanceOperatingAllocation(current: Allocation, changed: keyof Allocation, value: number): Allocation {
  const next = Object.fromEntries(OPERATING_ALLOCATION_KEYS.map((key) => [key, Math.round(clamp(finite(current[key], 5), 5, 50))])) as Allocation;
  next[changed] = Math.round(clamp(finite(value, current[changed]), 5, 50));
  let difference = 100 - allocationTotal(next);
  const candidates = [...OPERATING_ALLOCATION_KEYS.filter((key) => key !== changed), changed];
  for (const key of candidates) {
    if (Math.abs(difference) < 0.001) break;
    const room = difference > 0 ? 50 - next[key] : next[key] - 5;
    const adjustment = Math.sign(difference) * Math.min(Math.abs(difference), Math.max(0, room));
    next[key] = Math.round(next[key] + adjustment);
    difference -= adjustment;
  }
  return next;
}

export function allocationForInitiative(
  id: string,
  mode: InitiativeAllocationMode,
  allocations: InitiativeAllocationSet | undefined,
  shared: Allocation,
): Allocation {
  return mode === 'custom' && allocations?.[id]
    ? normalizeOperatingAllocation(allocations[id], shared)
    : { ...shared };
}

export function seedInitiativeAllocations(
  ids: string[],
  existing: InitiativeAllocationSet | undefined,
  shared: Allocation,
): InitiativeAllocationSet {
  return Object.fromEntries(ids.map((id) => {
    const allocation = allocationForInitiative(id, 'custom', existing, shared);
    return [id, allocationTotal(allocation) === 100 ? allocation : rebalanceOperatingAllocation(allocation, 'infra', allocation.infra)];
  }));
}

/**
 * A tailored mix remains an organisation-wide resource decision. Its weighted
 * aggregate is the capacity envelope used for delivery, governance, and
 * oversight gates; an initiative with no charged work does not distort it.
 */
export function derivePortfolioAllocation(
  shared: Allocation,
  mode: InitiativeAllocationMode,
  allocations: InitiativeAllocationSet | undefined,
  fundingByInitiative: Record<string, InitiativeFunding> | undefined,
): Allocation {
  if (mode !== 'custom' || !fundingByInitiative) return { ...shared };
  const funded = Object.entries(fundingByInitiative)
    .map(([id, funding]) => ({ id, total: Math.max(0, finite(funding?.total)) }))
    .filter((item) => item.total > 0);
  const total = funded.reduce((sum, item) => sum + item.total, 0);
  if (!total) return { ...shared };
  const aggregate = Object.fromEntries(OPERATING_ALLOCATION_KEYS.map((key) => [key,
    round(funded.reduce((sum, item) => sum + allocationForInitiative(item.id, mode, allocations, shared)[key] * item.total, 0) / total),
  ])) as Allocation;
  // Preserve a truthful 100% display despite two-decimal rounding.
  const remainder = round(100 - allocationTotal(aggregate));
  if (remainder) aggregate.infra = round(aggregate.infra + remainder);
  return aggregate;
}
