# Scenario Learning Research and Architecture

Status: planning and discussion only
Last updated: 2026-08-21

## Purpose and guardrails

The AI Investment Challenge should help learners practise **responsible executive decision-making under uncertainty**, not identify a pre-authored set of three “correct” AI use cases.

This is a decision record: it captures conclusions, supporting rationale, open questions, and proposed architecture. It deliberately records concise, reviewable reasoning rather than private model or individual chain-of-thought.

The current four scenarios—Project Factory 2030, BankNext Transformation, Care360 Health Network, and FutureReady University—remain useful foundation cases. The recommended next scenario set contains five additions:

1. **BharatMart Omnichannel Reset** — retail / CPG
2. **ShieldSure Claims Transformation** — insurance
3. **GridPulse Summer Reliability** — electricity distribution
4. **AgriLink Procurement Network** — agriculture and food processing
5. **CityFlow Urban Services** — municipal services

No product changes are authorised by this document. It is a basis for the next design review.

## Current product: strengths and boundary

The current implementation already provides a good platform:

- Data-driven, domain-agnostic scenario registration and serializable scenario packs.
- Native domain metrics with direction, bounds, starting points, and targets.
- Six initiatives, a multi-quarter loop, resource allocation, maturity, neglect, declared synergies, crises, save/load, and scenario-aware advisor context.
- A generic engine which does not need a branch for each industry.

Today’s learning model is primarily **portfolio selection plus deterministic operational improvement**. An initiative acts mainly on one primary metric; declared synergies add a predictable multiplier; events are selected responses with known effects. This makes an accessible first experience, but it under-represents how strategy, delivery, and AI governance work in an organisation.

## Research findings translated into design requirements

| Finding | Design requirement for this product |
|---|---|
| Simulation experiences are stronger when learning objectives are observable, matched to learner level, built from authentic cases, and organised around pre-briefing, events, and debriefing. | Each pack must declare learner audience, prerequisite knowledge, 3–5 assessable objectives, complexity level, pre-brief, evidence packets, event timeline, and debrief prompts. |
| Reflection and evidence-based debriefing turn activity into transferable learning. | Preserve a decision timeline; ask learners to explain assumptions before results; show predicted versus realised outcomes; facilitate reconstruction, analysis, and workplace transfer at the end. |
| Trustworthy AI is lifecycle work: accountability, valid data, testing, human oversight, documentation, monitoring, and response to incidents matter before and after launch. | A governance warning cannot be merely decorative. Use cases need data owners, assurance gates, human escalation rules, test/monitoring plans, and accountable executive owners. |
| Effects and harms depend on context and affected people, not just technical model quality. | Model stakeholder views, distributional impacts, and non-financial harm. A “high ROI” choice can still be blocked, paused, or score poorly if it creates safety, fairness, privacy, or workforce harm. |
| Good portfolios contain sequencing and option value, not just the individually highest ROI initiatives. | Represent prerequisites, shared enablers, delivery capacity, time-to-value, and reversible pilots. Reward a justified “foundation first” path when the context warrants it. |

These requirements are informed by the [INACSL simulation standards](https://www.inacsl.org/assets/docs/Endorsement/INACSL%20Endorsement%20Program%20Criteria%208-22-22.pdf), the [simulation scenario-design review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11164058/), [simulation learning and debriefing evidence](https://pmc.ncbi.nlm.nih.gov/articles/PMC10335712/), the [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework), the [NIST AI RMF core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/), and the [OECD AI Principles](https://legalinstruments.oecd.org/en/instruments/oecd-legal-0449).

## Strengthened learning objectives

Every scenario should select three to five objectives from this progression. Objectives should be phrased as observable performance, not as “understand AI.”

| Capability | Learner should be able to… | Evidence captured by the simulation |
|---|---|---|
| Diagnose | distinguish symptoms from root causes; assess data, process, and operating-model readiness | problem framing, evidence selected, assumptions and missing-data requests |
| Prioritise | construct a portfolio that trades value, feasibility, risk, and time-to-value | funding decisions, rejected alternatives, budget/capacity rationale |
| Sequence | define pilots, gates, dependencies, owners, and stop/scale criteria | roadmap with prerequisites, milestones, decision rights, and contingencies |
| Govern | specify accountability, human oversight, data use, assurance, monitoring, and incident response appropriate to the use case | risk/control plan, owners, escalation path, fairness or safety checks |
| Lead adoption | engage frontline and affected stakeholders, anticipate resistance, and redesign work | stakeholder response, adoption plan, role/workflow changes |
| Adapt | update a strategy as conditions and evidence change without hiding earlier assumptions | response to events, pivot/stop decisions, prediction-versus-actual reflection |
| Communicate | make a board-quality case that is clear about uncertainty and downside | board memo/presentation assessed with a transparent rubric |

### Assessment principle

Learners are assessed on **decision quality**, not only on terminal KPIs. A recommended composite score is:

`outcomes + quality of evidence + sequencing and execution + responsible-AI controls + stakeholder/adoption health + resilience under disruption`

The exact weightings should be scenario- and learner-level-specific. A score must always show its components and evidence; the optional LLM facilitator must never be the sole scorer.

## The five next scenario packs

### 1. BharatMart Omnichannel Reset

**Context:** A national retailer with 350 stores, e-commerce, and marketplace channels. Stock-outs are up 18%, returns are up 22%, and markdowns are eroding margin.

**Core learner tension:** Improve availability and profitable growth without increasing waste, surveillance concerns, or unfair customer treatment.

**Candidate initiatives:** store/SKU demand forecasting; markdown and assortment optimisation; shelf-availability computer vision; returns-fraud detection; service copilot; consent-based personalisation.

**Reality mechanisms:** product-master and promotion data defects; vendor lead-time volatility; customer consent; store colleague concerns over camera use; a festival-demand event; conflict between revenue, waste, margin, and service-level targets.

**Learning focus:** data foundations, channel trade-offs, customer trust, frontline adoption, working capital.

### 2. ShieldSure Claims Transformation

**Context:** A general insurer serving 8 million policyholders across motor and health claims, with TPAs and repair-network partners. Leakage and turnaround time are rising while complaints are becoming public.

**Core learner tension:** reduce leakage and settlement time without wrongful denial, opaque adverse decisions, or weak appeal routes.

**Candidate initiatives:** claims triage; fraud-ring detection; image-based motor-damage estimation; claims-service copilot; repair-network quality prediction; retention/cross-sell engine.

**Reality mechanisms:** partner data quality; image quality/coverage; thresholds that alter false-positive and false-negative harm; regulator-led explainability review; a catastrophic-weather claims surge.

**Learning focus:** fairness, human-in-the-loop case handling, explainability, auditability, loss ratio versus trust.

### 3. GridPulse Summer Reliability

**Context:** An urban electricity distributor serving 3 million connections with aging transformers and severe summer peaks.

**Core learner tension:** improve reliability and reduce losses while protecting safety, affordability, and public trust.

**Candidate initiatives:** transformer-failure prediction; peak-demand forecasting; field-crew dispatch; loss/theft anomaly detection; outage communication; image-based asset inspection.

**Reality mechanisms:** sparse sensors; inconsistent outage codes; safety-critical field decisions; inequitable service restoration; false accusations from loss detection; heatwave and equipment-failure events.

**Learning focus:** resilience, asset versus digital investment, public accountability, safety assurance, operational capacity.

### 4. AgriLink Procurement Network

**Context:** A food processor sourcing seasonal crops from 120,000 farmers, with cold-chain exposure and export traceability obligations.

**Core learner tension:** improve quality, continuity, and traceability without worsening exclusion, farmer distrust, or price instability.

**Candidate initiatives:** yield/procurement forecasting; AI-assisted crop grading; cold-chain spoilage prediction; farmer advisory; residue/traceability monitoring; transport and collection routing.

**Reality mechanisms:** uneven digital access; consent and data ownership; unreliable plot-level forecasts; language/literacy needs; a weather shock; supplier-power imbalance.

**Learning focus:** inclusion, ecosystem governance, climate uncertainty, data rights, supplier relationships.

### 5. CityFlow Urban Services

**Context:** A municipal authority responsible for drainage, waste, road repairs, emergency response, and citizen grievances.

**Core learner tension:** improve service delivery with incomplete data and public scrutiny while avoiding unequal treatment of underserved communities.

**Candidate initiatives:** flood/drainage prediction; waste-route optimisation; multilingual grievance assistant; road-defect detection; emergency resource dispatch; procurement anomaly detection.

**Reality mechanisms:** contested/open data; multilingual and accessible service requirements; complaints as a biased signal of need; procurement sensitivity; monsoon emergency; public/press response.

**Learning focus:** equity, transparency, public value, accessible design, political and operational accountability.

## Scenario design standard

A production-ready pack should contain the following content. The current pack format covers the first two elements and parts of the metrics, initiatives, events, and advisor context; the rest form the planned depth layer.

1. **Metadata and audience** — owner, subject-matter reviewer, version, learning level, estimated duration, prerequisites, and accessible-language needs.
2. **Organisation and trigger** — plausible operating context, time horizon, decision authority, external trigger, non-negotiable constraints.
3. **Objectives and assessment rubric** — a small set of observable objectives with scoring evidence and feedback prompts.
4. **Baseline evidence pack** — KPIs, data-quality report, workflow/process map, budget/capacity information, stakeholder quotations, and known unknowns. Evidence must carry a source/provenance label: simulated, anonymised, public, or expert-reviewed.
5. **Metric model** — operational, financial, adoption, and trust/safety/equity measures; bounds; units; direction; lag; uncertainty range; and distributional impact where relevant.
6. **Initiative cards** — outcome hypothesis, cost categories, expected benefit range, time-to-value, confidence, dependencies, data requirements, affected roles, owner, human-control boundary, and stop/scale gate.
7. **Stakeholder model** — role, mandate, priorities, red lines, influence, information held, and response to actions. Roles may include CFO, COO, CIO/CISO, risk or compliance, frontline lead, customer/citizen advocate, and regulator.
8. **Event model** — timed or condition-triggered events with uncertain outcomes, action options, opportunity cost, and a concise causal explanation after resolution.
9. **Debrief and transfer** — decision replay, predictions versus reality, outcome distribution, stakeholder effects, reflective prompts, and an application plan for the learner’s workplace.
10. **Quality and governance pack** — domain review, calibration evidence, content safety review, accessibility check, decision-log changes, and test cases.

## Proposed target architecture

### Design principle

Keep the **core engine generic and deterministic for the same seed and decisions**. Separate authored scenario content, calibrated causal rules, and presentation. Uncertainty must be reproducible: random outcomes are generated from a stored seed and disclosed in the debrief.

### Logical layers

```text
Scenario Authoring & Review
  └─ versioned scenario pack + evidence provenance + validation fixtures
             │
             ▼
Simulation Runtime
  ├─ Scenario registry / pack loader
  ├─ State machine and decision ledger
  ├─ Portfolio, capacity, and dependency resolver
  ├─ Causal metric and uncertainty resolver
  ├─ Event scheduler and consequence resolver
  ├─ Stakeholder and governance-gate resolver
  └─ Scoring and debrief evidence builder
             │
             ├────────► Learner experience: pre-brief → decide → results → reflect
             ├────────► Facilitator view: cohort progress, rubric evidence, debrief guide
             └────────► Advisor: grounded, read-only contextual coaching
```

### Essential runtime modules

| Module | Responsibility | Must not do |
|---|---|---|
| Pack validator | Validate schema, references, metric bounds, dependency graph, event triggers, accessible content, and test fixtures before publishing | Infer missing business rules at runtime |
| Decision ledger | Save every decision, evidence item viewed, stated assumption, prediction, owner, and rationale | Treat a click as a complete strategic decision |
| Portfolio resolver | Enforce budget, delivery capacity, dependencies, stage gates, and initiative lifecycle states | Assume all approved initiatives can begin immediately |
| Causal resolver | Apply transparent, scenario-authored causal rules with time lags, thresholds, synergies, trade-offs, and seeded uncertainty | Let an LLM invent business outcomes |
| Event scheduler | Trigger time-, metric-, and decision-dependent events; preserve causal provenance | Use surprise purely for drama |
| Stakeholder resolver | Calculate trust, adoption, approval/blocking, and distributional effects from declared stakeholder rules | Claim to simulate real people or regulators |
| Governance resolver | Enforce data readiness, accountable owner, impact assessment, testing, human-oversight, and monitoring gates for applicable cases | Treat governance spend as a generic risk discount |
| Assessment/debrief | Explain score components, counterfactuals, prediction accuracy, and reflection prompts | Reduce learning to a leaderboard number |
| Advisor | Answer from the selected pack, current ledger, and approved learning framework; flag uncertainty | select, fund, or score the portfolio autonomously |

### State and data design additions

These additions extend—rather than replace—the current `ScenarioDefinition`, `ScenarioState`, initiative state, crisis, synergy, and history constructs.

```text
ScenarioPack vNext
  metadata: audience, objectives, reviewers, version, seed policy
  baselineEvidence[]: source, visibility, confidence, disclosureQuarter
  metrics[]: value + distribution + lag + uncertainty + owner
  initiatives[]: hypothesis, lifecycle, costs, capacity, dependencies,
                 gates, controlBoundary, expectedRange, affectedStakeholders
  causalRules[]: conditions → effects, confidence, delay, explanation
  stakeholders[]: priorities, redLines, influence, response rules
  events[]: trigger, uncertainty model, options, causal rules, debrief note
  governanceRequirements[]: applicability, evidence, approver, monitoring
  rubric[]: objective, observable evidence, scoring guidance
  testFixtures[]: known seed + decisions → expected state/feedback

LearnerDecisionLedger
  decision, rationale, prediction, evidenceUsed, unresolvedAssumptions,
  assignedOwner, gateCriteria, timestamp/quarter
```

The present `baseEffect → primaryMetric` model can remain as a simple rule shorthand. Advanced packs should use declared `causalRules` so one initiative can improve one measure while causing cost, delay, adoption, trust, or equity trade-offs elsewhere.

### Example causal rule: not just a direct benefit

```text
If: crop-grading pilot is funded, data quality ≥ 70, farmer appeal route exists,
    and field-team capacity is available
Then after: 2 quarters
  quality consistency: +4 to +8 points
  disputed grading: -1 to +4 points, depending on regional-language coverage
  farmer trust: -3 unless appeal cases are resolved within the agreed SLA
Evidence: grader calibration report, appeal backlog, farmer representative feedback
```

This pattern is more faithful than “Crop Grading: +5 quality points.” It makes the learner decide on operating conditions and safeguards, not simply choose the tool.

## What changes in the learner flow

| Phase | Current strength | Planned strengthening |
|---|---|---|
| Pre-brief | Scenario/company/challenge context | role, authority limits, learning objectives, rules of the simulation, success criteria, evidence pack, and known unknowns |
| Diagnose | Learner sees challenges and initiative cards | learner examines evidence, requests limited additional evidence, records hypotheses and uncertainties |
| Decide | Select up to three initiatives and allocate funding | fund, sequence, defer, pilot, stop, assign owners, set gates, choose controls, and record an outcome prediction |
| Execute | Quarter resolution and occasional crisis | capacity/dependency constraints, delayed benefits, stakeholder response, governance approval, and condition-based events |
| Learn | Dashboard, advisor, final diagnosis | predicted vs actual, counterfactual portfolio comparison, decision-quality rubric, structured reflection, work-transfer plan |

## Build sequence after design approval

1. **Content and assessment standard:** agree the scenario-pack template, learning objectives, evaluation rubric, provenance approach, and minimum review process.
2. **Architecture foundation:** introduce versioned pack validation, seed-based uncertainty, decision ledger, and generic dependency/capacity model without changing the existing four scenario outcomes.
3. **Governance and stakeholder layer:** add gates, control boundaries, event triggers, stakeholder reactions, and transparent scoring components.
4. **One reference pack:** author and calibrate BharatMart as the first full-depth pack; conduct a subject-matter, learning-design, and usability review.
5. **Pilot and calibrate:** observe learners, compare intended versus observed misconceptions, rebalance rules and debrief, then author the other four packs.
6. **Scale responsibly:** add authoring workflow, automated validation, pack versioning, regression fixtures, and facilitator analytics before broad content expansion.

## Decision log

| Decision | Rationale | Open question |
|---|---|---|
| Add BharatMart to the recommended next-five list | It adds consumer, store-operations, and privacy/worker-surveillance tensions not present in the original four. | Is retail the first deep-reference pack, or should the first pilot target the learner cohort’s industry? |
| Retain the generic scenario engine | The existing architecture already decouples domain packs from engine code; this protects scale and testability. | Which new rule primitives are sufficiently universal to add to core? |
| Use seeded uncertainty rather than opaque randomness | Learners need realistic uncertainty, while authors, facilitators, and tests need reproducibility and auditability. | Should learners see likelihood bands before decisions, or only after completion? |
| Score decision quality and outcomes separately | A good decision can yield a poor short-term result; a lucky outcome should not be mistaken for good strategy. | What weighting is appropriate for each learner level? |
| Treat governance as a decision gate, not a cosmetic score | High-consequence AI use requires ownership, testing, human oversight, and monitoring across the lifecycle. | Which governance controls are mandatory by domain and jurisdiction? |
| Make the advisor grounded and non-authoritative | It can coach reflection and retrieve pack evidence but must not fabricate results or choose the answer. | What source/citation pattern should learners see in advisor responses? |
| Start depth with one reference pack | Reusable primitives should be proven through one rigorous pack before multiplying complexity across nine scenarios. | BharatMart is recommended; confirm target audience and business-school/corporate learning format. |

## Questions for the next discussion

1. Who is the primary learner for the first full-depth scenario: MBA/management students, functional leaders, executive teams, or mixed classroom groups?
2. Is the main outcome individual assessment, team-based board simulation, facilitated workshop learning, or all three?
3. How much of a scenario should be India-specific versus globally portable, given the ₹/Cr framing?
4. Which consequences should be safe to simulate emotionally and ethically, especially for health, insurance, farming, and public-service cases?
5. Should a learner be able to fund fewer than three initiatives—or none—when a foundation, pause, or stop decision is the responsible choice?
6. What subject-matter experts can review and calibrate the first pack before it is treated as a learning asset?
