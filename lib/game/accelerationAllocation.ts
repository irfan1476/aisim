/** Learner-controlled routing of capital released above the action floor. */
export type AccelerationAllocationMode = 'proportional' | 'focused';
export type AccelerationAllocationSet = Record<string, number>;

const finite = (value: unknown) => Math.max(0, Number(value) || 0);
const round = (value: number) => Number(value.toFixed(2));

/** Return a valid 100% split, preserving explicit learner choices. */
export function normalizeAccelerationAllocations(
  ids: string[],
  value?: AccelerationAllocationSet,
  weights?: Record<string, number>,
): AccelerationAllocationSet {
  const unique = Array.from(new Set(ids));
  if (!unique.length) return {};
  const requested = unique.map((id) => Math.max(0, finite(value?.[id])));
  const requestedTotal = requested.reduce((sum, item) => sum + item, 0);
  const source = requestedTotal > 0 ? requested : unique.map((id) => Math.max(0, finite(weights?.[id]), 1));
  const total = source.reduce((sum, item) => sum + item, 0) || unique.length;
  const result = Object.fromEntries(unique.map((id, index) => [id, round(source[index] * 100 / total)]));
  const drift = round(100 - Object.values(result).reduce((sum, item) => sum + item, 0));
  if (unique[0]) result[unique[0]] = round(result[unique[0]] + drift);
  return result;
}

export function accelerationAllocationTotal(value?: AccelerationAllocationSet): number {
  return round(Object.values(value || {}).reduce((sum, item) => sum + finite(item), 0));
}

export function accelerationAllocationFor(id: string, ids: string[], mode: AccelerationAllocationMode | undefined, value?: AccelerationAllocationSet, weights?: Record<string, number>): number {
  return normalizeAccelerationAllocations(ids, mode === 'focused' ? value : undefined, weights)[id] || 0;
}
