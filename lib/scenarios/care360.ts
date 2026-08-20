import type { ScenarioDefinition } from './types';
import { initiative, metric } from './scenarioHelpers';

export const care360: ScenarioDefinition = {
  id: 'care360', name: 'Care360 Health Network', industry: 'Healthcare', icon: '🏥', description: 'Improve access and patient outcomes across a growing healthcare network without compromising trust.', difficulty: 'advanced',
  company: { name: 'Care360', revenue: '₹1,200 Cr', employees: '4,000 clinicians', locations: '12 hospitals · 35 centres', description: 'A healthcare provider balancing patient flow, clinician capacity, safety, and privacy.' },
  challenges: [
    { id: 'wait', label: 'Patient wait times', severity: '75 minutes', metric: 'patientWaitTime', direction: 'lower-is-better', description: 'Long queues are damaging access and patient experience.' },
    { id: 'burnout', label: 'Clinician burnout', severity: '58 index', metric: 'clinicianBurnout', direction: 'lower-is-better', description: 'Overworked clinical and administrative teams need relief.' },
    { id: 'trust', label: 'Privacy and trust', severity: '65 index', metric: 'privacyTrust', direction: 'higher-is-better', description: 'AI must improve care while protecting patient trust.' },
  ],
  startingState: { budget: 5, defaultAllocation: { infra: 20, data: 25, people: 20, mlops: 10, compliance: 20, innovation: 5 }, startingMetrics: { patientWaitTime: 75, clinicianBurnout: 58, patientSafety: 70, privacyTrust: 65, careAccess: 50, efficiency: 30, adoption: 42, data: 55, satisfaction: 52 } },
  progress: [metric('patientWaitTime', 'Patient wait time', 'minutes', 75, 30, 'lower-is-better', 0, 240), metric('clinicianBurnout', 'Clinician burnout', 'index', 58, 30, 'lower-is-better'), metric('patientSafety', 'Patient safety', 'index', 70, 90, 'higher-is-better'), metric('privacyTrust', 'Privacy trust', 'index', 65, 90, 'higher-is-better'), metric('careAccess', 'Care access', '%', 50, 85, 'higher-is-better')],
  initiatives: [
    initiative({ id: 'radiologyAssistant', name: 'AI Radiology Assistant', desc: 'Support imaging review so clinicians can focus on critical cases.', cost: 1.6, roi: 160, risk: 'HIGH', data: 5, human: 4, impact: 'Improves diagnostic throughput.', baseEffect: -10, primaryMetric: 'patientWaitTime', effectUnit: 'minutes' }),
    initiative({ id: 'docCopilot', name: 'Clinical Documentation Copilot', desc: 'Reduce documentation burden at the point of care.', cost: 1.3, roi: 150, risk: 'MED', data: 4, human: 4, impact: 'Reduces clinician burden.', baseEffect: -5, primaryMetric: 'clinicianBurnout', effectUnit: 'index points' }),
    initiative({ id: 'riskScoring', name: 'Predictive Patient Risk Scoring', desc: 'Identify high-risk profiles early for proactive intervention.', cost: 1.7, roi: 170, risk: 'HIGH', data: 5, human: 4, impact: 'Improves patient safety.', baseEffect: 4, primaryMetric: 'patientSafety', effectUnit: 'index points' }),
    initiative({ id: 'schedulingOptimization', name: 'Appointment Scheduling Optimization', desc: 'Coordinate queues and visits across the network.', cost: 1.2, roi: 155, risk: 'LOW', data: 4, human: 3, impact: 'Reduces waiting.', baseEffect: -15, primaryMetric: 'patientWaitTime', effectUnit: 'minutes' }),
    initiative({ id: 'patientVirtualAssistant', name: 'Patient Virtual Assistant', desc: 'Provide reliable digital guidance and access around the clock.', cost: 1.1, roi: 140, risk: 'MED', data: 3, human: 3, impact: 'Expands care access.', baseEffect: 6, primaryMetric: 'careAccess', effectUnit: 'percentage points' }),
    initiative({ id: 'workforcePlanning', name: 'Workforce Planning AI', desc: 'Forecast demand and deploy clinical teams more effectively.', cost: 1.4, roi: 145, risk: 'MED', data: 4, human: 4, impact: 'Reduces workload pressure.', baseEffect: -4, primaryMetric: 'clinicianBurnout', effectUnit: 'index points' }),
  ],
  crises: [{ title: 'A privacy concern pauses an AI pilot.', type: 'PRIVACY REVIEW', text: 'Clinical leaders want progress, but patients and regulators need evidence of control.', options: [{ label: 'Pause and review', description: 'Strengthen controls before scaling.', cost: 0.5, impacts: { risk: -8, compliance: 6 } }, { label: 'Continue with guardrails', description: 'Preserve momentum with a narrower rollout.', cost: 0.3, impacts: { adoption: 4, risk: 3 } }] }],
  currency: { defaultSymbol: '₹', defaultLabel: 'Cr' }, frameworkContext: { advisorPrompt: 'Connect decisions to patient access, clinician workload, safety, privacy, and trust. Healthcare AI requires human oversight and careful evidence before scale.', industryBenchmarks: { patientSafety: 90, privacyTrust: 90, careAccess: 85 } },
};
