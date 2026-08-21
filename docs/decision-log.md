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
- **Plan:** [Current Scenarios: Depth-Layer Architecture and Change Approach](./current-scenarios-v3-approach.md).
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
- **Next decision needed:** select the reference-pack sequence, then answer the Phase 0 learner/delivery/assessment questions in [Current Scenarios: Depth-Layer Architecture and Change Approach](./current-scenarios-v3-approach.md).

## 2026-08-21 — Project Factory selected as the v2 reference pack

Status: agreed

- **Decision owner:** user.
- **Decision:** Project Factory is the first v2 reference conversion. BankNext, Care360, and FutureReady follow; BharatMart is the first new-domain pack after the four existing scenarios are deepened.
- **Rationale:** Project Factory is already implemented on the committed scenario branch, has clear operational cause-and-effect, matches the priority to deepen existing scenarios first, and is the lowest-risk test bed for lifecycle, causal-rule, governance-gate, stakeholder, and conditional-event primitives.
- **Architecture consequence:** V2 will be additive and backward-compatible. `resolveQuarter` remains a pure orchestrator; new serializable pack/state data and pure v2 resolvers are preferred over store/UI business logic or scenario-name branches.
- **Design artefact:** [Project Factory 2030 v2: Reference-Pack Design Brief](./project-factory-v3-design-brief.md).
- **Open decisions:** target learner, delivery format, duration, assessment purpose, geographic stance, evidence fidelity, reviewer availability, portfolio policy, and first-slice scorecard weighting.

## 2026-08-21 — Project Factory v2 product contract and backlog

Status: agreed product direction; proposed implementation detail

- **Decision owner:** user.
- **Agreed learner and experience:** functional managers and MBA/management learners; 90-minute facilitated team exercise with a self-paced fallback; one transformation-lead role that a team can share; formative scorecard only in the first pilot.
- **Agreed context and evidence:** India-first context with globally portable concepts; all initial evidence is clearly labelled expert-calibrated synthetic until anonymised real data is available.
- **Agreed portfolio policy:** the learner may pursue fewer than three initiatives and may have no more than two initiatives in pilot or scale concurrently.
- **Reasoning:** the choices preserve executive realism and team discussion while avoiding uncalibrated high-stakes grading, unnecessary multi-role UI, and dependence on unavailable data.
- **Proposed facilitation guardrail:** retain the twelve-quarter horizon but group it into four board decision windows for the 90-minute workshop; keep one-quarter steps in self-paced mode. This needs pilot validation.
- **New artefacts:** [refined design brief](./project-factory-v3-design-brief.md), [testable implementation backlog](./project-factory-v3-implementation-backlog.md), and [Scenario v2 Content-Authoring Template](./scenario-v3-content-authoring-template.md).
- **Open decisions:** approve or revise the four-window cadence; identify manufacturing and learning-design reviewers; decide whether the first formative scorecard shows dimension ratings only or also an optional composite indicator.

## 2026-08-21 — V3 branch separation

Status: agreed

- **Decision owner:** user.
- **Decision:** create a third-version branch, `codex/project-factory-v3`, from `main` without integrating the active v2 scenario branch.
- **Repository facts at creation:** `main` was `d71a6ea`; active v2 branch `feature/scenario-generic-pipeline` was `dc34433`; the v3 branch was created at `d71a6ea` and is not checked out.
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
- **Artefact updates:** [Project Factory v2 Design Brief](./project-factory-v3-design-brief.md) and [Project Factory v2 Implementation Backlog](./project-factory-v3-implementation-backlog.md).

## 2026-08-21 — Baseline assessment review

Status: agreed

- **Objective:** determine whether the five pre-game self-reflection prompts should remain unchanged in Project Factory v3.
- **Repository finding:** the current answers are displayed as a non-judgemental baseline but are passed to `createInferredGeneration`. The resulting context can affect campaign conditions and scenario effects; it is therefore more than a reflection-only instrument today.
- **Decision:** retain the five underlying dimensions and 1–5 response scale, use the revised wording in the Project Factory design brief, and decouple v3 responses from factory conditions, event probability, initiative effectiveness, scorecard, and difficulty. Use them only for hypothesis/advisor/debrief reflection.
- **Reasoning:** the current product promise says there are no wrong answers. A reflection baseline should not covertly reward or penalise a learner’s stated posture. The formative scorecard should assess observable decisions and evidence instead.
- **Implementation detail:** [Project Factory v2 Design Brief](./project-factory-v3-design-brief.md); backlog tasks `PF2.0` and `PF4.2a` in [Implementation Backlog](./project-factory-v3-implementation-backlog.md).

## 2026-08-21 — Reflection and conversational-coach architecture review

Status: agreed

- **Objective:** decide how to deepen learner self-reflection and whether a chatbot belongs in the Project Factory V3 reference slice.
- **Sources and artefacts inspected:** current baseline/reflection flow in `components/GameAssessmentScreen.tsx`, `components/GameHypothesisScreen.tsx`, `components/ReflectionCard.tsx`, `components/GameResultsModal.tsx`, and `lib/reflection.ts`; current advisor boundary in `lib/llm/advisorPrompt.ts`; research on structured simulation debriefing and educational chatbot support.
- **Finding:** the existing reflection implementation produces a numeric `selfAwareness`/belief-action alignment construct. That conflicts with the agreed V3 contract that baseline answers are reflective rather than judgemental or causal. The current Board Advisor is designed for concise operational recommendations, not a rigorous debrief.
- **Decision:** use a small, evidence-led structured reflection loop in V3: reconstruct, interpret, reframe, and transfer. Record one concise, optional checkpoint per board window plus a final workplace-transfer reflection. Keep facilitator-led team discussion primary and keep reflection separate from scorecard and resolver state.
- **Chatbot decision:** defer an AI reflection coach until after the structured experience has been piloted. It may later scaffold self-paced debriefing or prepare a human discussion, but must be evidence-grounded and question-led—not an outcome generator, portfolio recommender, scorekeeper, personality assessor, or replacement for a facilitator.
- **Rationale:** a chatbot is technically feasible but brings substantial learning-design, grounding, privacy/retention, tone, cost, and evaluation complexity. It should solve a demonstrated learner need rather than become a dependency of the reference slice.
- **Compatibility and validation:** V3 must replace the legacy reflection-alignment score only for an opted-in pack; V1/V2 behaviour remains untouched. A future coach requires pilot evidence, a reflection-quality rubric, adversarial evaluation cases, a transcript policy, failure fallback, and facilitator review before learner exposure.
- **Artefact updates:** [Project Factory v2 Design Brief](./project-factory-v3-design-brief.md) and [Project Factory v2 Implementation Backlog](./project-factory-v3-implementation-backlog.md).

## 2026-08-21 — V3 content-authoring staging discussion

Status: implemented for workspace and planning-artefact staging; content authoring remains next

- **Input reviewed:** a proposed sequence to create a dedicated `codex/project-factory-v3` worktree, move/rename the planning artefacts, commit them, then author the Project Factory V3 content pack.
- **Finding:** the sequence preserves the intended V2/V3 separation and identifies the correct content-pack categories. It is consistent with the existing branch strategy, but it changes the current planning-only boundary by creating a separate worktree and committing artefacts.
- **Implemented boundary:** a dedicated V3 worktree was established on `codex/project-factory-v3` and relocated to `/Users/irfan/projects/AISim-v3` so V3 artefacts do not appear as an untracked subdirectory of the active V2 worktree. Self-contained, V3-named planning artefacts were prepared there for an initial documentation-only commit. The original uncommitted V2-worktree artefacts were preserved.
- **Next authorised phase:** author the **Project Factory V3 content pack only**, after the planning-artefact commit. Do not integrate, merge, rebase, or copy V2 application code into V3; do not implement engine, UI, persistence, or deployment changes.
- **Existing branch context:** the active worktree remains `feature/scenario-generic-pipeline`; the V3 worktree is a separate, clean planning boundary as described in [Version and Branch Strategy](./version-branch-strategy.md).

## 2026-08-21 — Project Factory V3 provisional content pack authored

Status: committed planning content; pending review and calibration

- **Objective:** produce the first complete, implementation-independent reference content pack after the V3 planning baseline was committed.
- **Artefact:** [Project Factory V3 Content Pack](./project-factory-v3-content-pack.md), authored from the [Scenario V3 Content-Authoring Template](./scenario-v3-content-authoring-template.md).
- **Contents:** seven evidence artefacts; an organisation, metric, and gate-evidence dictionary; portfolio/capacity policy; six initiative delivery profiles and one governance gate per initiative; five stakeholder definitions and declared response rules; three bounded causal-rule shapes; one condition-triggered line-failure event; six formative scorecard dimensions; four structured reflection checkpoints; baseline-to-debrief prompts; positive/negative deterministic fixtures; and accessibility/review criteria.
- **Content status:** every rule parameter and numerical value is labelled expert-calibrated synthetic — provisional. No claim is made about a real named manufacturer. The pack contains no executable engine, UI, persistence, migration, deployment, or V2 integration change.
- **Reflection decision applied:** the four Reconstruct, Interpret, Reframe, and Transfer checkpoints are present. Baseline answers are reflection-only; no `selfAwareness` or belief/action alignment score is carried into V3 content. The AI reflection coach remains deferred until post-pilot validation.
- **Validation still required:** manufacturing operations/maintenance, quality/OEM, learning-design, and responsible-AI/governance review; schema/pack-validator design; deterministic resolver tests; accessibility review; and learner pilot calibration.
- **Commit record:** committed on `codex/project-factory-v3` in `aa2622e` after the planning baseline commit `ea1fa29`. Both commits are documentation-only; V2 code remains untouched.

## 2026-08-21 — V2 final-report autopsy informs V3 result integrity

Status: proposed V3 guardrails; no V2 code change authorised

- **Objective:** assess an observed 12-quarter Project Factory V2 final report for contradictions that would undermine V3 learning credibility.
- **Observed report evidence:** adoption was displayed at 38% in every quarter despite people and knowledge-assistant investment; risk was displayed at 5% while the roadmap still instructed the learner to bring it below 25%; a B/64 grade and generic outcome score coexisted with worsening/unmet quality and energy metrics; “tension awareness” was 100/100 despite zero identified tensions; the India-first scenario displayed $/M budget/spend language; and the narrative called a low-governance, low-baseline-governance run a “Trust Steward.”
- **Repository findings:** `resolveQuarter` merges scenario-state metrics over generic metrics in `lib/game/engine.ts`, while Project Factory stores generic adoption/efficiency/data/satisfaction keys in scenario state; this can overwrite calculated movement with a static starting value. Generic score/ROI/adoption/risk remain separate from scenario progress in `lib/game/engine.ts`, `lib/game/scoring.ts`, and `stores/gameStore.ts`; scenario progress is only a capped bonus. Risk has a floor of 5 and the report always renders the same “below 25%” roadmap item. Reflection defines tension score as `100 - 18 × number of tensions`, so zero tensions yields 100. Campaign archetype language is a formula-based label, not a verified causal explanation. Scenario currency metadata is not applied during game initialisation.
- **Proposed V3 response:** introduce metric-authority/unit validation, operational-value attribution, contextual deferral/exposure rules, source-grounded report integrity, and regression fixtures. Preserve the agreed V3 formative scorecard, non-causal baseline, four reflection checkpoints, and deferred AI coach; do not replace them with a new self-awareness score or universal allocation/funding thresholds.
- **Important design qualification:** adoption should respond to authored workflow/change evidence and stakeholder rules, not merely a people-allocation percentage. Risk should be decomposed into declared exposure/control conditions and gates, not prevented from falling below an arbitrary floor. A static plan is not automatically poor; unexplained persistence despite contrary evidence is the learning concern.
- **Artefact updates:** [V3 Design Brief](./project-factory-v3-design-brief.md), [V3 Content Pack](./project-factory-v3-content-pack.md), and [V3 Implementation Backlog](./project-factory-v3-implementation-backlog.md).

## 2026-08-21 — V3 branch-base clarification

Status: current-state finding; implementation-branch transition proposed; no branch or code change authorised

- **Question:** whether the V3 solution is being built on the V2 codebase.
- **Repository evidence:** the active V2 branch is `feature/scenario-generic-pipeline` at `dc34433` (`Branch1-version-2`). The current documentation-only V3 branch, `codex/project-factory-v3`, is rooted at `main` commit `d71a6ea`; `dc34433` is not an ancestor of that branch.
- **Clarification:** V3’s intended product architecture should be additive to the V2 scenario pipeline, preserving V2 behaviour for non-V3 packs. The current branch separation was a planning-isolation choice, not an intended independent product foundation.
- **Proposed transition at implementation approval:** retain this branch as the V3 planning/content baseline; create a new V3 implementation branch from a frozen V2 commit, then bring across the reviewed documentation-only V3 commits. This establishes V2 as the code foundation without altering V2 or performing V2/V3 code integration during planning.
- **Current boundary:** no branch move, merge, rebase, cherry-pick, or application-code change has been performed. An uncommitted content-pack refinement from the ongoing self-review remains uncommitted pending this branch-architecture decision.

## 2026-08-21 — V3 status checkpoint

Status: planning and provisional-content review in progress; no implementation authorised

- **Committed baseline:** `codex/project-factory-v3` currently contains only V3 planning/content documentation through `f170819`. The authored content pack, design brief, implementation backlog, decision log, and branch strategy are present and labelled provisional.
- **Work in progress:** internal self-review against the observed V2 report. The uncommitted documentation refinement adds a contextual exposure register for reliability, quality/OEM, energy/throughput, workforce, and supply continuity. It has not been committed or treated as calibrated content.
- **Not started:** V3 engine/schema, UI, persistence, migration, tests, deployment, V2/V3 code integration, and external SME review.
- **Architecture position:** the intended V3 product must extend the V2 pipeline, but the present V3 planning branch is rooted at `main`. A V2-based implementation branch has not been created because the product owner has not yet approved that branch transition or implementation.
- **Next decision:** choose whether to complete and commit the internal self-review refinements first, then arrange formal calibration; and confirm the V2-based branch transition approach before any implementation branch is created.

## 2026-08-21 — V3 branch, self-review, and alternative review-plan confirmation

Status: agreed; documentation-only refinement and commit in progress; engine implementation still deferred

- **Branch approach:** `codex/project-factory-v3` remains the V3 planning/content record. The eventual V3 implementation branch will be created from a named frozen commit on `feature/scenario-generic-pipeline`, making V2 the product-code foundation. No branch cut, merge, rebase, or code integration is performed by this decision.
- **Self-review refinements:** adoption is represented as initiative-specific workflow evidence rather than a generic campaign metric; generic neglect penalties are replaced with contextual exposure and review conditions; monetary benefit is withheld as **not yet observable** until CFO/operations calibration provides declared conversion assumptions.
- **Review route:** accept the documented alternative review plan. Internal self-review completes now; one manufacturing/operations reviewer and one learning-design reviewer review asynchronously before a learner pilot; full manufacturing, quality/OEM, CFO/operations, governance, and learning calibration follows the pilot before broader reuse.
- **Explicit non-decision:** reflection remains learner-owned debrief material only. It does not produce a self-awareness score or affect outcomes/assessment. The AI reflection coach remains deferred.
- **Current engine boundary:** the V3 documentation baseline may now be committed. V3 schema, engine, UI, persistence, tests, deployment, and the V2-based implementation-branch cut each still require the subsequent explicit implementation authorisation.
- **Artefacts:** [content self-review](./project-factory-v3-content-self-review.md), [content pack](./project-factory-v3-content-pack.md), [design brief](./project-factory-v3-design-brief.md), [implementation backlog](./project-factory-v3-implementation-backlog.md), and [branch strategy](./version-branch-strategy.md).

## 2026-08-21 — V3 first-checkpoint traceability review

Status: completed review; proposed authoring-contract refinements; no engine or V2 code change authorised

- **Objective:** trace the original realism checklist, scenario template, domain roadmap, and stated learning/responsible-AI sources into the current V3 design.
- **Finding:** Project Factory V3 has substantially progressed the core dynamics: dependencies, lifecycle/capacity/budget, delayed/conditional effects, stakeholder rules, gates, non-AI workflow evidence, events, decision ledger, and structured debrief. Most are authored content and architecture contracts; none is yet running V3 engine behaviour.
- **Standards stance:** the design is informed by INACSL simulation principles, the 2024 scenario-design review, NIST AI RMF, and OECD AI Principles. It is not an INACSL endorsement, NIST conformance assessment, legal review, or OECD certification claim.
- **Unclosed gaps:** the reusable template does not yet require an explicit plausible-but-wrong-for-now option, a consolidated operating-change plan, 2–3 event coverage for a learner-ready pack, a source-bound final board memo, a library-level budget-posture rule, or mandatory equity/distributional, residual-risk, sustainability, and incident-learning fields.
- **Roadmap confirmation:** BharatMart Omnichannel Reset, ShieldSure Claims Transformation, GridPulse Summer Reliability, AgriLink Procurement Network, and CityFlow Urban Services remain the agreed next-five content roadmap. They are neither authored nor approved for implementation before Project Factory validates the V3 primitives.
- **Artefact:** [V3 first-checkpoint traceability review](./v3-first-checkpoint-traceability-review.md).

## 2026-08-21 — Next V3 planning checkpoint recommended

Status: proposed next step; no authoring-contract or engine change authorised yet

- **Recommendation:** refine the reusable V3 authoring contract before further Project Factory expansion or implementation. The checkpoint review identified five linked gaps: wrong-for-now evidence, an operating-change plan, complete event coverage, a source-bound final board memo, and pack-level risk/equity/accessibility/sustainability fields.
- **Proposed sequence:** update and version the authoring template; run Project Factory through the revised template; obtain the agreed light operations and learning-design review; then name the frozen V2 commit and create the V2-based V3 implementation branch for the agreed thin vertical slice.
- **Boundary:** no new domain pack, V2 integration, engine, UI, persistence, or deployment work starts in this checkpoint.

## 2026-08-21 — First-checkpoint authoring-contract additions

Status: agreed; V3 planning/content baseline advanced to 0.2; no engine or V2 code change authorised

- **Language preference:** communicate in English only.
- **Evidence status:** add separate provenance and decision-use claim status. Reject the proposed rule that any decision based on provisional evidence is flagged, because every current source is transparently provisional synthetic. Prompt reflection only when contested or insufficient evidence is the sole substantive basis for a material claim.
- **Operating-change plan:** require concise structured workflow, role, remediation, capability/release, owner, feedback, and rollback content for pilot/scale. Reject direct effects from plan quality or completion; observed workflow/change evidence alone may affect authored rules.
- **Event coverage:** map five Project Factory exposures. The first vertical slice implements the line-failure event; a learner-ready pack needs two or three reviewed deterministic event cards. Reject generic neglect-duration triggers and do not approve a detailed probability/trigger risk-map UI at this point.
- **Board memo:** require an editable, source-bound, formative memo. It supports facilitator or peer discussion and is never engine-scored or LLM-invented.
- **Responsible-impact record:** require risk, equity/distributional impact, accessibility, sustainability, residual risk, monitoring, escalation, and incident-learning reflection at material scale decisions and in the final memo. To protect cognitive load, it is not a four-question form on every minor action and it never affects outcomes or assessment.
- **Architecture consequence:** these additions require additive schema, validator, persistence, UI, and test work alongside content. They fit the V3 approach but are not “content and UI only.”
- **Artefact updates:** [authoring template](./scenario-v3-content-authoring-template.md), [Project Factory content pack](./project-factory-v3-content-pack.md), [design brief](./project-factory-v3-design-brief.md), [implementation backlog](./project-factory-v3-implementation-backlog.md), and [first-checkpoint review](./v3-first-checkpoint-traceability-review.md).

## 2026-08-21 — V3 implementation-base verification

Status: current-state finding; implementation cut remains pending product-owner authorisation

- **Question addressed:** whether `dc34433` can now be treated as the V2 base for a V3 implementation branch.
- **Repository evidence:** `dc34433` is the current HEAD of `feature/scenario-generic-pipeline` and is contained by the `Branch1-version-2` tag. The active V2 worktree has unrelated and planning files that remain uncommitted; no V2 code change, merge, or branch cut was performed during this verification.
- **Interpretation:** the tag makes `dc34433` a reproducible candidate baseline. It is not, by itself, a semantic approval to freeze V2; the product owner must still confirm that the tag/commit is the intended implementation baseline before a V3 implementation branch is created.
- **Proposed next sequence:** retain the decision to wait for the two calibrated event cards; arrange the agreed light manufacturing-operations and learning-design reviews; then, on explicit approval, create a named V2-based V3 implementation branch from the confirmed baseline and transfer the documentation-only V3 planning commits. No V3 engine work is authorised by this record.

### Clarification: what the V2-freeze confirmation means

- **It does:** name one immutable V2 commit as the code starting point for a separate V3 implementation line. The existing `Branch1-version-2` tag currently identifies candidate commit `dc34433`; creation of `codex/project-factory-v3-impl` from that commit would give V3 the V2 scenario pipeline without changing the active V2 branch.
- **It does not:** stop V2 development, merge V3 into V2, deploy anything, overwrite the V2 worktree, or author V3 engine/UI code. Subsequent V2 commits would simply not appear in the V3 implementation branch unless deliberately brought across later.
- **Why confirmation is required:** this is a product-lineage choice, not a technical necessity. Once V3 begins implementation from a baseline, later V2 fixes/features must be evaluated and selectively integrated, so the product owner must confirm that `dc34433` represents the intended V2 behaviour to inherit.
- **Risk to manage:** the active V2 worktree contains uncommitted planning and local files. Those files are not captured by a branch cut from `dc34433`; this is desirable unless the product owner considers any of them part of the V2 baseline. A named commit/tag makes that boundary reviewable and reproducible.

## 2026-08-21 — V3 prioritized next-step plan

Status: agreed planning sequence; execution remains pending explicit authorisation

- **Priority 0 — lineage and calibration:** first obtain product-owner confirmation of `Branch1-version-2` / `dc34433` as the V2 implementation baseline; then create the separate V2-based V3 implementation branch and transfer documentation-only V3 planning commits. In parallel, prepare and complete the agreed light operations and learning-design review. The two additional Project Factory event cards remain deferred until operations review.
- **Priority 1 — core reference slice:** only after P0 gates, implement and test opt-in V3 schema, validation, migration, evidence/lifecycle/capacity/ledger decisions, gates, deterministic causal rules, one event, stakeholders, and evidence-led reflection/debrief. Standard and non-V3 behaviour remain unchanged.
- **Priority 2 — learner-pilot readiness:** add truthful report integrity, board memo, responsible-impact reflection, workshop/self-paced flows, and two or three reviewed deterministic events; then conduct the formative pilot.
- **Priority 3 — reuse:** calibrate from pilot evidence before porting primitives to the other existing scenarios or BharatMart; continue to defer the AI reflection coach.
- **Authorisation boundary:** this plan does not itself freeze V2, create a branch, start engine work, or merge/deploy anything.

## 2026-08-21 — Executive decision-ledger contract

Status: agreed V3 first-slice requirement; planning/content only

- **Decision:** elevate the decision ledger from a generic decision record to the auditable four-window learning spine: “you said → you did → what happened → what you learned.” It is a P1 reference-slice capability, not a later enhancement.
- **Pre-resolution record:** persist an immutable material-decision snapshot with lifecycle/capacity/cost action, rationale, predicted indicator/direction, assumption or known unknown, accountable owner, cited evidence, optional 1–5 confidence, and gate/stop criterion.
- **Resolution and reflection separation:** the deterministic resolver writes the outcome snapshot—metrics, gates, events, stakeholders, rule/evidence references, and uncertainty. The learner may then record a concise, skippable reflection and next adjustment. Neither confidence, timestamp, evidence-opening telemetry, nor learner text may affect outcomes or scorecard state.
- **Safeguards:** baseline attitudes remain reflection-only and are not an initial scenario hypothesis. The first pilot does not produce automatic blind-spot, trait, or prediction-accuracy diagnoses; the debrief presents visible entries for learner/facilitator interpretation. Any advisor/pattern-analysis use stays deferred until pilot evidence and a bounded rubric justify it.
- **Artefact updates:** [content pack](./project-factory-v3-content-pack.md), [design brief](./project-factory-v3-design-brief.md), [implementation backlog](./project-factory-v3-implementation-backlog.md), and [authoring template](./scenario-v3-content-authoring-template.md).

## 2026-08-21 — P0 readiness clarification

Status: current-state clarification; product-owner decisions remain pending

- **Planning versus readiness:** the V3 planning baseline is coherent and committed, but the Project Factory content remains provisional and is not yet learner-ready. It still lacks light operations and learning-design review, two additional reviewed event cards, technical validation, and a learner pilot.
- **Review gate:** the documented alternative review route stages full multi-specialist calibration until after the pilot; it does **not** waive the agreed light operations/manufacturing and learning-design review required by `PF-PLAN-03` before engine implementation. A future intention to identify reviewers is not a completed review.
- **Branch gate:** `Branch1-version-2` / `dc34433` remains a tagged, reproducible candidate V2 baseline. No product-owner approval to freeze it and no `codex/project-factory-v3-impl` branch creation has been received or performed.
- **Current boundary:** P1 engine work remains unauthorised. The next executable P0 actions require an explicit V2-baseline confirmation and assigned qualified reviewers (or an explicitly approved substitute review mechanism with equivalent documented evidence).

### Product-owner acknowledgement

- **Accepted:** the alternative review route defers broad post-pilot calibration but does not waive the light operations/manufacturing and learning-design review gate.
- **Completed:** the product owner subsequently approved `Branch1-version-2` / `dc34433` as the V3 code baseline; the implementation branch is recorded below.
- **Still pending:** assignment of the two qualified reviewers (or approval to draft briefs while reviewer identities are being identified). No documentation transfer, reviewer outreach, or engine work follows from the branch cut alone.

## 2026-08-21 — V3 implementation branch created from frozen V2 baseline

Status: implemented branch boundary; content review and engine implementation remain pending

- **Product-owner decision:** freeze the reproducible V2 snapshot identified by `Branch1-version-2` / `dc34433` for V3 implementation lineage.
- **Repository action:** created worktree `/Users/irfan/projects/AISim-v3-impl` on branch `codex/project-factory-v3-impl`, with HEAD exactly at `dc34433` (`Present multi-domain scenarios on homepage`).
- **Safety boundary:** the active V2 worktree and branch were not modified. No V3 application code, documentation transfer, merge, deployment, or engine work was performed by this branch cut.
- **Next gate:** transfer reviewed documentation-only V3 planning commits as a separate operation, complete the bounded operations and learning-design review, and pass the P0 content-calibration gate before starting P1 engine work.

## 2026-08-21 — Parallel V3 workstream orchestration

Status: agreed execution coordination model; implementation remains P0-gated

- **Orchestration:** the primary agent remains the workstream lead. Parallel agents may inspect and prepare bounded outputs, exchange dependency findings directly, and report contradictions to the lead; only the lead consolidates the plan and declares gates. Agents do not independently edit code, alter branches, contact reviewers, or mark review complete.
- **Parallel now:** documentation-only transfer into the V2-based implementation branch; operations/manufacturing review; learning-design review; reviewer-brief preparation; compatibility/test mapping; and authoring-validator planning can proceed independently where their interfaces are explicit.
- **Blocked:** quality-escape and technician-retirement event cards remain blocked on operations and relevant quality/workforce review. P1 engine/UI/persistence implementation remains blocked until the bounded light reviews are completed and the product owner separately authorises engine work.
- **P1 coordination:** after the schema contract is fixed, contract/validator, state/decision-ledger, resolver, and test lanes can progress in parallel. UI runtime work depends on stable state/store/resolver APIs. Tests must track each slice.
- **Compatibility hazards:** V3 must not globally change the V2 generic neglect penalty, periodic crisis logic, generic adoption metric, composite score, or fixed three-selection assumptions. Opted-in V3 paths must remain additive and source-bound.
- **Agent findings inspected:** V3 planning/dependency audit, frozen-V2 compatibility map, and content/reviewer-readiness review. Their conclusions are consolidated in [the implementation backlog](./project-factory-v3-implementation-backlog.md).

## 2026-08-21 — P0 parallel outputs completed

Status: implemented documentation outputs; external review and engine authorization remain pending

- **Documentation transfer:** the reviewed planning commits were transferred into `/Users/irfan/projects/AISim-v3-impl` on `codex/project-factory-v3-impl` as documentation-only changes. Transfer tip: `2e0fbc4`. The implementation worktree is clean and has no non-documentation changes from this operation.
- **Reviewer briefs:** bounded operations/manufacturing and learning-design briefs were authored in [project-factory-v3-reviewer-briefs.md](./project-factory-v3-reviewer-briefs.md), commit `66f74a2` on the planning branch, and transferred to the implementation branch. The implementation-branch documentation tip is now `43625dd`; only documentation paths changed.
- **Compatibility handoff:** the frozen V2 seams, migration hazards, regression fixtures, and P1 dependency order were mapped read-only. Key constraints are preservation of Standard/v1/v2 behavior, opt-in V3 state/rules, v5→v6 migration, and no global changes to legacy neglect, crisis, adoption, score, or three-selection paths.
- **Remaining dependency:** reviewer identities/contact context and completed review dispositions. No engine/UI/persistence implementation is authorized until the light review gate passes and the product owner separately authorizes P1.

## 2026-08-21 — Frozen V2 regression baseline environment check

Status: blocked by local dependency installation; no source change authorized

- **Worktree checked:** `/Users/irfan/projects/AISim-v3-impl`, branch `codex/project-factory-v3-impl`, HEAD `43625dd`, clean.
- **Commands attempted:** `npm test`, `npm run test:e2e`, `npm run type-check`, and `npm run build`.
- **Result:** none reached test/build execution because the worktree has no installed dependencies: TypeScript, Playwright, `tsc`, and Next.js commands are unavailable. No files, fixtures, or source were changed.
- **Next external dependency:** approval to install project dependencies in the implementation worktree (and, separately, reviewer identity/contact context). Once approved, rerun the frozen V2 regression suite before P1 implementation.

## 2026-08-21 — Frozen V2 baseline verification completed

Status: passed baseline verification; V3 implementation remains review-gated

- **Environment:** approved `npm ci` completed in `/Users/irfan/projects/AISim-v3-impl`. npm reported eight high-severity audit findings in the existing dependency tree; no automated audit fix or dependency upgrade was performed because that would change the baseline.
- **Unit/regression:** `npm test` passed all 35 tests.
- **Static/build:** `npm run type-check` passed; `npm run build` passed.
- **Browser:** `npm run test:e2e` passed all 8 Playwright tests, including Standard-mode isolation, scenario-mode campaign flow, reload/save behavior, and strategy discovery.
- **Workspace integrity:** the test-generated `balance-report.json` diff was restored; the implementation worktree remains clean at `43625dd` with documentation-only V3 additions and inherited V2 code.
- **Interpretation:** the frozen V2 foundation is technically healthy for the next gate. This does not validate V3 behavior, because no V3 runtime has been implemented. The remaining product dependency is light operations/manufacturing and learning-design review, followed by explicit P1 engine authorization.

## 2026-08-21 — P1 foundation slice implemented

Status: implemented and verified; next P1 decision/runtime slices remain

- **Authorized scope delivered:** `PF0.1` V2 save fixtures; `PF0.2`/`PF1.1` additive V3 schema/types; `PF1.2`/`PF1.2a` pack validator with reference, lifecycle, dependency, metric-authority, unit, currency, bounds, event, and report-source checks; `PF1.3` v5→v6 migration/defaults; and `PF1.4` deterministic V3 state factory.
- **Implementation commits:** `aa4ad0a` (fixtures), `173b130` (schema/validator), `2a939cb` (state/migration), and `b347da8` (explicit V3 pack opt-in compatibility guard).
- **Compatibility safeguard:** legacy Standard, v1, v2, and Project Factory saves do not receive V3 state unless the scenario pack explicitly supplies V3 metadata. V2 code paths remain unchanged.
- **Verification:** full suite `44/44` passed; type-check passed; production build passed; prior V2 E2E baseline passed `8/8`. The implementation worktree is clean after restoring test-generated reports.
- **Not included:** lifecycle decision UI, evidence room, ledger capture runtime, gates/causal/event/stakeholder resolvers, scorecard/debrief runtime, or V3 migration UI. These remain the next P1 slices.

## 2026-08-21 — Analytics sidecar integrated into the V3 delivery plan

Status: agreed architecture and backlog integration; sidecar UI implementation deferred until PF2/PF3 contracts are stable

- **Decision owner:** user.
- **Decision:** include the Project Factory V3 Analytics Sidecar as a first-class V3 workstream. It is a read-only projection over V3 state, pack metadata, and history—not a second engine or a second source of truth.
- **Sequence:** define the projection contract and selector invariants after PF2/PF3 state APIs are fixed (`PF2.6`, `PF6.1c`); implement the core learner-facing tabs in P2; implement operational/facilitator tabs and pilot calibration in P3. This does not delay the authorized PF2/PF3 runtime lanes.
- **Required surfaces:** Dashboard; Decision Ledger replay; Metrics & Targets; Governance & Gates; Stakeholders; Capacity & Budget; Events & Exposures; Evidence Room; and Learn/Resources. The core pilot slice prioritizes Dashboard, Ledger, Metrics, Evidence, and Gates.
- **Architecture guardrails:** every displayed claim must point to visible evidence, ledger, authored rule, gate, event, stakeholder rule, exposure, or an explicitly labelled derived calculation. Observed/estimated/not-yet-observable labels and scenario-owned units are mandatory. Opening or navigating the sidecar cannot mutate outcomes, scorecard state, baseline answers, reflections, or resolver state. Non-V3 runs hide the sidecar.
- **Schema reconciliation:** the supplied design examples referenced legacy `scenarioState.*` paths. The implementation will map to the actual V3 contract (`state.v3State`, scenario pack V3 metadata, and `state.history`) through pure selectors; derived analytics are not persisted.
- **Explicit non-decisions:** no composite score, CEO grade, trait/archetype diagnosis, automated blind-spot inference, or AI reflection coach is added by the sidecar. Any facilitator/post-run analytics expansion remains subject to pilot evidence and retention/access review.
- **Artefact:** [Project Factory V3 — Analytics Sidecar](./project-factory-v3-analytics-sidecar.md); backlog work package `WP-SC` in [Implementation Backlog](./project-factory-v3-implementation-backlog.md).

## 2026-08-21 — PF2/PF3 pure runtime contracts implemented

Status: implemented; orchestration/UI integration remains the next V3 slice

- **Scope delivered:** PF2.0–PF2.3b baseline reflection contract, authored lifecycle/dependency/gate validation, budget and active-delivery capacity validation, immutable portfolio-plan application, decision-ledger pre-resolution records, resolver-authored outcome attachment, and learner-owned reflection separation.
- **Resolver scope delivered:** PF3.1–PF3.5b gate evaluation, delayed causal-rule evaluation, operational-value attribution status, condition-triggered events, event coverage lookup, stakeholder movement, contextual exposure/deferral, and initiative-scoped workflow-adoption evidence.
- **Tests delivered:** deterministic state/ledger/legacy-compatibility coverage plus focused resolver tests. The causal resolver is source-pure; event resolution requires authored trigger conditions when present.
- **Compatibility:** V2/Standard behavior remains unchanged; V3 modules are additive and are not invoked for packs without explicit V3 metadata. The current Project Factory pack is still a V2 pack, so no legacy run silently acquires V3 mechanics.
- **Verification:** full unit suite 50/50 passed, production build passed, and existing E2E suite 8/8 passed. Type-check passed with incremental artifacts disabled because the sandbox blocks `.tsbuildinfo` writes.
- **Not yet delivered:** store/quarter orchestration wiring, PF2.4/PF2.5 UI, PF4 debrief UI, and sidecar selectors/UI. These remain ordered after the pure contracts.
- **Implementation commits:** `eda81aa`, `859172c`, `5868c00`, and resolver hardening `5aae843` on `codex/project-factory-v3-impl`.

## 2026-08-21 — V3 decision-resolution integration seam added

Status: implemented; V3 UI/store opt-in remains next

- **Decision:** expose the PF2/PF3 pure contracts through additive `lib/game/v3Runtime.ts` (`resolveV3Decision`). It validates the portfolio plan, appends the immutable ledger plan, evaluates declared gates, applies delayed causal effects, records optional event resolution, and returns source-labelled operational-value attribution.
- **Compatibility:** the façade is not called by legacy `resolveQuarter` or the V2 Zustand store. A scenario must explicitly provide V3 metadata and a future V3 UI/store action must opt in before these mechanics run.
- **Verification:** a focused façade test confirms composition, ledger capture, gate evaluation, causal movement, and value attribution without mutating the input state.
- **Next:** wire the façade to the V3 decision UI/store, then implement PF2.4/PF2.5 and sidecar projection selectors. This preserves the approved ordering and prevents accidental V2 behavior changes.
- **Commit:** `b5f738e` on `codex/project-factory-v3-impl`.

## 2026-08-21 — PF2.4/PF2.5 opt-in flow integrated

Status: implemented and verified; sidecar selectors/UI remain deferred to P2/P3

- **Store seam:** `confirmV3Decisions(plan, ledger?)` now calls the additive V3 façade only when the active scenario explicitly supplies `scenario.v3`. It updates V3 state and declared V3 metrics without entering the legacy `confirmDecisions` path.
- **UI seam:** `V3EvidenceRoom` and `V3InitiativePlan` are mounted conditionally in the game shell for opted-in V3 packs. They expose provenance, claim status, lifecycle, owner, evidence requirements, and authored transitions. Current four V2 packs do not mount them.
- **Tests:** orchestration/UI contract coverage was added; the full unit/regression suite passes 57/57, production build passes, and existing E2E passes 8/8.
- **Compatibility:** no V2 scenario, Standard mode, fixed three-selection flow, legacy score, or legacy quarter resolver was changed. V3 UI remains opt-in and the sidecar remains a separate P2/P3 read-only projection.
- **Commits:** `0c66fb7`, `cb05857`, and `71235b7` on `codex/project-factory-v3-impl`.

## 2026-08-21 — Project Factory V3 runtime pack and core sidecar delivered

Status: implemented and verified; operational sidecar expansion remains P3

- **Runtime content:** converted the reviewed provisional content pack into [projectFactoryV3.ts](../lib/scenarios/projectFactoryV3.ts), registered under canonical id `project-factory-2030`, and kept the legacy `projectFactory` definition unchanged. The pack contains authoritative/reported metrics, seven evidence artefacts, six initiatives, five stakeholders, six gates, three causal rules, one event, portfolio policy, scorecard/reflection metadata, and source-bound reports.
- **Validation correction:** fixed lifecycle-transition parsing so `stop` is not split by the word `to`; aligned provisional effect units and removed an authored dependency cycle so the runtime pack passes the validator.
- **PF2.6:** implemented deterministic read-only analytics projection selectors with direction-aware progress, source-rule/evidence links, ledger/gate/stakeholder/capacity/event/exposure/evidence views, and legacy hidden behavior.
- **P2 core sidecar:** implemented and mounted Dashboard, Ledger, Metrics, Evidence, and Governance tabs through [V3AnalyticsSidecar.tsx](../components/V3AnalyticsSidecar.tsx). It mounts only when V3 metadata and V3 state are present and has no mutating actions.
- **Verification:** full suite passes **67/67**, production build passes, and existing V2 E2E passes **8/8**. The implementation worktree is clean after restoring generated reports.
- **Known deferred schema depth:** the authored content still carries richer exposure registers, event options/trade-offs, seeded ranges, and detailed stakeholder response effects in documentation/extensions; those are scheduled for the operational sidecar/P3 calibration rather than silently approximated in the current engine.
- **Commits:** `917d454`, `2c33a79`, `50ff6d2`, `ca39eff`, `63a9563`, `bda2bed`, `d664e72`, and `9c71fa0`.

## 2026-08-21 — P2 core sidecar and browser gate completed

Status: P2 complete; paused at the documented P3/product-owner boundary

- **Browser coverage:** PF6.2 now covers the opt-in `project-factory-2030` launch, Evidence Room, Initiative Plan, Dashboard, Ledger, Metrics, Evidence, and Governance tabs. It also confirms Standard mode mounts none of the V3 surfaces.
- **Launch boundary:** V3 state is eagerly initialized only for the V3 pack. The existing `projectFactory` V2 entry remains separate; no V3 state leaks into V2 saves or Standard mode.
- **Accessibility/source improvements:** sidecar tabs have accessible tab/panel relationships, keyboard focus, source/evidence links, and stakeholder status context while remaining read-only.
- **Verification:** 67/67 unit/regression tests, production build, and 10/10 E2E tests pass.
- **P3 boundary reached:** remaining stakeholder/capacity/events-exposures/resources/export tabs, richer event options/exposure register/seeded ranges, pilot calibration, and reuse of primitives in BankNext/Care360/FutureReady are now the next work. These require product-owner prioritisation and/or calibration direction, so implementation pauses here.
- **Commits:** `bddd205`, `eeda26e`, and `1c32970`.

## 2026-08-21 — P2 learner-experience acceptance reopened

Status: agreed corrective action; P3 remains paused

- **Product-owner finding:** although the P2 panels, runtime pack, selectors, and browser tests exist, the learner experience is not yet coherent enough to accept. Evidence is presented as a catalogue, the initiative plan is not visibly driving the live V3 quarter, and the sidecar is not yet experienced as a replay of the learner's own evidence → decision → outcome chain.
- **Correction:** treat the current implementation as a technical slice, not learner-ready P2. Rebuild one end-to-end Predictive Maintenance loop before expanding scope.
- **Acceptance contract:** the learner opens and cites evidence; selects a lifecycle action; sees cost, capacity, dependencies, owner, gate, and stop criterion; records prediction/assumption; resolves through the V3 path; observes metric/gate/stakeholder/uncertainty movement; and sees the same records replayed in the ledger and sidecar.
- **Compatibility:** this corrective work remains additive and opt-in. Standard, V1, V2, and the legacy `projectFactory` path remain untouched.
- **Explicit pause:** no P3 reuse, additional event-card authoring, broader scenario conversion, or unrelated sidecar expansion until the corrective slice passes learner-facing acceptance.

## 2026-08-21 — Predictive-maintenance learner loop made coherent

Status: implemented and verified; learner acceptance remains open for product-owner review

- **Finding addressed:** the first P2 shell made evidence, initiative planning, and the sidecar visible but did not make them causally legible as one learner action. This was a product/experience gap, not a request for more generic tabs.
- **Implemented loop:** V3 evidence can be cited; the learner must enter rationale, prediction, and key assumption; lifecycle actions carry authored cost/capacity; V3 capacity pools are declared by the pack; the legacy V2 confirm control is disabled in V3; authored operating metrics are visible in the live screen; the resolver records the decision through the V3 ledger path.
- **Source/engine boundaries:** cited evidence and learner text are ledger metadata only. Outcomes remain resolver-authored. The predictive-maintenance causal rule is initiative-scoped and applies only when the initiative is active, preserving delayed/conditional behavior and V2 isolation.
- **Verification:** TypeScript check, production build, 68/68 unit/regression tests, and 11/11 browser tests pass. The new browser flow proves evidence citation and prediction replay in the ledger after a V3 research decision; Standard/V2 coverage remains green.
- **Remaining acceptance question:** does this single loop feel understandable and decision-relevant to a learner when exercised locally? Product-owner review of the live flow is now the next gate. P3 reuse, deferred event cards, and broader sidecar expansion remain paused.

## 2026-08-21 — V3 learner-experience reset required

Status: agreed direction to pause implementation; redesign checkpoint required

- **Product-owner finding:** the current V3 screen is not learnable enough to serve as the reference experience. It presents too many simultaneous controls and panels, does not establish a clear action sequence or visual hierarchy, and leaves the learner unsure which evidence, initiative, metric, and action are connected. The sidecar adds reporting surface without improving decision comprehension. The recent coherence patch does not resolve this fundamental problem.
- **Root cause:** V3 was composited onto the V2 cockpit instead of replacing the quarter decision journey with a state-driven V3 experience. Technical opt-in isolation is not sufficient learner isolation.
- **Decision:** stop feature implementation and do not proceed to P3, reuse, additional events, or further UI embellishment. Treat the current V3 implementation as a disposable technical prototype/reference for contracts, not as an accepted learner interface.
- **Required redesign:** define one explicit learner journey before code resumes: orient to the current board window; inspect only evidence relevant to the current decision; choose one bounded action; record a concise prediction; resolve; observe one outcome; reflect; then advance. Every visible element must have a declared role in that sequence.
- **Open product decision:** whether V3 should be a dedicated state-driven experience (recommended) or continue sharing the V2 cockpit with most legacy controls hidden. This must be settled in the redesign checkpoint before implementation resumes.

## 2026-08-21 — UX problem definition clarified by product owner

Status: agreed problem definition for redesign

- The learner cannot reconstruct the **previous state**: what happened, which decision caused it, and what evidence was used.
- The learner cannot orient to the **current state**: what the current spending decision is, which initiative it belongs to, what insight matters, or what action is expected now.
- The learner cannot anticipate the **next state**: what will change after the action, what result will appear, and how the game advances.
- Initiative-specific insights, spending, metrics, and governance information are not visibly associated with one another. The learner must mentally join unrelated panels.
- The additive V3 interfaces increase frustration because they introduce new surfaces without a clear flow contract. This is a coordination and sequencing failure, not a missing-detail problem.
- Redesign requirement: every screen state must answer, in order: **What just happened? What decision is open? What evidence/constraint matters for this decision? What action do I take? What will happen next?** Details must be progressively disclosed only after the learner has chosen the relevant initiative or decision.

## 2026-08-21 — State-driven V3 learner journey proposed

Status: proposed; awaiting product-owner review

- **Inputs:** product-owner feedback on excessive simultaneous context and missing previous/current/next-state orientation; the agreed four-window cadence; the V3 engine/content boundary; and the supplied synthesis of progressive disclosure, cognitive-load theory, OODA, meaningful choice, state visibility, and immediate feedback.
- **Recommendation:** create a dedicated V3 learner shell and retain one stable workspace whose central task moves through Orient → Compare → Commit → Outcome → Reflect → Next Window. This adapts the supplied five-screen storyboard to avoid introducing another collection of disconnected interfaces.
- **Information architecture:** co-locate initiative, evidence, spend, capacity, gate, trade-off, and primary metric in a compact decision packet. Remove the analytics sidecar and full evidence catalogue from active play; reuse their pure selectors in contextual outcomes and final debrief.
- **Validation strategy:** storyboard and test Window 1 before production code. A learner must independently identify the decision, relevant options, consequence/cost, primary action, and resulting change.
- **Compatibility:** existing V3 engine contracts remain potentially reusable; the current V3 UI remains a non-accepted technical prototype. No V2 integration, P3 reuse, event expansion, or further production UI is authorised by this proposal.
- **Artefact:** [Project Factory V3 — Learner-Journey Redesign Proposal](./project-factory-v3-learner-journey-redesign.md).

## 2026-08-21 — Dedicated V3 learner journey approved; Window 1 storyboard authored

Status: learner-journey direction agreed; storyboard proposed for review

- **Agreed by product owner:** dedicated V3 workspace; one stable shell; Orient → Compare → Commit → Outcome → Reflect → Next Window; co-located initiative decision packets; progressive disclosure; one primary action; semantic colour grammar; removal of the additive V2-plus-panels pattern and disconnected five-page approach.
- **Scope boundary retained:** no production implementation, P3 reuse, additional event cards, active-play analytics sidecar, AI reflection coach, new scoring, or cosmetic repair of the rejected V3 screen.
- **Storyboard:** Window 1 compares predictive-maintenance, visual-quality, and technician-knowledge research. Each packet co-locates the current problem, cost, capacity, relevant evidence, decision-use boundary, metric, and trade-off. Immediate pilot/scale is explicitly wrong for now because required evidence is absent.
- **Outcome principle:** research consumes resources and changes lifecycle/evidence readiness; it does not automatically improve downtime, defects, or workforce readiness. Outcome must explain both what changed and what did not.
- **Review gate:** settle whether Window 1 authorises one primary research priority, whether these are the correct three opening options, how deferral is presented, and the provisional research-result contract before visual wireframes or production code.
- **Artefact:** [Project Factory V3 — Window 1 Low-Fidelity Storyboard](./project-factory-v3-window-1-storyboard.md).

## 2026-08-21 — Window 1 reviews synthesised

Status: recommended revisions; awaiting product-owner approval

- **Accepted:** stable shell, single primary action, one Window 1 research authorisation, three opening priorities, skippable reflection, sidecar removal, explicit carried-forward state, and `changed / did not change / why / uncertainty` outcome structure.
- **Modified:** energy is acknowledged as monitored context rather than a fourth equal signal; Energy, Demand, and Supply appear as a collapsed later-window portfolio line rather than full selectable packets.
- **Rejected:** a recommended initiative, immediate Energy pilot, invented Q0 changes or pressure scores, required free-text prediction/assumption, full Evidence Room access in Orient, research-stage downtime/trust/readiness benefits, and research consuming an active pilot/scale slot. These conflict with the content pack or reintroduce cognitive/causal ambiguity.
- **Guardrail:** wireframes may represent only authored content and state transitions. Numeric outcome movements require a reviewed rule and deterministic fixture; presentation design cannot invent resolver behavior.
- **Artefact:** [Project Factory V3 — Window 1 Review Synthesis](./project-factory-v3-window-1-review-synthesis.md).

## 2026-08-21 — Window 1 synthesis approved for visual wireframing

Status: agreed; visual design authorised, production implementation not authorised

- **Approved:** dedicated stable V3 shell; six-state loop; one primary research authorisation; Predictive Maintenance, Visual Quality, and Technician Knowledge opening packets; co-located evidence/cost/capacity/gate/trade-off; skippable reflection; sidecar removal; and `changed / did not change / why / uncertainty` outcomes.
- **Approved refinements:** energy is monitored context; Energy, Demand, and Supply are visible as a collapsed later-window portfolio; Commit uses one structured prediction plus an optional note; research uses declared capacity but no active pilot/scale slot; and research cannot create operating benefit.
- **Rejected alternatives remain rejected:** recommended-answer labels, immediate Energy pilot, invented Q0 movements or pressure scores, mandatory free text, full Evidence Room in the primary path, and unsupported research-stage metric movement.
- **Next authorised deliverable:** visual wireframes for Orient, Compare, Commit, Outcome, Reflect, and Next Window using the stable shell and agreed semantic colours.
- **Validation gate:** production implementation remains blocked until the wireframes are reviewed and tested with representative learners. No P3 reuse, additional events, active-play sidecar, AI reflection coach, or scoring changes are authorised.

## 2026-08-21 — Window 1 visual wireframes reviewed

Status: architecture accepted in principle; revisions required before design/implementation approval

- **Accepted:** stable shell, six-state progression, three research packets, semantic colour grammar, monitored-energy context, later-window portfolio visibility, structured prediction, research no-benefit boundary, optional reflection, and source-bound outcome structure.
- **Interaction revisions:** make packets whole-card/radio selections with one global primary action; remove generic persistent tool links and active-play full-ledger access; clarify Research/Pilot/Scale language; expand capacity abbreviations; and add responsive/keyboard/focus requirements.
- **Blocking contract gaps:** define deterministic three-quarter window orchestration, research duration/per-quarter capacity schedule, research-result branches, pilot-readiness versus scale-gate state, and lifecycle-specific evidence requirements.
- **Contradiction prevented:** the illustrative `pilot-ready` research outcome cannot be guaranteed or inferred from learner prediction. It needs authored evidence/state/seed rules and fixtures; G-PF-01 remains a scale gate.
- **Implementation boundary:** existing V3 primitives may be reused, but the wireframe implies additive contracts not currently complete. Production implementation remains blocked until the revised design and those contracts are approved and tested.
- **Artefact:** [Project Factory V3 — Window 1 Visual Wireframe Review](./project-factory-v3-window-1-wireframe-review.md).

## 2026-08-21 — Revised Window 1 wireframes and behavioral contracts reviewed

Status: wireframe interaction architecture accepted; behavioral-contract revisions required

- **Wireframes:** the revised stable shell, state progression, whole-card selection, contextual links, explicit lifecycle language, energy/portfolio framing, research boundary, optional reflection, and replay-only Next Window are accepted. Branch variants, explicit labels, and responsive/accessibility annotations remain required.
- **State correction:** do not introduce `ResearchCompleted` as a lifecycle. Keep lifecycle `Research` and add a separate source-bound `researchReview.status`.
- **Persistence correction:** V3 ledger belongs in `state.v3State.ledger`, not legacy `scenarioState`; V3 window/quarter replay needs an additive serialisable window history and idempotent pause/resume cursor.
- **Causality correction:** research branches require authored, initiative-specific findings and outcome artefacts. Arbitrary thresholds and hidden seed luck are rejected; learner prediction cannot affect the branch.
- **Evidence correction:** distinguish available evidence, learner-cited decision evidence, resolver-produced outcome evidence, and gate-required evidence. Opening/citing an artefact never satisfies a gate by itself.
- **Scope correction:** contracts are Project Factory reference contracts and candidate generic primitives until pilot evidence supports reuse across V3 scenarios.
- **Implementation boundary:** production remains paused until the revised contracts, three-initiative branch content, wireframe variants, and representative-learner walkthrough are approved.
- **Artefact:** [Project Factory V3 — Revised Wireframe and Behavioral-Contract Review](./project-factory-v3-revised-wireframe-contract-review.md).

## 2026-08-21 — Window 1 v2 design package delivered

Status: proposed package complete; representative walkthrough and product-owner approval pending

- **Source:** product-owner/Codex instruction accepted the stable-shell interaction architecture and required branch-complete wireframes, corrected behavioral contracts, a consistency check, and no production implementation.
- **Wireframes delivered:** all three Research-review branches now have distinct Outcome, Reflect, and Next Window states. Capacity names are explicit, PF-E05 is labelled as early Q1 excerpts/full Q2 brief, and responsive, keyboard, focus-return, non-colour-status, and sticky-action behavior is specified.
- **Contracts delivered:** the Project Factory reference contract now uses `state.v3State.ledger`, opt-in V3 window history, an idempotent resolution cursor, separate `researchReview` state, lifecycle/action relevance filters, data-type aggregation, four evidence meanings, and branch-specific outcome artefacts.
- **Content authored for review:** Predictive Maintenance, Visual Quality, and Technician Knowledge each have `pilot-ready-with-conditions`, `remediation-required`, and `priority-not-supported` conditions plus deterministic fixtures. Learner prediction, note, reflection, and evidence-opening telemetry remain outcome-neutral.
- **Consistency finding:** PF-I05 currently lists G-PF-05 under `scale_gate`, while G-PF-05 applies to the Technician Knowledge Pilot. Treat it as a Pilot gate, show it as `not yet evaluated` after Research, and correct the action-specific profile mapping before implementation. No new Knowledge Scale gate is invented.
- **Compatibility boundary:** documentation only. V2 code, Standard mode, existing packs, production UI, persistence, and runtime were not changed. Contracts remain Project Factory reference contracts/candidate primitives until pilot evidence supports reuse.
- **Next gate:** run a structured walkthrough with the product owner and 3–5 representative learners/facilitators, resolve feedback, and explicitly approve the design package before Window 1 production work.
- **Artefacts:** [Window 1 Wireframes v2](./project-factory-v3-window-1-wireframes-v2.md), [Window 1 Behavioral Contracts v2](./project-factory-v3-behavioral-contracts-v2.md), and [Window 1 Consistency Check](./project-factory-v3-window-1-consistency-check.md).

## 2026-08-21 — Preliminary Window 1 walkthrough: Predictive Maintenance path

Status: proposed observation; walkthrough gate remains open

- **Participant/context:** Product owner completed one conversational walkthrough path; this is not a representative-learner sample or final approval.
- **Observed path:** Orient → Compare → Predictive Maintenance → Commit → Research Review (`pilot-ready-with-conditions`) → Reflect → Window 2.
- **Observed comprehension:** The participant identified Reliability, Quality, and Workforce as the opening priorities; selected Predictive Maintenance; accepted the distinction between Research and operating intervention; and understood that the Pilot decision occurs in Window 2.
- **Reflection evidence:** The participant wrote, “evidence that research will give clear directions for the pilot,” demonstrating that the reflection prompt can elicit a pre-Pilot condition without changing the result.
- **Design signal:** The path currently provides a coherent evidence → decision → authored outcome → next decision chain. No new contradiction was found in this path.
- **Remaining validation:** Walk the `remediation-required` and `priority-not-supported` variants, then test the package with 3–5 representative learners/facilitators. UX-W1-04 remains in progress and UX-W1-05 remains blocked.
