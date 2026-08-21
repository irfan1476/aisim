# Project Factory V3 — Window 1 Wireframes v2

Status: **proposed for representative-learner walkthrough; production implementation paused**

## Purpose and boundary

These low-fidelity wireframes complete the accepted Window 1 interaction design.
They describe one stable V3 workspace and one evolving central task card across:

`Orient → Compare → Commit → Outcome → Reflect → Next Window`

They do not author production UI, change the engine, or reopen the active-play
sidecar. The examples use Predictive Maintenance as the selected initiative; the
behavioral contract supplies equivalent research branches for Visual Quality and
Technician Knowledge.

## Learner context contract

The learner is not expected to know Project Factory's real internal operations.
At the start of the exercise, show this compact orientation statement:

> Treat the scenario pack as the operating truth for this exercise. You are not
> expected to know this factory in advance. If a fact is not in the evidence,
> treat it as unknown—not as permission to invent an assumption. Research is a
> way to resolve an unknown; a Pilot is an operating intervention.

This makes the uncertainty intentional rather than punitive. The learner is
choosing whether an evidence-building action is worth its cost and capacity, not
claiming private knowledge about a real plant.

## Stable shell

~~~text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Project Factory V3     Window 1 of 4 · Q1–Q3     Transformation Lead       │
│ ₹5.00 Cr remaining     Active delivery 0/2       Next: review priorities   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ORIENTATION STRIP: previous state · current question · next consequence      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           CENTRAL TASK CARD                                  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Contextual secondary action                         [Primary action — blue]   │
└──────────────────────────────────────────────────────────────────────────────┘
~~~

### Shell rules

- The header, orientation strip, and central task card remain in the same place.
- Every state has one filled-blue primary action. Secondary actions are contextual
  and never advance time.
- Blue means action; teal means evidence; amber means constraint; red means
  blocked/adverse; green means resolved; grey means context. Every meaning also
  has text and an icon or shape—colour is never the only signal.
- The active-play path contains no full Evidence Room, analytics sidecar, or full
  decision ledger.
- On wide screens, comparable packets may sit side by side. On narrow screens,
  packets stack vertically in the same reading and tab order.
- The action region may remain sticky, but must not cover content, trap scrolling,
  or prevent zoom/reflow at 200%.

## State 1 — Orient

~~~text
┌─ WINDOW 1 BRIEF ──────────────────────────────────────────────────────────────┐
│ No previous decision—this is the opening position.                           │
│                                                                              │
│ BOARD QUESTION                                                               │
│ Which evidence-building priority should receive capacity in Q1–Q3?           │
│                                                                              │
│ [!] Reliability     Unplanned downtime 12.0% · target ≤7.0%                  │
│ [!] Quality         Escaped defects 1,240 PPM · internal escalation >1,000   │
│ [!] Workforce       Readiness 52/100 · target ≥70                            │
│                                                                              │
│ [i] Monitored context: energy intensity is 15% above the prior baseline.     │
│                                                                              │
│ [Constraint] ₹5 Cr programme capital. Research also uses scarce Data         │
│ Engineering, plant, frontline, or Governance Assurance capacity.             │
│                                                                              │
│ [Why these signals?]  [What does Research mean?]                             │
│                                                   [Review three priorities]  │
└──────────────────────────────────────────────────────────────────────────────┘
~~~

The contextual drawers return focus to the link that opened them. Neither drawer
changes selection, evidence citation, state, or outcome.

## State 2 — Compare

~~~text
┌─ COMPARE THREE PRIORITIES ────────────────────────────────────────────────────┐
│                                                                              │
│ [● SELECTED] Predictive Maintenance — Research available now                 │
│ Problem: 12.0% downtime; M-4 drives 31% of stoppage minutes.                 │
│ Cost: ₹0.25 Cr capital                                                       │
│ Q1 capacity: Data Engineering 1/4 · Governance Assurance 1/2                │
│ Research signal: Q2                                                         │
│ Evidence: PF-E01 Plant dashboard · PF-E02 Asset-data assessment              │
│ Boundary: incomplete sensing supports Research, not operating benefit.       │
│ [View evidence for Predictive Maintenance]                                   │
│                                                                              │
│ [○ NOT SELECTED] Visual Quality Inspection — Research available now          │
│ Problem: 1,240 escaped-defect PPM; first-pass yield 91.2%.                   │
│ Cost: ₹0.20 Cr capital                                                       │
│ Q1 capacity: Data Engineering 1/4 · Plant Integration 1/3 ·                  │
│              Governance Assurance 1/2                                       │
│ Research signal: Q2                                                         │
│ Evidence: PF-E01 Plant dashboard · PF-E05 OEM brief                          │
│           (early Q1 excerpts; full brief Q2)                                 │
│ Boundary: labelled images, capture conditions, and traceability unresolved.  │
│ [View evidence for Visual Quality]                                           │
│                                                                              │
│ [○ NOT SELECTED] Technician Knowledge Assistant — Research available now     │
│ Problem: workforce readiness 52/100; 18% retirement-eligible.                │
│ Cost: ₹0.18 Cr capital                                                       │
│ Q1 capacity: Data Engineering 1/4 · Frontline Change 1/3 ·                   │
│              Governance Assurance 1/2                                       │
│ Research signal: Q2                                                         │
│ Evidence: PF-E04 Workforce brief · PF-E07 Governance brief                   │
│ Boundary: retirement eligibility is not a departure forecast.                │
│ [View evidence for Technician Knowledge]                                     │
│                                                                              │
│ [i] Only Research is available now. Pilot requires research evidence.        │
│     Scale requires pilot evidence and its declared governance gate.          │
│                                                                              │
│ Later-window portfolio: Energy Optimisation · Demand Forecasting ·           │
│ Supply Chain Risk                                                            │
│ [Why are these not on today's agenda?]                                       │
│                                      [Continue with Predictive Maintenance]  │
└──────────────────────────────────────────────────────────────────────────────┘
~~~

### Compare interaction

- Each packet is one radio option and one keyboard target. Space selects;
  arrow keys move within the group; Enter activates the single primary action.
- Selected state is conveyed by the radio marker, `SELECTED` text, border weight,
  and accessible name—not colour alone.
- Opening an evidence drawer does not cite that evidence. A learner explicitly
  cites evidence only in the decision record.
- The primary action is disabled until one packet is selected and announces the
  selected initiative in its label.

### What every decision packet must make explicit

The packet is a context bridge, not just a catalogue entry. Alongside the
problem, cost, capacity, and evidence, it must show:

- **Why this matters now:** the operational consequence in plain language;
- **What the evidence establishes:** two or three sourced facts;
- **What the evidence does not establish:** the unknown that Research tests;
- **What the decision tests:** the named findings that could make a Pilot
  possible, require remediation, or show the intervention is not actionable;
- **Who owns the decision:** the role accountable for the operational call;
- **If deferred:** the visible exposure or review trigger, without an invented
  penalty;
- **Plain-language terms:** for example, “failure-code history” means past
  maintenance records grouped into usable cause categories; “read-only access”
  means the team can inspect data but cannot change production systems.

The learner should be able to choose Research without knowing whether the
findings will be positive. The packet explains what will be learned and what a
later Pilot would require; it does not require the learner to supply hidden plant
knowledge.

### Complete reference packet — Predictive Maintenance

The visible packet should use this compact order. Detailed source text remains
behind the contextual evidence drawer.

~~~text
PREDICTIVE MAINTENANCE · RESEARCH

WHY NOW
Downtime is 12.0%; Line M-4 creates 31% of stoppage minutes.

WHAT WE KNOW
• Only 38% of critical assets have six months of usable sensor history.
• Only 44% of failure codes are structured; M-4 vibration data is irregular.

WHAT RESEARCH WILL RESOLVE
• Can selected M-4 failure modes be detected early enough to act?
• Is a named asset-data owner and read-only access available?
• Is protected technician review/disposition capacity available?

DECISION TEST
All five scoped findings accepted → bounded Pilot may be considered later.
Repairable gaps → remediation; failed actionability → priority not supported.

COMMITMENT
₹0.25 Cr · Data Engineering 1/4 · Governance Assurance 1/2 · Q1 only
Owner: Maintenance lead with CIO/data owner

IF DEFERRED
M-4 remains exposed; the next review is triggered by a material failure or
new asset-data/ownership evidence. No generic penalty is applied.

THIS IS NOT A PROMISE
Research does not deploy alerts, reduce downtime, or pass G-PF-01.

[View source evidence] [Plain-language terms] [Select this Research packet]
~~~

Plain-language terms are available without leaving the decision: an **asset
owner** is the role accountable for the machine data; **structured failure
codes** are repair records grouped into usable cause categories; **read-only
access** permits inspection without changing a production system; **disposition**
is the technician's recorded decision to inspect, schedule, defer, or override.

### Compact context for the other two packets

Visual Quality and Technician Knowledge use the same visible order. Their
decision-specific context is:

| Packet | Why now | Research will resolve | If deferred |
|---|---|---|---|
| Visual Quality | Escaped defects are 1,240 PPM and the OEM requires traceable containment. | Whether selected Q-2 defects are visually observable; whether labels/capture are usable; whether a Quality owner can trace override/rework. | OEM containment and defect exposure remain; review when Q2 OEM evidence or a material escape changes the case. |
| Technician Knowledge | Workforce readiness is 52/100 and 18% of senior technicians are retirement-eligible. | Whether a bounded knowledge set is validated; whether a technician review panel/time exists; whether safety/IP/withdrawal controls are usable. | Continuity exposure remains; review when protected review capacity or a material departure/workflow trigger changes the case. |

The learner should not have to infer these connections from initiative names or
generic evidence links.

## State 3 — Commit

~~~text
┌─ AUTHORISE RESEARCH: PREDICTIVE MAINTENANCE ─────────────────────────────────┐
│ Decision: Deferred → Research                                                │
│ Owner: Maintenance lead                                                      │
│ Capital: ₹0.25 Cr · remaining after approval: ₹4.75 Cr                      │
│ Q1 capacity: Data Engineering 1/4 · Governance Assurance 1/2                │
│ Research activity: Q1 · signal observed Q2 · no Q2–Q3 capacity unless       │
│ an authored response or event requires it                                   │
│ Evidence cited: PF-E01 · PF-E02                                              │
│                                                                              │
│ THIS WINDOW WILL TEST                                                        │
│ Critical-asset identity, selected failure history, read-only access,          │
│ accountable ownership, and technician review capacity.                       │
│                                                                              │
│ IT WILL NOT                                                                  │
│ Deploy alerts, pass the scale gate, or reduce downtime.                       │
│                                                                              │
│ Your prediction (choose one)                                                 │
│ [●] Evidence will support a constrained pilot                               │
│ [○] Evidence will require remediation                                        │
│ [○] Evidence will show this priority is not actionable now                   │
│                                                                              │
│ [Add a note — optional]                                                      │
│ [View cited evidence]  [What happens after Research?]                        │
│                                                    [Confirm Research]        │
└──────────────────────────────────────────────────────────────────────────────┘
~~~

The prediction and optional note are reflective ledger data. They never select
the research-result branch or change the resolver outcome.

The prediction is not a knowledge test. A learner receives no penalty because a
prediction differs from the resolver-authored finding; the debrief asks what the
evidence changed and what condition matters next.

## State 4 — Outcome variants

Every variant uses the title **Window 1 Research Review** and the same information
order. The status icon and text are announced when the result loads. Operating
metrics remain unchanged because Research created evidence, not an intervention.
The examples below use Predictive Maintenance, whose next governance checkpoint
is Scale gate G-PF-01. A Technician Knowledge result must instead show `Pilot gate
G-PF-05: not yet evaluated`; it must not relabel that Pilot gate as a Scale gate.

### 4A — Pilot-ready-with-conditions

~~~text
┌─ WINDOW 1 RESEARCH REVIEW ────────────────────────────────────────────────────┐
│ [✓ CONDITIONAL] Predictive Maintenance                                       │
│ Lifecycle: Research                                                          │
│ Research review: Pilot-ready with conditions                                 │
│ Pilot decision: Available in Window 2                                        │
│ Scale gate G-PF-01: Not yet eligible · read-only preview                     │
│                                                                              │
│ WHAT CHANGED                                                                 │
│ ₹0.25 Cr committed; ₹4.75 Cr remains. Q1 used Data Engineering 1/4 and      │
│ Governance Assurance 1/2. Research artefact PF-R01-A supports an M-4 pilot   │
│ boundary with named conditions.                                              │
│                                                                              │
│ WHAT DID NOT CHANGE                                                          │
│ Unplanned downtime remains 12.0%; no alert workflow was deployed.            │
│                                                                              │
│ WHY                                                                          │
│ PF-E01 and PF-E02 framed the problem. Research confirmed a bounded,           │
│ read-only, owner-supported test; this is evidence, not operating value.       │
│                                                                              │
│ UNCERTAINTY / NEXT CONSTRAINT                                                 │
│ Pilot usefulness, nuisance alerts, technician disposition, and scale-gate    │
│ evidence remain unobserved. Sources: PF-E01 · PF-E02 · PF-R01-A             │
│ [View causal explanation]                     [Reflect on this outcome]       │
└──────────────────────────────────────────────────────────────────────────────┘
~~~

### 4B — Remediation-required

~~~text
┌─ WINDOW 1 RESEARCH REVIEW ────────────────────────────────────────────────────┐
│ [! REMEDIATION REQUIRED] Predictive Maintenance                              │
│ Lifecycle: Research                                                          │
│ Research review: Remediation required                                        │
│ Pilot decision: Not available                                                │
│ Scale gate G-PF-01: Not yet eligible · read-only preview                     │
│                                                                              │
│ WHAT CHANGED                                                                 │
│ ₹0.25 Cr committed; ₹4.75 Cr remains. Q1 capacity was used. PF-R01-B        │
│ identifies repairable gaps in failure-history ownership and technician       │
│ review capacity; the initiative remains in Research.                         │
│                                                                              │
│ WHAT DID NOT CHANGE                                                          │
│ Unplanned downtime remains 12.0%; no pilot or alert workflow exists.         │
│                                                                              │
│ WHY                                                                          │
│ Research found the intervention potentially relevant but not yet executable  │
│ as a protected M-4 pilot. Evidence gaps are named rather than scored.         │
│                                                                              │
│ UNCERTAINTY / NEXT CONSTRAINT                                                 │
│ The team must establish an accountable data owner, usable selected-failure   │
│ history, and protected technician review before reconsidering Pilot.          │
│ Sources: PF-E01 · PF-E02 · PF-R01-B                                         │
│ [View causal explanation]                     [Reflect on this outcome]       │
└──────────────────────────────────────────────────────────────────────────────┘
~~~

### 4C — Priority-not-supported

~~~text
┌─ WINDOW 1 RESEARCH REVIEW ────────────────────────────────────────────────────┐
│ [× NOT ACTIONABLE NOW] Predictive Maintenance                                │
│ Lifecycle: Research                                                          │
│ Research review: Priority not supported                                      │
│ Pilot decision: Not available                                                │
│ Scale gate G-PF-01: Not yet eligible · read-only preview                     │
│                                                                              │
│ WHAT CHANGED                                                                 │
│ ₹0.25 Cr committed; ₹4.75 Cr remains. Q1 capacity was used. PF-R01-C        │
│ shows that the selected dominant failure modes cannot be detected early      │
│ enough—or acted on safely within the available M-4 window.                   │
│                                                                              │
│ WHAT DID NOT CHANGE                                                          │
│ Unplanned downtime remains 12.0%; no intervention was deployed.              │
│                                                                              │
│ WHY                                                                          │
│ Research tested actionability, not attractiveness. A material problem does   │
│ not make this AI intervention usable in the current operating context.       │
│                                                                              │
│ UNCERTAINTY / NEXT CONSTRAINT                                                 │
│ A materially different failure mode, sensing method, or maintenance window   │
│ would be needed before reopening this priority.                               │
│ Sources: PF-E01 · PF-E02 · PF-R01-C                                         │
│ [View causal explanation]                     [Reflect on this outcome]       │
└──────────────────────────────────────────────────────────────────────────────┘
~~~

## State 5 — Reflect variants

All reflections are optional, concise, stored for debrief only, and excluded
from resolver, gate, scorecard, and branch determination.

### 5A — Pilot-ready-with-conditions

~~~text
ONE-MINUTE REFLECTION
You predicted: Evidence will support a constrained pilot.
Research review: Pilot-ready with conditions.

What condition is most important before Pilot?
[Optional response________________________________________________]

[Skip]                                           [Save and continue]
~~~

### 5B — Remediation-required

~~~text
ONE-MINUTE REFLECTION
You predicted: Evidence will support a constrained pilot.
Research review: Remediation required.

What evidence gap must be closed first, and what would cause you to stop?
[Optional response________________________________________________]

[Skip]                                           [Save and continue]
~~~

### 5C — Priority-not-supported

~~~text
ONE-MINUTE REFLECTION
You predicted: Evidence will support a constrained pilot.
Research review: Priority not supported.

What evidence changed your view, and what would make this priority actionable?
[Optional response________________________________________________]

[Skip]                                           [Save and continue]
~~~

## State 6 — Next Window variants

Each version carries forward the actual branch, remaining capital, lifecycle,
and active-delivery count. `View Window 1 replay` opens a contextual replay, not
the full ledger or sidecar.

### 6A — Pilot-ready-with-conditions

~~~text
ENTER WINDOW 2 · Q4–Q6
Predictive Maintenance: Research · Pilot decision available
Capital remaining: ₹4.75 Cr · Active delivery: 0/2

NEW BOARD QUESTION
Do you pilot the reliability workflow, redirect capacity to Quality,
or remediate a remaining condition before committing a delivery slot?

[View Window 1 replay]                              [Enter Window 2]
~~~

### 6B — Remediation-required

~~~text
ENTER WINDOW 2 · Q4–Q6
Predictive Maintenance: Research · Remediation required · Pilot unavailable
Capital remaining: ₹4.75 Cr · Active delivery: 0/2

NEW BOARD QUESTION
Do you invest in the named remediation, switch priorities, or defer the work?

[View Window 1 replay]                              [Enter Window 2]
~~~

### 6B-follow-on — Window 2 remediation packet

When the learner chooses `Fund the named remediation`, Window 2 must reveal the
bounded action before any funding is committed:

~~~text
┌─ REPAIR EVIDENCE BEFORE PILOT ────────────────────────────────────────────────┐
│ Predictive Maintenance remains in Research                                  │
│ Action: Repair M-4 asset-data ownership and technician-review readiness      │
│ Duration: 1 quarter (Q4) · Capital: ₹0.15 Cr · Active delivery slot: No    │
│ Capacity: Data Engineering 1/4 · Governance Assurance 1/2 ·                 │
│           Frontline Change 1/3                                             │
│ Owner: CIO/data owner with Maintenance lead                                  │
│                                                                              │
│ WORK TO COMPLETE                                                             │
│ • Confirm the M-4 asset hierarchy and accountable data owner                 │
│ • Repair selected failure-code history and document limitations              │
│ • Protect technician review time and define disposition/override ownership   │
│ • Confirm read-only access and the safety/IP escalation route                 │
│                                                                              │
│ COMPLETION EVIDENCE                                                          │
│ Named owners accept the hierarchy; selected history is usable; review        │
│ capacity and escalation are documented; access boundaries are accepted.      │
│                                                                              │
│ [Amber constraint] This does not improve downtime or pass G-PF-01.           │
│ If evidence remains incomplete, Pilot stays unavailable.                     │
│                                                                              │
│ [View remediation evidence]                         [Fund remediation]       │
└──────────────────────────────────────────────────────────────────────────────┘
~~~

If the learner confirms, the resolver records the capital/capacity operation and
keeps the lifecycle in Research. It does not evaluate G-PF-01 or create a
downtime effect. A later outcome must report `remediation-complete` or
`remediation-incomplete` using the declared completion evidence.

### 6B-outcome — Remediation review

For the complete fixture (`PF-W2-RM-A`), the learner sees:

~~~text
┌─ WINDOW 2 REMEDIATION REVIEW ────────────────────────────────────────────────┐
│ [✓ COMPLETE] Evidence repair completed                                       │
│ Lifecycle: Research                                                          │
│ Pilot decision: May become available in the next window                       │
│ Scale gate G-PF-01: Not yet eligible · not evaluated                         │
│                                                                              │
│ WHAT CHANGED                                                                 │
│ ₹0.15 Cr committed; M-4 ownership, selected failure history, technician      │
│ review capacity, and read-only control boundaries were accepted.             │
│                                                                              │
│ WHAT DID NOT CHANGE                                                          │
│ Downtime remains 12.0%; no alert workflow or operating intervention exists.  │
│                                                                              │
│ WHY                                                                          │
│ Remediation repaired evidence and operating readiness conditions. It did     │
│ not create Pilot value. Pilot remains a later learner decision.              │
│                                                                              │
│ [View completion evidence]                         [Reflect on remediation]  │
└──────────────────────────────────────────────────────────────────────────────┘
~~~

For `PF-W2-RM-B`, replace the status with `INCOMPLETE`, show the unresolved
condition, keep Pilot unavailable, and offer `Defer` or `Stop` rather than imply
that funding created readiness.

### 6C — Priority-not-supported

~~~text
ENTER WINDOW 2 · Q4–Q6
Predictive Maintenance: Research · Priority not supported · Pilot unavailable
Capital remaining: ₹4.75 Cr · Active delivery: 0/2

NEW BOARD QUESTION
Do you switch to Quality or Workforce, or preserve capacity while you seek a
materially different reliability intervention?

[View Window 1 replay]                              [Enter Window 2]
~~~

## Responsive and accessibility acceptance notes

1. At narrow widths, packet content stacks without horizontal scrolling; the
   primary action follows content in document order even when visually sticky.
2. Radio-group name, option position, selected state, cost, capacity, evidence
   status, and blocked/conditional result are available to assistive technology.
3. Drawers are labelled dialogs, trap focus only while open, close with Escape,
   and return focus to the originating control.
4. Status text uses symbols plus words (`CONDITIONAL`, `REMEDIATION REQUIRED`,
   `NOT ACTIONABLE NOW`); no red/amber/green-only communication is permitted.
5. Focus moves to the new state heading after a confirmed transition. Returning
   to Compare restores focus to the selected packet.
6. The sticky action region cannot obscure the last packet, optional field, error,
   or browser zoom controls. A non-sticky fallback preserves the same order.
7. Outcome explanations and evidence summaries remain usable without tooltips,
   pointer hover, charts, animation, or colour perception.

## Review gate

These wireframes are ready for a product-owner and 3–5 representative
learner/facilitator walkthrough. They are not production approval. Feedback must
test orientation, connection between evidence and initiative, action clarity,
branch comprehension, and whether the learner can predict what advances next.

### Walkthrough handoff

Use a 30–45 minute moderated, think-aloud walkthrough. Do not teach the state
model before the participant attempts it. Rotate the three outcome branches so
the group sees every Next Window path.

Ask each participant to show or state:

1. what happened previously, what decision is open, and what advances the state;
2. which evidence belongs to each initiative and what that evidence cannot prove;
3. what capital/capacity Research uses and whether it occupies a delivery slot;
4. what they expect to change after confirming Research;
5. whether the result permits Pilot and whether any governance gate was evaluated;
6. what choice is available in the next window.

Record prompting required, wrong turns, words participants reinterpret, and any
request for information not present in the active task. The package passes the
walkthrough only if most participants can independently locate the one action,
connect evidence to the chosen initiative, explain why operating metrics did not
move, distinguish Pilot availability from a gate, and identify the branch-correct
next choice. Revise the design before code if those outcomes are not met.
