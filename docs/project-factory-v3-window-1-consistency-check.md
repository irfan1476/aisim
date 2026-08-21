# Project Factory V3 — Window 1 Consistency Check

Status: **design consistency passed with one authored-content correction required before implementation**

## Scope

This check compares the proposed Window 1 wireframes and behavioral contracts
with the current Project Factory content pack, V3 state/types, runtime façade,
implementation backlog, and agreed V2 compatibility boundary. It is a design
audit only; no production code or approved pack content was changed.

Reviewed artefacts:

- `project-factory-v3-window-1-wireframes-v2.md`;
- `project-factory-v3-behavioral-contracts-v2.md`;
- `project-factory-v3-content-pack.md`;
- `project-factory-v3-implementation-backlog.md`;
- `lib/game/state.ts`;
- `lib/scenarios/types.ts`;
- `lib/game/v3Runtime.ts`.

## Executive result

The revised design now tells one coherent story:

`evidence framing → one Research decision → Q1 resource use → Q2 source-bound
finding → Q3 aggregation → branch-aware reflection → branch-aware Window 2`

It removes the contradictions that made the previous additive V3 interface hard
to understand: Research cannot improve operating metrics, learner prediction
cannot select the result, Pilot readiness cannot pass a Scale gate, and opening
evidence cannot prove its own outcome.

The existing runtime does not yet implement the new window/research contracts.
That is expected and remains deliberately paused. One content inconsistency must
be corrected before implementation: G-PF-05 is authored as a Technician Knowledge
**Pilot** gate but the initiative profile labels it under `scale_gate`.

## Alignment matrix

| Concern | Current source | Revised contract | Result / required action |
|---|---|---|---|
| Lifecycle | V3 code and content use `deferred/research/pilot/scale/sustain/pause/stop`. | Lifecycle remains `research` after the review; no `ResearchCompleted`. | **Aligned.** Add `researchReview` as separate state only after design approval. |
| Decision ledger | `V3ScenarioState.ledger` exists; legacy `scenarioState` contains metrics/progress/flags. | Window decision points to `state.v3State.ledger`. | **Aligned.** No legacy-ledger reference remains. |
| Window persistence | Legacy `GameState.history` stores generic quarter snapshots; V3 has no window record/cursor. | Opt-in `v3State.windowHistory[]` with snapshots, pause state, aggregate, and idempotent cursor. | **Additive gap.** Requires new V3 state and versioned default/migration; never overload legacy history. |
| Runtime orchestration | `resolveV3Decision` resolves one supplied plan and may evaluate supplied gates/rules/event. | Project Factory window orchestrator resolves Q1–Q3 sequentially with relevance filters and resume cursor. | **Additive gap.** Compose existing pure resolvers; do not alter the V2 quarter engine. |
| Research timing | Initiative profiles declare one-quarter time to signal and Research capacity, but not a per-quarter schedule/review record. | Q1 commits capital/capacity; Q2 observes the signal; Q2–Q3 have no default Research capacity. | **Aligned as authored clarification; additive metadata/state required.** |
| Active delivery | Existing policy limits Pilot/Scale delivery; Research is lightweight. | Research consumes no Pilot/Scale slot. | **Aligned.** Header remains 0/2 after Window 1. |
| Operating effect | Content says value depends on later workflow/pilot evidence. | All Research fixtures keep downtime, defects, and workforce readiness unchanged. | **Aligned.** Outcome explicitly explains non-movement. |
| Branch determination | Current pack has no Window 1 research-result branches. | Nine deterministic fixtures and nine source-bound outcome artefacts are authored in the proposed contract. | **Design gap closed.** Merge into pack metadata only after approval. |
| Prediction/reflection | V3 ledger can store prediction/reflection; current UI previously overconnected fields. | Prediction, note, and reflection are replay/debrief data only. | **Aligned.** Must be protected by contamination tests when implemented. |
| Evidence meanings | Current initiative profile has one `evidenceRequired` list. | Four collections distinguish visible, learner-cited, resolver-produced, and gate-required evidence. | **Additive gap.** Requires profile metadata, validator rules, and selectors. |
| Gates | G-PF-01 and G-PF-02 apply to Scale; G-PF-05 applies to Technician Knowledge Pilot. | Gate status mutates only for the applicable requested action/authored review. | **Mostly aligned.** Correct PF-I05 `scale_gate: G-PF-05` mismatch before implementation. |
| Gate thresholds | Pack has explicit provisional thresholds for later governance gates. | Research branches use named actionability findings, not those thresholds. | **Aligned.** Declared gate thresholds remain valid provisional gate content; they do not choose a Research branch. |
| Seeded uncertainty | Existing engine can resolve seeded ranges in declared rules. | Window 1 branches use no random selection; later seeded uncertainty must declare range, cause, and explanation. | **Aligned.** Hidden luck prohibited. |
| UI wording | Prior wording risked `Research Completed`, generic gates, and a guaranteed Pilot. | `Window 1 Research Review`; branch-aware Pilot availability; PM/VQ Scale gate preview; Knowledge Pilot gate preview. | **Aligned after initiative-specific gate wording.** |
| Accessibility | Earlier wireframes lacked explicit behavior. | Stacking, keyboard radio group, focus return, non-colour state, visible non-trapping action. | **Design gap closed; walkthrough and later tests required.** |
| V2 compatibility | V3 state is optional and current runtime is separate from legacy scenario state. | New state, metadata, orchestrator, and UI remain V3 opt-in. | **Aligned boundary.** V2, Standard mode, and existing packs stay untouched. |

## Required authored-content correction

### PF-I05 / G-PF-05 gate-stage mismatch

The content pack currently declares:

- PF-I05 `scale_gate: [G-PF-05]`; and
- G-PF-05 `applies_to: [knowledge-assistant.pilot]`.

The gate conditions—review panel, source safety/IP review, provenance/withdrawal,
and no safety instruction—are clearly Pilot-readiness conditions. The consistent
resolution is:

1. treat G-PF-05 as the Technician Knowledge **Pilot** gate;
2. replace the PF-I05 profile's generic `scale_gate` reference with an
   action-specific gate mapping during the approved content update; and
3. in a Technician Knowledge Research outcome, display `Pilot gate G-PF-05:
   not yet evaluated`, not `Scale gate`.

No new Knowledge Scale gate should be invented in this design step. A later Scale
decision needs separately authored and reviewed conditions if that path is used.

## State and persistence additions required after approval

| Addition | Proposed location | Compatibility rule |
|---|---|---|
| `researchReview` | Optional field on V3 initiative state | Default absent for existing saves/packs; never add a lifecycle value. |
| `windowHistory[]` | Optional/additive field on V3 scenario state | Default empty; V2 and earlier V3 saves load without a window. |
| `resolutionCursor` and operation IDs | Inside each V3 window record | Persist after atomic operations; duplicate application is rejected/skipped. |
| Research branch definitions | Project Factory V3 pack metadata | Required only for the opted-in Window 1 journey. |
| Outcome artefacts | Project Factory V3 evidence metadata | Source-bound, provisional, branch-specific, and not operating evidence. |
| Lifecycle evidence map | V3 initiative metadata | Action-specific; legacy `evidenceRequired` remains readable during migration. |
| Window orchestrator/aggregator | New V3 module composed from pure resolvers | Never call or change the legacy selector/quarter resolver. |

A V3 state schema/default migration is required when these fields are implemented.
The exact global save-version increment is a technical implementation decision,
but old saves must receive empty/default V3 fields without changing outcomes.

## UI wording audit

| Situation | Required wording | Prohibited implication |
|---|---|---|
| Result heading | `Window 1 Research Review` | Research is a new completed lifecycle. |
| PM/VQ after Research | `Scale gate … not yet eligible · read-only preview` | Research evaluated or passed Scale. |
| Knowledge after Research | `Pilot gate G-PF-05 not yet evaluated` | G-PF-05 is a Scale gate or has already passed. |
| Pilot-ready branch | `Pilot decision available in Window 2` | Automatic transition to Pilot. |
| Remediation branch | `Pilot decision unavailable · remediation required` | A high readiness score can override missing findings. |
| Unsupported branch | `Priority not supported / not actionable now` | Another metric is simply more urgent. |
| Operating measures | `did not change` plus reason | Research created downtime, quality, trust, or workforce benefit. |
| PF-E05 in Q1 | `early Q1 excerpts; full brief Q2` | Full OEM evidence was available at selection. |

## Required validation after implementation is authorised

1. All nine branch fixtures resolve deterministically and create the declared
   artefact, next-action availability, and branch-specific text.
2. Every fixture preserves all operating metrics through Research.
3. Reload at every cursor position cannot duplicate capital, capacity, artefact,
   event, gate transition, or ledger entry.
4. Unrelated gates/rules are not evaluated.
5. Opening/citing evidence, prediction, note, confidence, telemetry, baseline,
   and reflection cannot change a branch or outcome.
6. A PM/VQ Scale gate is not mutated during Research; G-PF-05 is evaluated only
   on an applicable Knowledge Pilot request/authored review.
7. Narrow-screen, keyboard, focus-return, zoom/reflow, and non-colour status
   behaviors meet the wireframe annotations.
8. Existing V2/Standard regression fixtures remain byte-for-byte behaviorally
   unchanged; non-V3 packs never create window state or show the V3 shell.

## Checklist against the delivery instruction

| Check | Status |
|---|---|
| State, persistence, content, gates, and UI wording aligned | **Pass with PF-I05 gate-label correction recorded** |
| No `ResearchCompleted` lifecycle | **Pass** |
| No arbitrary Research-branch thresholds | **Pass** |
| No hidden or undeclared seed luck | **Pass** |
| Three opening initiatives have three branch conditions and fixtures each | **Pass — authored in the proposed behavioral contract** |
| V2 code, Standard mode, and V2 packs untouched | **Pass — documentation-only change** |
| Proposed future V3 changes additive and opt-in | **Pass** |

## Decision gate

The design package is ready for the product-owner and 3–5 representative
learner/facilitator walkthrough after acknowledging the PF-I05/G-PF-05 content
correction. Production implementation remains blocked until feedback is resolved
and the wireframes plus contracts are explicitly approved.
