# Project Factory V3 — Revised Wireframe and Behavioral-Contract Review

Status: **wireframes accepted with minor completion requirements; behavioral contracts require revision before approval**

## Overall position

The revised wireframes solve the previously identified interaction problems and
are suitable for a representative-learner walkthrough after the minor additions
below. The five behavioral contracts are directionally correct but are not yet
implementation-ready because parts conflict with the existing V3 state model,
persistence boundary, evidence semantics, and approved no-hidden-causality
guardrails.

## Wireframes

### Accepted

- stable V3 shell and explicit state-specific orientation;
- whole-card/radio selection and one filled primary action;
- contextual secondary links only;
- three opening research priorities;
- explicit lifecycle progression;
- energy as monitored context and later-window portfolio visibility;
- research duration and Q1-only capacity presentation;
- distinct lifecycle, research review, pilot availability, and scale-gate labels;
- no operating benefit from research;
- optional reflection and Window 1 replay only.

### Minor completion requirements

1. Spell out `Data Engineering` and `Governance Assurance` in Commit and
   Outcome; do not revert to `Data Eng` or `Gov` abbreviations.
2. Title the illustrative result `Window 1 Research Review`, not simply
   `Research Completed`, because the initiative lifecycle remains `Research`.
3. Mark the shown `pilot-ready-with-conditions` outcome as one illustrative
   branch and provide low-fidelity Outcome/Reflect/Next Window variants for
   `remediation-required` and `priority-not-supported`.
4. Make the reflection prompt and Window 2 board question branch-aware; neither
   may offer Pilot when remediation or reprioritisation is the result.
5. Add responsive and accessibility annotations: stacked mobile packets,
   non-colour selection/status, keyboard operation, drawer focus return, and a
   visible primary action without a scroll trap.
6. Label PF-E05 as `early Q1 excerpts; full brief Q2` in the Visual Quality
   research packet.

## Contract 1 — Window orchestration

### Agree

- resolve underlying quarters sequentially;
- pause only for authored conditions requiring learner response;
- retain quarter-level provenance and aggregate a window-level outcome;
- preserve deterministic replay and save/resume.

### Required corrections

1. Change scope from `All V3 scenarios` to `Project Factory V3 reference
   contract; candidate generic primitive`. Generalisation follows pilot
   validation.
2. Persist the decision ledger in `state.v3State.ledger`, not
   `state.scenarioState.ledger`. The latter is the legacy scenario-metric
   container.
3. Existing `GameState.history` stores legacy quarter snapshots and is not a
   sufficient V3 window record. Add an opt-in serialisable V3 window record,
   for example:

~~~yaml
v3State.windowHistory[]:
  windowId: PF-W1
  quarterRange: [1, 3]
  status: pending | paused | resolved
  decisionLedgerId: string
  quarterSnapshots: []
  pauseReason: optional
  aggregateOutcome: optional
~~~

4. Save structured prediction and optional note; do not reintroduce a required
   free-text assumption.
5. Evaluate only gates and causal rules eligible for the current lifecycle and
   requested action. Do not evaluate every gate every quarter and create false
   failures.
6. Make pause/resume idempotent through a stored resolution cursor so a reload
   cannot replay cost, effects, or an event.
7. Define aggregation by data type:
   - capital: sum committed during the window;
   - capacity: show quarter schedule, not an unexplained sum;
   - point-in-time metric: window start to window end;
   - cumulative metric: end value plus attributed additions;
   - gates/events: list state transitions in chronological order;
   - uncertainty: carry unresolved authored conditions, never generate prose
     without sources.

## Contract 2 — Research duration and capacity

### Agree

- authored duration and quarter-specific capacity;
- capital committed once;
- no automatic run cost;
- no active Pilot/Scale slot;
- Predictive Maintenance research uses Q1 capacity and makes its signal
  available in Q2.

### Required correction

Do not add `ResearchCompleted` to the lifecycle. The approved lifecycle remains:

`deferred → research → pilot → scale → sustain`, with pause/stop paths.

Add a separate research-review record:

~~~yaml
initiative.lifecycle: research
initiative.researchReview:
  status: in-progress | pilot-ready-with-conditions | remediation-required | priority-not-supported
  startedQuarter: 1
  signalQuarter: 2
  completedQuarter: 1
  outcomeArtifactId: PF-R01-A
~~~

For Window 1, explicitly state that Q1 consumes the authored capacity, the Q2
signal is observed, and Q2–Q3 consume no further research capacity unless an
authored response/event says otherwise.

## Contract 3 — Research-result branches

### Agree

- three distinct branches;
- resolver-authored outcome independent of learner prediction;
- source-bound explanation and deterministic fixtures;
- branch controls the next available decision.

### Required corrections

1. Do not use arbitrary illustrative thresholds such as `asset readiness ≥60`
   as implementation conditions. PF-E02 already says the current evidence can
   support a constrained pilot despite low network-wide readiness. Author
   pilot-scope findings instead:
   - named M-4 pilot boundary;
   - read-only access approved;
   - accountable asset-data owner;
   - usable history for selected failure modes;
   - technician review/change capacity identified.
2. `priority-not-supported` must mean that the researched intervention is not
   actionable or relevant—for example, dominant failures are not detectable or
   cannot be acted on within maintenance windows—not merely that another metric
   is more urgent.
3. Seeded uncertainty is allowed only when the pack declares the seeded range,
   cause, and explanation. Hidden luck is not acceptable. Same pack, seed, and
   decision must replay identically.
4. Research must create a branch-specific outcome artefact with provenance,
   facts, limitations, and decision use. Existing PF-E01/PF-E02 explain the
   starting position; they do not by themselves constitute a new research
   finding.
5. Author branch conditions and fixtures for all three opening initiatives,
   not Predictive Maintenance alone, before Window 1 implementation is
   complete.
6. Each branch needs its own Outcome, Reflect, and Next Window text contract.

## Contract 4 — Pilot readiness versus scale gate

### Agree

- research review may make Pilot available;
- availability is an option, not an automatic transition;
- the lifecycle stays `Research` until the learner authorises Pilot;
- the scale gate requires pilot evidence and cannot be passed by research.

### Required correction

Remove every statement that moves lifecycle to `ResearchCompleted`. Use the
separate `researchReview.status`. G-PF-01 may be displayed as `not yet eligible`
or as a read-only preview; its persisted status should be evaluated/mutated only
when an applicable Scale action is requested or an explicitly authored gate
review occurs.

## Contract 5 — Lifecycle-specific evidence

### Agree

- evidence requirements differ by lifecycle action;
- Compare shows only evidence relevant to the current Research decision;
- Commit records the decision basis;
- Outcome cites the evidence and new research-result artefact supporting the
  branch.

### Required correction: separate four evidence meanings

~~~yaml
availableEvidence: artefacts the pack makes visible
learnerDecisionEvidence: artefacts cited as the learner's decision basis
resolverOutcomeEvidence: findings produced/accepted by authored resolution
gateRequiredEvidence: evidence a declared gate tests
~~~

Opening or citing an artefact must not automatically satisfy a research result
or governance gate. Interaction telemetry is not evidence of operational
readiness.

Also correct the `lifecyle` typo in the proposed contract.

## Revised approval path

1. Treat the wireframe interaction architecture as accepted.
2. Add the six minor visual/branch variants.
3. Revise the five contracts with the corrections above.
4. Add Project Factory content for all three research-result branch sets and
   outcome artefacts.
5. Review the contracts and content for internal consistency.
6. Walk through the wireframes with the product owner and 3–5 representative
   learners/facilitators.
7. Resolve feedback and approve design plus behavioral contracts.
8. Implement Window 1 additively using V3 primitives and the newly approved
   window/research records.

Production implementation remains paused until step 7.
