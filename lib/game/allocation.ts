import type { Allocation } from './state';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
/**
 * Allocation readiness is deliberately allowed to reach zero.  A readiness
 * signal is an input to delivery gates, not a promise that every initiative
 * has a 30% capability floor before the learner has invested in it.
 */
const readiness = (value: number) => clamp(value);

/** Converts the existing percentage allocations into bounded scenario readiness. */
export function allocationToReadiness(allocation: Allocation) {
  return {
    data: readiness(Number(allocation.data || 0) / 30),
    people: readiness(Number(allocation.people || 0) / 25),
    governance: readiness(Number(allocation.compliance || 0) / 20),
    technical: readiness((Number(allocation.infra || 0) + Number(allocation.mlops || 0)) / 55),
  };
}
