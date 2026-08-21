# Project Factory V3 — Window 1 Behavioral Contracts v2

Status: **proposed reference contract; review and walkthrough required before implementation**

## Contract boundary

This document specifies the Project Factory V3 Window 1 reference behavior. It
is a candidate source for generic V3 primitives only after the pilot validates
that the behavior transfers. It does not alter V2, Standard mode, existing V3
runtime code, or the approved content pack.

The contract separates five concepts that must never be collapsed:

1. a board-window decision;
2. quarter-by-quarter deterministic resolution;
3. initiative lifecycle;
4. a source-bound Research review;
5. later Pilot and Scale decisions.

## Contract 1 — Project Factory window orchestration

### Scope

`Project Factory V3 reference contract; candidate generic primitive.`

Window 1 covers Q1–Q3 and contains one learner decision. The underlying engine
resolves Q1, Q2, and Q3 sequentially. Learners see the consolidated research
review after Q3 unless an authored event, applicable failed gate, or required
response pauses the window.

### Proposed serialisable state

~~~yaml
v3State:
  ledger:                         # existing V3 decision ledger; never scenarioState
    - id: PF-W1-D01
      quarter: 1
      initiativeIds: [predictive-maintenance]
      prediction: pilot-ready-with-conditions
      note: optional
      evidenceIds: [PF-E01, PF-E02]

  windowHistory:                  # new opt-in V3 record
    - windowId: PF-W1
      quarterRange: [1, 3]
      status: pending | paused | resolved
      decisionLedgerId: PF-W1-D01
      quarterSnapshots: []
      pauseReason: optional
      resolutionCursor:
        nextQuarter: 1
        appliedOperationIds: []
        awaitingResponseId: optional
      aggregateOutcome: optional
~~~

The resolution cursor is persisted after every atomic operation. Each cost,
capacity use, rule application, event, response, and snapshot has a stable
operation ID. Re-running after reload skips an already-applied operation. The
same pack version, seed, decision snapshot, and responses therefore replay to
the same result without duplicate spend, effects, or events.

### Quarter snapshot contract

~~~yaml
quarterSnapshot:
  quarter: 1
  capitalCommitted: []
  capacitySchedule: {}
  pointInTimeMetrics: {}
  cumulativeMetrics: {}
  lifecycleTransitions: []
  researchReviewTransitions: []
  gateTransitions: []
  eventTransitions: []
  ruleApplications: []
  evidenceProduced: []
  unresolvedAuthoredConditions: []
  operationIds: []
~~~

### Resolution sequence

1. Persist the immutable board-window decision in `state.v3State.ledger` with
   structured prediction, optional note, owner, action, and cited evidence.
2. Create `PF-W1` in `state.v3State.windowHistory` with status `pending`.
3. Resolve Q1:
   - commit the declared Research capital once;
   - consume the declared Q1 capacity;
   - transition the selected initiative from `deferred` to `research`;
   - create the in-progress Research review;
   - evaluate only Research/action-relevant rules;
   - evaluate an event only if its authored trigger is eligible;
   - persist the Q1 snapshot and cursor.
4. Resolve Q2:
   - consume no further Research capacity unless an authored response/event
     explicitly declares it;
   - observe the declared Research signal;
   - resolve one authored research-result branch and create its outcome artefact;
   - persist the Q2 snapshot and cursor.
5. Resolve Q3:
   - preserve the branch and expose unresolved authored conditions;
   - apply only eligible Q3 rules/events;
   - do not apply operating benefit merely because Research occurred;
   - persist the Q3 snapshot and cursor.
6. Aggregate the three snapshots, set the window to `resolved`, and present the
   learner-facing Research Review.

### Pause and resume

A window may pause only for:

- an authored event requiring a learner response;
- a failed gate relevant to the requested action when repair requires a learner
  choice; or
- another explicit pack-defined learner response.

When paused, `pauseReason`, `awaitingResponseId`, and the last completed atomic
operation are persisted. Resume continues from `nextQuarter`/operation and does
not restart the window.

### Relevance filtering

- Research branch predicates are evaluated only for the selected initiative.
- A Scale gate is not evaluated or mutated during Research.
- A causal rule is evaluated only when its declared lifecycle, action, evidence,
  metric, and delay conditions are eligible.
- An unrelated gate or rule cannot create a failure merely because a quarter
  advanced.

### Window aggregation

| Data type | Learner-facing aggregation |
|---|---|
| Capital | Sum of capital committed by operations within the window; show the remaining envelope separately. |
| Capacity | Quarter-by-quarter schedule by named pool; never an unexplained three-quarter sum. |
| Point-in-time metric | Window-start value → window-end value, with `unchanged` shown explicitly. |
| Cumulative metric | End value plus attributed additions and source operation/rule IDs. |
| Gates and events | Chronological transitions, including `not evaluated`; never infer a pass/fail from absence. |
| Evidence | Starting evidence cited separately from outcome artefacts produced. |
| Uncertainty | Carry only unresolved conditions authored in the pack or outcome artefact; no generated unsupported prose. |

## Contract 2 — Research duration and capacity timing

### Lifecycle rule

The lifecycle vocabulary remains:

`deferred → research → pilot → scale → sustain`, with `pause` and `stop` paths.

There is no `ResearchCompleted` lifecycle. Completion of Research activity and
the review of its findings are represented separately.

### Proposed Research-review state

~~~yaml
initiative:
  lifecycle: research
  researchReview:
    status: in-progress | pilot-ready-with-conditions | remediation-required | priority-not-supported
    startedQuarter: 1
    signalQuarter: 2
    completedQuarter: 1
    outcomeArtifactId: PF-R01-A
~~~

`completedQuarter` records the completion of the capacity-bearing research
activity. `signalQuarter` records when its result becomes observable. The review
status remains `in-progress` until the signal is resolved.

### Window 1 timing

| Quarter | Predictive Maintenance example |
|---|---|
| Q1 | Commit ₹0.25 Cr once; use Data Engineering 1 and Governance Assurance 1; lifecycle becomes `research`; complete the capacity-bearing research activity. |
| Q2 | Observe and resolve the authored Research signal; create PF-R01-A, B, or C; consume no Research capacity by default. |
| Q3 | Carry the finding and unresolved conditions into the window outcome; consume no Research capacity by default. |

The same timing shape applies to Visual Quality and Technician Knowledge using
their authored capital and capacity pools. Research never consumes an active
Pilot/Scale slot. Quarterly run cost is zero during Research unless the pack
explicitly declares otherwise. An authored event or remediation response may
add cost/capacity only through a separate, visible operation.

## Contract 3 — Research-result branches

### Common resolver rule

The learner's prediction is never an input to branch determination. Branches are
resolved from authored findings in this order:

1. `priority-not-supported` when an authored actionability test fails;
2. `pilot-ready-with-conditions` when every named scoped-pilot finding is
   accepted; otherwise
3. `remediation-required` when the intervention remains relevant and the missing
   conditions are explicitly repairable.

No arbitrary composite readiness threshold determines a branch. The initial
reference fixtures contain no random branch selection. If a later pack authors
seeded uncertainty, it must declare its range, operating cause, explanation,
and replay contract; the resolved explanation must reveal the uncertainty.
Hidden luck is prohibited.

### Outcome artefact contract

~~~yaml
researchOutcomeArtifact:
  id: PF-R01-A
  initiativeId: predictive-maintenance
  branch: pilot-ready-with-conditions
  sourceType: expert-calibrated synthetic
  sourceStatus: provisional
  authorRole: maintenance research review panel
  version: 0.1-provisional
  producedInWindow: PF-W1
  basedOnEvidence: [PF-E01, PF-E02]
  facts: []
  limitations: []
  decisionUse: string
  unresolvedConditions: []
~~~

Every branch creates a new artefact. Starting artefacts establish the problem;
the new artefact records what Research found. Its status, provenance, facts,
limitations, and decision use are visible. It never claims operating benefit.

### PF-I01 Predictive Maintenance branches

**Pilot-ready-with-conditions — PF-R01-A**

Required scoped findings:

- the pilot boundary is explicitly Line M-4 and selected failure modes;
- limited read-only access is approved for the named pilot purpose;
- an accountable asset-data owner is named;
- usable history exists for the selected failure modes, with limitations shown;
- technician review/change capacity and the alert disposition owner are named.

Artefact limitations: no pilot alert usefulness, nuisance-alert rate, technician
disposition, downtime benefit, or Scale evidence has been observed. Decision use:
Pilot may be considered in Window 2 within the named boundary.

**Remediation-required — PF-R01-B**

Condition: the selected failure modes are plausibly detectable and actionable,
but at least one scoped finding above is absent and has a named repair action,
owner, and review trigger. The artefact names the missing ownership, history,
access, or technician-review condition. Decision use: Pilot remains unavailable;
the learner may fund remediation, switch priority, or defer.

**Priority-not-supported — PF-R01-C**

Condition: Research finds that the selected dominant failures cannot be detected
early enough from the available signal, or cannot be acted on safely within the
available maintenance window. Material downtime alone is not sufficient.
Decision use: Pilot is unavailable; reopen only if a materially different
failure mode, sensing approach, or intervention window is evidenced.

### PF-I02 Visual Quality branches

**Pilot-ready-with-conditions — PF-R02-A**

Required scoped findings:

- the pilot boundary names Line Q-2 and selected visually observable defects;
- a representative image/sample plan is accepted by the Quality owner;
- capture and lighting conditions can be stabilised for that boundary;
- a named Quality owner controls release, override, rework, and containment;
- the traceability route can record review and override decisions;
- PF-E05 is treated as early Q1 excerpts, with the full brief due Q2.

Artefact limitations: false rejects, escaped-defect effect, operator override
completion, and OEM acceptance remain unobserved. Decision use: a constrained
Q-2 Pilot may be considered after the full Q2 brief is incorporated.

**Remediation-required — PF-R02-B**

Condition: the selected defect family appears visually detectable and the
workflow can potentially intercept it, but the sample plan, capture stability,
owner, or traceability path has a named repairable gap. Decision use: Pilot
remains unavailable until the stated remediation is reviewed.

**Priority-not-supported — PF-R02-C**

Condition: the selected defect family is not visually observable/repeatable at
the proposed inspection point, or the inspection cannot create a safe,
traceable action before release. Quality urgency alone cannot support this AI
intervention. Decision use: switch priority or redesign the inspection point.

### PF-I05 Technician Knowledge branches

**Pilot-ready-with-conditions — PF-R03-A**

Required scoped findings:

- a bounded knowledge domain and one shift workflow are named;
- a technician review panel and protected review time are identified;
- the initial source set has an accountable content owner;
- safety, intellectual-property, and confidentiality boundaries are approved;
- every answer can expose provenance, correction/withdrawal, and escalation;
- a named human owner retains applicability and safety decisions.

Artefact limitations: content usefulness, correction rate, workflow fit, trust,
and workforce-readiness benefit remain unobserved. Decision use: a bounded Pilot
may be considered through G-PF-05 in Window 2.

**Remediation-required — PF-R03-B**

Condition: validated knowledge exists and a bounded workflow is plausible, but
the review panel/time, content ownership, provenance, or safety/IP boundary has
a named repairable gap. Decision use: Pilot remains unavailable pending the
specific remediation and review.

**Priority-not-supported — PF-R03-C**

Condition: the target tasks cannot be supported by validated source material in
the shift workflow, or no safe accountable human-review path can be established
within the declared operating boundary. Retirement exposure alone cannot make
the assistant actionable. Decision use: preserve capacity or choose a different
knowledge-transfer intervention.

### Branch-specific learner text contract

| Branch | Outcome | Reflect | Next Window |
|---|---|---|---|
| Pilot-ready-with-conditions | Name the bounded pilot option and all remaining conditions. | What condition is most important before Pilot? | Pilot, redirect, or remediate a remaining condition. |
| Remediation-required | Name repairable gaps, owners, and the reason Pilot is unavailable. | What evidence gap must be closed first, and what would cause you to stop? | Remediate, switch priority, or defer. |
| Priority-not-supported | Name the failed actionability test; do not say merely that another metric is more urgent. | What evidence changed your view, and what would make this actionable? | Switch priority or preserve capacity. |

### Deterministic Window 1 fixtures

| Fixture | Authored finding profile | Expected branch / artefact | Next action contract |
|---|---|---|---|
| PF-W1-PM-A | M-4 boundary, access, owner, selected-failure history, and technician review accepted. | pilot-ready-with-conditions / PF-R01-A | Pilot available in Window 2. |
| PF-W1-PM-B | Failure modes remain plausible; asset owner and protected review are repairable gaps. | remediation-required / PF-R01-B | Pilot unavailable; remediation offered. |
| PF-W1-PM-C | Dominant selected failures are not detectable early enough for safe action. | priority-not-supported / PF-R01-C | Pilot unavailable; switch/preserve offered. |
| PF-W1-VQ-A | Q-2/defect boundary, sample plan, capture feasibility, owner, and traceability accepted. | pilot-ready-with-conditions / PF-R02-A | Pilot available after full Q2 brief is incorporated. |
| PF-W1-VQ-B | Defect is observable; representative labels and stable capture remain repairable gaps. | remediation-required / PF-R02-B | Pilot unavailable; remediation offered. |
| PF-W1-VQ-C | Target defect is not visually observable at the proposed inspection point. | priority-not-supported / PF-R02-C | Pilot unavailable; redesign/switch offered. |
| PF-W1-TK-A | Bounded workflow, reviewed sources, panel/time, boundaries, provenance, and owner accepted. | pilot-ready-with-conditions / PF-R03-A | G-PF-05 Pilot decision available in Window 2. |
| PF-W1-TK-B | Validated sources exist; protected review time and withdrawal ownership are repairable gaps. | remediation-required / PF-R03-B | Pilot unavailable; remediation offered. |
| PF-W1-TK-C | Target tasks lack a safely validatable source/review path in the shift workflow. | priority-not-supported / PF-R03-C | Pilot unavailable; different intervention offered. |

All fixtures assert unchanged operating metrics, single capital commitment,
Q1-only Research capacity, no active-delivery slot, an immutable decision ledger
entry, and a source-bound outcome artefact.

## Window 2 remediation action — provisional content

The `remediation-required` branch now has one bounded follow-on action. This is
expert-calibrated synthetic planning content, not an observed manufacturing cost.

~~~yaml
remediationAction:
  id: PF-RM-01
  initiativeId: predictive-maintenance
  name: "Repair M-4 asset-data ownership and technician-review readiness"
  status: provisional
  lifecycleBefore: research
  lifecycleAfter: research
  durationQuarters: 1
  executionQuarter: 4
  capitalInrCr: 0.15
  capacityPerQuarter:
    data_engineering: 1
    governance_assurance: 1
    frontline_change: 1
  activeDeliverySlot: false
  accountableOwner: "CIO/data owner with Maintenance lead"
  operatingChange:
    - "Confirm M-4 asset hierarchy and an accountable data owner."
    - "Repair selected failure-code history and document its limitations."
    - "Protect technician review time and define alert disposition/override ownership."
    - "Confirm read-only access and the safety/IP escalation route."
  completionEvidence:
    - "M-4 asset hierarchy and ownership record accepted by the named owners."
    - "Selected failure-mode history is usable for the bounded pilot question."
    - "Technician review capacity, disposition route, and escalation owner are documented."
    - "Read-only access and control boundaries are accepted for the pilot purpose."
  exitOptions:
    - id: remediation-complete
      effect: "Pilot decision may become available in the next window; lifecycle remains research until authorised."
    - id: remediation-incomplete
      effect: "Remain in research with named missing evidence; learner may defer, stop, or continue a separately authored repair."
  stopCriteria:
    - "Ownership cannot be assigned without breaching access or accountability controls."
    - "Selected failure history remains unusable after the declared work period."
    - "Protected technician review cannot be scheduled without creating an unsafe or unacceptable operating burden."
  metricBoundary: "Downtime, defects, workforce readiness, trust, and value metrics do not improve from remediation alone."
  scaleGateEffect: "G-PF-01 is not evaluated or mutated by remediation."
~~~

The amount, one-quarter duration, and capacity are provisional fixtures so the
learner can understand the trade-off. They must be reviewed/calibrated before a
pilot; changing them changes the content version, not the resolver's hidden
logic. The remediation packet must show capital, capacity, duration, owner,
completion evidence, and the no-benefit boundary before the learner confirms it.

## Contract 4 — Pilot readiness versus Scale gate

Research review, Pilot availability, lifecycle transition, and Scale gate are
separate state facts:

| Concept | Meaning |
|---|---|
| Lifecycle `research` | The learner authorised Research; it remains until the learner later authorises Pilot, pauses, defers, or stops. |
| Research-review branch | Resolver-authored finding from the declared Research contract. |
| Pilot available | A later choice exposed only by `pilot-ready-with-conditions`; it is not an automatic transition. |
| Scale gate | A governance evaluation requiring Pilot evidence; Research alone cannot evaluate or pass it. |

G-PF-01 may appear during Window 1 as `not yet eligible` or a read-only preview.
Its persisted gate status is evaluated or mutated only when:

- the learner requests the applicable Scale action; or
- the pack explicitly authors a gate-review operation.

The same rule applies to G-PF-02. G-PF-05 is a Pilot gate and may be evaluated
only if the learner later requests the Technician Knowledge Pilot. Merely opening
the gate or citing its evidence does not change its persisted status.

## Contract 5 — Lifecycle-specific evidence

### Four evidence meanings

~~~yaml
availableEvidence:           # what the pack makes visible for this decision
learnerDecisionEvidence:     # the subset the learner explicitly cites
resolverOutcomeEvidence:     # new findings produced/accepted by resolution
gateRequiredEvidence:        # artefacts and observed measures a declared gate tests
~~~

These collections are intentionally non-equivalent:

- opening an artefact does not cite it;
- citing an artefact does not prove a finding;
- a Research outcome artefact does not pass a later gate;
- interaction telemetry is not evidence of operational readiness;
- only a declared resolver/gate operation may accept an outcome or gate fact.

### Window 1 evidence map

| Initiative/action | availableEvidence | learnerDecisionEvidence | resolverOutcomeEvidence | gateRequiredEvidence |
|---|---|---|---|---|
| Predictive Maintenance / Research | PF-E01, PF-E02 | learner-selected subset of PF-E01/PF-E02, saved before resolution | exactly one of PF-R01-A/B/C | G-PF-01 later tests PF-E02, PF-E03, PF-E04, PF-E07 plus declared Pilot observations; not evaluated in Window 1 |
| Visual Quality / Research | PF-E01, PF-E05 early Q1 excerpts; full brief Q2 | learner-selected subset with excerpt status preserved | exactly one of PF-R02-A/B/C | G-PF-02 later tests PF-E01, PF-E03, full PF-E05, PF-E07 plus declared Pilot observations; not evaluated in Window 1 |
| Technician Knowledge / Research | PF-E04, PF-E07 | learner-selected subset of PF-E04/PF-E07 | exactly one of PF-R03-A/B/C | G-PF-05 tests PF-E04, PF-E07 and the Research findings only when a Pilot action is requested |

The Outcome cites both the starting evidence used by the resolver and the new
Research outcome artefact. If the learner cited a different subset, the replay
shows that distinction without changing the resolver branch.

## Validation contract before implementation

Implementation may begin only after review confirms that:

1. no lifecycle or UI copy uses `ResearchCompleted`;
2. every branch is driven by named findings, not an undeclared score;
3. all nine fixtures replay deterministically and keep operating metrics fixed;
4. Research prediction, note, reflection, and evidence-opening telemetry cannot
   change branch, gate, metric, scorecard, or stakeholder state;
5. pause/resume cannot duplicate an operation;
6. gates/rules are lifecycle and action relevant;
7. Window 1 artefacts and evidence meanings remain source-bound;
8. V2, Standard mode, and non-V3 packs remain untouched through opt-in state,
   pack metadata, migrations, resolvers, selectors, UI shell, and tests.
