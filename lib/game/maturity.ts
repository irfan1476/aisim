import type { MaturityLevel } from './initiativeState';

export function maturityMultiplier(level: MaturityLevel): number {
  return { nascent: 0.72, developing: 0.9, mature: 1, optimized: 1.08 }[level];
}

export function maturityReadiness(level: MaturityLevel): number {
  return { nascent: 0.35, developing: 0.6, mature: 0.82, optimized: 1 }[level];
}
