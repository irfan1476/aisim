# Project Factory V3: Internal Content Self-Review

Status: completed internal consistency review; alternative review plan agreed; external calibration pending  
Date: 2026-08-21  
Scope: documentation/content only; no engine, UI, persistence, V2 integration, or deployment work is authorised by this review.

## Objective and evidence reviewed

This review checks the provisional Project Factory V3 content against the
contradictions observed in one Project Factory V2 final report and the
repository audit recorded in [the decision log](./decision-log.md). It uses
the V3 [design brief](./project-factory-v3-design-brief.md), [content
pack](./project-factory-v3-content-pack.md), and [implementation
backlog](./project-factory-v3-implementation-backlog.md). It is an internal
architecture/content review, not manufacturing, finance, quality/OEM,
governance, accessibility, or learning-design validation.

## Findings

| V2 autopsy issue | V3 status | Evidence / conclusion | Action retained in V3 planning |
|---|---|---|---|
| Adoption displayed as a static 38% despite changing decisions. | Partial; strengthened by this review. | Metric-authority validation prevents silent generic/scenario metric collision, but a generic replacement adoption number would recreate the conceptual problem. | Use initiative-specific workflow use/review/override/correction evidence; add `PF3.5b`. Do not display a campaign-wide adoption percentage unless a future pack authors one with a distinct owner and unit. |
| Risk reached 5% mechanically, while governance allocation was low. | Partial; appropriate V3 direction. | V3 gates and stakeholder rules replace one generic risk floor, but conditions need a visible, cross-domain exposure record. | Add five contextual exposures, owners, and review triggers. Only reliability has an initial deterministic event. |
| Quality and energy worsened or remained unmet yet barely affected the verdict. | Partial; strengthened by this review. | The initial pack has one reliability event and quality/energy causal boundaries, but no explicit way to show that a deferred quality or energy problem remains unresolved. | Add `EX-PF-02` and `EX-PF-03` as scorecard/ledger review conditions. Do not invent automatic deterioration or extra events without authored causal logic and fixtures. |
| Generic ROI grew independently of operational reality. | Partial; monetary calibration still open. | V3 permits value only through stated operational mechanisms and separates cost. It lacks reviewed economic conversion ranges. | Add `VA-PF-01`–`VA-PF-04` as explicit calibration placeholders; monetary value remains **not yet observable** until operations/CFO review supplies ranges. |
| Composite grade, capped scenario bonus, tenure reward, and ungrounded “what worked” narrative masked trade-offs. | Addressed in V3 design; implementation still pending. | The V3 scorecard has dimensions and source-bound evidence only. | Retain `PF4.1` and `PF4.1a`: no composite, CEO grade, tenure reward, generic bonus, generic roadmap, or leadership-trait assertion. |
| Baseline answers and `selfAwareness`/tension score created a judgemental and contradictory reflection loop. | Addressed by agreed contract. | V3 baseline is non-causal; reflection is Reconstruct, Interpret, Reframe, Transfer. | Keep baseline and reflection separate from outcomes and assessment. **Do not** make reflection data feed a self-awareness score. |
| Currency and budget scope contradicted India-first context. | Addressed in content; implementation validation pending. | V3 capital envelope is ₹5.0 Cr cumulative across 12 quarters and declares INR/Cr. | Retain metric/unit/currency validation and the report-integrity fixture. |
| A static strategy was rewarded merely for persistence. | Addressed as a design rule; implementation pending. | Lifecycle, gates, capacity, ledger, pause/stop criteria, and source-grounded debrief make evidence-responsive sequencing observable. | A stable plan is not punished automatically. The debrief should ask for explanation when contrary evidence, failed gates, or unresolved exposure make persistence questionable. |

## Corrections to the fallback checklist

Two statements in the suggested fallback must not become V3 requirements:

1. “Neglect penalties exist” is too broad. V3 uses **contextual exposure and
   review** rules. It has one authored reliability event, not universal
   penalties or events for every deferred initiative.
2. “Reflection data feeds into self-awareness scoring” directly conflicts with
   the agreed baseline and reflection contract. Reflection is learner-owned
   sensemaking and debrief evidence; it never changes outcomes or produces a
   self-awareness grade.

## Alternative review plan — agreed

The content remains labelled provisional while review happens in parallel with
future implementation preparation. It must not be presented to learners as
calibrated before the required pre-pilot review.

| Phase | Review activity | Minimum evidence / exit condition |
|---|---|---|
| Pre-implementation | Internal consistency review against V2 autopsy and V3 integrity guardrails. | This document and resulting content/backlog refinements are committed. |
| Pre-pilot | Light asynchronous review by one manufacturing/operations reviewer and one learning-design reviewer. | Review comments and resolutions are recorded; safety/workflow red lines and reflection load are acceptable for a pilot. |
| Post-pilot calibration | Manufacturing, quality/OEM, CFO/operations, governance, and learning review using pilot evidence. | Rule, gate, value, event, and prompt changes are versioned before broader reuse or learner release. |

### Required parallel calibration

The following remains necessary before monetary attribution or broader learner
release:

1. Manufacturing operations/maintenance: causal plausibility, workflow and
   safety boundaries, reliability/exposure logic.
2. Quality/OEM: traceability, containment, false-reject, and customer
   consequence logic.
3. CFO/operations: `VA-PF-01`–`VA-PF-04` economic-conversion assumptions.
4. Learning design and responsible-AI/governance: reflection load, evidence
   framing, accessibility, and control boundaries.

## Review disposition

The self-review supports keeping Project Factory V3 as the reference content
pack, with the refinements made in this review. It does not authorise an engine
change or declare the content calibrated. Under the agreed alternative review
plan, a V2-based V3 implementation branch may be prepared only after this
documentation baseline is committed; implementation itself remains a separate
product-owner decision under the backlog readiness criteria.
