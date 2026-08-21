# Project Factory V3: Bounded Reviewer Briefs

Status: planning artifact for the P0 content-calibration gate; reviewer contact not initiated  
Date: 2026-08-21  
Scope: one light operations/manufacturing review and one light learning-design review of the provisional Project Factory V3 content pack.

## Purpose and gate boundary

These briefs define a small, asynchronous review that can be recorded without
turning provisional synthetic content into an implementation requirement. They
support `PF-PLAN-03`, `PF5.1`, `PF5.2`, `PF5.3a`, and `PF5.4` in the
[implementation backlog](./project-factory-v3-implementation-backlog.md).

The P0 gate passes only when both reviews have dispositions recorded as
**accept**, **revise**, or **defer**, with a rationale and owner for follow-up.
The reviews do not authorise engine, UI, persistence, deployment, V2 changes,
or learner release. The quality-escape and technician-retirement event cards
remain un-authored until operations dispositions are complete. Monetary
conversion ranges remain provisional until the separately planned CFO/
operations calibration.

## Shared reviewer contract

Reviewers inspect the frozen planning documents listed below, not an
implementation. They should assess plausibility and learning fitness for a
pilot, not certify a real factory, safety system, regulated process, or
instructional standard. Synthetic values and thresholds must stay labelled as
provisional. Reviewers may flag a claim as outside their expertise; that is a
valid **defer** disposition, not an implied approval.

For each finding, record:

| Field | Required content |
|---|---|
| ID / location | Brief question ID plus document section, metric, gate, rule, exposure, or prompt |
| Disposition | `accept`, `revise`, or `defer` |
| Finding | Concrete reason, boundary, or missing evidence; distinguish realism from preference |
| Required change | Exact content/rule/prompt change, or explicit no-change rationale |
| Owner / timing | Content owner and before-P0, before-pilot, or post-pilot timing |
| Confidence / dependency | Confidence and any dependency on quality/OEM, CFO/operations, governance, accessibility, or implementation validation |

### Evidence set to provide to either reviewer

- [Project Factory V3 content pack](./project-factory-v3-content-pack.md),
  especially evidence artefacts, six initiative profiles, stakeholders,
  gates, exposures, causal/event rules, workflow evidence, debrief, and
  deterministic fixtures.
- [Project Factory V3 design brief](./project-factory-v3-design-brief.md),
  especially learner contract, four-window cadence, learning objectives,
  reflection safeguards, and product boundaries.
- [V3 internal content self-review](./project-factory-v3-content-self-review.md),
  including the alternative review plan and explicit non-goals.
- [V3 first-checkpoint traceability review](./v3-first-checkpoint-traceability-review.md),
  including operating-change, event-coverage, board-memo, risk, equity,
  accessibility, and sustainability gaps.
- This brief and the P0 task detail in the implementation backlog.

## Brief A — operations/manufacturing reviewer

### Scope

Check whether the scenario's operating logic is directionally credible for an
India-first, five-plant automotive-component manufacturer and whether the
workflow/safety boundaries are stated clearly enough for a controlled pilot.
Focus on maintenance, production, quality/OEM interfaces, data readiness,
capacity, and observable operating consequences.

### Out of scope

Do not certify plant safety, automotive quality systems, legal/regulatory
compliance, cybersecurity, financial conversion rates, or the learning
experience. Do not author the held quality-escape or technician-retirement
events during this review; only disposition their candidate conditions and
what evidence would be required later.

### Review questions and evidence to inspect

| ID | Question | Inspect |
|---|---|---|
| O-01 | Are the baseline constraints and measures interpretable in an operating context, with no misleading unit or metric ownership? | PF-E01–PF-E07, baseline metric table, source/provenance labels, ₹5 Cr / 12-quarter envelope |
| O-02 | Are the six initiative profiles, dependencies, capacity limits, and “wrong for now” explanations plausible and non-trick-like? | Initiative delivery profiles; active pilot/scale limit; dependency graph; pause/stop criteria; PFV3-NG fixtures |
| O-03 | Are maintenance, operator, data-owner, and human-override boundaries safe and usable as written? | Predictive maintenance, visual quality, energy, and knowledge-assistant profiles; G-PF-01, G-PF-02, G-PF-04, G-PF-05; SR-MAINT and SR-DATA rules |
| O-04 | Do workflow signals represent real review/use/override/correction evidence rather than funding or a global adoption proxy? | Initiative workflow-evidence table; PF3.5b contract; maintenance/quality/supply examples |
| O-05 | Are exposure triggers for reliability, quality/OEM, energy/throughput, workforce, and supply continuity observable, owned, and proportionate? | EX-PF-01–EX-PF-05; scorecard/ledger consequences; EV-PF-01 boundary |
| O-06 | Are causal directions, lags, ranges, trade-offs, and event eligibility plausible enough to be marked provisional for a thin slice? | CR-PF-01–CR-PF-03, EV-PF-01, ER-PF-01/02, seeds PFV3-KS-01–03 |
| O-07 | Which thresholds or rules require operations revision before implementation, and which can safely remain provisional pending pilot evidence? | All gate thresholds, exposure thresholds, causal ranges, and deterministic fixtures; identify owner and validation evidence |

### Required disposition

The reviewer must explicitly dispose of O-01–O-07 and provide:

1. A short list of accepted operating assumptions that may enter the reviewed
   reference slice.
2. A revision list with exact IDs/thresholds/workflow language and the
   minimum evidence needed to close each item.
3. A defer list identifying claims requiring quality/OEM, CFO/operations,
   governance, or pilot data.
4. A red-line note covering unsafe scale, unreviewed advice, missing owner or
   control, absent traceability/containment, and removal of human override.
5. A recommendation on whether PF5.3a non-event exposures are ready to be
   represented as review conditions; no recommendation to create new events
   is implied without separate cards and deterministic fixtures.

## Brief B — learning-design reviewer

### Scope

Check whether the proposed 90-minute facilitated experience and self-paced
fallback support functional managers/MBA learners to make and explain
evidence-led decisions. Focus on objectives, evidence-room preparation,
decision pacing, reflection load, debrief alignment, accessibility cues, and
formative/non-judgemental framing.

### Out of scope

Do not validate operational thresholds, causal magnitudes, domain safety,
quality/OEM consequences, monetary value, engine APIs, or claims of INACSL,
NIST, or OECD conformance. Do not approve a high-stakes assessment, composite
grade, AI coach, personality/leadership inference, or reflection data that
changes outcomes.

### Review questions and evidence to inspect

| ID | Question | Inspect |
|---|---|---|
| L-01 | Are the five learning objectives observable through the planned decisions and debrief, without requiring specialist engineering expertise? | Design-brief learning objectives; learner profile; initiative/evidence choices; scorecard dimensions |
| L-02 | Is the initial evidence-room/pre-brief sufficient to orient a learner to provenance, known unknowns, synthetic status, and the decision task? | PF-E01–PF-E07 visibility, confidence, accessible text, claim-status labels; pre-brief contract |
| L-03 | Can four board windows plus quarter-level fallback fit a 90-minute facilitated session without compressing consequential decisions or debrief? | Q1–Q3/Q4–Q6/Q7–Q9/Q10–Q12 cadence; workshop/self-paced modes; PF4.3 |
| L-04 | Is the ledger/reflection burden concise, skippable where appropriate, and useful at the moment of decision? | Pre-brief hypothesis; one checkpoint per window; Reconstruct–Interpret–Reframe–Transfer prompts; PF2.3/PF4.2b |
| L-05 | Does the debrief connect prediction, evidence, outcome, gate/event, stakeholder trade-off, and transfer without inventing causes or rewarding a preferred belief? | Baseline-to-debrief table; decision/replay contract; scorecard boundaries; PFV3-NG-04 |
| L-06 | Are psychological safety, disagreement, private notes, team/shared answers, confidentiality, and accessibility adequately signposted for a pilot? | Facilitation guidance, responsible-impact reflection, first-checkpoint gaps; inspect reading load and prompt language |
| L-07 | Which prompts or fields should be accepted, revised, or deferred before pilot, and what pilot measure would test timing, cognitive load, and discussion quality? | Board memo and responsible-impact fields; PF4.2d/PF4.2e; pilot-readiness acceptance criteria |

### Required disposition

The reviewer must explicitly dispose of L-01–L-07 and provide:

1. An accepted minimum viable learning loop for the reference slice.
2. Prompt/field revisions with proposed shorter wording where load or
   ambiguity is a problem.
3. Deferred items that need pilot observation rather than design judgement.
4. A facilitation/self-paced timing estimate and at least three pilot measures
   (for example completion time, reflection completion/skip rate, and quality
   of evidence-linked discussion).
5. A clear confirmation that baseline/reflection remain non-causal and that
   the scorecard remains formative, transparent, and free of a composite
   learner grade.

## Resolution and handoff protocol

The lead records the two completed dispositions in the decision log or a
follow-up resolution record, links each content change to its reviewer ID,
and retains deferred assumptions visibly. A reviewer response is not itself a
branch or implementation approval.

Overlap boundaries for parallel work:

- **Documentation transfer:** transfer this planning artifact as a
  documentation-only file if the V2-based implementation line needs it; do
  not copy application code or silently merge planning history.
- **Compatibility/test planning:** inspect frozen V2 seams read-only and
  preserve Standard mode, v1/v2 saves, existing packs, deployment assumptions,
  and regression fixtures. Final APIs remain dependent on the reviewed V3
  schema; no runtime implementation begins from this brief.
- **Operations review:** owns plausibility/red-line dispositions and the
  prerequisite for any future quality/OEM or workforce event card.
- **Learning-design review:** owns learning-load, prompt, facilitation, and
  formative-assessment dispositions; it cannot approve domain realism.

The P0 gate is complete only after both reviewer outputs, resolutions, and
retained provisional/deferred assumptions are committed and the product owner
separately authorises implementation.
