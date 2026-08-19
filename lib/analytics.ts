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

export interface TransformationKPIs {
  timeToValue: { quartersToROI: number[]; average: number; trend: Trend; benchmark: number };
  adoption: { currentRate: number; trend: Trend; activationRate: number; activeUsage: number; departmentBreakdown: Record<string, number> };
  decisionAccuracy: { current: number; baseline: number; improvement: number; errorCostAvoided: number };
  capacity: { hoursSaved: number; tasksAutomated: number; workloadShift: number; FTEEquivalent: number };
  deploymentSpeed: { averageWeeks: number; trend: Trend; phases: Record<string, number> };
  overrideMetrics: { rate: number; trend: Trend; topInitiatives: { name: string; overrideRate: number }[]; insight: string };
  financial: { estimatedRevenue: number; estimatedCostSavings: number; estimatedRiskAvoidance: number; totalValue: number };
  security: { incidentsThisQuarter: number; totalIncidents: number; preventionRate: number; riskScore: 'low' | 'medium' | 'high' };
  workflowPenetration: { percentage: number; workflowsEmbedded: number; totalWorkflows: number; trend: Trend };
  scaleLeverage: { marginalBenefitPerUser: number; marginalCostPerUser: number; benefitCostRatio: number; currentScale: number };
}

export function calculateTransformationKPIs(state: any, initiatives: any[]): TransformationKPIs {
  const history = state.history || [];
  const metric = (key: string) => history.map((entry: any) => Number(entry.metrics?.[key] ?? entry[key] ?? 0));
  const roi = metric('roi');
  const adoptionHistory = metric('adoption');
  const current = (key: string) => Number(state[key] || 0);
  const firstPositive = roi.findIndex((value: number) => value > 0);
  const last = (values: number[]) => values[values.length - 1] ?? 0;
  const previous = (values: number[]) => values[values.length - 2] ?? last(values);
  const adoption = current('adoption');
  const compliance = current('compliance');
  const risk = current('risk');
  const overrideRate = Math.max(5, Math.min(60, 40 - adoption * 0.3 - current('data') * 0.2));
  const securityRisk = Math.max(10, Math.min(80, 40 + (100 - compliance) * 0.2));
  const hoursSaved = Math.round(adoption * 0.15 * 40 * Math.max(1, history.length * 4));
  const phases = Math.max(2, 4 - Math.floor(history.length / 3));
  return {
    timeToValue: { quartersToROI: roi, average: firstPositive < 0 ? 0 : firstPositive + 1, trend: trend(last(roi), previous(roi)), benchmark: 3 },
    adoption: { currentRate: adoption, trend: trend(last(adoptionHistory), previous(adoptionHistory)), activationRate: Math.min(100, adoption * 1.2), activeUsage: Math.min(100, adoption * 0.8), departmentBreakdown: { Operations: Math.min(100, adoption * 1.1), Engineering: Math.min(100, adoption * 1.2), Finance: Math.min(100, adoption * 0.8), HR: Math.min(100, adoption * 0.6) } },
    decisionAccuracy: (() => { const baseline = 75; const accuracy = Math.min(98, baseline + adoption * .15 + current('data') * .1); return { current: accuracy, baseline, improvement: accuracy - baseline, errorCostAvoided: Math.round((accuracy - baseline) / 100 * 1000000) }; })(),
    capacity: { hoursSaved, tasksAutomated: Math.round(adoption * .02), workloadShift: Math.min(40, adoption * .15), FTEEquivalent: Math.round(hoursSaved / 160) },
    deploymentSpeed: { averageWeeks: Math.max(4, 12 - history.length * .5), trend: trend(12 - history.length * .5, 12 - Math.max(0, history.length - 1) * .5), phases: { discovery: 2, prototype: phases, pilot: phases, scale: phases } },
    overrideMetrics: { rate: overrideRate, trend: trend(overrideRate, Math.min(60, overrideRate + 2)), topInitiatives: (state.selected || []).slice(0, 3).map((id: string, index: number) => ({ name: initiatives.find(item => item.id === id)?.name || id, overrideRate: Math.max(5, Math.round(overrideRate + index * 3)) })), insight: overrideRate < 30 ? 'Trust is building. AI recommendations are being adopted.' : 'High override rate. Increase trust calibration and enablement.' },
    financial: { estimatedRevenue: Math.round(current('roi') * 10000), estimatedCostSavings: Math.round(current('efficiency') * 5000), estimatedRiskAvoidance: Math.round(risk * 2000), totalValue: Math.round(current('roi') * 10000 + current('efficiency') * 5000 + risk * 2000) },
    security: { incidentsThisQuarter: securityRisk > 60 ? 1 : 0, totalIncidents: Math.max(0, Math.floor((100 - compliance) / 20)), preventionRate: Math.min(95, compliance * .4 + 30), riskScore: securityRisk > 60 ? 'high' : securityRisk > 40 ? 'medium' : 'low' },
    workflowPenetration: { percentage: Math.min(80, adoption * .6 + (current('q') / 12) * 20), workflowsEmbedded: Math.max(1, Math.floor(adoption / 15) + 1), totalWorkflows: 6, trend: trend(last(adoptionHistory), previous(adoptionHistory)) },
    scaleLeverage: (() => { const benefit = current('roi') * .5; const cost = 100 + current('q') * 5; return { marginalBenefitPerUser: Math.round(benefit), marginalCostPerUser: Math.round(cost), benefitCostRatio: Math.round(benefit / cost * 10) / 10, currentScale: Math.min(100, adoption * .7 + current('q') / 12 * 30) }; })(),
  };
}
