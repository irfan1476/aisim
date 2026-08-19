export type Trend = 'up' | 'down' | 'stable';

export function trend(current: number, previous: number): Trend {
  if (current - previous > 1) return 'up';
  if (current - previous < -1) return 'down';
  return 'stable';
}

export function trafficLight(value: number, benchmark: number): 'green' | 'yellow' | 'red' {
  const ratio = benchmark === 0 ? 1 : value / benchmark;
  if (ratio >= 0.9) return 'green';
  if (ratio >= 0.7) return 'yellow';
  return 'red';
}

export function humanCapitalIndex(metrics: { adoption: number; satisfaction: number; literacy: number; peopleBudget: number }) {
  return Math.round((metrics.adoption * 0.35 + metrics.satisfaction * 0.25 + metrics.literacy * 0.25 + Math.min(metrics.peopleBudget * 4, 100) * 0.15) * 10) / 10;
}
