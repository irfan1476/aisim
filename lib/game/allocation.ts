import type { Allocation } from './state';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const readiness = (value: number) => Math.max(0.3, clamp(value));

/** Converts the existing percentage allocations into bounded scenario readiness. */
export function allocationToReadiness(allocation: Allocation) {
  return {
    data: readiness(Number(allocation.data || 0) / 30),
    people: readiness(Number(allocation.people || 0) / 25),
    governance: readiness(Number(allocation.compliance || 0) / 20),
    technical: readiness((Number(allocation.infra || 0) + Number(allocation.mlops || 0)) / 55),
  };
}
