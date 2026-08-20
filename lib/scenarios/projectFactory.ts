import type { ScenarioDefinition } from './types';

const clamp = (value: number) => Math.min(100, Math.max(0, value));

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
    { id: 'downtime', label: 'Equipment Downtime', severity: '+12%', metric: 'efficiency', direction: 'higher-is-better', description: 'Unplanned downtime is putting pressure on production reliability.' },
    { id: 'scrap', label: 'Scrap & Defect Rates', severity: '+8%', metric: 'roi', direction: 'higher-is-better', description: 'Quality variation is increasing rework and reducing realised value.' },
    { id: 'energy', label: 'Energy Costs', severity: '+15%', metric: 'efficiency', direction: 'higher-is-better', description: 'Energy pressure is making efficiency improvements more valuable.' },
    { id: 'talent', label: 'Workforce Risk', severity: 'Retiring technicians', metric: 'satisfaction', direction: 'higher-is-better', description: 'Critical operating knowledge is leaving with retiring technicians.' },
  ],
  startingState: {
    budget: 5,
    defaultAllocation: { infra: 40, data: 20, people: 15, mlops: 10, compliance: 10, innovation: 5 },
    startingMetrics: { efficiency: 20, satisfaction: 40, adoption: 38, data: 54, downtimePressure: 88, defectPressure: 92, energyPressure: 85, workforceResilience: 40 },
  },
  progress: [
    { key: 'downtimePressure', label: 'Downtime pressure', start: 88, direction: 'lower-is-better', evaluate: (state) => clamp(88 - Math.max(0, state.efficiency - 20) * 2) },
    { key: 'defectPressure', label: 'Defect pressure', start: 92, direction: 'lower-is-better', evaluate: (state) => clamp(92 - Math.max(0, state.roi) * 0.35 - Math.max(0, state.data - 54) * 0.4) },
    { key: 'energyPressure', label: 'Energy pressure', start: 85, direction: 'lower-is-better', evaluate: (state) => clamp(85 - Math.max(0, state.efficiency - 20) * 1.5 - Math.max(0, state.revenue) * 0.4) },
    { key: 'workforceResilience', label: 'Workforce resilience', start: 40, direction: 'higher-is-better', evaluate: (state) => clamp(state.satisfaction) },
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
