# Project Factory V3 — Learner-Journey Redesign Proposal

Status: **proposed for product-owner review; no implementation authorised**

## Problem being solved

The current V3 technical prototype exposes valid content and engine concepts but
does not provide a usable learner mental model. The learner cannot reliably tell:

1. what happened previously;
2. what decision is open now;
3. which evidence, spending, constraint, metric, and initiative belong together;
4. what action is expected; or
5. what will happen after acting.

The failure is caused by simultaneous presentation of the V2 cockpit, V3
evidence catalogue, initiative plan, metrics, governance data, reflection
fields, and analytics sidecar. This creates extraneous cognitive load and makes
the interface—not the strategic trade-off—the problem the learner must solve.

## Recommended product direction

Build a **dedicated, state-driven V3 learner experience** for opted-in V3 packs.
Reuse the existing V3 schema, resolvers, content, migration, and selectors, but
do not reuse the V2 decision cockpit as the primary interaction.

The interface should be one stable workspace with a central card that changes
state. It should not be five unrelated pages or a dashboard of simultaneous
panels.

## The decision-window loop

~~~text
ORIENT → COMPARE → COMMIT → OUTCOME → REFLECT → NEXT WINDOW
~~~

| State | Learner question | Primary content | Single primary action |
|---|---|---|---|
| Orient | What just happened, and what needs attention now? | Previous outcome strip; current board question; 2–3 headline signals | Review options |
| Compare | What are the credible choices and trade-offs? | Two or three initiative decision packets | Select one option |
| Commit | What exactly am I authorising? | Selected initiative, spend, capacity, evidence, gate, expected metric, one prediction | Confirm decision |
| Outcome | What changed, why, and with what uncertainty? | Resolver-authored causal explanation and 1–3 relevant movements | Reflect and continue |
| Reflect | What did I learn and what will I adjust? | One concise, contextual, skippable prompt | Save or skip |
| Next window | What carries forward? | Updated portfolio, remaining resources, next decision trigger | Enter next window |

The same shell and location are retained throughout. Only the central task card
changes. The learner should never need to discover which panel advances time.

## Persistent orientation header

Every state shows a compact header with:

- `Window 1 of 4 · Q1–Q3`;
- learner role and current board mandate;
- cumulative capital remaining;
- active delivery capacity (`0/2`, `1/2`, or `2/2`);
- a one-line previous-state summary;
- the label of the next primary action.

This header provides continuity without becoming another dashboard.

## Initiative decision packet

Evidence, spending, constraints, and expected effects must be co-located around
the initiative. Each option shows only:

- initiative name and current lifecycle;
- problem it addresses;
- capital/run cost and delivery capacity;
- time to first signal;
- one primary operating metric;
- two most relevant evidence artefacts with claim status;
- one dependency or gate;
- one key downside or `wrong for now` explanation.

`View evidence` opens a contextual drawer already filtered to that initiative.
The full evidence catalogue is not shown during primary decision-making.

## Visual grammar

Colour encodes meaning consistently and is reinforced by text/icons:

| Meaning | Treatment |
|---|---|
| Primary action / eligible choice | Blue |
| Evidence / supported claim | Teal |
| Constraint / attention required | Amber |
| Blocked / failed gate / adverse event | Red |
| Confirmed outcome / completed state | Green |
| Context / inactive / deferred | Neutral grey |

There is one filled primary button per state. Secondary actions are links or
outlined controls. Colour is never the only status signal.

## Placement of existing V3 features

| Existing feature | Redesigned placement |
|---|---|
| Evidence Room | Contextual initiative-filtered drawer in Compare/Commit; full library available from a secondary menu |
| Initiative Plan | Replaced by the initiative decision packet and Commit state |
| Analytics Sidecar | Removed from active play; selectors feed contextual outcome cards and the final debrief |
| Decision Ledger | Invisible infrastructure during play; concise replay in Outcome and full replay in final debrief |
| Governance & Gates | Displayed on the relevant initiative and only when the pending action invokes the gate |
| Metrics & Targets | Two or three decision-relevant signals in Orient/Outcome; full view available after the window |
| Reflection fields | One prediction at Commit and one contextual reflection after Outcome; neither blocks progress |

## Workshop and engine cadence

The primary facilitated experience uses four board windows over twelve engine
quarters. A confirmed board decision can resolve the quarters within its window,
pausing only for a declared gate, material event, or required learner response.
The learner should not conduct twelve equally detailed portfolio reviews.

The self-paced fallback may expose quarter detail inside each window, but it
must preserve the same state sequence and single-action rule.

## First prototype: Window 1 only

Prototype one Project Factory decision before rebuilding the complete campaign:

> Production reliability is deteriorating while asset data is incomplete. Do
> you authorise predictive-maintenance research, address another priority, or
> defer investment and preserve capacity?

The prototype contains:

- one previous-state/orientation summary;
- three decision packets, including one credible `wrong for now` option;
- two evidence items per option;
- one commit review;
- one resolver-authored outcome;
- one reflection prompt; and
- one unambiguous transition into Window 2.

It must be tested as a storyboard or low-fidelity clickable prototype before
production implementation. Success means a learner can answer, without help:

1. What decision am I making?
2. Why are these options relevant?
3. What will this choice cost or constrain?
4. What do I click to proceed?
5. What changed because of my choice?

## Implementation sequence after approval

1. Approve the dedicated V3 shell and state map.
2. Produce low-fidelity wireframes for Window 1.
3. Conduct a cold walkthrough with the product owner and 3–5 representative
   learners/facilitators; record confusion points and time-to-first-decision.
4. Revise and approve the prototype.
5. Implement Window 1 using existing V3 engine contracts.
6. Run compatibility and learner-flow tests.
7. Extend the accepted pattern to the remaining three windows.
8. Reconsider full analytics/sidecar surfaces only after pilot evidence shows a
   need.

## Explicit non-goals at this checkpoint

- no P3 scenario reuse;
- no additional event cards;
- no full analytics sidecar in active play;
- no AI reflection coach;
- no new scoring model;
- no cosmetic redesign of the current additive V3 screen.

## Decision requested

Approve or revise these three linked proposals before design work begins:

1. V3 uses a dedicated state-driven learner shell instead of the V2 cockpit.
2. Active play follows the single-workspace six-state loop above.
3. The next deliverable is a low-fidelity Window 1 storyboard, not production code.
