import { getScenario } from './scenarios/registry';
import { averageFrameworkContribution } from './scenarios/framework';

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
type FrameworkResult<T extends Record<string, number>> = T & { overall: number; provenance: 'native' | 'scenario-native' };

function scenarioProgress(state: any, scenario: any, patterns: RegExp[]) {
  if (!scenario) return undefined;
  const definition = scenario.progress.find((item: any) => patterns.some((pattern) => pattern.test(`${item.key} ${item.label}`)));
  if (!definition) return undefined;
  const value = Number(state.scenarioState?.metrics?.[definition.key] ?? definition.start);
  const moved = definition.direction === 'higher-is-better' ? value - definition.start : definition.start - value;
  return Math.max(0, Math.min(100, (moved / Math.max(1, Math.abs(definition.target - definition.start))) * 100));
}

export function mckinseyRewired(metrics: any, scenario?: any): FrameworkResult<{ strategy: number; adoption: number; data: number; talent: number; operatingModel: number }> {
  if (scenario) {
    const values = {
      strategy: scenarioProgress(metrics, scenario, [/persistence|employability|trust|continuity|safety|resilience/i]) ?? 0,
      adoption: scenarioProgress(metrics, scenario, [/adoption|engagement|access/i]) ?? 0,
      data: scenarioProgress(metrics, scenario, [/data|fraud|quality|analytics/i]) ?? 0,
      talent: scenarioProgress(metrics, scenario, [/workload|burnout|faculty|workforce|satisfaction/i]) ?? 0,
      operatingModel: scenarioProgress(metrics, scenario, [/workflow|wait|approval|efficiency|governance|compliance/i]) ?? 0,
    };
    return { ...values, overall: Object.values(values).reduce((sum, value) => sum + value, 0) / 5, provenance: 'scenario-native' };
  }
  const capabilities = { strategy: Number(metrics.roi || 0), adoption: Number(metrics.adoption || 0), data: Number(metrics.data || 0), talent: Number(metrics.literacy || 0), operatingModel: Number(metrics.efficiency || 0) };
  return { ...capabilities, overall: Object.values(capabilities).reduce((a, b) => a + b, 0) / 5, provenance: 'native' };
}

export function pwcRai(metricsOrCompliance: any, satisfactionOrScenario: any, risk?: number, scenario?: any): FrameworkResult<{ governance: number; humanImpact: number; transparency: number; accountability: number }> {
  const scenarioContext = scenario || (satisfactionOrScenario?.progress ? satisfactionOrScenario : undefined);
  if (scenarioContext) {
    const state = metricsOrCompliance;
    const governance = scenarioProgress(state, scenarioContext, [/compliance|governance|privacy|trust|safety/i]) ?? 0;
    const humanImpact = scenarioProgress(state, scenarioContext, [/burnout|workload|satisfaction|engagement|access/i]) ?? 0;
    const transparency = scenarioProgress(state, scenarioContext, [/fraud|risk|approval|privacy|trust/i]) ?? 0;
    const accountability = (governance + transparency) / 2;
    return { governance, humanImpact, transparency, accountability, overall: (governance + humanImpact + transparency + accountability) / 4, provenance: 'scenario-native' };
  }
  const compliance = Number(metricsOrCompliance || 0);
  const satisfaction = Number(satisfactionOrScenario || 0);
  const values = { governance: compliance, humanImpact: satisfaction, transparency: 100 - Number(risk || 0), accountability: (compliance + 100 - Number(risk || 0)) / 2 };
  return { ...values, overall: Object.values(values).reduce((a, b) => a + b, 0) / 4, provenance: 'native' };
}

export interface BCGAlignment { score: number; dimensions: { peopleChange: number; processWorkflow: number; techData: number; algorithmModel: number }; insights: string[]; recommendations: string[]; }

export function calculateBCGAlignment(state: any, initiatives: any[] = []): BCGAlignment {
  const selectedIds = Array.from(new Set([
    ...(state.selected || []),
    ...(state.history || []).flatMap((entry: any) => entry.selectedIds || []),
  ]));
  const selected = selectedIds.map((id: string) => state.initiativeStates?.[id] || initiatives.find(item => item.id === id)).filter(Boolean);
  const authoredContribution = averageFrameworkContribution(selected);
  const peopleBudget = Number(state.alloc?.people ?? 0);
  let peopleChange = Math.min(80, peopleBudget * 2) + (peopleBudget > 20 ? 10 : 0);
  const averageHumanCapability = selected.length
    ? selected.reduce((sum, item) => sum + Number(item.currentHuman ?? item.human ?? 0), 0) / selected.length
    : 0;
  peopleChange += Math.min(20, averageHumanCapability * 3);
  if (Number(state.alloc?.compliance ?? 0) > 12) peopleChange += 10;
  if (Number(state.adoption ?? 0) > 60) peopleChange += 10;
  const processWorkflow = Math.min(100, (selected.filter(item => /workflow|process|operations|service|throughput|planning|capacity/i.test(`${item.impact || ''} ${item.desc || ''}`)).length / Math.max(1, selected.length)) * 100 + (Number(state.alloc?.innovation ?? 0) > 10 ? 10 : 0));
  const techData = Math.min(100, ((Number(state.alloc?.infra ?? 0) + Number(state.alloc?.data ?? 0)) / 80) * 100 + (Number(state.alloc?.mlops ?? 0) > 15 ? 10 : 0) + (Number(state.data ?? 0) > 70 ? 10 : 0));
  const avgROI = selected.length ? selected.reduce((sum, item) => sum + Number(item.roi || 0), 0) / selected.length : Number(state.roi || 0);
  const algorithmModel = Math.min(100, Math.max(0, avgROI / 2));
  const dimensions = authoredContribution
    ? { peopleChange: authoredContribution.peopleChange, processWorkflow: authoredContribution.processWorkflow, techData: authoredContribution.techData, algorithmModel: authoredContribution.algorithmModel }
    : { peopleChange: Math.min(100, Math.max(0, peopleChange)), processWorkflow, techData, algorithmModel };
  const score = Math.round(dimensions.peopleChange * .4 + dimensions.processWorkflow * .3 + dimensions.techData * .2 + dimensions.algorithmModel * .1);
  const insights: string[] = []; const recommendations: string[] = [];
  if (dimensions.peopleChange < 50) { insights.push('People and change investment is below the value-realization threshold.'); recommendations.push('Increase people enablement, training, and role redesign.'); }
  if (dimensions.processWorkflow < 50) { insights.push('Process redesign is weak; AI is not yet embedded in core workflows.'); recommendations.push('Choose initiatives that change operating workflows, not only add tools.'); }
  if (dimensions.techData < 50) { insights.push('Technology and data foundations may constrain scale.'); recommendations.push('Strengthen data engineering and MLOps before scaling.'); }
  if (!insights.length) insights.push('Your portfolio is aligned across people, process, technology, and model capability.');
  return { score, dimensions, insights, recommendations };
}

export interface TransformationKPIs {
  provenance: 'modelled' | 'mixed';
  scenarioOutcomes: { key: string; label: string; unit: string; current: number; target: number; progress: number; direction: 'higher-is-better' | 'lower-is-better' }[];
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
    provenance: state.scenarioMode ? 'mixed' : 'modelled',
    scenarioOutcomes: (() => {
      const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
      if (!scenario) return [];
      const scenarioMetrics = state.scenarioState?.metrics || {};
      return scenario.progress.map((definition) => ({
        key: definition.key,
        label: definition.label,
        unit: definition.unit,
        current: Number(scenarioMetrics[definition.key] ?? definition.start),
        target: definition.target,
        direction: definition.direction,
        progress: Number(state.scenarioState?.progress?.[definition.key] ?? 0),
      }));
    })(),
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

/**
 * Scenario-only forecast. It projects each domain metric from its recorded
 * momentum and target gap, with a small funding signal from the active
 * initiative's authored primary metric. It is deliberately labelled as a
 * directional model in the UI; it is never presented as measured telemetry.
 */
export function scenarioForecast(state: any, quarters = 3) {
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  if (!scenario) return [];
  const metrics = scenario.progress;
  const history = state.history || [];
  const initiatives = Object.values(state.initiativeStates || {}) as any[];
  const selected = new Set(state.selected || []);
  return Array.from({ length: quarters }, (_, index) => {
    const values = Object.fromEntries(metrics.map((definition) => {
      const series = history.map((entry: any) => Number(entry.scenarioState?.metrics?.[definition.key] ?? definition.start));
      const previous = series.at(-1) ?? Number(state.scenarioState?.metrics?.[definition.key] ?? definition.start);
      const before = series.at(-2) ?? definition.start;
      const momentum = previous - before;
      const relevantFunding = initiatives.filter((item) => selected.has(item.id) && item.scenarioMetadata?.primaryMetric === definition.key).length;
      const fundingSignal = relevantFunding ? Math.sign(definition.target - previous) * Math.min(1.5, relevantFunding * 0.75) : 0;
      const targetPull = (definition.target - previous) * 0.12;
      const next = previous + momentum * 0.35 + targetPull + fundingSignal;
      return [definition.key, Math.max(definition.min, Math.min(definition.max, next))];
    }));
    return { quarter: state.q + index + 1, values };
  });
}
