import type { ScenarioDefinition } from './types';
import { initiative, metric } from './scenarioHelpers';

export const bankNext: ScenarioDefinition = {
  id: 'bankNext', name: 'BankNext Transformation', industry: 'Banking', icon: '🏦',
  description: 'Lead a mid-sized private-sector bank through digital growth, fraud pressure, and regulatory scrutiny.', difficulty: 'advanced',
  company: { name: 'BankNext', revenue: '₹1,800 Cr', employees: '18,000', locations: '800 branches', description: 'A fast-growing bank expanding mobile and UPI services while protecting trust.' },
  challenges: [
    { id: 'fraud', label: 'Digital fraud incidents', severity: 'Rising', metric: 'fraudPressure', direction: 'lower-is-better', description: 'Digital transaction risk is increasing as the bank scales.' },
    { id: 'credit', label: 'Credit approval speed', severity: '120 hours', metric: 'creditApprovalTime', direction: 'lower-is-better', description: 'Manual approvals are losing customers to fintech competitors.' },
    { id: 'compliance', label: 'Compliance readiness', severity: '45 index', metric: 'complianceReadiness', direction: 'higher-is-better', description: 'Regulatory reporting and control coverage need deliberate investment.' },
  ],
  startingState: { budget: 5, defaultAllocation: { infra: 25, data: 25, people: 15, mlops: 10, compliance: 20, innovation: 5 }, startingMetrics: { fraudPressure: 80, creditApprovalTime: 120, complianceReadiness: 45, customerTrustIndex: 63, digitalAdoption: 55, efficiency: 30, adoption: 45, data: 50, satisfaction: 55 } },
  progress: [
    metric('fraudPressure', 'Fraud pressure', 'index', 80, 30, 'lower-is-better'), metric('creditApprovalTime', 'Credit approval time', 'hours', 120, 24, 'lower-is-better', 0, 240), metric('complianceReadiness', 'Compliance readiness', 'index', 45, 85, 'higher-is-better'), metric('customerTrustIndex', 'Customer trust', 'index', 63, 85, 'higher-is-better'), metric('digitalAdoption', 'Digital adoption', '%', 55, 80, 'higher-is-better'),
  ],
  initiatives: [
    initiative({ id: 'fraudDetection', name: 'AI Fraud Detection', desc: 'Monitor digital transactions in real time to contain fraud.', cost: 1.5, roi: 165, risk: 'MED', data: 4, human: 3, impact: 'Reduces fraud exposure.', baseEffect: -5, primaryMetric: 'fraudPressure', effectUnit: 'index points' }),
    initiative({ id: 'creditRiskAssessment', name: 'AI Credit Risk Assessment', desc: 'Accelerate responsible loan decisions with explainable risk models.', cost: 1.8, roi: 175, risk: 'HIGH', data: 5, human: 4, impact: 'Shortens approval cycles.', baseEffect: -15, primaryMetric: 'creditApprovalTime', effectUnit: 'hours' }),
    initiative({ id: 'customerCopilot', name: 'Customer Service Copilot', desc: 'Give service teams faster, more consistent answers.', cost: 1.1, roi: 145, risk: 'LOW', data: 3, human: 3, impact: 'Improves digital service adoption.', baseEffect: 3, primaryMetric: 'digitalAdoption', effectUnit: 'percentage points' }),
    initiative({ id: 'complianceMonitoring', name: 'Regulatory Compliance Monitoring', desc: 'Automate control monitoring and reporting evidence.', cost: 1.4, roi: 130, risk: 'LOW', data: 4, human: 3, impact: 'Improves regulatory readiness.', baseEffect: 6, primaryMetric: 'complianceReadiness', effectUnit: 'index points' }),
    initiative({ id: 'rmSalesAssistant', name: 'RM Sales Assistant', desc: 'Equip relationship managers with contextual product insight.', cost: 1.2, roi: 155, risk: 'MED', data: 3, human: 4, impact: 'Builds digital growth.', baseEffect: 4, primaryMetric: 'digitalAdoption', effectUnit: 'percentage points' }),
    initiative({ id: 'personalizedEngine', name: 'Personalized Product Engine', desc: 'Recommend relevant products across digital channels.', cost: 1.6, roi: 185, risk: 'HIGH', data: 5, human: 3, impact: 'Strengthens customer trust when governed well.', baseEffect: 3, primaryMetric: 'customerTrustIndex', effectUnit: 'index points' }),
  ],
  crises: [{ title: 'A spike in digital fraud triggers board scrutiny.', type: 'FRAUD ALERT', text: 'The board wants containment without stopping digital growth.', options: [{ label: 'Accelerate fraud controls', description: 'Fund a focused control response.', cost: 0.8, impacts: { risk: -8, compliance: 5 } }, { label: 'Protect growth speed', description: 'Keep the roadmap moving and accept exposure.', impacts: { risk: 6, adoption: 3 } }] }],
  currency: { defaultSymbol: '₹', defaultLabel: 'Cr' }, frameworkContext: { advisorPrompt: 'Connect decisions to fraud containment, responsible credit speed, compliance readiness, customer trust, and digital adoption. Banking initiatives require explainability and governance.', industryBenchmarks: { complianceReadiness: 85, customerTrustIndex: 85, digitalAdoption: 80 } },
};
