import type { Allocation } from './state';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Converts the existing percentage allocations into bounded scenario readiness. */
export function allocationToReadiness(allocation: Allocation) {
  return {
    data: clamp(Number(allocation.data || 0) / 30),
    people: clamp(Number(allocation.people || 0) / 25),
    governance: clamp(Number(allocation.compliance || 0) / 20),
    technical: clamp((Number(allocation.infra || 0) + Number(allocation.mlops || 0)) / 55),
  };
}
