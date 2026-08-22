# Project Factory v2: Implementation Backlog

Status: proposed; no implementation authorised by this backlog
Date: 2026-08-21
Reference: [Project Factory 2030 v2 Design Brief](./project-factory-v2-design-brief.md)

## Delivery principles

- Ship vertical slices that work end to end; avoid a long-lived, unusable schema-only branch.
- Preserve Standard mode and v1 scenario behaviour exactly until a pack explicitly opts into v2.
- Keep all state serializable and all outcome rules deterministic for a recorded seed.
- Keep business rules in pure modules, not React components, Zustand actions, or the LLM.
- Treat synthetic content calibration and learner debrief as deliverables, not afterthoughts.

## Work packages

### WP0 — Baseline and contract

| ID | Task | Acceptance criteria |
|---|---|---|
| PF0.1 | Freeze current v1 regression fixtures and save samples. | Existing Standard and all four v1 scenario tests pass unchanged; representative v5 saves are stored as non-sensitive test fixtures. |
| PF0.2 | Finalise the v2 schema contract and authoring template. | Types cover learning, evidence, lifecycle/delivery, capacity, gates, causal rules, events, stakeholders, scorecard, and fixtures; no runtime functions occur in pack data. |
| PF0.3 | Define test seed policy. | A scenario run records seed/version; same pack, state, seed, and decisions produce identical outcomes. |

### WP1 — Compatibility foundation

| ID | Task | Acceptance criteria |
|---|---|---|
| PF1.1 | Add optional v2 fields to scenario types and version metadata. | Type check passes; existing four packs compile without v2 fields; v2 validation rejects malformed references. |
| PF1.2 | Add pack validator. | Validator detects unknown metric/initiative/stakeholder IDs, invalid lifecycle transitions, dependency cycles, invalid event triggers, and effects outside declared metric boundaries. |
| PF1.3 | Add v2 scenario state defaults and versioned persistence migration. | Version increments from v5 to v6; v5 Standard and v1 scenario saves load safely with v2 defaults; snapshots retain prior history. |
| PF1.4 | Build a pure v2 state factory. | A Project Factory v2 run starts with ledger, lifecycle, budget/capacity, gates, event log, stakeholder state, and scorecard state in predictable default condition. |

### WP2 — Decision and portfolio slice

| ID | Task | Acceptance criteria |
|---|---|---|
| PF2.0 | Implement the v3 baseline-assessment contract. | Five responses are persisted as reflective baseline data with question/version metadata. Changing responses does not change a v3 Project Factory outcome for the same seed and decisions; v1/v2 baseline behaviour remains unchanged. |
| PF2.1 | Implement lifecycle transition validation. | Only authored transitions are accepted; scale is rejected/pending when its pilot or gate is incomplete; pause/stop behaviour is explicit. |
| PF2.2 | Implement budget and active-delivery capacity resolver. | Fewer than three initiatives are valid; more than two pilot/scale initiatives is prevented with an explanatory reason; research has the agreed lightweight capacity treatment. |
| PF2.3 | Implement decision ledger. | Every decision window persists rationale, prediction, owner, evidence used, unresolved assumption, and gate/stop criterion; concise validation messages protect empty or excessive entries. |
| PF2.4 | Add pre-brief and evidence-room UI. | Learner can inspect four initial evidence artefacts and known unknowns before the first decision; artefact provenance is visible. |
| PF2.5 | Add initiative-plan UI. | Learner chooses lifecycle action and sees cost, capacity, prerequisites, owner, and stop/scale criterion before confirming. |

### WP3 — Governance and causal runtime slice

| ID | Task | Acceptance criteria |
|---|---|---|
| PF3.1 | Implement generic gate resolver. | A pack can declare evidence/owner/metric conditions; engine returns allowed, limited, or blocked action plus an explanation. |
| PF3.2 | Implement delayed causal-rule resolver. | Supports a condition, effect delay, range selected from seed, trade-off, and causal explanation; does not alter a v1 resolution. |
| PF3.3 | Add three Project Factory reference rules. | Test fixtures cover: delayed predictive-maintenance benefit, visual-quality false-reject trade-off, and knowledge/maintenance dependency. |
| PF3.4 | Implement condition-triggered event resolver. | A line-failure event becomes eligible from declared asset/gate conditions; cause, seed, evidence, response, and impact are saved and displayed. |
| PF3.5 | Implement deterministic stakeholder resolver. | Technician/maintenance, plant/COO, OEM/quality, CFO, and data-owner states change only through authored rules and are visible in the snapshot. |

### WP4 — Formative feedback and facilitation

| ID | Task | Acceptance criteria |
|---|---|---|
| PF4.0 | Replace the legacy reflection-alignment pattern for an opted-in V3 pack. | Baseline answers are displayed as a reflective starting point only; no belief/action alignment, `self-awareness` number, or baseline-derived archetype contributes to a V3 score or outcome. Legacy v1/v2 reflection remains unchanged. |
| PF4.1 | Implement evidence-led scorecard. | Results show separate operational, decision-quality, execution, governance, stakeholder, and resilience dimensions with supporting evidence; no high-stakes composite grade is required. |
| PF4.2 | Implement prediction-versus-actual and decision replay. | Debrief identifies the learner’s predicted result, actual result, relevant evidence/gates/events, and a reflective question. |
| PF4.2a | Add the baseline-to-debrief comparison. | Each baseline dimension displays its initial response, relevant decisions/evidence, and a neutral reflection prompt; it never creates a score bonus or penalty. |
| PF4.2b | Add one guided reflection checkpoint per board window. | The learner can record observation, interpretation, and next adjustment after a material result, gate, or event; prompts use visible evidence, are skippable/concise, and have no effect on resolver state or assessment. |
| PF4.2c | Add final transfer reflection and facilitator guidance. | Final debrief supports an action, trigger, and metric for real-work transfer; a facilitator can run the four-window discussion without the product presenting one answer as authoritative. |
| PF4.3 | Add workshop decision-window mode. | Facilitator view can group the 12 quarters into four windows; self-paced mode retains quarter-by-quarter play. |
| PF4.4 | Ground the advisor in v2 context. | Advisor receives only visible evidence, ledger, gates, and current state; prompt directs it to flag uncertainty and never select, score, or invent effects. |

### WP5 — Project Factory content and calibration

| ID | Task | Acceptance criteria |
|---|---|---|
| PF5.1 | Author and review the evidence pack. | Seven evidence artefacts have source type, confidence, visibility, learning purpose, accessible text, and manufacturing-review sign-off. |
| PF5.2 | Author initiative delivery profiles, gates, and rules. | All six initiatives have lifecycle/cost/capacity/dependency/owner/control-boundary/stop-scale content; synthetic values are labelled as such. |
| PF5.3 | Author events, stakeholder rules, and debrief prompts. | At least one condition-triggered event and the five stakeholder perspectives produce testable, explained effects. |
| PF5.4 | Run content, learning-design, and accessibility review. | Review comments and resolutions are recorded; no content presents synthetic values as real company evidence. |

### WP6 — Validation and pilot

| ID | Task | Acceptance criteria |
|---|---|---|
| PF6.1 | Extend unit and migration coverage. | Resolver, validator, lifecycle, gate, capacity, causal, event, stakeholder, scorecard, and v5→v6 tests cover success/failure boundaries. |
| PF6.2 | Add browser flows. | A v2 Project Factory learner can pre-brief, make an evidence-led decision, encounter an explained event, resume a save, and reach debrief; v1 scenario and Standard flows continue to pass. |
| PF6.3 | Run a formative learner pilot. | Observe target learners in a 90-minute team session and self-paced fallback; collect evidence about comprehension, cognitive load, discussion quality, and misleading mechanics. |
| PF6.4 | Calibrate before reuse. | Rule/content changes from pilot are versioned; only validated primitives are copied into BankNext, Care360, and FutureReady. |

## Suggested implementation order

`PF0 → PF1 → PF2 → PF3.1–PF3.4 → PF4.0–PF4.2b → PF5 → PF6 → PF3.5/PF4.2c/PF4.3/PF4.4 as pilot evidence warrants`

This order gets an end-to-end, individually playable reference slice before adding facilitation mode or deeper stakeholder interactions. It reduces the risk of designing a rich authoring system whose learner loop has not been validated.

## Definition of readiness for implementation

Implementation should begin only when:

1. The agreed product decisions in the design brief remain correct.
2. The scenario authoring template is accepted.
3. At least one manufacturing and one learning-design reviewer are identified or a documented alternative review plan exists.
4. The Project Factory evidence/rule values are explicitly labelled as expert-calibrated synthetic until reviewed.
5. The product owner approves the proposed workshop-cadence experiment or selects a different time model.

## Deferred after the first pilot — AI reflection coach

This is intentionally not part of the V3 reference slice. It may be considered only after the structured reflection checkpoints have been piloted and the following acceptance conditions are met:

1. Pilot evidence identifies a meaningful self-paced reflection gap that a facilitator guide and structured prompts cannot meet.
2. A `ReflectionCoach` contract is defined: read only learner-visible evidence/ledger/outcomes; Socratic questions and summaries only; no portfolio recommendation, outcome generation, scoring, personality inference, or state mutation.
3. Grounded-response, hallucinated-causality, over-agreeable-tone, privacy/retention, accessibility, cost, and service-failure cases have explicit tests and fallback behaviour.
4. A learning-design reviewer and a facilitator approve the question design and an evaluation rubric before learner exposure.
