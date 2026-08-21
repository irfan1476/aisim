# Project Factory V3 — Window 1 Visual Wireframe Review

Status: **architecture accepted in principle; revisions and runtime-contract clarification required before implementation approval**

## Overall assessment

The visual wireframes correctly implement the approved learner-journey reset:
one stable shell, one evolving central card, explicit previous/current/next-state
orientation, contextual evidence, a single primary action, and no active-play
sidecar. The design should be revised rather than replaced.

Production implementation is not yet ready because several wireframe statements
imply runtime behaviour that is not fully declared in the current content or
engine contracts.

## Accepted without change

- Dedicated V3 shell and persistent orientation header.
- Orient → Compare → Commit → Outcome → Reflect → Next Window.
- Reliability, Quality, and Knowledge Continuity as the three Window 1 packets.
- Energy as monitored context.
- Energy, Demand, and Supply as a collapsed later-window portfolio line.
- One primary research authorisation.
- Structured prediction plus optional note.
- Research-stage no-operating-benefit boundary.
- `changed / did not change / why / uncertainty` outcome structure.
- Optional, non-scoring reflection.
- Semantic colour grammar, provided status also uses text and iconography.

## Required visual/interaction revisions

### 1. Preserve one primary action in Compare

The three cards should be selectable radio cards or whole-card controls. Do not
show three filled `Select` buttons plus a global primary button. After one card
is selected, the single filled action is:

`Continue with Predictive Maintenance` (or the selected initiative name).

### 2. Remove generic persistent secondary navigation

The shell footer should not permanently show generic `Evidence`, `Portfolio`,
and `Glossary` actions. Secondary links must be state-specific. A persistent
tool row risks recreating the sidecar/navigation problem.

### 3. Clarify lifecycle language

Replace:

> Scaling now is blocked for all three: required pilot evidence absent.

with:

> Only Research is available now. Pilot requires research evidence; Scale
> requires pilot evidence and its declared gate.

G-PF-01 is the predictive-maintenance **scale** gate. It must not be presented
as the gate that permits entry to Research or automatically permits Pilot.

### 4. Keep labels explicit

Avoid `P1`, `G1`, or similar abbreviations in a decision packet. Show `Plant
integration 1/3` and `Governance assurance 1/2`. The learner should not need a
legend to understand the primary decision.

### 5. Keep the ledger outside active play

In Next Window, retain `View Window 1 replay`. Remove `View decision ledger so
far` from the active path. The replay can use the ledger underneath; the full
ledger belongs in the final debrief.

### 6. Add responsive and accessibility behaviour

- three columns on wide screens, one vertical sequence on narrow screens;
- visible selected state using label/icon/border, not colour alone;
- keyboard-selectable decision packets;
- drawers return focus to the originating control;
- evidence status uses `supports` and `does not establish` text;
- the primary action remains visible without creating a scroll trap.

## Blocking runtime/content clarifications

### A. Four-window orchestration

The wireframe assumes that one confirmation resolves Q1–Q3 and then displays a
Window 1 outcome. The existing V3 state/resolver contracts are primarily
quarter-based. Before implementation, define an additive window orchestrator:

1. save the board-window decision;
2. resolve its quarters sequentially and deterministically;
3. pause only for an authored gate, material event, or required response;
4. aggregate `changed / did not change / why / uncertainty` for the window;
5. preserve quarter-level records for replay and save migration.

This must not be approximated by jumping the quarter counter from 1 to 4.

### B. Research duration and capacity timing

The content pack declares capacity units per quarter and a one-quarter time to
signal for these initiatives. The wireframe currently says `Data 1/4` and
`Governance 1/2 used during this window`, which is ambiguous across three
quarters.

The content/runtime contract must declare whether research capacity is:

- consumed once in Q1;
- consumed in every active research quarter; or
- scheduled explicitly by quarter.

Recommended contract: lifecycle profiles declare a duration and per-quarter
capacity schedule. Capital is committed once; research does not automatically
incur pilot/scale run cost or an active-delivery slot.

### C. Research outcome branches

The shown outcome—`evidence now supports a constrained M-4 pilot proposal`—is a
valid illustrative branch, not a guaranteed result. Before implementation,
author deterministic research outcomes such as:

1. `pilot-ready-with-conditions`;
2. `remediation-required`; or
3. `priority-not-supported`.

The branch must be produced by declared evidence/state/seed rules, never by the
learner's prediction and never invented in the UI. Each branch needs a fixture
and source-bound explanation.

### D. Pilot readiness versus scale gate

The UI must maintain separate states for:

- research review completed;
- pilot-entry readiness;
- lifecycle remains `Research` until a later learner decision;
- G-PF-01 scale gate remains pending until pilot evidence exists.

Replace `Research complete · Pilot decision available` with a precise status,
for example:

> Lifecycle: Research · Review: pilot-ready with conditions · Scale gate:
> not yet eligible.

### E. Lifecycle-specific evidence requirements

The decision packet cites two evidence items, while the initiative profile has
a broader evidence list for its complete lifecycle. Define evidence by
lifecycle/action:

- minimum evidence for Research authorisation;
- evidence needed to consider Pilot;
- evidence required for the Scale gate.

The two-item packet should be explicitly labelled `Evidence for this Research
decision`, not implied to satisfy all later governance requirements.

## Outcome wording correction

The illustrative Predictive Maintenance outcome should read:

- **Lifecycle:** remains in Research;
- **Window review:** pilot-ready with conditions (illustrative branch);
- **Resources:** ₹0.25 Cr committed; exact quarterly capacity use reported from
  the authored schedule;
- **Operating outcome:** unplanned downtime remains 12.0%; no alert workflow was
  deployed;
- **Evidence outcome:** named research findings and missing evidence;
- **Gate:** G-PF-01 scale gate not yet eligible;
- **Uncertainty:** sensor coverage, failure-code quality, and technician workflow
  usefulness remain unresolved or below threshold.

## Approval sequence

1. Revise the low-fidelity wireframes for the interaction and language items.
2. Add the five runtime/content contracts above to the design/backlog.
3. Walk through all six states with the product owner.
4. Test the revised wireframe with 3–5 representative learners/facilitators.
5. Record confusion points and revisions.
6. Approve the design and runtime contract together.
7. Only then implement Window 1 using the existing V3 primitives plus the
   explicitly approved additive window orchestration/research-result contracts.

## No clarification required from the product owner yet

The recommended corrections follow the already approved guardrails. Product
input is needed after the revised wireframe and runtime-contract proposal are
available, not before those revisions are prepared.
