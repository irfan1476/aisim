# Scenario v3 Content-Authoring Template

Status: reusable draft template
Use this to author Project Factory v3 first, then every future v3 scenario pack. Complete each required field with scenario-specific content; do not place engine logic in the narrative sections.

## 1. Pack identity and review

| Field | Required content |
|---|---|
| Pack ID / version | Stable ID, semantic content version, compatibility version |
| Owner | Named content owner and technical owner |
| Reviewers | Domain SME, learning-design reviewer, responsible-AI/governance reviewer as appropriate |
| Target learner | Role, prior knowledge, language/accessibility needs |
| Delivery mode | Facilitated workshop, self-paced, or both; duration and decision-window design |
| Context stance | India-first/global portability statement; local references requiring explanation |
| Evidence policy | Synthetic, anonymised, public, or mixed; provenance labels and limitations |

## 2. Learning contract

```yaml
learning:
  purpose: "What judgement should this simulation practise?"
  objectives:
    - id: diagnose
      observable_behaviour: "..."
      evidence_in_debrief: [ledger.problem_framing, evidence.asset_data_assessment]
  assessment:
    mode: formative
    scorecard_dimensions: [outcomes, decision_quality, execution, governance, stakeholders, resilience]
    prohibited_use: "Do not use this pilot score as a high-stakes grade."
  prebrief:
    learner_role: "..."
    authority_limits: "..."
    success_definition: "..."
    known_unknowns: ["...", "..."]
```

## 3. Organisation, trigger, and baseline metrics

Define only the facts the learner needs to make the intended decisions.

| Element | Content |
|---|---|
| Organisation profile | Scale, operating model, customer/public consequence, relevant geography |
| Trigger | External or internal change creating the decision window |
| Time horizon | Number of quarters and decision windows |
| Non-negotiables | Safety, legal, financial, service, or equity constraints |
| Metrics | Key, label, unit, starting value, target, range, direction, owner, reporting lag, distributional impact if applicable |

## 4. Evidence pack

Each artefact should be useful, incomplete, and attributable. Do not hide a required answer in a single document.

```yaml
evidence:
  - id: asset-data-assessment
    title: "Asset-data readiness assessment"
    source_type: expert-calibrated-synthetic # or anonymised/public
    author_role: data_owner
    version: "1.0"
    confidence: medium
    available_from: Q1
    format: table # table, memo, dashboard, quote, process-map
    informs: [predictive_maintenance.research, predictive_maintenance.scale_gate]
    facts: ["..."]
    limitations: ["..."]
    accessibility_summary: "..."
```

## 5. Portfolio policy and capacity

```yaml
portfolio_policy:
  minimum_active_delivery_initiatives: 0
  maximum_active_delivery_initiatives: 2
  lifecycle_states: [deferred, research, pilot, scale, sustain, pause, stop]
  budget:
    currency: INR_Cr
    capital_envelope: 0
    annual_run_envelope: 0
  capacity_pools:
    - id: data_engineering
      units: 0
      definition: "..."
    - id: frontline_change
      units: 0
      definition: "..."
  exception_policy: "Who can approve a capacity/budget exception and what evidence is required?"
```

## 6. Initiative delivery profiles

Create one profile per initiative. State a value hypothesis, not a benefit promise.

```yaml
initiative:
  id: predictive-maintenance
  name: "..."
  value_hypothesis: "If ... then ... because ..."
  lifecycle:
    allowed_transitions: [deferred_to_research, research_to_pilot, pilot_to_scale, scale_to_sustain, any_to_pause, pause_to_resume, any_to_stop]
    time_to_signal_quarters: 0
  cost:
    research_capital: 0
    pilot_capital: 0
    scale_capital: 0
    quarterly_run_cost: 0
    change_assurance_effort: 0
  capacity_required:
    research: { data_engineering: 0 }
    pilot: { data_engineering: 0, frontline_change: 0 }
    scale: { data_engineering: 0, frontline_change: 0, governance_assurance: 0 }
  dependencies: ["..."]
  evidence_required: ["..."]
  owner_role: "..."
  affected_stakeholders: ["..."]
  control_boundary: "What it recommends, what a human decides, override/escalation path"
  pilot_success_criteria: ["..."]
  scale_gate: ["..."]
  stop_or_pause_criteria: ["..."]
  known_risks: ["..."]
```

## 7. Stakeholders and governance gates

```yaml
stakeholder:
  id: technician_representative
  role: "..."
  priorities: ["..."]
  red_lines: ["..."]
  influence: high
  signals: [workforce_resilience, adoption]
  response_rules: ["Declared rule IDs only; no free-form AI outcome generation"]

governance_gate:
  id: maintenance-scale-readiness
  applies_to: [predictive-maintenance.scale]
  owner_role: maintenance_lead
  required_evidence: [asset-data-assessment, technician-workflow-test]
  conditions: ["metric.data_completeness >= 70", "stakeholder.technician_trust >= 60"]
  on_failure: limit_to_pilot # or block/pause
  explanation: "..."
```

## 8. Causal rules and events

Rules must be data, serializable, bounded, and explainable. State effects in a direction and range, never only a narrative promise.

```yaml
causal_rule:
  id: maintenance-pilot-signal
  when: ["initiative.predictive-maintenance.lifecycle == pilot", "gate.maintenance-pilot-readiness == passed"]
  after_quarters: 1
  uncertainty: { distribution: seeded-range, min: -2, max: -1, seed_scope: scenario }
  effects:
    - metric: downtime_pressure
      delta: "sampled_value"
    - metric: technician_trust
      delta: 1
  explanation: "..."

event:
  id: critical-line-failure
  trigger: ["quarter >= 3", "metric.asset_condition < 50", "initiative.predictive-maintenance.lifecycle not_in [scale, sustain]"]
  eligibility: "..."
  uncertainty: { probability: 0.35, seed_scope: scenario }
  evidence_revealed: [maintenance-backlog]
  choices:
    - id: emergency-repair
      cost: 0
      effects: ["rule references only"]
      trade_off: "..."
  debrief_explanation: "..."
```

## 9. Scorecard, debrief, and test fixtures

| Element | Required content |
|---|---|
| Scorecard dimension | Objective, source metrics/ledger evidence, display label, formative feedback rule |
| Debrief prompt | Reconstruction, analysis, and workplace-transfer question linked to an objective |
| Known-seed fixture | Pack version, seed, start state, learner decisions, expected metrics/state/gates/events/explanations |
| Negative fixture | Invalid dependency, failed gate, over-capacity plan, or boundary condition and expected validation |
| Accessibility check | Plain-language summary, colour-independent meaning, keyboard/screen-reader considerations |

## 10. Review and publication checklist

- [ ] Content owner has completed every required field.
- [ ] All numerical values are marked synthetic, anonymised, public, or expert-reviewed.
- [ ] Domain reviewer has checked causal plausibility and safety/compliance red lines.
- [ ] Learning reviewer has checked that evidence, decisions, and debrief align with objectives.
- [ ] Technical validator and deterministic fixtures pass.
- [ ] The learner cannot obtain the intended answer solely by reading one card.
- [ ] Every metric, event, and score component has a learner-visible explanation.
- [ ] Pack version and migration impact are recorded in the decision log.
