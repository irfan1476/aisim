import type { ScenarioDefinition, V3ScenarioPack, V3LifecycleState } from './types';

export type V3ValidationIssue = { code: string; path: string; message: string };
export type V3ValidationResult = { valid: boolean; errors: V3ValidationIssue[]; warnings: V3ValidationIssue[] };

const states = new Set<V3LifecycleState>(['deferred', 'research', 'pilot', 'scale', 'sustain', 'pause', 'stop']);
const issue = (code: string, path: string, message: string): V3ValidationIssue => ({ code, path, message });

/** Validate an opted-in V3 pack without invoking game/runtime code. */
export function validateScenarioV3Pack(scenario: Pick<ScenarioDefinition, 'id' | 'v3'> | V3ScenarioPack): V3ValidationResult {
  const pack: V3ScenarioPack | undefined = ('v3' in scenario ? scenario.v3 : scenario) as V3ScenarioPack | undefined;
  if (!pack) return { valid: true, errors: [], warnings: [] };
  const errors: V3ValidationIssue[] = [];
  const warnings: V3ValidationIssue[] = [];
  const metrics = [...(pack.metrics ?? []), ...(pack.reportedMetrics ?? [])];
  const metricByKey = new Map<string, (typeof metrics)[number]>();
  for (let i = 0; i < metrics.length; i += 1) {
    const metric = metrics[i];
    const path = `v3.metrics[${i}]`;
    if (!metric.key) errors.push(issue('metric-key-required', path, 'Each reported metric needs a stable key.'));
    if (!metric.unit) errors.push(issue('metric-unit-required', path, `${metric.key || 'Metric'} must declare a unit.`));
    if (!metric.timeBasis) errors.push(issue('metric-time-basis-required', path, `${metric.key || 'Metric'} must declare a reporting time basis.`));
    if (!metric.ownerRole) errors.push(issue('metric-owner-required', path, `${metric.key || 'Metric'} must declare exactly one owner.`));
    if (metricByKey.has(metric.key)) errors.push(issue('metric-authority-collision', path, `Metric '${metric.key}' has more than one authority.`));
    else metricByKey.set(metric.key, metric);
    if (metric.min !== undefined && metric.max !== undefined && metric.min > metric.max) errors.push(issue('metric-bounds-invalid', path, 'Metric minimum cannot exceed maximum.'));
    if (metric.start !== undefined && metric.min !== undefined && metric.start < metric.min) errors.push(issue('metric-start-outside-bounds', path, 'Metric start is below its declared minimum.'));
    if (metric.start !== undefined && metric.max !== undefined && metric.start > metric.max) errors.push(issue('metric-start-outside-bounds', path, 'Metric start exceeds its declared maximum.'));
    if (metric.scope === 'generic' && metrics.some((other) => other !== metric && other.key === metric.key && other.scope === 'scenario')) errors.push(issue('generic-scenario-metric-collision', path, `Generic metric '${metric.key}' collides with a scenario metric.`));
  }
  const metricKeys = new Set(metricByKey.keys());
  const evidenceIds = new Set((pack.evidence ?? []).map((x) => x.id));
  const initiativeIds = new Set((pack.initiatives ?? []).map((x) => x.id));
  const stakeholderIds = new Set((pack.stakeholders ?? []).map((x) => x.id));
  const ruleIds = new Set((pack.causalRules ?? []).map((x) => x.id));
  const gateList = pack.governanceGates ?? pack.gates ?? [];
  const gateIds = new Set(gateList.map((x) => x.id));
  const ref = (set: Set<string>, value: string | undefined, code: string, path: string, noun: string) => {
    if (value && !set.has(value)) errors.push(issue(code, path, `Unknown ${noun} '${value}'.`));
  };
  const validateWindow = (window: NonNullable<V3ScenarioPack['windowOne']>, path: string) => {
    if (window.quarterRange[0] < 1 || window.quarterRange[1] < window.quarterRange[0]) errors.push(issue('invalid-window-range', `${path}.quarterRange`, 'Window quarter range must be ordered and start at Q1 or later.'));
    const seen = new Set<string>();
    if (window.id === 'PF-W1' && window.priorities.length !== 3) errors.push(issue('window-priority-count', `${path}.priorities`, 'Project Factory Window 1 must present exactly three opening priorities.'));
    window.priorities.forEach((priority, index) => {
      const priorityPath = `${path}.priorities[${index}]`;
      if (seen.has(priority.id)) errors.push(issue('duplicate-window-priority', priorityPath, `Priority '${priority.id}' is repeated.`));
      seen.add(priority.id);
      ref(initiativeIds, priority.id, 'unknown-initiative-reference', `${priorityPath}.id`, 'initiative');
      priority.evidenceIds.forEach((id) => ref(evidenceIds, id, 'unknown-evidence-reference', `${priorityPath}.evidenceIds`, 'evidence'));
      Object.keys(priority.capacity).forEach((pool) => { if (!(pool in (pack.portfolioPolicy?.capacityPools || {}))) errors.push(issue('unknown-capacity-pool', `${priorityPath}.capacity`, `Capacity pool '${pool}' is not declared in the portfolio policy.`)); });
      if (priority.costInrCr < 0) errors.push(issue('negative-window-cost', `${priorityPath}.costInrCr`, 'Window priority cost cannot be negative.'));
      if (priority.signalQuarter < window.quarterRange[0]) errors.push(issue('invalid-signal-quarter', `${priorityPath}.signalQuarter`, 'Research signal cannot precede the window start.'));
    });
  };
  if (pack.windowOne) validateWindow(pack.windowOne, 'v3.windowOne');
  (pack.windows || []).forEach((window, index) => validateWindow(window, `v3.windows[${index}]`));
  (pack.researchReviews || []).forEach((review, index) => {
    ref(initiativeIds, review.initiativeId, 'unknown-initiative-reference', `v3.researchReviews[${index}].initiativeId`, 'initiative');
    review.outcomes.forEach((outcome, outcomeIndex) => {
      const outcomePath = `v3.researchReviews[${index}].outcomes[${outcomeIndex}]`;
      if (outcome.initiativeId !== review.initiativeId) errors.push(issue('research-outcome-initiative-mismatch', outcomePath, 'Research outcome must belong to its review initiative.'));
      outcome.basedOnEvidence.forEach((id) => ref(evidenceIds, id, 'unknown-evidence-reference', `${outcomePath}.basedOnEvidence`, 'evidence'));
    });
  });
  for (let i = 0; i < (pack.evidence ?? []).length; i += 1) {
    const evidence = (pack.evidence ?? [])[i];
    if (!evidence.id) errors.push(issue('evidence-id-required', `v3.evidence[${i}]`, 'Evidence needs a stable id.'));
    for (const source of evidence.informs ?? []) {
      const [initiative] = source.split('.');
      ref(initiativeIds, initiative, 'unknown-initiative-reference', `v3.evidence[${i}].informs`, 'initiative');
    }
  }
  for (let i = 0; i < (pack.initiatives ?? []).length; i += 1) {
    const initiative = (pack.initiatives ?? [])[i];
    const path = `v3.initiatives[${i}]`;
    for (const dep of initiative.dependencies ?? []) ref(initiativeIds, dep, 'unknown-initiative-reference', `${path}.dependencies`, 'initiative');
    for (const evidence of initiative.evidenceRequired ?? []) ref(evidenceIds, evidence, 'unknown-evidence-reference', `${path}.evidenceRequired`, 'evidence');
    for (const stakeholder of initiative.affectedStakeholders ?? []) ref(stakeholderIds, stakeholder, 'unknown-stakeholder-reference', `${path}.affectedStakeholders`, 'stakeholder');
    if (initiative.valueMetric) ref(metricKeys, initiative.valueMetric, 'undeclared-value-reference', `${path}.valueMetric`, 'metric');
    if (initiative.effect) validateEffect(initiative.effect, `${path}.effect`);
    for (const transition of initiative.lifecycle?.allowedTransitions ?? []) {
      const [from, to] = transition.replace(/_/g, ' ').split(/\s+to\s+|→/).map((x) => x.trim());
      if (!from || !to || (from !== 'any' && !states.has(from as V3LifecycleState)) || (to !== 'any' && !states.has(to as V3LifecycleState))) errors.push(issue('invalid-lifecycle-transition', `${path}.lifecycle.allowedTransitions`, `Invalid lifecycle transition '${transition}'.`));
    }
  }
  function validateEffect(effect: { metric: string; delta: number; unit?: string }, path: string) {
    const metric = metricByKey.get(effect.metric);
    ref(metricKeys, effect.metric, 'undeclared-effect-reference', `${path}.metric`, 'metric');
    if (!metric) return;
    if (effect.unit && effect.unit !== metric.unit) errors.push(issue('incompatible-effect-unit', path, `Effect unit '${effect.unit}' does not match metric unit '${metric.unit}'.`));
    if (metric.start !== undefined && metric.min !== undefined && metric.start + effect.delta < metric.min) errors.push(issue('effect-outside-metric-boundary', path, 'Effect can move the metric below its declared boundary.'));
    if (metric.start !== undefined && metric.max !== undefined && metric.start + effect.delta > metric.max) errors.push(issue('effect-outside-metric-boundary', path, 'Effect can move the metric above its declared boundary.'));
  }
  for (let i = 0; i < (pack.causalRules ?? []).length; i += 1) {
    const rule = (pack.causalRules ?? [])[i];
    for (const evidence of rule.evidenceIds ?? []) ref(evidenceIds, evidence, 'unknown-evidence-reference', `v3.causalRules[${i}].evidenceIds`, 'evidence');
    ref(metricKeys, rule.metric, 'undeclared-value-reference', `v3.causalRules[${i}].metric`, 'metric');
    for (let j = 0; j < (rule.effects ?? []).length; j += 1) validateEffect((rule.effects ?? [])[j], `v3.causalRules[${i}].effects[${j}]`);
    for (const stakeholder of rule.stakeholderIds ?? []) ref(stakeholderIds, stakeholder, 'unknown-stakeholder-reference', `v3.causalRules[${i}].stakeholderIds`, 'stakeholder');
  }
  for (let i = 0; i < (pack.events ?? []).length; i += 1) {
    const event = (pack.events ?? [])[i];
    ref(metricKeys, event.triggerMetric, 'invalid-event-trigger', `v3.events[${i}].triggerMetric`, 'metric');
    ref(initiativeIds, event.triggerInitiative, 'invalid-event-trigger', `v3.events[${i}].triggerInitiative`, 'initiative');
    if (!event.trigger && !event.triggerMetric && !event.triggerInitiative) errors.push(issue('invalid-event-trigger', `v3.events[${i}]`, 'Event must declare a trigger or trigger reference.'));
    for (let j = 0; j < (event.effects ?? []).length; j += 1) validateEffect((event.effects ?? [])[j], `v3.events[${i}].effects[${j}]`);
  }
  for (let i = 0; i < gateList.length; i += 1) {
    const gate = gateList[i];
    for (const evidence of gate.requiredEvidence ?? []) ref(evidenceIds, evidence, 'unknown-evidence-reference', `v3.gates[${i}].requiredEvidence`, 'evidence');
    for (const target of gate.appliesTo ?? []) {
      const initiative = target.split('.')[0];
      ref(initiativeIds, initiative, 'unknown-initiative-reference', `v3.gates[${i}].appliesTo`, 'initiative');
    }
    if (!gate.ownerRole) errors.push(issue('gate-owner-required', `v3.gates[${i}]`, 'Governance gate needs an owner role.'));
  }
  // Dependency cycles make lifecycle resolution ambiguous.
  const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (id: string) => { if (visiting.has(id)) return true; if (visited.has(id)) return false; visiting.add(id); const node = pack.initiatives?.find((x) => x.id === id); const cycle = (node?.dependencies ?? []).some(visit); visiting.delete(id); visited.add(id); return cycle; };
  for (const id of Array.from(initiativeIds)) if (visit(id)) { errors.push(issue('dependency-cycle', 'v3.initiatives', 'Initiative dependencies must form an acyclic graph.')); break; }
  const reportChanges = pack.report?.changes ?? [];
  for (let i = 0; i < reportChanges.length; i += 1) {
    const change = reportChanges[i];
    ref(metricKeys, change.metric, 'undeclared-report-reference', `v3.report.changes[${i}]`, 'metric');
    if (!change.ruleId && !(change.evidenceIds?.length)) errors.push(issue('report-source-required', `v3.report.changes[${i}]`, 'Every reported change must identify a rule or evidence source.'));
    ref(ruleIds, change.ruleId, 'unknown-rule-reference', `v3.report.changes[${i}].ruleId`, 'causal rule');
    for (const evidence of change.evidenceIds ?? []) ref(evidenceIds, evidence, 'unknown-evidence-reference', `v3.report.changes[${i}].evidenceIds`, 'evidence');
  }
  const budgetCurrency = pack.portfolioPolicy?.budget?.currency;
  if (budgetCurrency) for (const metric of metrics) if (metric.currency && metric.currency !== budgetCurrency) errors.push(issue('incompatible-currency', 'v3.metrics', `Metric '${metric.key}' currency '${metric.currency}' conflicts with budget currency '${budgetCurrency}'.`));
  return { valid: errors.length === 0, errors, warnings };
}

export const validateV3Pack = validateScenarioV3Pack;
