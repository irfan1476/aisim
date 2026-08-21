# Project Factory v3: Implementation Backlog

Status: prioritised planning backlog; no implementation authorised by this backlog
Date: 2026-08-21
Reference: [Project Factory 2030 v3 Design Brief](./project-factory-v3-design-brief.md)

## Delivery principles

- Ship vertical slices that work end to end; avoid a long-lived, unusable schema-only branch.
- Preserve Standard mode and v1 scenario behaviour exactly until a pack explicitly opts into v3.
- Keep all state serializable and all outcome rules deterministic for a recorded seed.
- Keep business rules in pure modules, not React components, Zustand actions, or the LLM.
- Treat synthetic content calibration and learner debrief as deliverables, not afterthoughts.

## Priority, decision gates, and next sequence

The ordering below separates branch control and content calibration from engine work. A V3 implementation branch may be created after its explicit approval, but **no engine/UI/persistence implementation begins until the content-review gate is passed**.

| Priority | Work | Status and exit criterion | Why it comes here |
|---|---|---|---|
| **P0 — Product lineage** | `PF-PLAN-01` confirm `Branch1-version-2` / `dc34433` as the frozen V2 baseline; `PF-PLAN-02` create `codex/project-factory-v3-impl` from that exact commit and transfer documentation-only V3 planning commits. | Pending product-owner approval. The branch cut does not authorise implementation. | V3 must inherit the V2 scenario pipeline from a reproducible point, while V2 remains independently active. |
| **P0 — Content-calibration gate** | `PF-PLAN-03` prepare bounded reviewer briefs; `PF5.1`, `PF5.2`, `PF5.3a`, and `PF5.4` obtain and resolve light operations and learning-design review. `PF5.3b` authors the two additional event cards only after operations review. | Required before engine work. Reviewer resolutions and retained provisional assumptions are recorded. | Prevents encoding uncalibrated operational triggers, causal magnitudes, or reflection load into the engine. |
| **P1 — Core playable reference slice** | `PF0` through `PF3`, then `PF4.0`–`PF4.2c`, with `PF6.1`/`PF6.1a`/`PF6.1b` developed alongside their corresponding work. | A deterministic, saveable Project Factory V3 run can support evidence-led lifecycle decisions, an executive decision ledger, gates, capacity, causal rules, one implemented event, stakeholders, and a source-grounded formative debrief. | Proves the reusable V3 engine primitives against one reviewed pack before breadth or polish. |
| **P2 — Learner-pilot readiness** | `PF4.1`, `PF4.1a`, `PF4.2d`, `PF4.2e`, `PF4.3`, `PF5.3b`, `PF6.2`, and `PF6.3`. | A 90-minute facilitated run and self-paced fallback are accessible, report truthfully, include two or three reviewed deterministic event cards, and produce an editable board memo. | Completes the agreed learning experience without adding an AI coach or a high-stakes score. |
| **P3 — Reuse and later enhancements** | `PF5.1a`, `PF5.3c`, `PF6.4`, further-pack conversion, and deferred `PF4.4` advisor work. | Pilot results are versioned before V3 primitives are reused in BankNext, Care360, FutureReady, or BharatMart. | Avoids copying provisional assumptions or adding AI-mediated complexity before evidence justifies it. |

### P0 task detail

| ID | Task | Acceptance criteria |
|---|---|---|
| PF-PLAN-01 | Confirm the V2 implementation baseline. | Product owner explicitly confirms whether tagged commit `Branch1-version-2` / `dc34433` is the intended V3 code base. The record states that later V2 work is not included automatically. |
| PF-PLAN-02 | Establish the V2-based V3 implementation line. | A separate `codex/project-factory-v3-impl` worktree/branch starts exactly at the approved V2 commit. Only reviewed documentation-only V3 commits are transferred; no V3 application implementation begins; V2 worktree and branch remain untouched. |
| PF-PLAN-03 | Run the light content review. | One operations/manufacturing reviewer and one learning-design reviewer receive a bounded brief. Each comment is accepted, rejected, or deferred with rationale. Quality-escape and technician-retirement cards remain un-authored until operations review is complete. A plan to identify reviewers later does not satisfy this gate. |

## Work packages

### WP0 — Baseline and contract

| ID | Task | Acceptance criteria |
|---|---|---|
| PF0.1 | Freeze current v1 regression fixtures and save samples. | Existing Standard and all four v1 scenario tests pass unchanged; representative v5 saves are stored as non-sensitive test fixtures. |
| PF0.2 | Finalise the v3 schema contract and authoring template. | Types cover learning, evidence, lifecycle/delivery, capacity, gates, causal rules, events, stakeholders, scorecard, and fixtures; no runtime functions occur in pack data. |
| PF0.2a | Add first-checkpoint authoring fields to the schema and validator contract. | Evidence provenance is separate from claim status; initiative profiles support wrong-for-now and operating-change-plan fields; packs declare budget posture, event coverage, board memo, and responsible-impact fields. Missing required fields are identified with an author-facing explanation. |
| PF0.3 | Define test seed policy. | A scenario run records seed/version; same pack, state, seed, and decisions produce identical outcomes. |

### WP1 — Compatibility foundation

| ID | Task | Acceptance criteria |
|---|---|---|
| PF1.1 | Add optional v3 fields to scenario types and version metadata. | Type check passes; existing four packs compile without v3 fields; v3 validation rejects malformed references. |
| PF1.2 | Add pack validator. | Validator detects unknown metric/initiative/stakeholder IDs, invalid lifecycle transitions, dependency cycles, invalid event triggers, and effects outside declared metric boundaries. |
| PF1.2a | Add metric-authority and unit validation. | Each reported metric has one declared owner and unit/time basis; validator rejects generic/scenario collisions, undeclared value/effect references, incompatible currency/unit use, and reports that cannot identify the rule/evidence source of a change. |
| PF1.3 | Add v3 scenario state defaults and versioned persistence migration. | Version increments from v5 to v6; v5 Standard and v1 scenario saves load safely with v3 defaults; snapshots retain prior history. |
| PF1.4 | Build a pure v3 state factory. | A Project Factory v3 run starts with ledger, lifecycle, budget/capacity, gates, event log, stakeholder state, and scorecard state in predictable default condition. |

### WP2 — Decision and portfolio slice

| ID | Task | Acceptance criteria |
|---|---|---|
| PF2.0 | Implement the v3 baseline-assessment contract. | Five responses are persisted as reflective baseline data with question/version metadata. Changing responses does not change a v3 Project Factory outcome for the same seed and decisions; v1/v3 baseline behaviour remains unchanged. |
| PF2.1 | Implement lifecycle transition validation. | Only authored transitions are accepted; scale is rejected/pending when its pilot or gate is incomplete; pause/stop behaviour is explicit. |
| PF2.2 | Implement budget and active-delivery capacity resolver. | Fewer than three initiatives are valid; more than two pilot/scale initiatives is prevented with an explanatory reason; research has the agreed lightweight capacity treatment. |
| PF2.3 | Implement executive decision ledger. | Every material decision window persists an immutable pre-resolution decision snapshot, rationale, predicted indicator/direction, key assumption/known unknown, owner, cited evidence, optional 1–5 confidence, and gate/stop criterion. Concise validation prevents empty or excessive entries; no baseline answer is treated as a scenario hypothesis. |
| PF2.3b | Attach resolver-authored outcome snapshots and learner-owned reflection. | After each resolved window, the ledger stores source-bound metric deltas, gates, events, stakeholder effects, rule/evidence references, and uncertainty. It separately stores a concise skippable reflection/next adjustment. Learner text, timestamps, confidence, and evidence-opening telemetry do not affect resolver state or outcome. |
| PF2.3a | Add operating-change-plan and contested-evidence rationale capture. | Pilot/scale decisions capture concise workflow, roles, remediation, capability/release, owner, feedback, and rollback fields. A rationale is prompted only when contested/insufficient evidence is the sole substantive basis for a material claim. Plan text itself has no direct metric effect. |
| PF2.4 | Add pre-brief and evidence-room UI. | Learner can inspect four initial evidence artefacts and known unknowns before the first decision; artefact provenance and decision-use/claim status are visible. |
| PF2.5 | Add initiative-plan UI. | Learner chooses lifecycle action and sees cost, capacity, prerequisites, owner, and stop/scale criterion before confirming. |

### WP3 — Governance and causal runtime slice

| ID | Task | Acceptance criteria |
|---|---|---|
| PF3.1 | Implement generic gate resolver. | A pack can declare evidence/owner/metric conditions; engine returns allowed, limited, or blocked action plus an explanation. |
| PF3.2 | Implement delayed causal-rule resolver. | Supports a condition, effect delay, range selected from seed, trade-off, and causal explanation; does not alter a v1 resolution. |
| PF3.2a | Implement the operational-value attribution resolver. | Value is derived only from declared operational deltas, cost types, timing, and labelled assumption ranges; it can return observed, estimated, or not-yet-observable and cannot compound independently of scenario evidence. |
| PF3.3 | Add three Project Factory reference rules. | Test fixtures cover: delayed predictive-maintenance benefit, visual-quality false-reject trade-off, and knowledge/maintenance dependency. |
| PF3.4 | Implement condition-triggered event resolver. | A line-failure event becomes eligible from declared asset/gate conditions; cause, seed, evidence, response, and impact are saved and displayed. |
| PF3.4a | Validate event-coverage maps. | The validator distinguishes implemented, authored-not-implemented, and candidate events; a learner-ready pack requires two or three authored events with deterministic fixtures. The first vertical slice may implement one declared event. No generic unfunded-duration trigger is allowed. |
| PF3.5 | Implement deterministic stakeholder resolver. | Technician/maintenance, plant/COO, OEM/quality, CFO, and data-owner states change only through authored rules and are visible in the snapshot. |
| PF3.5a | Implement exposure and deferral rules. | A pack can declare adverse trend, unaddressed condition, rationale/review trigger, stakeholder, and event-eligibility relationships. The engine does not impose a generic “unfunded for N quarters” penalty. Project Factory must surface all five declared exposures even though only reliability has an initial conditional event. |
| PF3.5b | Implement initiative-specific workflow-adoption evidence. | Each initiative records its authored use/review/override/correction evidence. A derived state, if used, remains initiative-scoped and source-bound; funding or people allocation alone cannot change it, and no global campaign-adoption metric can overwrite scenario state. |

### WP4 — Formative feedback and facilitation

| ID | Task | Acceptance criteria |
|---|---|---|
| PF4.0 | Replace the legacy reflection-alignment pattern for an opted-in V3 pack. | Baseline answers are displayed as a reflective starting point only; no belief/action alignment, `self-awareness` number, or baseline-derived archetype contributes to a V3 score or outcome. Legacy v1/v2 reflection behaviour remains unchanged. |
| PF4.1 | Implement evidence-led scorecard. | Results show separate operational, decision-quality, execution, governance, stakeholder, and resilience dimensions with supporting evidence; no composite score, CEO grade, scenario bonus, or initiative-tenure reward is shown. |
| PF4.1a | Implement final-report integrity rules. | Every outcome/recommendation names its metric/rule/evidence source and respects current state. The report distinguishes observation, attributed value, and uncertainty; it cannot call most-used work “what worked,” recommend an already-met threshold, or infer a leadership trait as a fact. |
| PF4.2 | Implement prediction-versus-actual and decision replay. | Debrief presents each board window as “you said → you did → what happened → what you learned,” using the immutable decision snapshot, resolver-authored outcome snapshot, cited/opened evidence, gates/events, and a reflective question. It makes no automated blind-spot, leadership-trait, or prediction-accuracy diagnosis. |
| PF4.2a | Add the baseline-to-debrief comparison. | Each baseline dimension displays its initial response, relevant decisions/evidence, and a neutral reflection prompt; it never creates a score bonus or penalty. |
| PF4.2b | Add one guided reflection checkpoint per board window. | The learner can record observation, interpretation, and next adjustment after a material result, gate, or event; prompts use visible evidence, are skippable/concise, and have no effect on resolver state or assessment. |
| PF4.2c | Add final transfer reflection and facilitator guidance. | Final debrief supports an action, trigger, and metric for real-work transfer; a facilitator can run the four-window discussion without the product presenting one answer as authoritative. |
| PF4.2d | Add a source-bound final board memo. | Learner can edit a structured memo from visible ledger/evidence only: decision, operating change, uncertainty, cost/value status, gate/exposure, responsible-impact record, and next action. It is formative, exportable, and never engine-scored or LLM-invented. |
| PF4.2e | Add responsible-impact reflection. | At material scale decisions and final memo, learner records risk, equity/distributional impact, accessibility, sustainability, residual risk, monitoring, escalation authority, and incident learning. It is discussable/visible but cannot alter outcome, baseline, or scorecard. |
| PF4.3 | Add workshop decision-window mode. | Facilitator view can group the 12 quarters into four windows; self-paced mode retains quarter-by-quarter play. |
| PF4.4 | Ground the advisor in v3 context. | Advisor receives only visible evidence, ledger, gates, and current state; prompt directs it to flag uncertainty and never select, score, invent effects, or make unsupported pattern/blind-spot/leadership-trait claims. It remains deferred until pilot evidence warrants it. |

### WP5 — Project Factory content and calibration

Authoring output: [Project Factory V3 Provisional Content Pack](./project-factory-v3-content-pack.md). This document is planning content; it has not been validated by an engine or subject-matter reviewers.

| ID | Task | Acceptance criteria |
|---|---|---|
| PF5.1 | Author and review the evidence pack. | Seven evidence artefacts have source type, confidence, visibility, learning purpose, accessible text, and manufacturing-review sign-off. |
| PF5.1a | Calibrate economic-conversion assumptions. | Operations and CFO review records values/ranges, units, time horizon, eligible scope, downside, and evidence for `VA-PF-01` through `VA-PF-04`; before that, the product reports monetary benefit as not yet observable rather than generic ROI. |
| PF5.2 | Author initiative delivery profiles, gates, and rules. | All six initiatives have lifecycle/cost/capacity/dependency/owner/control-boundary/stop-scale content; synthetic values are labelled as such. |
| PF5.2a | Complete first-checkpoint initiative authoring. | Every initiative has a visible wrong-for-now lifecycle explanation and a concise operating-change-plan requirement. Evidence claim status is tailored to decision use, not confused with provisional synthetic provenance. |
| PF5.3 | Author events, stakeholder rules, and debrief prompts. | At least one condition-triggered event and the five stakeholder perspectives produce testable, explained effects. |
| PF5.3a | Calibrate non-event exposure content. | Quality/OEM, energy/throughput, workforce, and supply-continuity exposure conditions have reviewer-approved signals, owners, and review consequences. New events are added only with an authored causal explanation and deterministic fixture. |
| PF5.3b | Complete learner-ready event coverage. | Two or three reviewed Project Factory event cards have conditions, seed scope, trade-off choices, stakeholder effects, causal boundaries, and deterministic fixtures. Candidate events that do not meet this bar remain visible as exposures, not pseudo-events. |
| PF5.3c | Add a library-level budget-posture review. | Before BharatMart or another new pack is authored, the library plan demonstrates constrained, balanced, and transformation-scale budget postures across the scenario set, each with an explicit learning rationale. |
| PF5.4 | Run content, learning-design, and accessibility review. | Review comments and resolutions are recorded; no content presents synthetic values as real company evidence. |

### WP6 — Validation and pilot

| ID | Task | Acceptance criteria |
|---|---|---|
| PF6.1 | Extend unit and migration coverage. | Resolver, validator, lifecycle, metric authority, value attribution, workflow-adoption, exposure, gate, capacity, causal, event, stakeholder, scorecard, report-integrity, and v5→v6 tests cover success/failure boundaries. Fixtures prove that a baseline change cannot alter an outcome; a scenario metric cannot silently overwrite a core metric; a met target never produces a contrary recommendation; initiative workflow evidence cannot appear as a static global adoption value; and units/currency remain consistent. |
| PF6.1a | Add first-checkpoint contract tests. | Tests prove source status cannot be mistaken for claim status; contested/insufficient evidence prompts reflection only under declared conditions; operating-plan text has no direct outcome effect; responsible-impact text has no outcome/score effect; and incomplete learner-ready event coverage is rejected or clearly marked. |
| PF6.1b | Add decision-ledger integrity tests. | Tests prove a ledger prediction/assumption is captured before resolution; the resolver, not learner text, creates the outcome snapshot; baseline answers, confidence, timestamps, evidence-opening telemetry, and reflection text cannot change outcomes or scorecard state; replay is source-bound to the same pack, seed, and decision snapshot. |
| PF6.2 | Add browser flows. | A v3 Project Factory learner can pre-brief, make an evidence-led decision, encounter an explained event, defer with an explicit trigger, resume a save, and reach a source-grounded debrief; v1 scenario and Standard flows continue to pass. |
| PF6.3 | Run a formative learner pilot. | Observe target learners in a 90-minute team session and self-paced fallback; collect evidence about comprehension, cognitive load, discussion quality, and misleading mechanics. |
| PF6.4 | Calibrate before reuse. | Rule/content changes from pilot are versioned; only validated primitives are copied into BankNext, Care360, and FutureReady. |

## Detailed implementation order after the P0 gates

`PF0/PF0.2a → PF1/PF1.2a → PF2/PF2.3b → PF3.1–PF3.5b → PF4.0/PF4.2–PF4.2c → matching PF6.1/PF6.1a/PF6.1b tests → PF4.1/PF4.1a/PF4.2d/PF4.2e/PF4.3 → PF5.3b/PF6.2/PF6.3 → PF5.1a/PF5.3c/PF6.4 → PF4.4 only as pilot evidence warrants`

This order gets an end-to-end, individually playable reference slice before adding workshop polish, a board memo, deeper event coverage, or advisor support. It reduces the risk of designing a rich authoring system whose learner loop has not been validated.

## Definition of readiness for implementation

Implementation should begin only when:

1. The agreed product decisions in the design brief remain correct.
2. The scenario authoring template is accepted.
3. The agreed light manufacturing/operations and learning-design reviews are completed and their resolutions are recorded; any broader calibration remains clearly labelled for the post-pilot phase.
4. The Project Factory evidence/rule values are explicitly labelled as expert-calibrated synthetic until reviewed.
5. The agreed four-window workshop cadence and quarter-by-quarter self-paced fallback are represented in the implementation plan, with pilot measures for timing, cognitive load, and discussion quality.
6. `PF-PLAN-01` has been explicitly approved and `PF-PLAN-02` has created the V2-based implementation line.
7. `PF-PLAN-03` has recorded light review resolutions and any resulting content updates, including the decision to retain, revise, or defer additional event cards.

## Deferred after the first pilot — AI reflection coach

This is intentionally not part of the V3 reference slice. It may be considered only after the structured reflection checkpoints have been piloted and the following acceptance conditions are met:

1. Pilot evidence identifies a meaningful self-paced reflection gap that a facilitator guide and structured prompts cannot meet.
2. A `ReflectionCoach` contract is defined: read only learner-visible evidence/ledger/outcomes; Socratic questions and summaries only; no portfolio recommendation, outcome generation, scoring, personality inference, or state mutation.
3. Grounded-response, hallucinated-causality, over-agreeable-tone, privacy/retention, accessibility, cost, and service-failure cases have explicit tests and fallback behaviour.
4. A learning-design reviewer and a facilitator approve the question design and an evaluation rubric before learner exposure.
