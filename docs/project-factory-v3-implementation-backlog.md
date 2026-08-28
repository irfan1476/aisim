# Project Factory v3: Implementation Backlog

Status: implementation checkpoint updated; approved Window 1 V3 runtime/UI and PF6.2 browser coverage complete, later-window content and pilot remain deferred
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
| **P0 — Product lineage** | `PF-PLAN-01` confirm `Branch1-version-2` / `dc34433` as the frozen V2 baseline; `PF-PLAN-02` create `codex/project-factory-v3-impl` from that exact commit; transfer documentation-only V3 planning commits as a separate step. | **Baseline, branch cut, and initial documentation transfer complete.** Reviewer-brief transfer is being synchronized separately. The branch cut does not authorise implementation. | V3 must inherit the V2 scenario pipeline from a reproducible point, while V2 remains independently active. |
| **P0 — Content-calibration gate** | `PF-PLAN-03` plus the bounded operations and learning-design review. | **Passed:** review accepted on 2026-08-21; provisional values and held event cards remain explicitly labelled/deferred. | Prevents unreviewed operational triggers, causal magnitudes, or reflection load from being silently treated as fact. |
| **P1 — Core playable reference slice** | `PF0` through `PF3`, then `PF4.0`–`PF4.2c`, with `PF6.1`/`PF6.1a`/`PF6.1b` alongside the slices. Add `PF2.6` and `PF6.1c` for the analytics projection contract and selector invariants. | A deterministic, saveable Project Factory V3 run supports evidence-led decisions, ledger, gates, capacity, causal rules, one event, stakeholders, formative debrief, and a stable read-only analytics projection contract. | Proves the reusable V3 primitives before sidecar UI polish or new-domain breadth. The sidecar contract may be prepared in parallel but does not block PF2/PF3 runtime work. |
| **P2 — Learner-pilot readiness** | `PF4.1`, `PF4.1a`, `PF4.2d`, `PF4.2e`, `PF4.3`, `PF5.3b`, `PF6.2`, `PF6.3`, plus `PF-SC-UI-01` and `PF-SC-UI-02`. | A 90-minute facilitated run and self-paced fallback are accessible, source-grounded, include reviewed deterministic events, produce an editable board memo, and expose the core sidecar tabs without mutating state. | Completes the agreed learning experience and makes the decision audit inspectable without adding an AI coach or high-stakes score. |
| **P3 — Operational sidecar and reuse** | `PF-SC-UI-03`, `PF-SC-TEST-01`, `PF-SC-TEST-02`, `PF-SC-PILOT-01`, `PF5.1a`, `PF5.3c`, `PF6.4`, further-pack conversion, and deferred `PF4.4`. | Stakeholder, capacity, events/exposures, resources, export, facilitator view, and pilot evidence are validated before reuse in BankNext, Care360, FutureReady, or BharatMart. | Keeps analytics useful and evidence-led without turning it into a second engine, trait detector, or AI-mediated dependency. |

### P0 task detail

| ID | Task | Acceptance criteria |
|---|---|---|
| PF-PLAN-01 | Confirm the V2 implementation baseline. | **Complete:** product owner confirmed tagged commit `Branch1-version-2` / `dc34433` as the intended V3 code base. Later V2 work is not included automatically. |
| PF-PLAN-02 | Establish the V2-based V3 implementation line and transfer planning artefacts. | **Branch and initial transfer complete:** separate `codex/project-factory-v3-impl` worktree/branch starts exactly at the approved V2 commit; planning artefacts are present as documentation-only commits; no V3 application implementation began; V2 worktree and branch remain untouched. |
| PF-PLAN-03 | Run the light content review. | **Complete:** product-owner/architect review accepted the provisional content on 2026-08-21. Quality-escape and technician-retirement cards remain un-authored until operations review is complete. |

### Parallel workstreams and dependencies

| Workstream | Can run now in parallel with | Depends on | Must not do yet |
|---|---|---|---|
| Documentation transfer | Reviewer-brief drafting, compatibility mapping, review scheduling | Clean V3 planning commits and the V2-based implementation worktree | Copy application code or silently merge planning-branch history |
| Operations/manufacturing review | Learning-design review, documentation transfer, compatibility/test planning | Assigned qualified reviewer and bounded brief | Author the two held event cards before dispositions are recorded |
| Learning-design review | Operations review, documentation transfer, compatibility/test planning | Assigned qualified reviewer and bounded brief | Approve cognitive-load or pilot readiness from planning alone |
| Compatibility and test design | Both reviews and documentation transfer | Read-only inspection of the frozen V2 seams; final APIs still depend on the V3 schema contract | Modify V2 behavior or start runtime implementation before P0 review gate |
| Schema/validator contract preparation | Documentation transfer and review preparation | P0 content-review completion before implementation | Encode unreviewed event thresholds as executable rules |
| Event-card authoring | — | Operations dispositions, plus quality/OEM and workforce input where applicable | Use generic “unfunded for N quarters” triggers or unbounded effects |

The active coordination rule is: each workstream reports dependencies and
contradictions to the lead, and sends overlapping findings to the affected
workstreams. The lead owns the consolidated backlog and resolves conflicts;
agents do not independently change branch state or declare a gate passed.

### P1 dependency graph after P0 review

Once `PF-PLAN-03` passes, the first implementation slice can be decomposed into
parallel lanes after the schema contract is fixed:

1. **Contract lane:** `PF0`, `PF0.2a`, `PF1.1`, `PF1.2`, and `PF1.2a` — schema, validator, metric authority, units, and fixtures.
2. **State/decision lane:** `PF1.3`, `PF1.4`, `PF2.0`–`PF2.3b` — v5→v6 migration, state factory, lifecycle/capacity, evidence-led decisions, and the executive ledger.
3. **Resolver lane:** `PF3.1`–`PF3.5b` — gates, delayed causal rules, value attribution, one event, stakeholders, exposure, and workflow evidence; it consumes the contract and state APIs.
4. **Test lane:** `PF6.1`, `PF6.1a`, and `PF6.1b` follow each contract/state/resolver slice, not a final testing phase.
5. **UI lane:** `PF2.4`, `PF2.5`, and then `PF4.0`–`PF4.2c` depend on stable store actions/selectors and resolver explanations. UI can be designed in parallel, but runtime implementation waits for those APIs.
6. **Analytics projection lane:** `PF2.6` defines pure selectors over `state.v3State`, pack metadata, and history; `PF6.1c` proves source links, deterministic progress, no mutation, and legacy hiding. Sidecar UI starts only after PF2/PF3 contracts exist; it consumes selectors and never writes resolver state.

Compatibility constraints for every lane: preserve Standard and non-V3 packs;
do not globally alter the V2 generic neglect penalty, periodic crisis logic,
generic adoption metric, composite score, or three-selection UI assumptions.
Opted-in V3 behavior must use separate state, rules, and report paths.

## Work packages

### Current implementation status

The first P1 foundation slice is implemented on
`codex/project-factory-v3-impl` and verified against the frozen V2 baseline:

- **Complete:** `PF0.1`, `PF0.2`, `PF1.1`, `PF1.2`, `PF1.2a`, `PF1.3`, and `PF1.4`.
- **Verified:** 44/44 unit/regression tests, type-check, production build, and the existing 8 E2E tests pass.
- **Compatibility rule:** V3 state is attached only when a scenario pack explicitly supplies V3 metadata. Legacy Standard/v1/v2 and Project Factory saves remain on the V2 state path.
- **Complete (pure runtime contracts):** `PF2.0`–`PF2.3b`, `PF3.1`–`PF3.5b`, and initial `PF6.1`/`PF6.1a`/`PF6.1b` coverage are implemented in additive modules (`v3Decisions.ts`, `v3Resolver.ts`) with deterministic focused tests. The resolver was hardened so causal evaluation is source-pure and events require authored trigger conditions.
- **Integration seam added:** `lib/game/v3Runtime.ts` now composes the pure contracts behind an additive `resolveV3Decision` façade. It is not invoked by legacy `resolveQuarter` or the V2 store path until a V3 pack/UI explicitly opts in.
- **Complete in this slice:** the façade is available through opt-in `confirmV3Decisions`; PF2.4/PF2.5 evidence-room and initiative-plan panels are mounted only when a pack supplies V3 metadata. Legacy scenario screens remain unchanged.
- **Complete in this slice:** the provisional Project Factory V3 pack is registered as `project-factory-2030`; PF2.6 selectors, PF6.1c fixtures, research-review branches, window history/cursor persistence, capacity scheduling, resolver-authored ledger outcomes, and the Window 1 runtime path are implemented. The analytics sidecar remains read-only and is not part of active play.
- **Technical P2 exit:** PF6.2 browser coverage passes for the opt-in Project Factory V3 flow and Standard-mode isolation (13/13 full browser tests; 5/5 V3-specific tests).
- **Implementation verification:** 72/72 unit/regression tests, type-check, production build, and the local browser walkthrough pass. The walkthrough confirms Orient → Compare → Commit → Outcome → Reflect → Next Window, save/resume at the saved cursor, research-only no-benefit semantics, and the explicit Window 2 boundary.
- **Learning P2 status:** **not accepted yet.** The current panels are technically mounted but do not sufficiently connect evidence, initiative plan, V3 runtime outcome, ledger, and sidecar into one learner-understandable loop.
- **Corrective slice:** rebuild one end-to-end Predictive Maintenance loop before declaring P2 learner-ready. Acceptance requires evidence citation, lifecycle/capacity/gate decision, resolver-authored metric outcome, ledger replay, and matching sidecar projection.
- **Next boundary:** P3 reuse, additional event cards, broader calibration, and other operational sidecar tabs remain paused until this corrective slice is accepted.

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
| PF2.6 | Define the read-only analytics projection contract and selectors. | `V3AnalyticsProjection` reads only V3 state, pack metadata, and history; tab availability, source references, observed/estimated/not-yet-observable labels, direction-aware progress, and legacy hiding are explicit. No derived analytics state is persisted and no selector mutates state. |

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

### WP-SC — Analytics sidecar

The complete sidecar contract is in [Project Factory V3 — Analytics Sidecar](./project-factory-v3-analytics-sidecar.md). These tasks are additive and consume the PF2/PF3 contracts; they do not introduce a parallel engine or alter V2 behavior.

| ID | Priority | Task | Acceptance criteria |
|---|---|---|---|
| PF-SC-UI-01 | P2 | Implement the core learner-facing sidecar tabs: Dashboard, Decision Ledger, Metrics & Targets, Evidence Room, and Governance & Gates. | Tabs render from `V3AnalyticsProjection`; each metric/status/insight has a source link; ledger replay is collapsible and deep-links; opening/navigating cannot change resolver state, scorecard, or outcomes; non-V3 runs hide the sidecar. |
| PF-SC-UI-02 | P2 | Integrate sidecar navigation with reflection/debrief and board memo. | “You said → You did → What happened → What you learned” remains the debrief spine; sidecar links to the same immutable ledger/outcome/reflection records; no automated trait or composite diagnosis is introduced. |
| PF-SC-UI-03 | P3 | Add Stakeholders, Capacity & Budget, Events & Exposures, Learn/Resources, exports, and facilitator-oriented post-run view. | Stakeholder movement, budget/capacity limits, event/exposure status, provenance, and resources are source-grounded; exports are labelled; facilitator view is read-only and respects retention/access policy. |
| PF-SC-TEST-01 | P3 | Add sidecar accessibility and interaction tests. | Keyboard/focus/semantic-label tests, responsive tab behavior, non-colour status cues, chart text alternatives, deep-link return paths, and export snapshots pass for every delivered tab. |
| PF-SC-TEST-02 | P3 | Add projection integrity, privacy, and compatibility tests. | Same input gives deterministic projection; before/after sidecar state is identical; no baseline/reflection/telemetry contamination; every claim has a source or derived label; legacy fixtures return hidden/empty projection. |
| PF-SC-PILOT-01 | P3 | Calibrate sidecar usefulness and cognitive load in the V3 pilot. | Facilitator/learner feedback records which tabs improve evidence use and debrief quality, which are distracting, and whether post-run view is needed; no trait inference or AI coach is enabled from telemetry. |

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

### Corrective P2 learner-loop slice (reopened)

The technical sidecar slice is not considered learner-accepted until one decision is experienced as a connected evidence → plan → resolver → metric → ledger loop.

| ID | Status | Acceptance evidence |
|---|---|---|
| P2-COHERENCE-01 | Implemented | Citing PF-E02, entering rationale/prediction/assumption, choosing deferred→research, carrying authored cost/capacity, and recording the immutable ledger entry are covered by `tests/e2e/v3-project-factory.test.cjs` and `tests/pf2-maintenance-loop.test.cjs`. |
| P2-COHERENCE-02 | Implemented | V3 operating metrics are visible in the live screen; authored capacity pools are initialized; V2 confirm is disabled for V3; type-check/build/unit/E2E suites pass. |
| P2-COHERENCE-03 | Complete for Window 1 implementation checkpoint | The local V3 walkthrough confirms the connected evidence → research plan → resolver finding → unchanged operating metrics → ledger/reflection chain. Full learner-effectiveness validation remains part of PF6.3 pilot work. |

### UX reset checkpoint (blocking further implementation)

The current additive UI is explicitly not learner-accepted. Do not add more tabs, styling, fields, event cards, or reuse work until this checkpoint is resolved.

| ID | Status | Required outcome |
|---|---|---|
| UX-RESET-01 | Complete — design agreed | The six-state learner journey and exact primary transition are documented in the learner-journey and Window 1 storyboard artefacts. |
| UX-RESET-02 | Complete — design agreed | An opted-in Project Factory V3 pack uses a dedicated stable V3 workspace; the V2 cockpit and active-play sidecar are not the primary path. |
| UX-RESET-03 | Complete — design agreed | Blue/action, teal/evidence, amber/constraint, red/blocked, green/resolved, and grey/context are semantic and paired with non-colour labels/icons. |
| UX-RESET-04 | Complete — design agreed | Window 1 presents three comparable Research packets but permits one primary Research decision, one outcome branch, and one contextual reflection. |
| UX-RESET-05 | Complete — product-owner approval recorded | The revised Window 1 wireframes/contracts were approved; the dedicated V3 shell is implemented for the authored Window 1 slice. Effectiveness validation remains a pilot activity. |

### Window 1 design-review checkpoint

| ID | Status | Required outcome |
|---|---|---|
| UX-W1-01 | Approved and implemented for Window 1 | [Window 1 Wireframes v2](./project-factory-v3-window-1-wireframes-v2.md) includes branch-specific Outcome/Reflect/Next Window states, explicit capacity labels, PF-E05 timing, responsive behavior, keyboard interaction, focus return, non-colour status, and a non-trapping primary action. |
| UX-W1-02 | Approved and implemented for Window 1 | [Window 1 Behavioral Contracts v2](./project-factory-v3-behavioral-contracts-v2.md) defines opt-in window history/cursor, Research review state, three branches and fixtures for all three opening initiatives, action-specific gate semantics, and four evidence meanings. |
| UX-W1-03 | Complete — one content correction recorded | [Window 1 Consistency Check](./project-factory-v3-window-1-consistency-check.md) aligns state, persistence, content, gates, and UI wording. Before implementation, correct PF-I05's `scale_gate` reference because G-PF-05 is authored as a Pilot gate. |
| UX-W1-04 | Complete — agent persona panel; conditional acceptance | At the product owner's explicit request, three context-aware reviewer personas substituted for the unavailable live walkthrough: operations/manufacturing SME, non-manufacturing executive learner, and learning-design/accessibility/facilitation reviewer. The panel walked the three opening priorities and all three branch implications. It accepted the method conditionally; it did not claim learning-effectiveness evidence. |
| UX-W1-05 | Complete — product-owner approval recorded | The corrected wireframes, behavioral contracts, branch content, and PF-I05/G-PF-05 correction were approved for the Window 1 vertical slice. |
| UX-W1-06 | Complete for authored Window 1 | The dedicated V3 workspace is implemented additively and opt-in. The slice covers Orient → Compare → Commit → Outcome → Reflect → Next Window, authored branch outcomes, quarter snapshots, saved cursor, and the explicit Window 2 content boundary. |
| UX-W1-07 | Draft complete — provisional; review required | `PF-RM-01` now bounds “fund the named remediation” as one Q4 quarter, ₹0.15 Cr, Data Engineering 1/4, Governance Assurance 1/2, Frontline Change 1/3, accountable CIO/data owner + Maintenance lead, completion evidence, exit options, and a no-operating-benefit boundary. Deterministic fixtures `PF-W2-RM-A/B` cover complete/incomplete outcomes. Review/calibrate the synthetic values before implementation. |
| UX-W1-08 | Draft complete — validation pending | All three opening priorities now have the same context pattern: why now, known facts, unknowns, decision test, accountable role, if-deferred trigger, cost/capacity, and plain-language terms. Validate that a non-manufacturing reviewer can make a bounded Research choice from the pack alone. |
| UX-FLOW-01 | Proposed — method contract added | V3 gameplay follows the six learner-facing states `Orient → Compare → Commit → Outcome → Reflect → Next Window`. Resolve is an internal transition phase, visible only for an authored event/gate pause. One primary action advances state; drawers/reports cannot advance or exit the campaign; pause/resume returns to the saved cursor; stop is a strategic action, not campaign exit. |
| UX-FLOW-02 | Updated — timing and facilitation contract | Facilitated mode targets 90 minutes: 8-minute prebrief, four 15-minute windows, 17-minute final debrief/board memo, and a 5-minute contingency/transition buffer. Self-paced mode retains the same state order without a punitive clock. Pilot measures timing, comprehension, cognitive load, accessibility, and discussion quality. |
| UX-W1-09 | Complete — agent-panel P0 corrections applied | Added a visible capacity-unit contract and legend, metric scope/denominator notes, Q1/Q2/Q3 interpretation timing, scheduled plus event-triggered deferral wording, plain-language context, the M-4 early-action boundary, trainer-day scope, and PF-I05's action-specific Pilot gate mapping. |
| UX-W1-10 | Complete for design gate — effectiveness validation deferred to pilot | The agent persona panel substituted the live context walkthrough by explicit product-owner direction and reached conditional acceptance. A future formative pilot must still test independent learner comprehension, cognitive load, timing, accessibility, and discussion quality; this is not waived. |

#### Mandatory state-screen contract

Before implementation resumes, each V3 state must have one primary action and a compact orientation header containing:

1. **Previous state:** last decision, relevant evidence, and observable outcome.
2. **Current state:** current quarter/window, initiative under consideration, spend/capacity available, and the one decision question.
3. **Expected action:** one clearly labelled primary action; secondary actions are hidden or deferred.
4. **Next state preview:** what will resolve, which metric/gate will be reviewed, and how the learner advances.

Initiative-linked insights must be co-located with the initiative decision. Generic dashboards, sidecars, and full evidence catalogues must not appear in the primary decision path; they belong behind deliberate disclosure after the learner is oriented.

## Detailed implementation order after the P0 gates

`PF0/PF0.2a → PF1/PF1.2a → PF1.3/PF1.4 + PF2.0–PF2.3b → PF3.1–PF3.5b → PF2.4/PF2.5 → PF2.6 + PF6.1c → PF4.0/PF4.2–PF4.2c → matching PF6.1/PF6.1a/PF6.1b tests → PF4.1/PF4.1a/PF4.2d/PF4.2e/PF4.3 → PF-SC-UI-01/PF-SC-UI-02 + PF5.3b/PF6.2/PF6.3 → PF-SC-UI-03/PF-SC-TEST-01/PF-SC-TEST-02/PF-SC-PILOT-01 → PF5.1a/PF5.3c/PF6.4 → PF4.4 only as pilot evidence warrants`

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
8. The product owner has separately authorised engine implementation after the P0 content gate; branch creation alone is not that authorisation.
9. Compatibility expectations are tied to `PF0.1`, `PF1.3`, and `PF6.1`: v1/v2 saves, Standard mode, the existing four packs, deployment assumptions, and the full regression suite remain protected.

## Deferred after the first pilot — AI reflection coach

This is intentionally not part of the V3 reference slice. It may be considered only after the structured reflection checkpoints have been piloted and the following acceptance conditions are met:

1. Pilot evidence identifies a meaningful self-paced reflection gap that a facilitator guide and structured prompts cannot meet.
2. A `ReflectionCoach` contract is defined: read only learner-visible evidence/ledger/outcomes; Socratic questions and summaries only; no portfolio recommendation, outcome generation, scoring, personality inference, or state mutation.
3. Grounded-response, hallucinated-causality, over-agreeable-tone, privacy/retention, accessibility, cost, and service-failure cases have explicit tests and fallback behaviour.
4. A learning-design reviewer and a facilitator approve the question design and an evaluation rubric before learner exposure.
