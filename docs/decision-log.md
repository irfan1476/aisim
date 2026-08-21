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
- **Implemented boundary:** a dedicated V3 worktree was established at `/Users/irfan/projects/AISim/.worktrees/project-factory-v3` on `codex/project-factory-v3`. Self-contained, V3-named planning artefacts were prepared there for an initial documentation-only commit. The original uncommitted V2-worktree artefacts were preserved.
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
