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

export function bcgCompliance(people: number, infra: number, data: number) {
  const total = Math.max(1, people + infra + data);
  const peopleShare = people / total;
  const techShare = (infra + data) / total;
  const processShare = Math.max(0, 1 - peopleShare - techShare);
  return { people: peopleShare, tech: techShare, process: processShare, compliant: peopleShare >= 0.6, score: peopleShare >= 0.7 ? 5 : peopleShare >= 0.6 ? 3 : 0, insight: peopleShare >= 0.6 ? 'People investment is supporting value realization.' : 'Increase people enablement before scaling ambition.' };
}
export function mckinseyRewired(metrics: any) { const capabilities = { strategy: metrics.roi, adoption: metrics.adoption, data: metrics.data, talent: metrics.literacy, operatingModel: metrics.efficiency }; return { ...capabilities, overall: Object.values(capabilities).reduce((a: number, b: any) => a + Number(b || 0), 0) / Object.keys(capabilities).length }; }
export function pwcRai(compliance: number, satisfaction: number, risk: number) { const values = { governance: compliance, humanImpact: satisfaction, transparency: 100 - risk, accountability: (compliance + 100 - risk) / 2 }; return { ...values, overall: Object.values(values).reduce((a: number, b: any) => a + Number(b || 0), 0) / Object.keys(values).length }; }
