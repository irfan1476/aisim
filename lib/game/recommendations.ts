import type { Allocation, GameState, Recommendation } from './state';
import { getScenario } from '../scenarios/registry';

function initiativeIdsForMetric(state: GameState, metric?: string): string[] {
  const exact = Object.values(state.initiativeStates || {})
    .filter((item) => item.scenarioMetadata?.primaryMetric === metric)
    .map((item) => item.id);
  if (exact.length) return exact;
  const key = String(metric || '').toLowerCase();
  const keywordMap: Record<string, string[]> = {
    risk: ['quality', 'supply', 'maintenance', 'fraudDetection', 'regulatoryCompliance'],
    compliance: ['quality', 'supply', 'regulatoryCompliance'],
    data: ['demand', 'maintenance', 'fraudDetection', 'learningAnalytics'],
    adoption: ['knowledge', 'customerService', 'patientVirtualAssistant', 'facultyCopilot'],
    workforce: ['knowledge', 'workforcePlanning', 'facultyCopilot'],
    downtime: ['maintenance'],
    defect: ['quality'],
    fraud: ['fraudDetection'],
    credit: ['creditRiskAssessment'],
    wait: ['appointmentScheduling'],
    patient: ['patientVirtualAssistant', 'radiologyAssistant'],
    student: ['studentSuccessPredictor', 'studentSupportChatbot'],
  };
  const wanted = Object.entries(keywordMap).filter(([word]) => key.includes(word)).flatMap(([, ids]) => ids);
  return wanted.filter((id) => Boolean(state.initiativeStates?.[id]));
}

function targetsForMetric(metric?: string): Partial<Allocation> {
  const key = String(metric || '').toLowerCase();
  if (key.includes('risk') || key.includes('compliance') || key.includes('fraud')) return { compliance: 20, data: 25, people: 15 };
  if (key.includes('adoption') || key.includes('workforce') || key.includes('patient') || key.includes('student')) return { people: 25, data: 20, compliance: 10 };
  if (key.includes('data') || key.includes('credit') || key.includes('forecast')) return { data: 35, mlops: 15, people: 15 };
  return { data: 25, people: 20, compliance: 15 };
}

function actionData(state: GameState, metric?: string, preferred: string[] = []): Pick<Recommendation, 'initiativeIds' | 'preferredInitiativeIds' | 'deploymentAmount' | 'operatingAllocationTargets'> {
  const initiativeIds = initiativeIdsForMetric(state, metric);
  const preferredInitiativeIds = preferred.filter((id) => Boolean(state.initiativeStates?.[id]));
  const chosen = preferredInitiativeIds.length ? preferredInitiativeIds : initiativeIds;
  const cost = chosen.slice(0, 3).reduce((sum, id) => sum + Number(state.initiativeStates[id]?.baseCost ?? state.initiativeStates[id]?.cost ?? 0), 0);
  const cap = Number(state.quarterlyDeploymentCap || state.quarterlyBudget || 0);
  const amount = Math.min(cap, Math.max(Number(state.quarterlyBudget || 0), cost));
  return { initiativeIds: initiativeIds.slice(0, 3), preferredInitiativeIds: preferredInitiativeIds.slice(0, 3), deploymentAmount: Number.isFinite(amount) ? Number(amount.toFixed(2)) : undefined, operatingAllocationTargets: targetsForMetric(metric) };
}

function recommendation(state: GameState, value: Omit<Recommendation, 'initiativeIds' | 'preferredInitiativeIds' | 'deploymentAmount' | 'operatingAllocationTargets'> & { metricKey?: string; preferred?: string[] }): Recommendation {
  const { metricKey, preferred, ...base } = value;
  return { ...base, ...actionData(state, metricKey, preferred) };
}

export function generateProactiveRecommendations(state: GameState): Recommendation[] {
  const recs: Recommendation[] = [];
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  if (scenario) {
    const weakest = scenario.progress
      .map((definition) => ({ definition, value: Number(state.scenarioState?.metrics?.[definition.key] ?? definition.start), progress: Number(state.scenarioState?.progress?.[definition.key] ?? 0) }))
      .sort((a, b) => a.progress - b.progress)[0];
    if (weakest && weakest.progress < 45) {
      recs.push(recommendation(state, { priority: weakest.progress < 25 ? 'high' : 'medium', title: `${weakest.definition.label} remains behind target`, message: `${weakest.definition.label} is ${weakest.progress.toFixed(0)}% toward its scenario target. Review the initiatives and allocation that influence this outcome.`, action: `Prioritise ${weakest.definition.label.toLowerCase()} before scaling`, metric: `${weakest.value.toFixed(1)} ${weakest.definition.unit} versus target ${weakest.definition.target}`, metricKey: weakest.definition.key }));
    }
  }
  if (state.alloc.people < 15) recs.push(recommendation(state, { priority: 'high', title: 'People Allocation Alert', message: 'People investment is below the simulation’s value-realization threshold.', action: 'Review people allocation', metric: 'Adoption risk is rising', metricKey: 'adoption' }));
  if (state.data < 50 && state.selected.includes('maintenance')) recs.push(recommendation(state, { priority: 'medium', title: 'Data Readiness Gap', message: 'Predictive maintenance needs stronger data foundations.', action: 'Review data engineering investment', metric: 'Projected ROI may soften', metricKey: 'data', preferred: ['maintenance', 'demand'] }));
  if (state.risk > 35) recs.push(recommendation(state, { priority: 'high', title: 'Risk Exposure Warning', message: 'Risk exposure is high enough to trigger governance scrutiny.', action: 'Increase compliance budget', metric: 'Risk reduction potential', metricKey: 'risk' }));
  if (state.adoption < 45 && state.alloc.people >= 15) recs.push(recommendation(state, { priority: 'medium', title: 'Adoption Lag Detected', message: 'Adoption is below the expected change-management curve.', action: 'Increase training investment', metric: 'Adoption potential', metricKey: 'adoption' }));
  if (state.selected.length === 3 && state.alloc.people >= 15 && state.alloc.compliance >= 10) recs.push(recommendation(state, { priority: 'low', title: 'Balanced Portfolio', message: 'Your current portfolio funds both value and the operating system around it.', action: 'Maintain course', metric: 'Steady growth predicted', metricKey: 'adoption', preferred: state.selected }));
  return recs;
}
