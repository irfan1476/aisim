import type { InitiativeFunding } from './businessModel';
import type { Allocation, InitiativeAllocationMode, InitiativeAllocationSet } from './state';

export const OPERATING_ALLOCATION_KEYS: (keyof Allocation)[] = ['infra', 'data', 'people', 'mlops', 'compliance', 'innovation'];

const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value: number, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value));
const round = (value: number) => Number(value.toFixed(2));

export function allocationTotal(allocation: Partial<Allocation> | undefined): number {
  return Number(OPERATING_ALLOCATION_KEYS.reduce((sum, key) => sum + finite(allocation?.[key]), 0).toFixed(2));
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
  const requested = Math.round(clamp(finite(value, current[changed]), 5, 50));
  const previous = next[changed];
  next[changed] = requested;
  let difference = previous - requested;
  const candidates = OPERATING_ALLOCATION_KEYS.filter((key) => key !== changed);
  const rooms = candidates.map((key) => ({
    key,
    room: difference < 0 ? next[key] - 5 : 50 - next[key],
  }));
  const totalRoom = rooms.reduce((sum, item) => sum + Math.max(0, item.room), 0);
  if (totalRoom > 0 && difference !== 0) {
    const magnitude = Math.min(Math.abs(difference), totalRoom);
    const sign = Math.sign(difference);
    const allocations = rooms.map((item) => {
      const exact = magnitude * Math.max(0, item.room) / totalRoom;
      const whole = Math.min(Math.floor(exact), Math.max(0, item.room));
      return { ...item, exact, adjustment: whole };
    });
    let remainder = magnitude - allocations.reduce((sum, item) => sum + item.adjustment, 0);
    allocations
      .sort((a, b) => (b.exact - b.adjustment) - (a.exact - a.adjustment))
      .forEach((item) => {
        if (remainder <= 0 || item.adjustment >= item.room) return;
        item.adjustment += 1;
        remainder -= 1;
      });
    allocations.forEach((item) => {
      next[item.key] = Math.round(next[item.key] - sign * item.adjustment);
    });
  }
  // Defensive correction for malformed/legacy mixes and rounding drift.
  let remainder = 100 - allocationTotal(next);
  for (const key of candidates) {
    if (!remainder) break;
    const room = remainder > 0 ? 50 - next[key] : next[key] - 5;
    const adjustment = Math.sign(remainder) * Math.min(Math.abs(remainder), Math.max(0, room));
    next[key] = Math.round(next[key] + adjustment);
    remainder -= adjustment;
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
  // Correct tiny rounding drift only when every contributing initiative is
  // already balanced. An incomplete learner mix must remain visible and must
  // be rejected by the quarter confirmation gate.
  if (funded.every((item) => allocationTotal(allocationForInitiative(item.id, mode, allocations, shared)) === 100)) {
    const remainder = round(100 - allocationTotal(aggregate));
    if (remainder) aggregate.infra = round(aggregate.infra + remainder);
  }
  return aggregate;
}
