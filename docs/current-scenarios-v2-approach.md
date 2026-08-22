# Current Scenarios: Depth-Layer Architecture and Change Approach

Status: proposed — planning and discussion only
Date: 2026-08-21
Scope: extend the four implemented scenario packs without starting the five proposed new domains

## Confirmed sequencing

Status: agreed
Project Factory is the first v2 reference conversion. BankNext, Care360, and FutureReady follow; BharatMart is the first new-domain pack after the four existing scenarios are deepened. The rationale and Project Factory-specific design are in [Project Factory 2030 v2: Reference-Pack Design Brief](./project-factory-v2-design-brief.md).

Related records:

- [Scenario Learning Research and Architecture](./scenario-learning-research-and-architecture.md)
- [Scenario Pipeline — Implementation Plan](./scenario-pipeline-plan.md)
- [Project Decision Log](./decision-log.md)

## Decision request

Approve the direction to evolve the existing four packs—Project Factory 2030, BankNext Transformation, Care360 Health Network, and FutureReady University—from portfolio-selection exercises into evidence-led executive simulations.

This is not a request to implement the full plan yet. It establishes the safe architecture and content approach that implementation should follow.

## What was inspected

The committed branch is `feature/scenario-generic-pipeline` at `f7cad58` (2026-08-21). It contains the generic scenario pipeline introduced across 33 changed files.

Inspected components include:

- Scenario schema, registry, all four packs, helpers, and progress calculation: `lib/scenarios/*`.
- Generic resolver, engine, allocation/maturity/initiative state, persistence, scoring, and game store: `lib/game/*`, `stores/gameStore.ts`.
- Scenario selector, decision screen, results experience, final screen, advisor prompt, and view types: `components/*`, `lib/llm/advisorPrompt.ts`.
- Engine and browser coverage: `tests/game-engine.test.cjs`, `tests/e2e/campaign.test.cjs`.

No application code was modified during this audit.

## Current architecture: what is worth preserving

| Existing capability | Why preserve it |
|---|---|
| Domain-agnostic registry and serializable packs | New domains can be added as data rather than engine-specific branches. |
| Native scenario metrics, bounds, units, direction, and targets | Each industry already has a meaningful operating vocabulary. |
| Initiative state, maturity, neglect, declared synergies, and 12-quarter history | These make continuity, sequencing, and long-term consequences visible. |
| Save migration and Standard-mode regression boundary | The depth layer must not corrupt existing learner progress or Standard mode. |
| Scenario-specific crises and advisor context | These are the right hooks to evolve into conditional events and grounded coaching. |
| Existing Node and E2E coverage | It provides a foundation for deterministic rule and persistence regression fixtures. |

## Audit findings that drive the v2 proposal

These are design boundaries, not implementation defects.

| Current behaviour | Learning limitation | v2 response |
|---|---|---|
| Each initiative has one `baseEffect` and `primaryMetric`. | It makes cause and effect too direct; it cannot express lags, prerequisites, trade-offs, or non-financial harm. | Retain this shorthand for simple packs and add declarative causal rules for advanced packs. |
| A learner selects from six initiatives immediately, with a three-initiative ceiling. | It removes pilot, defer, stop, foundation-first, and sequencing decisions. | Add initiative lifecycle states and allow a scenario to define portfolio rules, including fewer than three initiatives. |
| Initiative costs can exceed the quarterly envelope; the present mechanism adds an overspend risk signal. | Cost is informative but not a full capital, run-cost, capacity, or opportunity-cost decision. | Introduce explicit financial envelopes, delivery capacity, capital/run cost, and approval rules. |
| Allocation feeds generic readiness multipliers. | Data, people, technical controls, and governance do not appear as verifiable delivery conditions. | Add named prerequisites and governance gates with required evidence and approvers. |
| Crises are seeded and occur only at periodic risk-triggered points; response options have fixed impacts. | Events are predictable in structure and only weakly connected to the learner’s prior choices. | Add time-, metric-, dependency-, and decision-triggered event rules with stored seed/provenance. |
| The score is primarily generic ROI, adoption, efficiency, risk, plus a small final scenario-progress bonus. | A learner can be rewarded for generic signals even when domain outcomes, safeguards, or stakeholder effects are weak. | Build a transparent scenario scorecard that separates outcomes, evidence, delivery, governance, stakeholder effects, and resilience. |
| The decision screen captures selections and allocation only. | There is no record of the learner’s reasoning, confidence, prediction, owner, or stop/scale condition. | Add a small decision ledger before resolution and make it central to debriefing. |
| Four generic advisor personas answer with scenario context. | Coaching is useful but cannot reliably represent a real stakeholder or score work. | Ground advisor answers in visible pack evidence and ledger state; keep it read-only and non-scoring. |

## Architecture decision: additive v2, not a rewrite

The engine remains scenario-agnostic and data-driven. V2 fields are additive and optional so the existing packs retain their current behaviour until each is deliberately converted.

```text
Existing ScenarioDefinition / ScenarioState
             │
             ├── remains the compatibility layer for v1 packs and saves
             │
             ▼
ScenarioPack v2 (optional depth data)
  learning        evidence          initiative delivery      causal rules
  stakeholders    governance gates  conditional events       assessment rubric
             │
             ▼
Generic resolution sequence
  validate decision → record ledger → allocate capacity/budget →
  evolve initiatives → apply due causal rules → resolve events/gates →
  compute scorecard → produce evidence-led debrief
```

### V2 data additions

| Object | New content | Compatibility approach |
|---|---|---|
| `ScenarioDefinition` | metadata/version, learning objectives, evidence pack, stakeholders, governance requirements, assessment rubric, causal rules, delivery capacity, portfolio policy | Add optional fields. V1 scenarios use existing resolver behaviour. |
| Scenario initiative | outcome hypothesis, stage, capex/run cost, time-to-value, dependencies, required evidence, affected roles, owner, control boundary, stop/scale criteria | Extend current `ScenarioInitiative`; retain `baseEffect`/`primaryMetric` as baseline shorthand. |
| `ScenarioState` | decision ledger, initiative lifecycle, reserved/actual budget, capacity, stakeholder state, governance evidence/gates, delayed effects, event log, score components | Persist under a versioned v2 state object; migrate v5 saves to safe default values. |
| Crisis template | trigger, eligibility, uncertainty model, options, causal explanation, stakeholder effect, debrief note | Existing periodic crises are adapted as default trigger rules. |
| Test fixture | seed, starting state, learner decisions, expected outcomes and explanations | Add per-pack regression fixtures; no LLM expected-output tests. |

### Generic resolution order

1. Check the portfolio policy, budget, and delivery capacity.
2. Capture the learner’s rationale, prediction, owner, and gate criteria in the decision ledger.
3. Evolve funded or active initiatives and apply recurring costs.
4. Evaluate prerequisites and governance gates; pause, limit, or allow rollout according to authored policy.
5. Apply all due causal rules, including lags, thresholds, trade-offs, and seeded uncertainty ranges.
6. Schedule or resolve eligible events, then record the cause and response in the event log.
7. Update operational, financial, adoption, trust/safety/equity, and stakeholder metrics.
8. Compute a visible scorecard and build debrief prompts from ledger evidence, not an opaque conclusion.

## Conversion plan for the four current packs

All four scenarios receive the same v2 structural language. They should not receive identical rules, risk weights, or learning objectives.

| Pack | Reference decision tension | First evidence pack | Non-negotiable gate | Distinct event / stakeholder mechanism |
|---|---|---|---|---|
| Project Factory 2030 | Recover uptime, quality, energy, and knowledge while modernising legacy plants | CMMS history, downtime taxonomy, sensor coverage, defect traceability, energy bill/shift data, technician interviews | Maintenance or visual-quality scale requires asset-data quality and frontline operating sign-off | Plant manager prioritises output; technicians prioritise safe workable procedures; OEM customer penalises quality failure. A line-failure event varies with asset condition and unfinished foundations. |
| BankNext Transformation | Increase speed and growth without weakening fraud, fairness, compliance, or customer trust | Fraud cases, approval workflow, reason-code coverage, model-validation report, complaint/appeal data | Credit and personalisation scale require validation, explainability, adverse-action process, and accountable risk owner | Risk lead can halt an unsafe rollout; branch/RM leader values customer response; regulator event depends on control evidence and incidents. |
| Care360 Health Network | Improve access and clinician capacity while protecting patient safety, privacy, and clinical trust | Wait-time flow, documentation burden, imaging turnaround, representative data coverage, clinical validation report, privacy-impact assessment | No autonomous clinical recommendation; clinical owner, validation evidence, escalation path, and privacy review are mandatory before scale | Clinical lead can restrict to pilot; patient advocate tracks unequal access; safety signal event depends on validation/adoption state. |
| FutureReady University | Improve persistence and employability while retaining academic integrity, learner agency, and faculty trust | Course-engagement quality, consent coverage, faculty workload diary, learner support journey, policy and assessment-integrity evidence | Student analytics or faculty AI scale requires consent/data governance, faculty co-design, and a learner appeal route | Faculty council affects adoption and legitimacy; student representative flags access/agency impact; policy or competitor event tests responsible speed. |

### Recommended conversion order

1. **Project Factory** becomes the reference v2 pack. It has concrete operations, measurable lagged outcomes, manageable safety risk, and clear shared-data dependencies.
2. **BankNext** proves auditability, risk, and explainability gates.
3. **Care360** applies the same primitives under the strictest human-oversight and safety constraints.
4. **FutureReady** proves workforce co-design, academic governance, and learner-agency mechanics.

No fifth-domain pack should be implemented until Project Factory validates that the primitives are reusable and learnable.

## Phased implementation plan after approval

### Phase 0 — learning and content contract

- Confirm audience, format, duration, assessment use, required fidelity, and India/global positioning.
- Agree a scenario authoring template and evidence-provenance rules.
- Define the scorecard dimensions and which dimensions are hard gates rather than trade-offs.
- Write Project Factory’s content blueprint before changing engine code.

**Exit condition:** approved v2 schema and a reviewed Project Factory scenario brief.

### Phase 1 — compatibility foundation

- Introduce optional v2 schema fields and a pack validator.
- Add scenario versioning and a persistence migration from v5 to v6.
- Extend `ScenarioState` with safe defaults for ledger, lifecycle, budgets, capacity, gates, events, and score components.
- Add deterministic seed ownership at scenario level while preserving the current campaign seed for legacy behaviour.

**Exit condition:** all existing scenarios, saves, Standard mode, and current tests behave identically when v2 content is absent.

### Phase 2 — decision, portfolio, and evidence experience

- Add pre-brief, evidence pack, known-unknowns, and limited evidence-request interaction.
- Add initiative lifecycle choices: research, pilot, scale, pause, stop/defer.
- Add rationale, prediction, owner, and gate fields to the decision ledger.
- Show true budget/capacity effect and initiative cost categories before confirmation.

**Exit condition:** a learner can make and explain a portfolio decision without the engine yet needing advanced causal rules.

### Phase 3 — generic runtime depth

- Implement dependency, capacity, budget, governance-gate, and delayed causal-rule resolvers.
- Implement condition-triggered events with stored cause, probability/seed, response, and outcome explanation.
- Add stakeholder response and transparent domain scorecard modules.

**Exit condition:** pure module tests demonstrate reproducible, explainable effects across a representative v2 fixture.

### Phase 4 — Project Factory reference conversion

- Author the full evidence pack, six initiative delivery profiles, gates, stakeholders, causal rules, event rules, and debrief rubric.
- Calibrate with a manufacturing subject-matter reviewer and a learning-design reviewer.
- Run learner/usability pilots; adjust content and rule strength before copying patterns.

**Exit condition:** a complete, reviewed 12-quarter Project Factory run produces traceable decision evidence and meaningful alternative outcomes.

### Phase 5 — convert BankNext, Care360, and FutureReady

- Apply only proven generic primitives; add domain-specific gates and review criteria.
- Add one full deterministic fixture and one browser flow per pack.
- Conduct appropriate domain reviews, especially clinical and financial-risk review.

**Exit condition:** all four packs meet the scenario authoring standard and regression suite.

### Phase 6 — debrief and facilitator capability

- Build prediction-versus-actual replay, counterfactual comparisons, rubric feedback, and work-transfer reflection.
- Add a facilitator guide/view only if the chosen delivery format requires it.

**Exit condition:** assessment results can be explained without asking the LLM to justify a score.

## Non-negotiable engineering constraints

- No scenario-name conditionals in the engine.
- No LLM-generated scores, metric effects, or hidden business rules.
- Every uncertain event is reproducible from a recorded seed and has an authored explanation.
- Current saves must load safely; a v1 scenario must retain v1 behaviour until intentionally upgraded.
- Standard mode must remain regression-compatible.
- A score must show its components and supporting evidence.
- Domain claims, metrics, and regulatory controls need provenance and subject-matter review before release.

## Information needed from the product owner

Architecture can proceed with the existing codebase. These decisions are needed before locking Phase 0 and authoring the reference pack:

1. **Primary learner and starting capability:** MBA/management student, functional manager, executive team, or mixed group.
2. **Delivery format:** individual self-paced simulation, team boardroom exercise, facilitated workshop, or assessed academic course.
3. **Time budget:** target duration per scenario and expected number of sessions/quarters completed.
4. **Assessment purpose:** formative reflection only, scored coursework, executive development, hiring/assessment, or a combination.
5. **Geographic and domain stance:** India-first, globally portable, or a deliberately mixed library; this determines the level of regulatory/content specificity.
6. **Fidelity boundary:** illustrative but credible ranges, anonymised real operational data, or expert-calibrated synthetic data.
7. **Content authority:** named or available manufacturing, banking, health, and education reviewers who can validate plausible mechanisms and red lines.
8. **Collaboration priority:** whether the first release must support teams and facilitators, or whether individual learning remains the first milestone.

The minimum required answers to start Phase 0 are items 1–5. Items 6–8 are required before Project Factory is released as a calibrated learning asset.
