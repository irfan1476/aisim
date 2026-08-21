import type { ScenarioDefinition, V3ScenarioPack } from './types';
import { projectFactory } from './projectFactory';

/**
 * Project Factory 2030's reviewed-but-provisional V3 metadata.  The legacy
 * `projectFactory` definition remains unchanged; this companion definition is
 * the explicit opt-in runtime pack for depth-v3 experiments.
 */
export const projectFactoryV3Pack: V3ScenarioPack = {
  version: '0.2.0-provisional',
  compatibilityVersion: 'scenario-depth-v3',
  owner: 'product-owner-tbc',
  timeHorizonQuarters: 12,
  currency: { code: 'INR', unit: 'Cr' },
  nonNegotiables: ['Do not bypass safety controls.', 'Do not conceal a quality escape.', 'Do not scale without an accountable owner and evidence.', 'Do not exceed the ₹5 Cr capital envelope without the defined exception.'],
  metrics: [
    { key: 'unplanned_downtime_share', label: 'Unplanned downtime', unit: '% of scheduled production time', timeBasis: 'quarterly', ownerRole: 'maintenance_lead', scope: 'scenario', start: 12, target: 7, min: 0, max: 25, direction: 'lower-is-better' },
    { key: 'first_pass_yield', label: 'First-pass yield', unit: '%', timeBasis: 'quarterly', ownerRole: 'quality_head', scope: 'scenario', start: 91.2, target: 95, min: 70, max: 100, direction: 'higher-is-better' },
    { key: 'escaped_defects_ppm', label: 'Escaped defects', unit: 'PPM', timeBasis: 'quarterly', ownerRole: 'quality_oem_lead', scope: 'scenario', start: 1240, target: 850, min: 0, max: 3000, direction: 'lower-is-better' },
    { key: 'energy_intensity_index', label: 'Energy per unit', unit: 'index; Q1 = 100', timeBasis: 'monthly rolled to quarter', ownerRole: 'energy_operations_manager', scope: 'scenario', start: 100, target: 88, min: 70, max: 140, direction: 'lower-is-better' },
    { key: 'schedule_adherence', label: 'Schedule adherence', unit: '%', timeBasis: 'quarterly', ownerRole: 'supply_chain_lead', scope: 'scenario', start: 86, target: 93, min: 50, max: 100, direction: 'higher-is-better' },
    { key: 'workforce_readiness', label: 'Workforce readiness', unit: '0–100 index', timeBasis: 'quarterly pulse and capability evidence', ownerRole: 'maintenance_lead_hr_partner', scope: 'scenario', start: 52, target: 70, min: 0, max: 100, direction: 'higher-is-better' },
    { key: 'technician_trust', label: 'Technician trust', unit: '0–100 index', timeBasis: 'quarter-end pulse', ownerRole: 'technician_representative', scope: 'scenario', start: 58, target: 72, min: 0, max: 100, direction: 'higher-is-better' },
    { key: 'oem_confidence', label: 'OEM confidence', unit: '0–100 index', timeBasis: 'quarterly account review', ownerRole: 'quality_oem_lead', scope: 'scenario', start: 68, target: 80, min: 0, max: 100, direction: 'higher-is-better' },
    { key: 'asset_data_readiness', label: 'Asset-data readiness', unit: '0–100 index', timeBasis: 'evidence-based composite', ownerRole: 'data_owner', scope: 'scenario', start: 43, target: 75, min: 0, max: 100, direction: 'higher-is-better' },
    { key: 'cash_commitment', label: 'Cumulative programme capital committed', unit: '₹ Cr', timeBasis: 'immediate cumulative', ownerRole: 'cfo', scope: 'scenario', start: 0, target: 5, min: 0, max: 5.5, direction: 'lower-is-better', currency: 'INR_Cr' },
  ],
  reportedMetrics: [
    { key: 'critical_asset_sensor_coverage', label: 'Critical asset sensor coverage', unit: '%', timeBasis: 'quarterly gate review', ownerRole: 'data_owner', scope: 'scenario', start: 38, min: 0, max: 100 },
    { key: 'structured_failure_code_coverage', label: 'Structured failure-code coverage', unit: '%', timeBasis: 'quarterly gate review', ownerRole: 'maintenance_lead', scope: 'scenario', start: 44, min: 0, max: 100 },
    { key: 'technician_workflow_usefulness', label: 'Technician workflow usefulness', unit: '0–100 index', timeBasis: 'pilot review', ownerRole: 'technician_representative', scope: 'scenario', min: 0, max: 100 },
    { key: 'false_reject_rate', label: 'False reject rate', unit: '%', timeBasis: 'pilot review', ownerRole: 'quality_head', scope: 'scenario', min: 0, max: 100 },
    { key: 'operator_override_traceability', label: 'Operator override traceability', unit: '%', timeBasis: 'pilot review', ownerRole: 'quality_head', scope: 'scenario', min: 0, max: 100 },
    { key: 'eligible_line_metering_coverage', label: 'Eligible-line metering coverage', unit: '%', timeBasis: 'quarterly gate review', ownerRole: 'energy_operations_manager', scope: 'scenario', start: 54, min: 0, max: 100 },
    { key: 'planner_exception_review_rate', label: 'Planner exception review rate', unit: '%', timeBasis: 'pilot review', ownerRole: 'supply_chain_lead', scope: 'scenario', min: 0, max: 100 },
    { key: 'priority_alert_action_capacity', label: 'Priority-alert action capacity', unit: '%', timeBasis: 'pilot review', ownerRole: 'supply_chain_lead', scope: 'scenario', min: 0, max: 100 },
  ],
  evidence: [
    { id: 'PF-E01', title: 'Plant performance dashboard', sourceType: 'expert-calibrated synthetic', sourceStatus: 'provisional', claimStatus: 'supported for problem framing; insufficient for root-cause attribution', authorRole: 'operations performance office', version: '0.1', availableFrom: 'Q1', informs: ['maintenance', 'quality', 'energy', 'demand', 'supply'] },
    { id: 'PF-E02', title: 'Asset-data readiness assessment', sourceType: 'expert-calibrated synthetic', sourceStatus: 'provisional', claimStatus: 'supported for research and constrained pilot; insufficient for scale', authorRole: 'CIO/data owner with maintenance analyst', version: '0.1', availableFrom: 'Q1', informs: ['maintenance', 'energy', 'knowledge'] },
    { id: 'PF-E03', title: 'Value-stream and change-window map', sourceType: 'expert-calibrated synthetic', sourceStatus: 'provisional', claimStatus: 'supported for capacity constraints; local workflow requires validation', authorRole: 'plant transformation office', version: '0.1', availableFrom: 'Q1', informs: ['maintenance', 'quality', 'demand', 'energy', 'supply'] },
    { id: 'PF-E04', title: 'Workforce continuity and workflow brief', sourceType: 'expert-calibrated synthetic', sourceStatus: 'provisional', claimStatus: 'supported for training capacity; not a complete attitude account', authorRole: 'maintenance lead and HR partner', version: '0.1', availableFrom: 'Q1', informs: ['knowledge', 'maintenance'] },
    { id: 'PF-E05', title: 'OEM quality, traceability, and delivery brief', sourceType: 'expert-calibrated synthetic', sourceStatus: 'provisional', claimStatus: 'supported for traceability and containment constraints', authorRole: 'quality/OEM account lead', version: '0.1', availableFrom: 'Q1', informs: ['quality', 'demand', 'supply'] },
    { id: 'PF-E06', title: 'Finance, programme capacity, and value-range brief', sourceType: 'expert-calibrated synthetic', sourceStatus: 'provisional', claimStatus: 'supported for capital and capacity; insufficient for monetary attribution', authorRole: 'CFO transformation office', version: '0.1', availableFrom: 'Q1', informs: ['demand', 'energy', 'supply'] },
    { id: 'PF-E07', title: 'Governance and accountable-use brief', sourceType: 'expert-calibrated synthetic', sourceStatus: 'provisional', claimStatus: 'supported for control boundaries; insufficient for local validity', authorRole: 'CIO/CISO/data owner', version: '0.1', availableFrom: 'Q1', informs: ['maintenance', 'quality', 'demand', 'energy', 'knowledge', 'supply'] },
  ],
  initiatives: [
    initiative('maintenance', 'Predictive maintenance for critical assets', 'Maintenance lead', ['PF-E01', 'PF-E02', 'PF-E03', 'PF-E04', 'PF-E07'], [], 'asset_data_readiness', { data_engineering: { research: 2, pilot: 2, scale: 3 }, plant_integration: { research: 1, pilot: 2, scale: 2 }, frontline_change: { pilot: 2, scale: 2 }, governance_assurance: { pilot: 1, scale: 2 } }),
    initiative('quality', 'AI visual quality inspection', 'Quality head', ['PF-E01', 'PF-E03', 'PF-E05', 'PF-E07'], ['maintenance'], 'first_pass_yield', { data_engineering: { research: 2, pilot: 2, scale: 2 }, plant_integration: { pilot: 2, scale: 2 }, frontline_change: { pilot: 2, scale: 2 }, governance_assurance: { pilot: 1, scale: 2 } }),
    initiative('demand', 'Demand forecasting and inventory alignment', 'Supply-chain planning lead', ['PF-E01', 'PF-E03', 'PF-E05', 'PF-E06', 'PF-E07'], [], 'schedule_adherence', { data_engineering: { research: 1, pilot: 2, scale: 2 }, plant_integration: { pilot: 1, scale: 1 }, frontline_change: { pilot: 1, scale: 1 }, governance_assurance: { pilot: 1, scale: 1 } }),
    initiative('energy', 'Energy optimisation for production operations', 'Energy and operations manager', ['PF-E01', 'PF-E02', 'PF-E03', 'PF-E06', 'PF-E07'], [], 'energy_intensity_index', { data_engineering: { research: 1, pilot: 2, scale: 2 }, plant_integration: { pilot: 2, scale: 2 }, frontline_change: { pilot: 1, scale: 1 }, governance_assurance: { pilot: 1, scale: 1 } }),
    initiative('knowledge', 'Technician knowledge assistant', 'Maintenance lead', ['PF-E02', 'PF-E04', 'PF-E07'], ['maintenance'], 'workforce_readiness', { data_engineering: { research: 1, pilot: 1, scale: 1 }, plant_integration: { pilot: 1, scale: 1 }, frontline_change: { pilot: 2, scale: 2 }, governance_assurance: { pilot: 2, scale: 2 } }),
    initiative('supply', 'Supply-chain risk monitoring', 'Procurement and supply-chain lead', ['PF-E01', 'PF-E03', 'PF-E05', 'PF-E06', 'PF-E07'], ['demand'], 'schedule_adherence', { data_engineering: { research: 2, pilot: 2, scale: 2 }, plant_integration: { pilot: 1, scale: 1 }, frontline_change: { pilot: 1, scale: 1 }, governance_assurance: { pilot: 1, scale: 2 } }),
  ],
  stakeholders: [
    { id: 'cfo', role: 'CFO transformation sponsor', priorities: ['realised operating value', 'cash discipline', 'credible downside'], redLines: ['uncontrolled capital overrun', 'scale without owner/evidence'], influence: 'high', signals: ['cash_commitment', 'capacity'] },
    { id: 'coo_plant_manager', role: 'COO and plant managers', priorities: ['on-time output', 'safe change windows', 'line stability'], redLines: ['disruptive scale', 'bypassed safety approval'], influence: 'high', signals: ['unplanned_downtime_share', 'schedule_adherence'] },
    { id: 'quality_oem_lead', role: 'Quality head and OEM account lead', priorities: ['first-pass yield', 'traceability', 'OEM confidence'], redLines: ['untraceable inspection', 'concealed quality escape'], influence: 'high', signals: ['first_pass_yield', 'escaped_defects_ppm', 'oem_confidence'] },
    { id: 'maintenance_technician', role: 'Maintenance lead and technician representative', priorities: ['safe useful work', 'respect for expertise', 'protected review time'], redLines: ['unsafe advice', 'imposed alert workflow', 'removal of override'], influence: 'high', signals: ['technician_trust', 'workforce_readiness'] },
    { id: 'cio_ciso_data_owner', role: 'CIO/CISO/data owner', priorities: ['data quality', 'access boundary', 'monitoring ownership'], redLines: ['unapproved access', 'unknown owner', 'no escalation route'], influence: 'high', signals: ['asset_data_readiness'] },
  ],
  gates: [
    gate('G-PF-01', ['maintenance.scale'], 'maintenance_lead', ['PF-E02', 'PF-E03', 'PF-E04', 'PF-E07'], ['asset_data_readiness >= 70', 'critical_asset_sensor_coverage >= 70', 'structured_failure_code_coverage >= 65', 'technician_workflow_usefulness >= 60'], 'limit_to_pilot_or_pause'),
    gate('G-PF-02', ['quality.scale'], 'quality_head', ['PF-E01', 'PF-E03', 'PF-E05', 'PF-E07'], ['false_reject_rate <= 8', 'operator_override_traceability >= 75'], 'remain_in_pilot_or_pause'),
    gate('G-PF-03', ['demand.pilot'], 'supply_chain_planning_lead', ['PF-E01', 'PF-E03', 'PF-E05', 'PF-E06', 'PF-E07'], ['planner_exception_review_rate >= 80'], 'remain_in_research'),
    gate('G-PF-04', ['energy.scale'], 'energy_operations_manager', ['PF-E01', 'PF-E02', 'PF-E03', 'PF-E07'], ['eligible_line_metering_coverage >= 70'], 'remain_in_pilot_or_pause'),
    gate('G-PF-05', ['knowledge.pilot'], 'maintenance_lead', ['PF-E04', 'PF-E07'], [], 'remain_in_research'),
    gate('G-PF-06', ['supply.scale'], 'procurement_supply_chain_lead', ['PF-E03', 'PF-E05', 'PF-E06', 'PF-E07'], ['priority_alert_action_capacity >= 80'], 'remain_in_pilot_or_pause'),
  ],
  causalRules: [
    { id: 'CR-PF-01', evidenceIds: ['PF-E02', 'PF-E04'], metric: 'unplanned_downtime_share', effects: [{ metric: 'unplanned_downtime_share', delta: -1.6, unit: '% of scheduled production time' }, { metric: 'technician_trust', delta: 2, unit: '0–100 index' }] },
    { id: 'CR-PF-02', evidenceIds: ['PF-E01', 'PF-E05'], metric: 'first_pass_yield', effects: [{ metric: 'first_pass_yield', delta: 1, unit: '%' }, { metric: 'escaped_defects_ppm', delta: -100, unit: 'PPM' }] },
    { id: 'CR-PF-03', evidenceIds: ['PF-E04', 'PF-E07'], metric: 'workforce_readiness', effects: [{ metric: 'workforce_readiness', delta: 5, unit: '0–100 index' }, { metric: 'technician_trust', delta: 3, unit: '0–100 index' }] },
  ],
  events: [{ id: 'EV-PF-01', trigger: 'quarter >= 4', triggerMetric: 'unplanned_downtime_share', triggerInitiative: 'maintenance', effects: [{ metric: 'schedule_adherence', delta: -3, unit: '%', sourceRuleId: 'ER-PF-01', sourceEvidenceIds: ['PF-E02', 'PF-E03', 'PF-E04'] }] }],
  portfolioPolicy: { lifecycleStates: ['deferred', 'research', 'pilot', 'scale', 'sustain', 'pause', 'stop'], budgetPosture: 'constrained', budget: { currency: 'INR_Cr', capitalEnvelope: 5, annualRunEnvelope: 1.2 } },
  learning: { evidencePolicy: 'Seven expert-calibrated synthetic artefacts; none describes a named company.', scorecardDimensions: ['operational_outcomes', 'decision_quality', 'execution_and_sequencing', 'responsible_ai_governance', 'stakeholder_workforce_health', 'resilience'], reflectionStages: ['reconstruct', 'interpret', 'reframe', 'transfer'] },
  scorecard: { dimensions: ['operational_outcomes', 'decision_quality', 'execution_and_sequencing', 'responsible_ai_governance', 'stakeholder_workforce_health', 'resilience'], composite: false },
  report: { changes: [{ metric: 'unplanned_downtime_share', ruleId: 'CR-PF-01', evidenceIds: ['PF-E02', 'PF-E04'] }, { metric: 'first_pass_yield', ruleId: 'CR-PF-02', evidenceIds: ['PF-E01', 'PF-E05'] }, { metric: 'workforce_readiness', ruleId: 'CR-PF-03', evidenceIds: ['PF-E04', 'PF-E07'] }] },
};

function initiative(id: string, valueHypothesis: string, ownerRole: string, evidenceRequired: string[], dependencies: string[], valueMetric: string, capacityRequired: Record<string, Record<string, number>>) {
  return { id, valueHypothesis, ownerRole, evidenceRequired, dependencies, valueMetric, capacityRequired, lifecycle: { allowedTransitions: ['deferred to research', 'research to pilot', 'pilot to scale', 'scale to sustain', 'pilot to pause', 'scale to pause', 'pause to research', 'pilot to stop', 'scale to stop', 'sustain to stop'] } };
}

function gate(id: string, appliesTo: string[], ownerRole: string, requiredEvidence: string[], conditions: string[], onFailure: string) {
  return { id, appliesTo, ownerRole, requiredEvidence, conditions, onFailure };
}

export const projectFactoryV3: ScenarioDefinition = { ...projectFactory, id: 'project-factory-2030', schemaVersion: 'v3', packVersion: '0.2.0-provisional', v3: projectFactoryV3Pack };
