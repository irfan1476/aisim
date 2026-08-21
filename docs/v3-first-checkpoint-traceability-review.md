# V3 First Checkpoint: Realism, Learning, and Responsible-AI Traceability

Status: checkpoint review complete; five authoring-contract additions agreed; no engine or V2 code change authorised
Date: 2026-08-21  
Scope: Project Factory V3 content and reusable V3 authoring/architecture direction.

## Review question and evidence base

This review asks whether the original realism requirements, scenario-design template,
and new-domain roadmap have progressed into the V3 design, and whether the
direction is informed by the stated simulation and responsible-AI sources.

The review inspected the [current-scenarios V3 approach](./current-scenarios-v3-approach.md),
[Project Factory V3 content pack](./project-factory-v3-content-pack.md),
[design brief](./project-factory-v3-design-brief.md), [implementation
backlog](./project-factory-v3-implementation-backlog.md), and [authoring
template](./scenario-v3-content-authoring-template.md). External design lenses
were the [INACSL simulation standards](https://www.inacsl.org/healthcare-simulation-standards),
the [2024 scenario-design review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11164058/),
[NIST AI RMF 1.0](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf), and the
[OECD AI Principles](https://oecd.ai/en/assets/files/OECD-LEGAL-0449-en.pdf).

This is a **standards-informed design review**, not an INACSL endorsement,
NIST conformance assessment, legal review, or OECD certification claim.

## Original realism requirements: traceability

| Original requirement | Current V3 position | Status | Refinement still required |
|---|---|---|---|
| Include a plausible but wrong-for-now initiative. | Project Factory initiatives have known risks, dependencies, gates, and pause/stop criteria. Deferral is permitted and explained. | Partial | Require each pack to name at least one credible-but-unready, low-value-in-context, or capacity-incompatible option and the evidence that makes it wrong **now**. This must not be a trick option. |
| Make shared prerequisites and dependencies visible. | Initiative profiles declare dependencies; gates use evidence/owners; the knowledge–maintenance rule demonstrates a cross-initiative dependency. | Designed and authored for Project Factory; engine pending | Preserve a generic dependency graph and test cycles/shared-enabler constraints in the validator. |
| Replace fixed “select 3” with cost, capacity, risk, and timing decisions. | Lifecycle states, 0–2 active pilot/scale limit, cumulative capital, run-cost, capacity pools, exception policy, and gates are authored. | Designed and authored for Project Factory; engine pending | Require a stated budget posture and rationale for every future pack so the library includes genuinely constrained and transformation-scale cases. |
| Use uncertain, conditional benefits rather than promises. | Causal rules use delayed seeded ranges; events have explicit eligibility/probability; monetary value is withheld until calibrated. | Partial by design | Calibrate VA-PF-01 through VA-PF-04; do not add a generic ROI. Future packs should state the decision-relevant uncertainty form, not a spurious percentage. |
| Represent conflicting stakeholders. | Project Factory has five rule-bound stakeholders with red lines, owners, gates, and state effects. | Designed and authored for Project Factory; engine pending | V3 intentionally keeps one transformation-lead role. Multi-role negotiation is deferred, so this is stakeholder simulation rather than role-play. |
| Let governance stop, limit, or pause work. | Six visible gates, override/escalation boundaries, red lines, exposure rules, and pause/stop criteria are authored. | Designed and authored for Project Factory; engine pending | Complete domain-specific sign-off/red-line review before learner pilot; do not substitute a generic compliance score. |
| Require process, people, data, and accountability change alongside AI. | Change/assurance effort, capacity pools, human control boundaries, workflow evidence, data remediation, and named owners are present. | Partial | Add one required **operating-change plan** to each initiative decision: process/workflow change, data remediation, training/release, accountable owner, monitoring, and rollback/escalation. |
| Test strategy through consequence, pivot, and stop decisions. | Twelve quarters, four board windows, lifecycle, decision ledger, causal lags, one conditional event, exposure register, and structured debrief are authored. | Partial for a complete pack | The first vertical slice deliberately implements one event. A learner-ready complete pack needs an authored 2–3 event coverage map; quality/OEM, energy/throughput, workforce, and supply exposures are candidates, not implemented events. |

## Scenario-authoring template: traceability

| Original template element | Current V3 coverage | Checkpoint conclusion |
|---|---|---|
| Organisation, operating model, trigger, baseline data | Required in sections 2–4 of the template; Project Factory provides seven evidence artefacts. | Addressed. |
| Six initiatives: cost, run cost, time-to-signal, data readiness, dependencies, benefit range, risk, owner | Required delivery-profile fields and authored for Project Factory. | Addressed, except the explicit wrong-for-now field above. |
| Three stakeholder perspectives | Template supports stakeholder rules; Project Factory authors five. | Addressed beyond the original minimum. |
| Two or three event cards | Template supports events; Project Factory intentionally has one implemented event plus exposure candidates. | Not yet complete for a learner-ready pack; retain one event only for the thin implementation slice, then author a full event coverage map. |
| Final decision memo / board presentation | Decision ledger, scorecard, and transfer reflection exist. | Gap: add a source-bound final board-memo template that assembles decision, evidence, uncertainty, cost, gate status, exposure, and next action. Do not let an LLM invent its contents. |
| Vary budgets across scenarios | Template has scenario-specific budget fields; Project Factory uses one ₹5 Cr cumulative envelope. | Partial: add library-level budget-posture guidance before authoring BharatMart and the other new packs. |

## Standards-informed assessment

| Design lens | What the sources call for | V3 evidence | Remaining proof or gap |
|---|---|---|---|
| INACSL | Clear objectives, learner-appropriate preparation/prebriefing, facilitation, planned debrief, psychological safety, professional integrity, and evaluation. | Learner profile, learning objectives, evidence-room prebrief, non-graded baseline, four structured reflection stages, facilitator-oriented four-window cadence, provenance labels, and privacy boundaries are designed. | Add a facilitator guide/prebrief script, orientation/fiction-contract language, psychological-safety and confidentiality checks, and debrief evaluation. INACSL is a healthcare standard used here as a learning-design lens, not a claim of endorsement. |
| 2024 scenario-design review | Scenario templates should connect practical setting and learners, objectives, preparation, triggers/natural feedback, anticipated facilitator analysis, and post-simulation iteration. | Template covers pack identity/learners, objectives, preparation/evidence, causal triggers/events, fixtures, and content versioning. | Add author/facilitator operational fields, cue/natural-feedback plan, and a formal post-session modification/evaluation record. |
| NIST AI RMF | Continuous socio-technical risk practice across Govern, Map, Measure, and Manage; accountable ownership, context, measurement, risk treatment, and lifecycle monitoring. | Gates, owners, control boundaries, stakeholder red lines, evidence provenance, bounded rules, seeded fixtures, exposure register, pause/stop, incident event, and report-integrity rules. | Add an explicit pack-level risk register: affected groups, harm/benefit hypotheses, risk tolerance, residual risk, monitoring cadence, incident learning, and escalation authority. |
| OECD AI Principles | Inclusive/sustainable benefit; human-centred values/fairness; transparency/explainability; robustness/security/safety; accountability. | Human override/control boundaries, stakeholder interests, evidence and ledger traceability, explainable rules, gates, safety/privacy red lines, and accountable owners. | Make distributional impact/equity analysis mandatory where people are affected—for example borrowers, patients, students, farmers, drivers, and citizens—not merely “if applicable.” Add accessibility and environmental/sustainability considerations at pack level. |

## New-domain roadmap

The following five domains are an **agreed content-roadmap order**, not authored
or implemented packs:

1. BharatMart Omnichannel Reset
2. ShieldSure Claims Transformation
3. GridPulse Summer Reliability
4. AgriLink Procurement Network
5. CityFlow Urban Services

They diversify operating constraints and affected stakeholders. They should not
be started until Project Factory validates the generic V3 primitives. Before
authoring them, add the refinement fields in this review, especially
equity/distributional impacts and a budget posture. Those are especially
material for insurance, agriculture, and public services.

## Checkpoint conclusion and next documentation actions

The V3 direction has progressed substantially beyond the original “select three
AI initiatives” design and is well informed by the stated sources. It is not
yet complete or empirically validated. The next planning refinements are:

1. Add a wrong-for-now evidence field and an operating-change plan to the reusable initiative template.
2. Add a complete-event coverage map: one event in the vertical slice, two or three for a learner-ready pack, with deterministic fixtures.
3. Add a source-bound final board-memo requirement.
4. Add pack-level risk, equity/distributional-impact, accessibility, and sustainability checks, with residual-risk and incident-learning fields.
5. Add library-level budget-posture guidance before creating BharatMart.

These authoring-contract refinements are agreed. They do not authorise
implementation; the V2-based branch and engine work remain separate decisions.
