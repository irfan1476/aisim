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
