import type { ScenarioDefinition, ScenarioInitiative } from './types';
import { synergy } from './scenarioHelpers';

const initiatives: ScenarioInitiative[] = [
  { id: 'maintenance', name: 'Predictive Maintenance', desc: 'Predict component failures weeks in advance.', cost: 2.8, roi: 187, risk: 'MED', data: 4, human: 3, impact: 'Cuts downtime and extends asset life.', baseEffect: -3, primaryMetric: 'downtimePressure', effectUnit: 'index points', frameworkContribution: { peopleChange: 65, processWorkflow: 85, techData: 85, algorithmModel: 75 }, lifecycleProfile: { dataReadiness: 78, evaluation: { criteria: [{ id: 'downtime-signal', label: 'Reduce unplanned downtime pressure', metric: 'downtimePressure', threshold: -2, direction: 'lower-is-better' }, { id: 'technician-usefulness', label: 'Give technicians a useful alert lead time', metric: 'technicianWorkflowUsefulness', threshold: 60, direction: 'higher-is-better' }], goThreshold: 0.7 }, deployment: { defaultMode: 'augmentation', modes: { augmentation: { efficiencyDelta: 7, riskDelta: -5, trustDelta: 4, oversightUnits: 2 }, automation: { efficiencyDelta: 16, riskDelta: 9, trustDelta: -3, oversightUnits: 3 } } }, risks: { model: 46, operational: 55, legal: 28 }, drift: { susceptibility: 42, quarterlyRate: 3, degradationThreshold: 55, monitoringRequired: true }, oversight: { baseUnits: 2, automationUnits: 3 }, autonomy: 'semi_autonomous', autonomyBoundaries: 'The model may recommend maintenance windows; plant engineering retains final work-order authority.', flywheel: { active: true, quality: 82, recipientIds: ['quality', 'energy'] } }, provisional: true },
  { id: 'quality', name: 'AI Visual Quality', desc: 'Detect defects in real time on the line.', cost: 2.1, roi: 164, risk: 'LOW', data: 3, human: 2, impact: 'Improves first-pass yield and OEM trust.', baseEffect: -40, primaryMetric: 'defectRate', effectUnit: 'PPM', frameworkContribution: { peopleChange: 55, processWorkflow: 80, techData: 80, algorithmModel: 85 }, provisional: true },
  { id: 'demand', name: 'Demand Forecasting', desc: 'Align raw stock with OEM pull schedules.', cost: 1.5, roi: 142, risk: 'LOW', data: 5, human: 4, impact: 'Reduces inventory volatility.', baseEffect: 3, primaryMetric: 'supplyContinuity', effectUnit: 'percentage points', frameworkContribution: { peopleChange: 60, processWorkflow: 85, techData: 90, algorithmModel: 80 }, provisional: true },
  { id: 'energy', name: 'Energy Optimization', desc: 'Use AI to offset rising energy costs.', cost: 1.8, roi: 156, risk: 'LOW', data: 3, human: 3, impact: 'Improves efficiency across five plants.', baseEffect: -2, primaryMetric: 'energyPressure', effectUnit: 'index points', frameworkContribution: { peopleChange: 50, processWorkflow: 80, techData: 85, algorithmModel: 75 }, provisional: true },
  { id: 'knowledge', name: 'AI Knowledge Assistant', desc: 'Capture IP from retiring technicians.', cost: 1.2, roi: 198, risk: 'HIGH', data: 2, human: 5, impact: 'Builds resilience and workforce confidence.', baseEffect: 4, primaryMetric: 'workforceResilience', effectUnit: 'index points', frameworkContribution: { peopleChange: 95, processWorkflow: 70, techData: 60, algorithmModel: 70 }, lifecycleProfile: { dataReadiness: 42, evaluation: { criteria: [{ id: 'knowledge-grounding', label: 'Ground answers in approved plant procedures', metric: 'knowledgeGrounding', threshold: 75, direction: 'higher-is-better' }, { id: 'frontline-confidence', label: 'Improve frontline confidence', metric: 'workforceResilience', threshold: 3, direction: 'higher-is-better' }], goThreshold: 0.7 }, deployment: { defaultMode: 'augmentation', modes: { augmentation: { efficiencyDelta: 5, riskDelta: -6, trustDelta: 6, oversightUnits: 2 }, automation: { efficiencyDelta: 9, riskDelta: 14, trustDelta: -8, oversightUnits: 4 } } }, risks: { model: 70, operational: 48, legal: 62 }, drift: { susceptibility: 68, quarterlyRate: 5, degradationThreshold: 60, monitoringRequired: true }, oversight: { baseUnits: 2, automationUnits: 4 }, autonomy: 'advisory', autonomyBoundaries: 'The assistant can retrieve and draft; technicians validate procedures and no safety instruction is executed automatically.', flywheel: { active: true, quality: 76, recipientIds: ['maintenance', 'supply'] } }, provisional: true },
  { id: 'supply', name: 'Supply Chain Risk', desc: 'Flag supplier delivery issues early.', cost: 2.3, roi: 134, risk: 'MED', data: 4, human: 3, impact: 'Protects tier-one OEM commitments.', baseEffect: 4, primaryMetric: 'supplyContinuity', effectUnit: 'percentage points', frameworkContribution: { peopleChange: 60, processWorkflow: 90, techData: 85, algorithmModel: 80 }, provisional: true },
];

export const projectFactory: ScenarioDefinition = {
  id: 'projectFactory',
  name: 'Project Factory 2030',
  industry: 'Automotive manufacturing',
  icon: '🏭',
  description: 'Lead the AI transformation of a high-volume automotive component manufacturer.',
  difficulty: 'intermediate',
  company: {
    name: 'Project Factory 2030', revenue: '₹2,500 Cr', employees: '7,000', locations: '5 plants',
    description: 'A 24×7 manufacturer balancing uptime, quality, energy costs, and workforce resilience.',
  },
  challenges: [
    { id: 'downtime', label: 'Equipment Downtime', severity: '+12%', metric: 'downtimePressure', direction: 'lower-is-better', description: 'Unplanned downtime is putting pressure on production reliability.' },
    { id: 'scrap', label: 'Scrap & Defect Rates', severity: '+8%', metric: 'defectRate', direction: 'lower-is-better', description: 'Quality variation is increasing rework and reducing realised value.' },
    { id: 'energy', label: 'Energy Costs', severity: '+15%', metric: 'energyPressure', direction: 'lower-is-better', description: 'Energy pressure is making efficiency improvements more valuable.' },
    { id: 'talent', label: 'Workforce Risk', severity: 'Retiring technicians', metric: 'workforceResilience', direction: 'higher-is-better', description: 'Critical operating knowledge is leaving with retiring technicians.' },
  ],
  startingState: {
    budget: 5,
    defaultAllocation: { infra: 40, data: 20, people: 15, mlops: 10, compliance: 10, innovation: 5 },
    startingMetrics: { efficiency: 20, satisfaction: 40, adoption: 38, data: 54, downtimePressure: 65, defectRate: 500, energyPressure: 70, workforceResilience: 55, supplyContinuity: 65 },
  },
  progress: [
    { key: 'downtimePressure', label: 'Downtime pressure', unit: 'index', start: 65, target: 35, min: 0, max: 100, direction: 'lower-is-better' },
    { key: 'defectRate', label: 'Defect rate', unit: 'PPM', start: 500, target: 200, min: 0, max: 1000, direction: 'lower-is-better' },
    { key: 'energyPressure', label: 'Energy pressure', unit: 'index', start: 70, target: 40, min: 0, max: 100, direction: 'lower-is-better' },
    { key: 'workforceResilience', label: 'Workforce resilience', unit: 'index', start: 55, target: 85, min: 0, max: 100, direction: 'higher-is-better' },
    { key: 'supplyContinuity', label: 'Supply continuity', unit: '% on time', start: 65, target: 85, min: 0, max: 100, direction: 'higher-is-better' },
  ],
  initiatives,
  synergies: [
    synergy({ key: 'demand:supply', initiativeIds: ['demand', 'supply'], label: 'End-to-end planning', description: 'Demand signals and supplier warnings reinforce a more reliable production plan.', roiBoost: 0.07, riskReduction: 1.5, adoptionBoost: 1, costReduction: 0.02 }),
    synergy({ key: 'knowledge:maintenance', initiativeIds: ['knowledge', 'maintenance'], label: 'Learning maintenance loop', description: 'Technician knowledge helps predictive maintenance move from a model into frontline practice.', roiBoost: 0.05, riskReduction: 1, adoptionBoost: 2, costReduction: 0.02 }),
    synergy({ key: 'maintenance:quality', initiativeIds: ['maintenance', 'quality'], label: 'Asset-quality signal', description: 'Asset health and defect signals reinforce the same operating improvement cycle.', roiBoost: 0.08, riskReduction: 1.5, adoptionBoost: 1, costReduction: 0.03 }),
    synergy({ key: 'energy:maintenance', initiativeIds: ['energy', 'maintenance'], label: 'Efficient uptime', description: 'Energy telemetry and maintenance timing reduce delivery friction together.', roiBoost: 0.06, riskReduction: 1, adoptionBoost: 0, costReduction: 0.02 }),
  ],
  crises: [
    { title: 'A critical production line fails unexpectedly.', type: 'EQUIPMENT FAILURE', text: 'One of the oldest production lines has stopped. The board wants a response that protects uptime without creating a larger operating risk.', options: [
      { label: 'Emergency maintenance', description: 'Restore the line quickly, accepting a short-term risk increase.', cost: 0.5, impacts: { efficiency: -10, risk: 5 } },
      { label: 'Accelerate predictive maintenance', description: 'Invest in a faster rollout to build a durable response.', cost: 1.2, impacts: { efficiency: 15, risk: -5 } },
      { label: 'Temporary workaround', description: 'Protect continuity while deferring the larger decision.', cost: 0.3, impacts: { efficiency: -5, satisfaction: -5 } },
    ] },
    { title: 'Quality variation is creating avoidable rework.', type: 'QUALITY PRESSURE', text: 'Scrap and defect rates are rising on a key line. The plant manager wants evidence that AI investment will improve first-pass yield.', options: [
      { label: 'Scale visual quality', description: 'Prioritise a focused quality intervention.', cost: 0.8, impacts: { efficiency: 8, roi: 3, data: 2 } },
      { label: 'Strengthen the data foundation', description: 'Improve traceability before scaling the model.', cost: 0.5, impacts: { data: 5, risk: -4 } },
      { label: 'Hold the current roadmap', description: 'Protect delivery focus and accept slower quality improvement.', impacts: { risk: 4, efficiency: -3 } },
    ] },
    { title: 'Two senior technicians announce retirement.', type: 'TALENT SIGNAL', text: 'Their tacit knowledge is essential to keeping the plants running smoothly.', options: [
      { label: 'Retention and knowledge transfer', description: 'Keep expertise in the system while the bench develops.', cost: 0.7, impacts: { satisfaction: 8, literacy: 10, adoption: 5 } },
      { label: 'Upskill the bench', description: 'Accelerate training and frontline adoption.', cost: 0.4, impacts: { literacy: 8, adoption: 6, satisfaction: 3 } },
      { label: 'Recruit externally', description: 'Add experienced operators while accepting integration effort.', cost: 0.9, impacts: { satisfaction: 3, innovation: 4, risk: 2 } },
    ] },
  ],
  currency: { defaultSymbol: '₹', defaultLabel: 'Cr' },
  frameworkContext: { advisorPrompt: 'The company is facing equipment downtime (+12%), scrap and defect pressure (+8%), rising energy costs (+15%), and retiring technicians. Recommendations should connect AI value to uptime, quality, energy efficiency, and workforce resilience.', industryBenchmarks: { efficiency: 50, satisfaction: 61, adoption: 67 } },
};
