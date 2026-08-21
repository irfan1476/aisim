# Project Factory 2030 V3 — Provisional Content Pack

Status: authored planning content; not executable scenario data
Content version: `0.1.0-provisional`
Target pack ID: `project-factory-2030`
Target compatibility contract: `scenario-depth-v3` (proposed; no engine implementation exists yet)
Date: 2026-08-21

> **Educational-use notice:** Every number, threshold, cost, range, stakeholder response, and event parameter in this pack is **expert-calibrated synthetic — provisional**. It is designed to create defensible executive-learning trade-offs, not to predict the performance of a real manufacturer or provide professional, safety, regulatory, financial, or engineering advice. Values require manufacturing and learning-design review before learner release.

## 1. Pack identity and review

| Field | Authored content |
|---|---|
| Pack ID / version | `project-factory-2030` / `0.1.0-provisional`; target compatibility `scenario-depth-v3`; migration impact: none until the V3 state schema is implemented. |
| Content owner | Product owner — **TBC**. This draft is maintained as a planning artefact, not approved operational content. |
| Technical owner | Simulation-engine owner — **TBC**. |
| Required reviewers | Automotive operations/maintenance SME; quality/OEM-supply SME; learning-design reviewer; responsible-AI/governance reviewer. |
| Target learner | Functional managers and MBA/management learners. Assume no specialist data-science background; explain manufacturing acronyms on first use and provide plain-language summaries. |
| Delivery mode | 90-minute facilitated team exercise across four decision windows, with a 12-quarter self-paced fallback. One transformation-lead role; a team can make one shared decision. |
| Context stance | India-first automotive-component supplier with India-specific ₹/Cr and OEM context. The operating mechanics—reliability, quality, energy, workforce, and supplier continuity—are globally portable. |
| Evidence policy | Seven expert-calibrated synthetic artefacts. Each item states its confidence, scope, and limitations. None is evidence about a named company. |
| Review state | Authored for design review; not SME-reviewed, technically validated, or pilot-tested. |

## 2. Learning contract

~~~yaml
learning:
  purpose: >
    Practise making a justified, sequenced AI-transformation decision under
    operational uncertainty, without confusing an attractive use case with
    a deployable operating capability.
  objectives:
    - id: diagnose
      observable_behaviour: >
        Separates data, workflow, capacity, people, and tool-selection
        constraints before proposing scale.
      evidence_in_debrief:
        - ledger.problem_framing
        - evidence.asset-data-readiness
        - evidence.value-stream-map
    - id: sequence
      observable_behaviour: >
        Uses research, pilot, scale, pause, or stop deliberately while keeping
        no more than two pilots/scales active.
      evidence_in_debrief:
        - ledger.lifecycle_decisions
        - portfolio.capacity_history
        - gate.history
    - id: govern
      observable_behaviour: >
        Names accountable owners, evidence, human controls, and a stop/scale
        criterion before operational rollout.
      evidence_in_debrief:
        - ledger.owner_and_gate
        - gate.history
        - initiative.override_and_escalation
    - id: reason_about_tradeoffs
      observable_behaviour: >
        Explains how reliability, quality, energy, workforce, cash, and OEM
        trust can improve or worsen together.
      evidence_in_debrief:
        - causal_rule_explanations
        - stakeholder.history
        - metric_history
    - id: adapt
      observable_behaviour: >
        Revises a plan after evidence, a gate failure, or an adverse event
        without retrospective rationalisation.
      evidence_in_debrief:
        - reflection.checkpoints
        - event.history
        - ledger.changed_assumption
  assessment:
    mode: formative
    scorecard_dimensions:
      - operational_outcomes
      - decision_quality
      - execution_and_sequencing
      - governance
      - stakeholder_and_workforce_health
      - resilience
    prohibited_use: >
      Do not use the pilot scorecard as a high-stakes grade, hiring signal,
      performance rating, or personality assessment.
  prebrief:
    learner_role: >
      Transformation lead proposing a 12-quarter portfolio to the executive
      committee of Project Factory.
    authority_limits: >
      Can commission research, propose pilots and scale plans, and recommend
      pause/stop decisions. Cannot waive safety, data-access, OEM traceability,
      capital, or accountable-owner requirements.
    success_definition: >
      Protect OEM delivery, workforce safety, and financial discipline while
      creating credible operating value and a more resilient transformation
      capability.
    known_unknowns:
      - "Whether plant telemetry and CMMS history are reliable enough for maintenance scale."
      - "Whether quality-image labels reflect the current defect mix at every plant."
      - "Whether technicians will trust and use AI-supported workflows under production pressure."
      - "Whether OEM demand-schedule variance is a data issue, a planning issue, or both."
      - "Which two delivery efforts deserve scarce plant-change capacity first."
  reflection_contract:
    baseline: >
      The five baseline answers are reflection-only. They cannot alter the
      pack facts, seed, events, initiative effects, difficulty, or scorecard.
    checkpoints: [reconstruct, interpret, reframe, transfer]
    AI_reflection_coach: >
      Deferred until after the V3 pilot; not part of this pack or its outcome
      rules.
~~~

## 3. Organisation, trigger, and baseline metrics

### Organisation and trigger

| Element | Authored content |
|---|---|
| Organisation profile | A ₹2,500 Cr automotive-component manufacturer supplying tier-one OEM programmes. Five plants, 7,000 employees, 24×7 production, mixed legacy and modern equipment, and material flow across machining, assembly, inspection, and dispatch. |
| Trigger | Over the last 18 months, equipment downtime is up 12%, scrap/defect pressure is up 8%, and energy cost per produced unit is up 15%. Simultaneously, experienced technicians are retiring and OEMs are tightening traceability, quality, and delivery expectations. |
| Horizon | 12 quarters: four facilitated windows, Q1–Q3, Q4–Q6, Q7–Q9, and Q10–Q12. |
| Non-negotiables | Do not bypass safety controls; do not use unvalidated technician knowledge as operating instruction; do not conceal a quality escape; do not scale a system without an accountable owner and evidence; do not exceed the capital envelope without the defined exception. |
| Starting ambiguity | No single initiative is presented as the right answer. The evidence supports different choices depending on the learner’s problem framing, sequencing, capacity use, and risk controls. |

### Baseline metric dictionary

All baseline values and targets below are expert-calibrated synthetic — provisional.

| ID | Learner-visible label | Unit | Start | Aspirational target by Q12 | Direction / declared range | Accountable role | Reporting lag / caveat |
|---|---|---:|---:|---:|---|---|---|
| `unplanned_downtime_share` | Unplanned downtime | % of scheduled production time | 12.0 | ≤ 7.0 | lower is better; 0–25 | Maintenance lead | Quarterly; severe single-line failures can be masked by network averages. |
| `first_pass_yield` | First-pass yield | % | 91.2 | ≥ 95.0 | higher is better; 70–100 | Quality head | Quarterly; cannot alone reveal false rejects or escaped defects. |
| `escaped_defects_ppm` | Escaped defects | PPM | 1,240 | ≤ 850 | lower is better; 0–3,000 | Quality/OEM lead | Quarterly; confirmed OEM claims lag the production signal. |
| `energy_intensity_index` | Energy per unit | index; Q1 = 100 | 100 | ≤ 88 | lower is better; 70–140 | Energy/operations manager | Monthly rolled to quarter; production mix affects the index. |
| `schedule_adherence` | Material and production schedule adherence | % | 86 | ≥ 93 | higher is better; 50–100 | Supply-chain lead | Quarterly; cannot distinguish supplier delay from planning error alone. |
| `workforce_readiness` | Workforce readiness | 0–100 index | 52 | ≥ 70 | higher is better; 0–100 | Maintenance lead / HR partner | Quarterly pulse and capability evidence; not a survey of employee sentiment alone. |
| `technician_trust` | Technician trust in the changed workflow | 0–100 index | 58 | ≥ 72 | higher is better; 0–100 | Technician representative / maintenance lead | Quarter-end pulse; must be interpreted with adoption and override evidence. |
| `oem_confidence` | OEM confidence | 0–100 index | 68 | ≥ 80 | higher is better; 0–100 | Quality/OEM lead | Quarterly account review; a quality escape can create a sharp temporary decline. |
| `asset_data_readiness` | Asset-data readiness | 0–100 index | 43 | ≥ 75 | higher is better; 0–100 | Data owner | Evidence-based composite; no scale gate should rely on the index alone. |
| `cash_commitment` | Cumulative programme capital committed | ₹ Cr | 0.0 | ≤ 5.0 | lower is not inherently better; 0–5.5 | CFO | Immediate; run cost is tracked separately. |

### Gate-evidence measures

These are learner-visible pilot or readiness measures, not scorecard dimensions. They are declared here so gates and causal rules do not rely on hidden criteria. All starting positions are expert-calibrated synthetic — provisional.

| ID | Label / unit | Starting position | Used by |
|---|---|---:|---|
| `critical_asset_sensor_coverage` | Critical assets with usable sensor history, % | 38 | G-PF-01 |
| `structured_failure_code_coverage` | Work orders with structured failure codes, % | 44 | G-PF-01 |
| `technician_workflow_usefulness` | Technician usability assessment, 0–100 | Not observed before pilot | G-PF-01, CR-PF-01, CR-PF-03 |
| `false_reject_rate` | Flagged good units sent to rework, % | Not observed before pilot | G-PF-02, CR-PF-02 |
| `operator_override_traceability` | Flagged units with documented review/override path, % | Not observed before pilot | G-PF-02, CR-PF-02 |
| `eligible_line_metering_coverage` | Pilot-line energy coverage, % | 54 | G-PF-04 |
| `planner_exception_review_rate` | Priority exceptions reviewed by a named planner, % | Not observed before pilot | G-PF-03 |
| `priority_alert_action_capacity` | Priority supplier alerts within procurement action capacity, % | Not observed before pilot | G-PF-06 |

## 4. Evidence pack

The learner sees evidence progressively. Each artefact is intentionally incomplete; a responsible decision should draw on more than one item.

### PF-E01 — Plant performance dashboard

| Metadata | Value |
|---|---|
| Source type / status | Expert-calibrated synthetic — provisional |
| Author role / version | Operations performance office / 0.1 |
| Confidence | Medium-high for directional pattern; medium for plant-level attribution |
| Availability / format | Q1 / dashboard with accessible data table |
| Informs | Problem framing; maintenance, quality, energy, and capacity decisions |
| Accessibility summary | Network performance worsened across three bottleneck areas; Line M-4 and Line A-2 are disproportionately important. |

**Facts**

- Unplanned downtime rose from 10.7% to 12.0% over 18 months; Line M-4 accounts for 31% of stoppage minutes while contributing 18% of volume.
- First-pass yield is 91.2%; 46% of reported scrap cost originates at two inspection-heavy lines.
- Escaped defects are 1,240 PPM, above the internal escalation threshold of 1,000 PPM.
- Energy intensity is 15% above the prior baseline, with a large variance between comparable shifts.
- Schedule adherence is 86%; late material confirmations and short-notice OEM schedule changes both appear in the dashboard.

**Limitations**

- It shows correlation, not root cause.
- It aggregates different component families and does not reveal whether failures are mechanical, process, supplier, or scheduling driven.
- It does not show technician workarounds, false rejects, or the quality of CMMS failure coding.

### PF-E02 — Asset-data readiness assessment

| Metadata | Value |
|---|---|
| Source type / status | Expert-calibrated synthetic — provisional |
| Author role / version | CIO/data owner with maintenance analyst / 0.1 |
| Confidence | Medium |
| Availability / format | Q1 / assessment table and plant coverage map |
| Informs | Predictive-maintenance research/pilot/scale gate; energy-optimisation telemetry gate |
| Accessibility summary | The most critical assets are not yet consistently identified, sensed, coded, or owned in the data estate. |

**Facts**

- 71% of critical-asset records have a unique asset identifier; only 43% meet the completeness/ownership/readiness index.
- 38% of critical assets have at least six months of usable sensor history; Line M-4 has partial vibration data but irregular sampling.
- Only 44% of CMMS failure codes are in a structured, analysable category; free-text work orders use inconsistent terminology.
- Maintenance planners and the data owner disagree on who approves revised asset hierarchies in two plants.
- Current data-access controls support a limited, read-only pilot but not broader vendor access without a reviewed data-sharing arrangement.

**Limitations**

- Completeness is not accuracy.
- The assessment does not test whether technicians find the current asset hierarchy meaningful.
- A readiness score cannot replace line-specific validation before a pilot or scale decision.

### PF-E03 — Value-stream and change-window map

| Metadata | Value |
|---|---|
| Source type / status | Expert-calibrated synthetic — provisional |
| Author role / version | Plant transformation office / 0.1 |
| Confidence | Medium-high |
| Availability / format | Q1 / process map with capacity notes |
| Informs | Portfolio sequencing; plant integration and frontline-change capacity |
| Accessibility summary | The bottleneck lines have limited safe change windows, and rework, maintenance, and inspection share the same constrained attention. |

**Facts**

- The M-4 machining-to-assembly hand-off has one planned eight-hour maintenance/change window per month; emergency work frequently consumes it.
- Visual inspection on Line Q-2 is followed by a manual rework loop that already consumes quality-engineer attention.
- Introducing a new workflow on two plants in the same quarter would require the same plant-integration lead and shift trainers.
- A supplier hand-off before final assembly causes material re-sequencing when OEM schedules change with less than seven days’ notice.
- The map identifies an existing escalation route for safety and quality, but no equivalent route for AI-alert overrides or knowledge-assistant corrections.

**Limitations**

- It does not quantify every local work practice.
- It should not be used to infer that a change window is automatically available merely because it is planned.
- It cannot resolve whether a technology, process redesign, or staffing action is the appropriate response.

### PF-E04 — Workforce continuity and workflow brief

| Metadata | Value |
|---|---|
| Source type / status | Expert-calibrated synthetic — provisional |
| Author role / version | Maintenance lead and HR business partner / 0.1 |
| Confidence | Medium |
| Availability / format | Q1 / workforce brief, anonymised technician quotations, training-capacity table |
| Informs | Knowledge-assistant gate; maintenance adoption; frontline-change capacity; stakeholder health |
| Accessibility summary | Retirement risk and limited release time make knowledge capture urgent, but technicians will reject a system that adds unvalidated work or reduces safety. |

**Facts**

- 18% of senior maintenance technicians are eligible to retire within 18 months; two of the affected shifts cover M-4 and an inspection-heavy line.
- Only 1.5 trainer-days per plant per quarter are currently protected for workflow change; emergency cover frequently displaces training.
- Technician representatives support documenting troubleshooting knowledge if contributors can review material and if the assistant cannot issue unsafe instructions.
- Existing maintenance alerts are often manually reconciled; technicians report that nuisance alerts reduce trust.
- A pilot champion network can cover one pilot plant and one adjacent plant, not a simultaneous enterprise rollout.

**Limitations**

- It does not measure every technician’s capability or attitude.
- Quotations are illustrative and should not be treated as a representative survey.
- Retirement eligibility is not a prediction of actual departure date.

### PF-E05 — OEM quality, traceability, and delivery brief

| Metadata | Value |
|---|---|
| Source type / status | Expert-calibrated synthetic — provisional |
| Author role / version | Quality/OEM account lead / 0.1 |
| Confidence | Medium-high for contractual constraints; medium for response timing |
| Availability / format | Q2; early excerpts available Q1 / customer brief and traceability checklist |
| Informs | Visual-quality scale gate; event response; OEM-confidence stakeholder rules |
| Accessibility summary | OEMs value speed, but require an auditable response to defects, traceability, and delivery risk. |

**Facts**

- The largest OEM programme requires a documented containment and traceability response within 24 hours of a confirmed quality escape.
- The account team expects sustained PPM improvement before accepting a wider automated inspection workflow; a model score is not sufficient evidence.
- A missed delivery on the top-volume programme would trigger senior review and could reduce confidence in broader digital-transformation claims.
- OEM forecast changes vary materially by programme; the brief does not state whether the variability is avoidable.
- Any AI-supported inspection workflow must retain a named human decision owner and a record of override/rework decisions during pilot.

**Limitations**

- The brief is a learning abstraction, not a legal contract.
- It does not reveal the OEM’s full commercial negotiation position.
- It does not specify a universally correct PPM threshold for every component family.

### PF-E06 — Finance, programme capacity, and value-range brief

| Metadata | Value |
|---|---|
| Source type / status | Expert-calibrated synthetic — provisional |
| Author role / version | CFO transformation office / 0.1 |
| Confidence | Medium; ranges are intentionally broad |
| Availability / format | Q1 / finance memo and capacity table |
| Informs | Capital allocation, active-delivery constraint, CFO stakeholder response, scale cases |
| Accessibility summary | ₹5 Cr is a hard programme-capital envelope; capacity and credible evidence, not money alone, determine what can progress. |

**Facts**

- Cumulative programme capital is capped at ₹5.0 Cr over the 12-quarter exercise; scale investments also create recurring run cost.
- No more than two initiatives may be in pilot or scale simultaneously. Research is allowed but still uses a small amount of data-owner and sponsor attention.
- The indicative value range in a scale case must state assumptions, operating costs, adoption dependencies, and downside—not only gross benefit.
- Capacity available per quarter is shown below. Capacity is not fungible across pools.
- The CFO will consider an exception only for a documented safety, OEM-continuity, or evidence-backed recovery case jointly sponsored by the CFO and COO.

| Capacity pool | Quarterly units available | Meaning |
|---|---:|---|
| Data engineering | 4 | Data extraction, quality remediation, model monitoring, and integration analysis. |
| Plant integration | 3 | Controls/process integration, safe deployment, and line-owner coordination. |
| Frontline change | 3 | Shift release, training, co-design, workflow testing, and adoption support. |
| Governance assurance | 2 | Data-access review, validation, monitoring, incident/override design, and accountable-owner evidence. |

**Limitations**

- Value ranges are hypotheses, not forecasts.
- Capacity units are a planning abstraction and must not be converted into headcount without a real operating plan.
- The brief does not make higher spend synonymous with better learning or outcomes.

### PF-E07 — Governance and accountable-use brief

| Metadata | Value |
|---|---|
| Source type / status | Expert-calibrated synthetic — provisional |
| Author role / version | CIO/CISO/data owner with quality and maintenance representatives / 0.1 |
| Confidence | Medium-high for control themes; medium for effort estimates |
| Availability / format | Q1 / governance brief and gate checklist |
| Informs | All six initiative gates; control boundaries; incident response; decision ledger |
| Accessibility summary | AI may support operational judgement, but every use case needs an owner, a valid data/workflow boundary, monitoring, and an escalation/override route. |

**Facts**

- No initiative may make a safety-critical, maintenance-release, quality-containment, supplier-award, or customer-communication decision without a named human owner.
- Pilot access is read-only and purpose-limited by default; any broader access requires a documented data owner, access review, and retention boundary.
- Every pilot requires a hypothesis, success criteria, a known failure mode, an override/escalation path, and an accountable business owner.
- A scale decision requires evidence from the pilot and confirmation that workflow burden, false alerts/rejects, and monitoring ownership are acceptable.
- Technician-contributed knowledge must be reviewed for safety, IP/confidentiality, and validity before it is presented as guidance.

**Limitations**

- This is an educational control model, not legal advice or a substitute for OEM, safety, data-protection, cybersecurity, or labour obligations.
- Passing a generic checklist does not demonstrate plant-specific safety or model validity.
- The brief does not prescribe a particular AI technology or vendor.

## 5. Portfolio policy and capacity

~~~yaml
portfolio_policy:
  minimum_active_delivery_initiatives: 0
  maximum_active_delivery_initiatives: 2
  lifecycle_states: [deferred, research, pilot, scale, sustain, pause, stop]
  capital_envelope:
    currency: INR_Cr
    amount: 5.0
    scope: "Cumulative programme capital across 12 quarters."
  annual_run_envelope:
    currency: INR_Cr
    amount: 1.2
    scope: "Incremental annualised run cost at the end of the exercise."
  capacity_pools:
    - id: data_engineering
      units_per_quarter: 4
      definition: "Data quality, engineering, model/analytics analysis, and monitoring."
    - id: plant_integration
      units_per_quarter: 3
      definition: "Plant controls/process integration and safe line-owner deployment."
    - id: frontline_change
      units_per_quarter: 3
      definition: "Training, co-design, workflow testing, and shift release."
    - id: governance_assurance
      units_per_quarter: 2
      definition: "Data access, validation, controls, monitoring, and incident/override design."
  exception_policy: >
    A capital or active-delivery exception requires joint CFO and COO approval,
    written rationale in the ledger, an identified safety/OEM-continuity or
    evidence-backed recovery case, and a compensating capacity plan. An
    exception cannot waive a governance or safety gate.
~~~

### Lifecycle interpretation

| State | Learner meaning | Capacity rule |
|---|---|---|
| Deferred | Acknowledged but not actively pursued. | No active-delivery slot; no direct benefit. |
| Research | Test the problem, data, workflow, owner, and value hypothesis. | Small stated capacity use; does not count as one of two active pilot/scale slots. |
| Pilot | Test a constrained workflow with success criteria and an override route. | Counts as one active-delivery slot. |
| Scale | Expand an approved pilot into eligible operational workflow. | Counts as one active-delivery slot and requires a named gate. |
| Sustain | Operate, monitor, retrain/revalidate, and improve an established capability. | Uses declared run/monitoring capacity but does not automatically occupy a pilot/scale slot. |
| Pause | Stop expansion while retaining a safe, explainable state and a review point. | Releases future growth capacity; may retain limited run/exit effort. |
| Stop | Retire the work safely and record learning, debt, or handover. | Releases capacity after stated exit obligations. |

## 6. Initiative delivery profiles

### PF-I01 — Predictive maintenance

~~~yaml
initiative:
  id: predictive-maintenance
  name: "Predictive maintenance for critical assets"
  value_hypothesis: >
    If the factory first improves critical-asset data and co-designs a
    technician-reviewed alert workflow, then it can reduce avoidable
    unplanned downtime because earlier, trusted signals allow planned
    intervention before selected failure modes escalate.
  lifecycle:
    allowed_transitions:
      [deferred_to_research, research_to_pilot, pilot_to_scale,
       scale_to_sustain, any_to_pause, pause_to_resume, any_to_stop]
    time_to_signal_quarters: 1
  cost_inr_cr:
    research_capital: 0.25
    pilot_capital: 0.70
    scale_capital: 1.45
    quarterly_run_cost: 0.18
    change_assurance_effort: 0.12
  capacity_required:
    research: { data_engineering: 1, governance_assurance: 1 }
    pilot: { data_engineering: 2, plant_integration: 1, frontline_change: 1, governance_assurance: 1 }
    scale: { data_engineering: 2, plant_integration: 2, frontline_change: 2, governance_assurance: 1 }
  dependencies:
    - asset-data-readiness
    - technician-workflow-test
  evidence_required: [PF-E01, PF-E02, PF-E03, PF-E04, PF-E07]
  owner_role: "Maintenance lead"
  affected_stakeholders: [maintenance_technician, coo_plant_manager, cfo, cio_ciso_data_owner]
  control_boundary: >
    The system prioritises review of selected maintenance signals. The
    maintenance lead or delegated technician decides whether to inspect,
    schedule, defer, or override. It cannot issue a safety release, bypass a
    lockout/tagout step, or close a work order automatically. Nuisance alerts,
    unsafe advice, and persistent overrides escalate to the maintenance lead
    and data owner.
  pilot_success_criteria:
    - "Critical-asset data/readiness evidence is accepted for the pilot line."
    - "At least 70% of pilot alerts receive a documented review or override reason."
    - "Technician workflow test shows alert usefulness at or above 60/100."
    - "No unresolved safety-control breach or material data-access issue."
  scale_gate: [G-PF-01]
  stop_or_pause_criteria:
    - "False-alert or unreviewed-alert rate remains above 25% for two quarters."
    - "Technician trust falls below 50 without a credible recovery plan."
    - "Asset-data ownership or access control cannot be resolved."
  known_risks:
    - "Poor failure codes and incomplete sensing create misleading correlations."
    - "Alert volume can shift work from planned maintenance to unplanned triage."
    - "Scaling before workflow adoption can damage trust and capacity."
~~~

### PF-I02 — AI visual quality inspection

~~~yaml
initiative:
  id: visual-quality
  name: "AI visual quality inspection"
  value_hypothesis: >
    If labelled images, lighting/camera conditions, and an operator-owned
    override/rework route are validated on a high-defect line, then the
    factory can improve first-pass yield and reduce escaped defects because
    repeatable inspection support identifies selected defects earlier.
  lifecycle:
    allowed_transitions:
      [deferred_to_research, research_to_pilot, pilot_to_scale,
       scale_to_sustain, any_to_pause, pause_to_resume, any_to_stop]
    time_to_signal_quarters: 1
  cost_inr_cr:
    research_capital: 0.20
    pilot_capital: 0.65
    scale_capital: 1.15
    quarterly_run_cost: 0.14
    change_assurance_effort: 0.16
  capacity_required:
    research: { data_engineering: 1, plant_integration: 1, governance_assurance: 1 }
    pilot: { data_engineering: 2, plant_integration: 1, frontline_change: 1, governance_assurance: 1 }
    scale: { data_engineering: 1, plant_integration: 2, frontline_change: 2, governance_assurance: 1 }
  dependencies:
    - labelled-defect-image-set
    - inspection-override-route
    - oem-traceability-review
  evidence_required: [PF-E01, PF-E03, PF-E05, PF-E07]
  owner_role: "Quality head"
  affected_stakeholders: [quality_oem_lead, coo_plant_manager, maintenance_technician, cio_ciso_data_owner]
  control_boundary: >
    The system flags suspected defects for an operator/quality decision. A
    quality owner decides containment, rework, release, or escalation. It
    cannot automatically release product, suppress a confirmed defect, or
    replace OEM containment requirements. False rejects, escapes, and
    override patterns are monitored and escalated.
  pilot_success_criteria:
    - "Representative labelled images and stable capture conditions are documented."
    - "False-reject rate is at or below 8% during the pilot review period."
    - "Operators record review/override reasons for at least 75% of flagged units."
    - "Traceability and containment path pass the quality-owner review."
  scale_gate: [G-PF-02]
  stop_or_pause_criteria:
    - "False rejects exceed 12% for two consecutive quarters."
    - "A quality escape is linked to an unreviewed or undocumented workflow failure."
    - "Lighting, camera, or product-mix changes invalidate the pilot evidence."
  known_risks:
    - "A higher detection rate can initially increase rework and reduce throughput."
    - "Biased or stale labels can move defects between false-negative and false-positive failure modes."
    - "OEM trust depends on traceability and containment, not only a model metric."
~~~

### PF-I03 — Demand forecasting and inventory alignment

~~~yaml
initiative:
  id: demand-forecasting
  name: "Demand forecasting and inventory alignment"
  value_hypothesis: >
    If planners reconcile OEM schedules, inventory masters, and supplier
    constraints in a common review workflow, then the factory can improve
    schedule adherence and reduce avoidable expedites because forecast
    signals are paired with accountable planning action.
  lifecycle:
    allowed_transitions:
      [deferred_to_research, research_to_pilot, pilot_to_scale,
       scale_to_sustain, any_to_pause, pause_to_resume, any_to_stop]
    time_to_signal_quarters: 2
  cost_inr_cr:
    research_capital: 0.15
    pilot_capital: 0.45
    scale_capital: 0.85
    quarterly_run_cost: 0.11
    change_assurance_effort: 0.10
  capacity_required:
    research: { data_engineering: 1, governance_assurance: 1 }
    pilot: { data_engineering: 1, plant_integration: 1, frontline_change: 1, governance_assurance: 1 }
    scale: { data_engineering: 1, plant_integration: 1, frontline_change: 2, governance_assurance: 1 }
  dependencies:
    - oem-schedule-quality
    - inventory-master-reconciliation
    - planner-action-workflow
  evidence_required: [PF-E01, PF-E03, PF-E05, PF-E06, PF-E07]
  owner_role: "Supply-chain planning lead"
  affected_stakeholders: [cfo, coo_plant_manager, quality_oem_lead, cio_ciso_data_owner]
  control_boundary: >
    The system produces forecast and exception signals. Planners decide
    purchase, inventory, production-sequence, or escalation actions. It
    cannot place orders, commit delivery dates, or override an OEM schedule
    without authorised planner approval. Material-risk exceptions escalate to
    the supply-chain lead.
  pilot_success_criteria:
    - "At least two OEM programme feeds and the inventory master are reconciled."
    - "Planner review occurs for at least 80% of material-risk exceptions."
    - "Forecast bias and exception explanations are visible by programme."
    - "Supplier and procurement escalation owners accept the workflow."
  scale_gate: [G-PF-03]
  stop_or_pause_criteria:
    - "Schedule-quality evidence remains unresolved after the research window."
    - "Planner adoption is below 50% or exceptions cannot be acted on."
    - "The workflow systematically increases stock-outs or unapproved inventory build."
  known_risks:
    - "A confident forecast can obscure data-quality or commercial-schedule uncertainty."
    - "Value depends on supplier and procurement response capacity outside the model."
    - "Inventory reduction can conflict with resilience during disruption."
~~~

### PF-I04 — Energy optimisation

~~~yaml
initiative:
  id: energy-optimisation
  name: "Energy optimisation for production operations"
  value_hypothesis: >
    If metering, production-load context, and a safe operator-override policy
    are established, then the factory can reduce energy intensity because
    operators can identify and manage avoidable consumption without
    compromising output, maintenance windows, or equipment care.
  lifecycle:
    allowed_transitions:
      [deferred_to_research, research_to_pilot, pilot_to_scale,
       scale_to_sustain, any_to_pause, pause_to_resume, any_to_stop]
    time_to_signal_quarters: 1
  cost_inr_cr:
    research_capital: 0.20
    pilot_capital: 0.55
    scale_capital: 0.95
    quarterly_run_cost: 0.12
    change_assurance_effort: 0.10
  capacity_required:
    research: { data_engineering: 1, plant_integration: 1 }
    pilot: { data_engineering: 1, plant_integration: 1, frontline_change: 1, governance_assurance: 1 }
    scale: { data_engineering: 1, plant_integration: 2, frontline_change: 1, governance_assurance: 1 }
  dependencies:
    - metering-coverage
    - production-load-context
    - safe-override-policy
  evidence_required: [PF-E01, PF-E02, PF-E03, PF-E06, PF-E07]
  owner_role: "Energy and operations manager"
  affected_stakeholders: [coo_plant_manager, cfo, maintenance_technician, cio_ciso_data_owner]
  control_boundary: >
    The system recommends operating or scheduling adjustments within approved
    safe ranges. The operations owner decides whether to apply, defer, or
    override a recommendation. It cannot alter machine setpoints, maintenance
    windows, or production commitments automatically. Safety, throughput, and
    equipment-protection overrides are logged.
  pilot_success_criteria:
    - "Metering covers at least 70% of pilot-line energy use."
    - "Production-load context is available for pilot analysis."
    - "Operators can execute and log a safe override."
    - "No sustained throughput or maintenance-window degradation is attributed to the pilot."
  scale_gate: [G-PF-04]
  stop_or_pause_criteria:
    - "Telemetry coverage or production-context data is materially unreliable."
    - "Recommended action conflicts repeatedly with safety, throughput, or maintenance controls."
    - "Energy gains are not separable from production-mix shifts."
  known_risks:
    - "Energy reduction without production context can be a misleading proxy for value."
    - "Aggressive optimisation can defer necessary maintenance or reduce throughput."
    - "Benefits are exposed to energy-price and product-mix uncertainty."
~~~

### PF-I05 — Technician knowledge assistant

~~~yaml
initiative:
  id: knowledge-assistant
  name: "Technician knowledge assistant"
  value_hypothesis: >
    If experienced technicians review curated troubleshooting knowledge and a
    clear safety/IP boundary is enforced, then the factory can improve
    workforce readiness and maintenance adoption because useful knowledge is
    easier to find, challenge, correct, and transfer across shifts.
  lifecycle:
    allowed_transitions:
      [deferred_to_research, research_to_pilot, pilot_to_scale,
       scale_to_sustain, any_to_pause, pause_to_resume, any_to_stop]
    time_to_signal_quarters: 1
  cost_inr_cr:
    research_capital: 0.18
    pilot_capital: 0.45
    scale_capital: 0.70
    quarterly_run_cost: 0.10
    change_assurance_effort: 0.18
  capacity_required:
    research: { data_engineering: 1, frontline_change: 1, governance_assurance: 1 }
    pilot: { data_engineering: 1, frontline_change: 2, governance_assurance: 1 }
    scale: { data_engineering: 1, frontline_change: 2, governance_assurance: 1 }
  dependencies:
    - technician-champion-network
    - reviewed-knowledge-set
    - safety-ip-boundary
  evidence_required: [PF-E02, PF-E04, PF-E07]
  owner_role: "Maintenance lead with technician representative"
  affected_stakeholders: [maintenance_technician, coo_plant_manager, cio_ciso_data_owner, cfo]
  control_boundary: >
    The assistant retrieves approved guidance and records feedback. A
    technician and maintenance owner decide whether guidance is applicable.
    It cannot issue a safety instruction, close a work order, disclose
    restricted information, or claim that a procedure is approved. Unsafe,
    stale, or disputed content is withdrawn and escalated for review.
  pilot_success_criteria:
    - "A technician-review panel approves the initial knowledge set and feedback process."
    - "At least 60% of pilot users rate retrieved content as useful or correctable."
    - "Every retrieved item displays source/review status and an escalation route."
    - "No unreviewed safety or confidential content is presented as guidance."
  scale_gate: [G-PF-05]
  stop_or_pause_criteria:
    - "Technician representative withdraws support because review time or safety boundary is not maintained."
    - "Repeated unsafe, stale, or confidential responses are unresolved."
    - "Usage is low because the workflow does not fit shift conditions."
  known_risks:
    - "A fluent answer can appear more authoritative than its validation status warrants."
    - "Capturing knowledge without recognition, review time, or ownership harms trust."
    - "Operational value is indirect unless maintenance and workflow adoption improve."
~~~

### PF-I06 — Supply-chain risk monitoring

~~~yaml
initiative:
  id: supply-chain-risk-monitoring
  name: "Supply-chain risk monitoring"
  value_hypothesis: >
    If supplier lead-time, quality, and schedule signals are connected to a
    named procurement escalation workflow, then the factory can protect
    schedule adherence because emerging disruptions are identified early
    enough for accountable mitigation rather than passive alerting.
  lifecycle:
    allowed_transitions:
      [deferred_to_research, research_to_pilot, pilot_to_scale,
       scale_to_sustain, any_to_pause, pause_to_resume, any_to_stop]
    time_to_signal_quarters: 2
  cost_inr_cr:
    research_capital: 0.15
    pilot_capital: 0.40
    scale_capital: 0.90
    quarterly_run_cost: 0.12
    change_assurance_effort: 0.12
  capacity_required:
    research: { data_engineering: 1, governance_assurance: 1 }
    pilot: { data_engineering: 1, frontline_change: 1, governance_assurance: 1 }
    scale: { data_engineering: 1, plant_integration: 1, frontline_change: 1, governance_assurance: 1 }
  dependencies:
    - supplier-data-sharing
    - procurement-escalation-workflow
    - demand-schedule-context
  evidence_required: [PF-E01, PF-E03, PF-E05, PF-E06, PF-E07]
  owner_role: "Procurement and supply-chain lead"
  affected_stakeholders: [cfo, coo_plant_manager, quality_oem_lead, cio_ciso_data_owner]
  control_boundary: >
    The system identifies supplier-risk signals and suggests a review
    priority. Procurement decides any supplier contact, alternative source,
    inventory buffer, or delivery communication. It cannot change supplier
    awards, commercial terms, or OEM commitments automatically. Material
    exceptions escalate through the procurement owner.
  pilot_success_criteria:
    - "Pilot suppliers have agreed data-sharing and contact/escalation rules."
    - "Procurement reviews at least 80% of priority signals within the agreed window."
    - "Signals can be linked to a documented mitigation or justified no-action decision."
    - "Alert volume is within the team’s stated action capacity."
  scale_gate: [G-PF-06]
  stop_or_pause_criteria:
    - "Supplier data-sharing is unreliable or lacks a lawful/approved basis."
    - "Priority alerts repeatedly exceed procurement action capacity."
    - "No mitigation pathway exists for the dominant risk categories."
  known_risks:
    - "More alerts without action capacity create fatigue, not resilience."
    - "A risk score can obscure commercial, relationship, or quality context."
    - "Inventory buffers may protect delivery while harming working capital."
~~~

## 7. Stakeholders and governance gates

### Stakeholder definitions and declared response rules

| ID / role | Priorities | Red lines | Influence / signals | Declared response rules |
|---|---|---|---|---|
| `cfo` — CFO transformation sponsor | Realised operating value, cash discipline, credible downside, funded run model | Uncontrolled capital overrun; scale case with no owner, evidence, or cost-to-run view | High; `cash_commitment`, value hypothesis, portfolio capacity | `SR-CFO-01`: support rises only when capital, run cost, owner, and gate evidence are visible. `SR-CFO-02`: third pilot/scale or capital exception is blocked without joint evidence-backed recovery case. |
| `coo_plant_manager` — COO and plant managers | On-time output, safe change windows, line stability, usable workflow | Disruptive scale during an unavailable change window; bypassed safety/line-owner approval | High; downtime, schedule adherence, plant integration capacity | `SR-COO-01`: scale is limited when no line owner/change window exists. `SR-COO-02`: resilient response improves support after an event if production and safety trade-offs are made explicit. |
| `quality_oem_lead` — Quality head and OEM account lead | First-pass yield, containment, traceability, escaped-defect avoidance, OEM confidence | Untraceable inspection decision; concealed quality escape; automatic product release | High; FPY, PPM, OEM confidence | `SR-QUAL-01`: visual-quality scale is blocked without traceability/override evidence. `SR-QUAL-02`: a confirmed escape reduces OEM confidence until documented containment and learning evidence exists. |
| `maintenance_technician` — Maintenance lead and technician representative | Safe, useful maintenance work, respect for expertise, protected training/review time | Unsafe or unreviewed advice; imposed alert workflow; removal of human override | High; technician trust, workforce readiness, maintenance adoption | `SR-MAINT-01`: trust rises from usable, reviewed workflow and feedback closure. `SR-MAINT-02`: nuisance alerts or unreviewed knowledge reduce trust and can limit maintenance scale. |
| `cio_ciso_data_owner` — CIO/CISO/data owner | Data quality, access boundary, cyber/operational security, monitoring ownership | Unapproved data access; unknown data owner; no incident/escalation route | High; asset-data readiness, gate history, control evidence | `SR-DATA-01`: access expansion pauses until ownership/control evidence is complete. `SR-DATA-02`: a pilot with documented controls may proceed with constrained access even when enterprise scale is not ready. |

### Governance gates

Each gate is a serializable, learner-visible proposal. Thresholds are synthetic — provisional and must be implemented as declared conditions rather than narrative judgement.

#### G-PF-01 — Predictive-maintenance scale readiness

~~~yaml
governance_gate:
  id: G-PF-01
  applies_to: [predictive-maintenance.scale]
  owner_role: maintenance_lead
  required_evidence: [PF-E02, PF-E03, PF-E04, PF-E07]
  conditions:
    - "asset_data_readiness >= 70"
    - "critical_asset_sensor_coverage >= 70%"
    - "structured_failure_code_coverage >= 65%"
    - "technician_workflow_usefulness >= 60/100"
    - "named override and escalation owner exists"
  on_failure: limit_to_pilot_or_pause
  explanation: >
    Maintenance value requires credible asset context and a technician-usable
    workflow; an attractive downtime case alone is not enough to scale.
~~~

#### G-PF-02 — Visual-quality inspection scale readiness

~~~yaml
governance_gate:
  id: G-PF-02
  applies_to: [visual-quality.scale]
  owner_role: quality_head
  required_evidence: [PF-E01, PF-E03, PF-E05, PF-E07]
  conditions:
    - "representative labelled defect set reviewed by quality owner"
    - "capture conditions documented for the eligible line"
    - "false_reject_rate <= 8%"
    - "operator override and rework traceability >= 75%"
    - "OEM containment path and accountable release owner confirmed"
  on_failure: remain_in_pilot_or_pause
  explanation: >
    Quality automation may expand only when it improves detection without
    hiding false rejects, eroding traceability, or replacing release authority.
~~~

#### G-PF-03 — Demand-forecasting pilot readiness

~~~yaml
governance_gate:
  id: G-PF-03
  applies_to: [demand-forecasting.pilot]
  owner_role: supply_chain_planning_lead
  required_evidence: [PF-E01, PF-E03, PF-E05, PF-E06, PF-E07]
  conditions:
    - "two OEM programme schedules reconciled with inventory master"
    - "planner owner and procurement escalation route named"
    - "forecast bias and exception explanation view available"
    - "supplier-data use approved for pilot purpose"
  on_failure: remain_in_research
  explanation: >
    Forecasting is not ready for pilot if the inputs cannot be reconciled or
    if no planner can act on the exceptions it will create.
~~~

#### G-PF-04 — Energy-optimisation scale readiness

~~~yaml
governance_gate:
  id: G-PF-04
  applies_to: [energy-optimisation.scale]
  owner_role: energy_operations_manager
  required_evidence: [PF-E01, PF-E02, PF-E03, PF-E07]
  conditions:
    - "eligible-line metering coverage >= 70%"
    - "production-load context available for the pilot"
    - "safe operator override policy tested"
    - "no unresolved throughput, maintenance-window, or equipment-protection conflict"
  on_failure: remain_in_pilot_or_pause
  explanation: >
    Energy recommendations must be interpretable in production context and
    safely overrideable; lower energy use alone is not a scale justification.
~~~

#### G-PF-05 — Knowledge-assistant pilot readiness

~~~yaml
governance_gate:
  id: G-PF-05
  applies_to: [knowledge-assistant.pilot]
  owner_role: maintenance_lead
  required_evidence: [PF-E04, PF-E07]
  conditions:
    - "technician review panel and feedback owner named"
    - "initial knowledge sources reviewed for safety, IP, and confidentiality"
    - "content provenance and withdrawal route visible to users"
    - "no system action may be presented as a safety instruction"
  on_failure: remain_in_research
  explanation: >
    Capturing expertise is not sufficient. The pilot requires a human review
    and correction process that protects contributors and users.
~~~

#### G-PF-06 — Supply-chain risk-monitoring scale readiness

~~~yaml
governance_gate:
  id: G-PF-06
  applies_to: [supply-chain-risk-monitoring.scale]
  owner_role: procurement_supply_chain_lead
  required_evidence: [PF-E03, PF-E05, PF-E06, PF-E07]
  conditions:
    - "supplier data-sharing basis and retention boundary documented"
    - "procurement owner and escalation route named"
    - "priority alert volume is within stated action capacity"
    - "demand-schedule context linked to top supplier-risk signals"
  on_failure: remain_in_pilot_or_pause
  explanation: >
    A risk-monitoring scale case is credible only when the organisation can
    lawfully receive, interpret, and act on the signals.
~~~

## 8. Causal rules and conditional event

The three rules below are deliberately limited reference shapes. They must resolve from declared state, a recorded seed, and bounded values—not from scenario-specific code or an LLM.

### CR-PF-01 — Delayed maintenance benefit

~~~yaml
causal_rule:
  id: CR-PF-01
  name: "Delayed, technician-mediated reliability benefit"
  when:
    - "initiative.predictive-maintenance.lifecycle in [pilot, scale]"
    - "gate.G-PF-01 is passed for scale, or pilot readiness is accepted"
    - "technician_workflow_usefulness >= 60/100"
  after_quarters: 1
  uncertainty:
    distribution: seeded-range
    min: -2.2
    max: -1.0
    unit: "percentage points of unplanned_downtime_share"
    seed_scope: "pack-run-rule"
  effects:
    - { metric: unplanned_downtime_share, delta: "sampled_value" }
    - { metric: technician_trust, delta_range: [1, 3] }
    - { metric: workforce_readiness, delta_range: [0, 2] }
  boundary:
    - "No effect may take unplanned downtime below the declared metric floor."
    - "Pilot effect is constrained to the named eligible line; scale may widen eligibility only after G-PF-01."
  explanation: >
    Earlier review can reduce selected avoidable stoppages after technicians
    have a usable workflow. It does not promise that every failure is
    predictable or that a model replaces maintenance judgement.
~~~

### CR-PF-02 — Visual-quality benefit with false-reject trade-off

~~~yaml
causal_rule:
  id: CR-PF-02
  name: "Quality improvement with workflow-sensitive false rejects"
  when:
    - "initiative.visual-quality.lifecycle in [pilot, scale]"
    - "labelled image and capture-condition evidence is available"
  after_quarters: 1
  uncertainty:
    distribution: seeded-range
    seed_scope: "pack-run-rule"
  effects:
    - { metric: first_pass_yield, delta_range: [0.6, 1.4], condition: "false_reject_rate <= 8%" }
    - { metric: escaped_defects_ppm, delta_range: [-140, -80], condition: "operator override/rework traceability >= 75%" }
    - { metric: first_pass_yield, delta_range: [-1.5, -0.5], condition: "false_reject_rate > 8%" }
    - { metric: oem_confidence, delta_range: [-5, -2], condition: "false_reject_rate > 12% or quality escape not contained" }
    - { capacity_pool: frontline_change, delta_range: [-1, -1], condition: "false_reject_rate > 8%" }
  boundary:
    - "The rule may not assert an OEM response without the stated traceability/containment condition."
    - "False-reject and escaped-defect mechanisms remain visible separately."
  explanation: >
    Earlier defect detection can improve quality, but poor labels, capture
    conditions, or workflow design can shift cost into rework and damage OEM
    confidence. A single model-accuracy figure is insufficient.
~~~

### CR-PF-03 — Knowledge and maintenance dependency

~~~yaml
causal_rule:
  id: CR-PF-03
  name: "Knowledge-supported maintenance adoption"
  when:
    - "initiative.knowledge-assistant.lifecycle in [pilot, scale, sustain]"
    - "initiative.predictive-maintenance.lifecycle in [pilot, scale, sustain]"
    - "gate.G-PF-05 is passed"
    - "technician review and feedback closure are active"
  after_quarters: 2
  uncertainty:
    distribution: seeded-range
    min: 3
    max: 7
    unit: "workforce_readiness points"
    seed_scope: "pack-run-rule"
  effects:
    - { metric: workforce_readiness, delta: "sampled_value" }
    - { metric: technician_trust, delta_range: [2, 5] }
    - { metric: unplanned_downtime_share, delta_range: [-0.8, -0.3], condition: "technician_workflow_usefulness >= 60/100" }
  boundary:
    - "The knowledge assistant alone cannot reduce downtime through this rule."
    - "If technician review is withdrawn, future dependency benefits stop and trust may fall through SR-MAINT-02."
  explanation: >
    Reviewed knowledge can strengthen the human workflow that turns maintenance
    signals into action. It is a dependency and adoption mechanism, not an
    autonomous maintenance system.
~~~

### EV-PF-01 — Critical line failure

~~~yaml
event:
  id: EV-PF-01
  name: "Critical line failure on M-4"
  trigger:
    - "quarter >= 4"
    - "unplanned_downtime_share > 11%"
    - "asset_data_readiness < 70 or initiative.predictive-maintenance.lifecycle not_in [scale, sustain]"
  eligibility: >
    Evaluate once per run after Q4. The event is not eligible if the
    maintenance scale gate is passed, eligible-line workflow is operating, and
    downtime has remained at or below 9% for the preceding quarter.
  uncertainty:
    probability_when_eligible: 0.35
    seed_scope: "pack-run-event"
    recorded_fields: [seed, eligibility_conditions, sampled_result]
  evidence_revealed: [PF-E02, PF-E03, PF-E04]
  choices:
    - id: emergency-repair
      cost_inr_cr: 0.65
      rule_references: [ER-PF-01]
      trade_off: >
        Restores near-term output sooner but consumes the planned change window,
        adds overtime pressure, and can defer data/workflow remediation.
    - id: controlled-contingency-and-root-cause
      cost_inr_cr: 0.40
      rule_references: [ER-PF-02]
      trade_off: >
        Accepts a short-term delivery/throughput hit while preserving a
        structured root-cause, asset-data, and maintenance-workflow recovery.
    - id: protect-output-and-defer
      cost_inr_cr: 0.10
      rule_references: [ER-PF-03]
      trade_off: >
        Minimises immediate intervention cost but leaves the underlying
        reliability and workforce burden exposed.
  response_rule_shapes:
    - id: ER-PF-01
      effects:
        - "schedule_adherence: -3 to -1 now"
        - "cash_commitment: +0.65"
        - "capacity_pool.frontline_change: -1 for the next quarter"
        - "asset_data_readiness: no direct improvement"
    - id: ER-PF-02
      effects:
        - "schedule_adherence: -5 to -2 now"
        - "asset_data_readiness: +5 to +9 after one quarter"
        - "technician_trust: +1 to +3 if representatives are included"
        - "predictive-maintenance gate evidence: recovery evidence becomes available"
    - id: ER-PF-03
      effects:
        - "schedule_adherence: -2 to 0 now"
        - "unplanned_downtime_share: +1 to +3 after one quarter"
        - "technician_trust: -2 to -5"
        - "oem_confidence: -2 to -4 if a delivery commitment is missed"
  debrief_explanation: >
    The event is a consequence of the declared reliability and readiness
    conditions, not a punishment for a baseline answer. The debrief should
    distinguish the unavoidable shock from the learner's response quality,
    evidence use, and resilience choices.
~~~

## 9. Formative scorecard, reflection, and fixtures

### Operational-value attribution model

Project Factory V3 does not use a generic, independently compounding ROI metric. When it displays an estimated operating-value range, the report must state the operational source, time horizon, cost basis, evidence status, and uncertainty. All mappings below are expert-calibrated synthetic — provisional.

| Operating signal | Permitted value mechanism | Required evidence / limitation | Report boundary |
|---|---|---|---|
| Lower unplanned downtime | Eligible production time recovered, adjusted by declared contribution-margin and recovery-cost assumptions. | Line eligibility, maintenance workflow evidence, planned/unplanned distinction. | Do not claim recovered output when demand, labour, or a bottleneck prevents conversion. |
| Lower escaped defects / higher first-pass yield | Avoided scrap, rework, containment, and selected expedited-quality costs. | Traceability, rework cost range, containment history, false-reject effect. | Do not net quality savings against an undisclosed false-reject or customer-claim exposure. |
| Lower energy intensity | Metered energy-use reduction multiplied by a stated price range and production context. | Meter coverage, production-load context, product-mix caveat. | Do not call an index movement a saving when the production mix changed without evidence. |
| Higher schedule adherence | Avoided expedite, disruption, or inventory-buffer cost within stated assumptions. | Supplier/plan exception, procurement action, inventory and delivery evidence. | Do not claim avoided lost revenue unless an eligible missed-delivery exposure is evidenced. |
| Workforce readiness / technician trust | Leading indicator only; it may enable later reliability or quality value through an authored dependency rule. | Training/review participation, workflow usefulness, feedback closure. | Do not convert trust or knowledge use directly into cash value. |

Capital, recurring run cost, crisis/event cost, and exit/pause cost must be shown separately. A value result is labelled **observed**, **estimated**, or **not yet observable**; it never grows simply because an initiative remained funded.

### Scorecard dimensions

No composite score is shown in the first pilot. Each dimension displays one of **Evidence of strength**, **Mixed evidence**, **Needs attention**, or **Not yet observable**, followed by learner-visible support.

| Dimension | Objective | Learner-visible evidence | Formative feedback rule |
|---|---|---|---|
| Operational outcomes | Protect and improve the most relevant operational measures without breaching non-negotiables. | Metric trends, targets, event impact, line/plant scope. | Do not reward an outcome that required bypassing a stated safety, quality, or governance boundary. Explain adverse seeded-event impact separately. |
| Decision quality | Form a defensible view from incomplete evidence and explicit assumptions. | Evidence opened/used, ledger rationale, prediction, unresolved assumption. | Stronger when the learner compares sources and names uncertainty; never score the learner’s baseline posture. |
| Execution and sequencing | Use lifecycle, capacity, budget, and dependencies coherently. | Lifecycle history, active-delivery count, capacity/capital history, pause/stop decisions. | Stronger when research/pilot/scale timing follows evidence and capacity rather than when the greatest number of initiatives is funded. |
| Governance | Make ownership, control boundaries, gates, monitoring, and escalation operational. | Gate results, named owners, override/escalation paths, evidence status. | A blocked gate with a reasoned repair plan can be better evidence than premature scale. |
| Stakeholder and workforce health | Protect viable adoption, technician trust, quality/OEM confidence, and accountable support. | Stakeholder state, trust/readiness, traceability/feedback evidence. | Do not infer sentiment from a metric alone; show the declared stakeholder rule and relevant evidence. |
| Resilience | Respond to disruption by protecting essentials and adapting the plan. | Event response, revised assumption, recovery path, continuity and capacity effects. | Stronger when the learner acknowledges trade-offs and creates a credible recovery path; not merely when the event does not occur. |

### Four guided reflection checkpoints

| Phase / timing | Prompt | Required evidence boundary | Stored output |
|---|---|---|---|
| Reconstruct — end of Window 1 (Q1–Q3) | “What problem did you decide to address first, what result did you predict, and which two evidence items mattered most?” | Visible initial evidence, lifecycle plan, ledger prediction. | Shared team response or private solo note; factual reconstruction and prediction. |
| Interpret — end of Window 2 (Q4–Q6) | “What evidence supported or challenged your initial hypothesis? Which assumption now needs qualification?” | Actual metric change, gate result, event explanation if present. | Supported/challenged assumption and evidence reference. |
| Reframe — end of Window 3 (Q7–Q9) | “What will you continue, pause, stop, or redesign? What capacity, stakeholder, or control trade-off makes that necessary?” | Portfolio/capacity state, stakeholder signals, ledger and gate history. | Next adjustment and explicit trade-off. |
| Transfer — final debrief (Q10–Q12) | “What decision principle would you take to a real transformation? Name one action, the trigger that would make you act, and the measure you would review.” | Full learner-visible ledger, scorecard evidence, outcomes, baseline comparison. | Learner-owned action, trigger, and metric; not used to score or alter future outcomes. |

### Baseline-to-debrief comparison prompts

| Reflection-only baseline dimension | Relevant V3 evidence | Final neutral prompt |
|---|---|---|
| People and workflow change | Training/change capacity, technician trust, knowledge/maintenance adoption | “What evidence strengthened or changed your view of people enablement?” |
| Speed and assurance | Lifecycle pace, gates met/repaired, event response | “When did speed help, and when did assurance protect value?” |
| Governance before scale | Owner, control, validation, and gate history | “Which governance action made a business decision possible or safer?” |
| Portfolio balance | Active initiatives, capacity allocation, deferred work | “Did focus or breadth create more value in this context?” |
| CFO communication confidence | Value hypothesis, capital/run costs, predicted and actual result | “What would you now say differently in a CFO conversation?” |

### Known-seed fixtures for later implementation

These fixtures define deterministic expectations once the V3 schema and resolver exist. They are not tests of current application code.

| Fixture | Pack / seed | Start and decisions | Expected explained outcome |
|---|---|---|---|
| `PFV3-KS-01` | `0.1.0-provisional` / seed `203007` | Q1: research predictive maintenance and knowledge assistant; Q2: pilot knowledge assistant only after G-PF-05; Q3: pilot predictive maintenance after local readiness repair; Q4–Q5: retain pilots, record alert/workflow evidence; Q6: scale predictive maintenance only if G-PF-01 passes. | At no point are more than two pilot/scale initiatives active. CR-PF-01 becomes eligible after the pilot conditions are met. If G-PF-01 fails, scale is limited and the ledger gives the missing evidence. EV-PF-01 is not eligible if the declared maintenance readiness/outcome conditions have been achieved. |
| `PFV3-KS-02` | `0.1.0-provisional` / seed `203011` | Q1–Q2: research then pilot visual quality on Q-2 with traceability evidence; Q3: operator override completion reaches 80% and false rejects are 7%; Q4: request scale through G-PF-02. | CR-PF-02 can improve first-pass yield and reduce escaped defects within its bounded seeded range. Scale is allowed only if the stated gate evidence is recorded; outcome explanation mentions both detection and false-reject exposure. |
| `PFV3-KS-03` | `0.1.0-provisional` / seed `203019` | Leave predictive maintenance deferred; hold asset-data readiness below 70; after Q4 meet EV-PF-01 eligibility and select controlled contingency and root cause. | The event result is determined only by the recorded seed after eligibility. ER-PF-02 produces the documented short-term continuity trade-off and later recovery evidence; the resilience dimension refers to response quality rather than treating the event as a baseline penalty. |

### Negative fixtures for later implementation

| Fixture | Invalid condition | Expected validation |
|---|---|---|
| `PFV3-NG-01` | Learner requests predictive-maintenance scale without G-PF-01 conditions. | Reject or limit to pilot with an explanation listing missing asset-data, workflow, and owner/control evidence. |
| `PFV3-NG-02` | Learner selects three initiatives in pilot/scale in one quarter. | Reject before resolution; show active-delivery capacity limit and which actions consume slots. |
| `PFV3-NG-03` | Learner requests visual-quality scale while false rejects are 13% and traceability is incomplete. | Block scale; retain/pause pilot and surface quality/OEM gate rationale. |
| `PFV3-NG-04` | Same seed and learner decisions with different baseline assessment answers. | Resolve to identical metrics, gates, events, stakeholder effects, and scorecard evidence. Only reflection prompts display the different learner-owned baseline responses. |
| `PFV3-NG-05` | Content author creates a dependency cycle or points an effect to an undeclared metric. | Pack validator rejects the content before a run begins and identifies the invalid reference. |

### Accessibility and learner-safety checks

- Every dashboard, chart, and outcome requires a plain-language text summary, a data table, and meaning that is not communicated by colour alone.
- Acronyms such as OEM, CMMS, PPM, and first-pass yield require first-use explanation and glossary support.
- Evidence should state uncertainty and limitations in text, not only visual treatment.
- Reflection prompts must allow skip/private-note behaviour and must not expose personal baseline answers to a team without the learner’s consent.
- The simulation must distinguish a synthetic operational event from a learner failure, and must never present a stakeholder reaction as a real person’s assessment.

## 10. Review and publication checklist

- [x] Content author has completed every required template section for the first provisional pack.
- [x] Every numerical value is marked expert-calibrated synthetic — provisional.
- [ ] Automotive operations/maintenance reviewer has checked causal plausibility and safety/workflow red lines.
- [ ] Quality/OEM reviewer has checked traceability, containment, and customer-consequence logic.
- [ ] Learning-design reviewer has checked evidence, decisions, pacing, reflection, and debrief alignment.
- [ ] Responsible-AI/governance reviewer has checked control boundaries and gate wording.
- [ ] Technical validator and deterministic fixtures pass; no V3 implementation exists yet.
- [x] No single evidence artefact reveals an intended “correct” portfolio.
- [x] Every metric, gate, event, stakeholder rule, scorecard dimension, and reflection prompt has a learner-visible explanation.
- [x] Pack version and migration impact are recorded in the decision log.
- [ ] Pilot findings and reviewer changes have been versioned before release.
