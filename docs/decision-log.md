# Project Decision Log

This log records material project outcomes after substantive planning, design, research, and implementation discussions. It is concise by design: it captures shareable rationale, evidence, decisions, and open questions rather than private chain-of-thought.

## 2026-08-21 — Learning direction and next-domain research

Status: proposed

- **Outcome:** The product direction is an evidence-led executive simulation under uncertainty, not a single-answer AI use-case picker.
- **Evidence:** Scenario-learning and AI-governance research was synthesised in [Scenario Learning Research and Architecture](./scenario-learning-research-and-architecture.md).
- **Recommended next five domains:** BharatMart retail/CPG, ShieldSure insurance, GridPulse utility, AgriLink agriculture/food processing, and CityFlow municipal services.
- **Architecture direction:** preserve the generic engine and add authoring/review, decision ledger, dependencies, seeded uncertainty, stakeholders, governance gates, transparent assessment, and grounded debriefing.
- **Open decision:** confirm primary learner, delivery format, assessment purpose, geographic stance, and reference pack before implementation.

## 2026-08-21 — Audit of the implemented scenario branch

Status: proposed

- **Objective:** determine how to apply the realism and learning recommendations to the four existing scenario packs first.
- **Inspected:** committed branch `feature/scenario-generic-pipeline` at `f7cad58`; scenario types/packs/registry; generic engine, store, persistence, initiative lifecycle, UI, and Node/E2E tests.
- **Finding:** the committed data-driven engine is the correct base. It already supports native metrics, initiative maturity/neglect, synergies, seeded periodic crises, persistence, and Standard-mode protection. It lacks explicit evidence, decision rationale, delivery capacity, dependencies, governance gates, stakeholders, causal lags/trade-offs, and domain-weighted assessment.
- **Decision:** pursue an additive, backward-compatible v2 scenario depth layer. Existing v1 scenarios retain current behaviour until deliberately converted; no scenario-name branches or LLM-generated outcomes.
- **Conversion order:** Project Factory becomes the reference pack, then BankNext, Care360, and FutureReady.
- **Plan:** [Current Scenarios: Depth-Layer Architecture and Change Approach](./current-scenarios-v2-approach.md).
- **Open decision:** product owner input is needed on learner, delivery format, time, assessment, geographic stance, fidelity, reviewers, and collaboration priority.

## Documentation practice

Status: implemented

- A reusable personal Codex skill, `project-decision-log`, was created and validated structurally by inspection. It instructs future work to update this shared record before final responses, distinguish evidence from assumptions, preserve decision status, and avoid recording private reasoning.
- The bundled validator could not run because its runtime lacks the `yaml` module; this did not affect the skill files. The skill front matter and required files were checked directly.

## 2026-08-21 — Reconciliation of shared expansion proposal

Status: proposed

- **Source:** user-provided planning text, `pasted-text.txt` (attached 2026-08-21).
- **Finding:** the proposal is substantively aligned with the current architecture direction: replace linear single-effect choices with causal rules; add initiative lifecycle, scorecard, dynamic events, stakeholder/change mechanics, optional backward-compatible v2 scenario fields, and learning objectives before implementation.
- **Confirmed domain backlog:** BharatMart, ShieldSure, GridPulse, AgriLink, and CityFlow remain the five recommended expansion packs.
- **Decision tension to resolve:** the shared proposal names BharatMart as the reference implementation, whereas the active plan to enrich existing scenarios names Project Factory as the reference conversion. Both are valid, but they answer different sequencing objectives.
  - **Project Factory first:** proves v2 primitives against the current product without expanding scope; its operational data, lags, and workforce tensions make it a lower-risk architecture reference.
  - **BharatMart first:** proves a new-domain authoring pack immediately and foregrounds customer, omnichannel, consent, and store-workforce trade-offs.
- **Proposed sequencing:** Project Factory v2 first; BharatMart immediately after as the first net-new domain. Change this only if validating new-domain authoring is more important than improving the currently implemented learning experience.
- **Next decision needed:** select the reference-pack sequence, then answer the Phase 0 learner/delivery/assessment questions in [Current Scenarios: Depth-Layer Architecture and Change Approach](./current-scenarios-v2-approach.md).

## 2026-08-21 — Project Factory selected as the v2 reference pack

Status: agreed

- **Decision owner:** user.
- **Decision:** Project Factory is the first v2 reference conversion. BankNext, Care360, and FutureReady follow; BharatMart is the first new-domain pack after the four existing scenarios are deepened.
- **Rationale:** Project Factory is already implemented on the committed scenario branch, has clear operational cause-and-effect, matches the priority to deepen existing scenarios first, and is the lowest-risk test bed for lifecycle, causal-rule, governance-gate, stakeholder, and conditional-event primitives.
- **Architecture consequence:** V2 will be additive and backward-compatible. `resolveQuarter` remains a pure orchestrator; new serializable pack/state data and pure v2 resolvers are preferred over store/UI business logic or scenario-name branches.
- **Design artefact:** [Project Factory 2030 v2: Reference-Pack Design Brief](./project-factory-v2-design-brief.md).
- **Open decisions:** target learner, delivery format, duration, assessment purpose, geographic stance, evidence fidelity, reviewer availability, portfolio policy, and first-slice scorecard weighting.

## 2026-08-21 — Project Factory v2 product contract and backlog

Status: agreed product direction; proposed implementation detail

- **Decision owner:** user.
- **Agreed learner and experience:** functional managers and MBA/management learners; 90-minute facilitated team exercise with a self-paced fallback; one transformation-lead role that a team can share; formative scorecard only in the first pilot.
- **Agreed context and evidence:** India-first context with globally portable concepts; all initial evidence is clearly labelled expert-calibrated synthetic until anonymised real data is available.
- **Agreed portfolio policy:** the learner may pursue fewer than three initiatives and may have no more than two initiatives in pilot or scale concurrently.
- **Reasoning:** the choices preserve executive realism and team discussion while avoiding uncalibrated high-stakes grading, unnecessary multi-role UI, and dependence on unavailable data.
- **Proposed facilitation guardrail:** retain the twelve-quarter horizon but group it into four board decision windows for the 90-minute workshop; keep one-quarter steps in self-paced mode. This needs pilot validation.
- **New artefacts:** [refined design brief](./project-factory-v2-design-brief.md), [testable implementation backlog](./project-factory-v2-implementation-backlog.md), and [Scenario v2 Content-Authoring Template](./scenario-v2-content-authoring-template.md).
- **Open decisions:** approve or revise the four-window cadence; identify manufacturing and learning-design reviewers; decide whether the first formative scorecard shows dimension ratings only or also an optional composite indicator.

## 2026-08-21 — V3 branch separation

Status: agreed

- **Decision owner:** user.
- **Decision:** create a third-version branch, `codex/project-factory-v3`, from `main` without integrating the active v2 scenario branch.
- **Repository facts at creation and staging:** `main` was `d71a6ea`; active v2 branch `feature/scenario-generic-pipeline` was `dc34433`; the V3 branch was created at `d71a6ea`. It now has a dedicated sibling worktree at `/Users/irfan/projects/AISim-v3`, with documentation-only commits `ea1fa29`, `aa2622e`, and `8b4f330`.
- **Rationale:** maintain a clean v3 boundary while v2 remains actively developed and hosted. Architecture planning may inspect v2, but code integration is explicitly deferred.
- **Constraint:** the shared worktree remains on v2 and contains uncommitted planning files plus unrelated local/generated artefacts. They were not moved, committed, reset, or deleted.
- **Future decision:** select an explicit v2 integration point and method only when v3 code work is authorised and v2 is stable enough for compatibility review.
- **Branch record:** [Version and Branch Strategy](./version-branch-strategy.md).

## 2026-08-21 — Project Factory v2 pilot configuration

Status: agreed

- **Decision owner:** user.
- **Workshop cadence:** retain the quarter-by-quarter engine; present four facilitated decision windows (Q1–Q3, Q4–Q6, Q7–Q9, Q10–Q12). Self-paced mode remains quarter by quarter.
- **Scoring:** show formative dimension ratings and the learner-visible evidence behind them. Do not show a composite score in the initial pilot.
- **Content review:** proceed with clearly labelled provisional synthetic content now. Evidence, causal-rule parameters, and stakeholder responses must include source/confidence metadata and an educational-use disclaimer; formal review can follow pilot learning.
- **Artefact updates:** [Project Factory v2 Design Brief](./project-factory-v2-design-brief.md) and [Project Factory v2 Implementation Backlog](./project-factory-v2-implementation-backlog.md).

## 2026-08-21 — Baseline assessment review

Status: agreed

- **Objective:** determine whether the five pre-game self-reflection prompts should remain unchanged in Project Factory v3.
- **Repository finding:** the current answers are displayed as a non-judgemental baseline but are passed to `createInferredGeneration`. The resulting context can affect campaign conditions and scenario effects; it is therefore more than a reflection-only instrument today.
- **Decision:** retain the five underlying dimensions and 1–5 response scale, use the revised wording in the Project Factory design brief, and decouple v3 responses from factory conditions, event probability, initiative effectiveness, scorecard, and difficulty. Use them only for hypothesis/advisor/debrief reflection.
- **Reasoning:** the current product promise says there are no wrong answers. A reflection baseline should not covertly reward or penalise a learner’s stated posture. The formative scorecard should assess observable decisions and evidence instead.
- **Implementation detail:** [Project Factory v2 Design Brief](./project-factory-v2-design-brief.md); backlog tasks `PF2.0` and `PF4.2a` in [Implementation Backlog](./project-factory-v2-implementation-backlog.md).

## 2026-08-21 — Reflection and conversational-coach architecture review

Status: agreed

- **Objective:** decide how to deepen learner self-reflection and whether a chatbot belongs in the Project Factory V3 reference slice.
- **Sources and artefacts inspected:** current baseline/reflection flow in `components/GameAssessmentScreen.tsx`, `components/GameHypothesisScreen.tsx`, `components/ReflectionCard.tsx`, `components/GameResultsModal.tsx`, and `lib/reflection.ts`; current advisor boundary in `lib/llm/advisorPrompt.ts`; research on structured simulation debriefing and educational chatbot support.
- **Finding:** the existing reflection implementation produces a numeric `selfAwareness`/belief-action alignment construct. That conflicts with the agreed V3 contract that baseline answers are reflective rather than judgemental or causal. The current Board Advisor is designed for concise operational recommendations, not a rigorous debrief.
- **Decision:** use a small, evidence-led structured reflection loop in V3: reconstruct, interpret, reframe, and transfer. Record one concise, optional checkpoint per board window plus a final workplace-transfer reflection. Keep facilitator-led team discussion primary and keep reflection separate from scorecard and resolver state.
- **Chatbot decision:** defer an AI reflection coach until after the structured experience has been piloted. It may later scaffold self-paced debriefing or prepare a human discussion, but must be evidence-grounded and question-led—not an outcome generator, portfolio recommender, scorekeeper, personality assessor, or replacement for a facilitator.
- **Rationale:** a chatbot is technically feasible but brings substantial learning-design, grounding, privacy/retention, tone, cost, and evaluation complexity. It should solve a demonstrated learner need rather than become a dependency of the reference slice.
- **Compatibility and validation:** V3 must replace the legacy reflection-alignment score only for an opted-in pack; V1/V2 behaviour remains untouched. A future coach requires pilot evidence, a reflection-quality rubric, adversarial evaluation cases, a transcript policy, failure fallback, and facilitator review before learner exposure.
- **Artefact updates:** [Project Factory v2 Design Brief](./project-factory-v2-design-brief.md) and [Project Factory v2 Implementation Backlog](./project-factory-v2-implementation-backlog.md).

## 2026-08-21 — V3 content-authoring staging discussion

Status: implemented for V3 workspace, planning baseline, and provisional content pack

- **Input reviewed:** a proposed sequence to create a dedicated `codex/project-factory-v3` worktree, move/rename the planning artefacts, commit them, then author the Project Factory V3 content pack.
- **Finding:** the sequence preserves the intended V2/V3 separation and identifies the correct content-pack categories. It is consistent with the existing branch strategy, but it changes the current planning-only boundary by creating a separate worktree and committing artefacts.
- **Implemented boundary:** the V3 worktree was established and relocated to `/Users/irfan/projects/AISim-v3` so it does not appear as an untracked directory in the active V2 worktree. The V3 planning baseline was committed in `ea1fa29` before the provisional content pack was committed in `aa2622e`; `8b4f330` records those outcomes.
- **Current phase:** V3 content authoring is complete for the first provisional Project Factory pack. Do not integrate, merge, rebase, or copy V2 application code into V3; do not implement engine, UI, persistence, or deployment changes.
- **Existing branch context:** active worktree remains `feature/scenario-generic-pipeline`; the sibling V3 worktree is a separate, clean planning boundary as described in [Version and Branch Strategy](./version-branch-strategy.md).

## 2026-08-22 — Analytics V2 scenario wiring audit and first implementation pass

Status: implemented first wiring pass; remaining work is documented

- **Objective:** verify whether every Analytics tab reflects the active domain scenario rather than generic portfolio proxies, then correct the highest-risk wiring issues.
- **Inspected:** AnalyticsHub, MagicAnalytics, KPI calculations, FrameworkDashboard, initiative evolution, roadmap/history, forecast, engine, game store, scenario registry, and all four scenario packs.
- **Finding:** the engine maintains native portfolio metrics and scenario-specific domain metrics as separate layers. The former Analytics tabs frequently read only native metrics, making scenario outcomes invisible in KPIs, Diagnostics, Forecasting, Frameworks, and parts of History.
- **Finding:** several KPI values are formula-derived estimates rather than recorded gameplay measurements. They must be labelled by provenance before being treated as operational analytics.
- **Implemented:** added a shared scenario/native analytics view model; rewired Dashboard and Diagnostics; made the heatmap target-progress and scenario-aware; added historical allocation evidence to DNA; removed Project Factory-specific BCG ID assumptions; corrected Q1 roadmap spend and currency; deducted selected initiative cost from the scenario quarter budget.
- **Validation:** `npm run type-check`, `npm run build`, and `npm test` pass; 35 tests pass.
- **Decision:** preserve one generic analytics boundary. Scenario differences belong in serializable pack declarations (metrics, effects, gates, events, stakeholder relationships), not scenario-name branches in the engine or UI.
- **Remaining action plan:** [Analytics V2 — Scenario Wiring Audit and Action Plan](./analytics-v2-audit-and-action-plan.md), especially KPI provenance, scenario scorecards, causal diagnostics, complete historical ledger, and pack-declared framework contributions.

## 2026-08-22 — Analytics V2 backlog completion pass

Status: implemented first V2 backlog slice; depth-layer items remain explicit

- **Objective:** complete the highest-priority analytics fixes identified by the cross-scenario audit.
- **Implemented:** KPI provenance disclosure and scenario scorecards; causal-chain and recommendation evidence in Diagnostics; richer History detail for allocation, spend, scenario outcomes, progress and synergies; scenario target projections beside native ROI; scenario-aware recommendations; scenario benchmark context in Frameworks; and generic framework scoring without Project Factory ID checks.
- **Constraint preserved:** scenario-specific behaviour remains data-driven. The engine and analytics boundary do not branch on BankNext, Care360, FutureReady or Project Factory names.
- **Validation:** type-check, production build, and all 35 Node tests pass.
- **Historical note:** at the time this entry was written, crisis-response and recommendation-approval persistence and the structured Learn retrospective were still listed as remaining. The later ledger-and-learning closure entry below supersedes those three items.
- **Remaining at the time:** authored framework contribution dimensions, uncertainty bands, governance-gate causal narratives, and deeper decision-ledger DNA. The framework contribution item was completed in the subsequent pass.
- **Source of truth:** [Analytics V2 — Scenario Wiring Audit and Action Plan](./analytics-v2-audit-and-action-plan.md).

## 2026-08-22 — Analytics V2 ledger and learning closure

Status: implemented locally on `feature/scenario-generic-pipeline`; validation passed

- Persisted recommendation approvals and crisis responses into the latest quarter snapshot so the History tab reflects what happened after the initial decision.
- Added per-initiative spend to the Dashboard, using the live selection or the last completed quarter when the next decision window is open.
- Added a structured Learn-tab retrospective covering the decision, observed scenario movement, causal evidence, spend, approvals and the next-quarter question.
- **Validation evidence:** `npm run type-check` passed; `npm test` passed all 35 tests; `npm run build` passed on 2026-08-22.
- **Remaining decision:** review whether the next analytics slice should prioritise full decision-ledger DNA, uncertainty bands, governance-gate narratives, or browser-level tab assertions. No commit, push, merge or deployment was performed as part of this workstream.

## 2026-08-24 — V2 decision-window and evidence-led analytics refinement

Status: implemented in the V2 working tree; pending release validation

- **Objective:** continue V2 from the weekend baseline without changing V3, while making the decision window more compact, scenario feedback more active, and analytics more honest about evidence versus interpretation.
- **Scope inspected:** the four scenario packs, current V2 release notes, analytics audit, pre-production checklist, and the existing V2 decision-window implementation.
- **Implemented in the working tree:** collapsible Quarter Coach and Decision Preview; live decision-impact evidence; evolved initiative values with baseline movement; dynamic scenario challenge states; latest-completed-quarter spend/Diagnostics fallback; separate Strategy DNA and Initiative Evolution responsibilities; and modelled-proxy labelling.
- **Agreed semantics:** 60% is a suggested UI deployment pace only. It is not a minimum, a required quarterly spend, or a restriction on learner choice. Flexible budgets and 0–3 initiative choices remain part of V2.
- **Evidence rule:** measured snapshots and scenario-native values remain primary. Forecasts, framework views, heuristic KPI cards and inferred patterns are interpretations and must be labelled as modelled proxies.
- **Compatibility constraint:** Standard Mode and all four scenario packs remain on the generic V2 engine. No scenario-name branching, V3 edits, new branch, commit, push or deployment is part of this documentation task.
- **Known risks:** the four packs still contain provisional domain values and targets; browser-level coverage and manual playthroughs remain outstanding; uncertainty bands and deeper governance-gate narratives remain future V2 depth work.
- **Next decision:** after manual and browser validation, decide whether this V2 working-tree change is ready to commit and release. Until then, these notes are a record of implementation status, not production approval.
