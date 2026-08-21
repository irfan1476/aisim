# Project Factory V3 — Window 1 Low-Fidelity Storyboard

Status: **proposed for walkthrough and revision; no production implementation authorised**

## Purpose

This storyboard tests the approved dedicated V3 workspace and the state loop:

`Orient → Compare → Commit → Outcome → Reflect → Next Window`

It covers only Window 1 (`Q1–Q3`). The same stable workspace is retained across
all states. The central task card changes; the learner does not navigate among
multiple dashboards or tools.

## Window 1 learning objective

The learner must distinguish an urgent business problem from a justified AI
lifecycle decision. They should recognise that a credible initiative can be
worth researching while still being wrong to pilot or scale now.

## Stable workspace shell

~~~text
┌─────────────────────────────────────────────────────────────────────────┐
│ PROJECT FACTORY V3       WINDOW 1 OF 4 · Q1–Q3       ROLE: TRANSFORMATION LEAD │
│ ₹5.00 Cr capital left    Active delivery 0/2        Next: Review priorities   │
├─────────────────────────────────────────────────────────────────────────┤
│ Previous / current orientation strip                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    EVOLVING CENTRAL TASK CARD                           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ [Evidence & sources] [Portfolio detail]          ONE PRIMARY ACTION     │
└─────────────────────────────────────────────────────────────────────────┘
~~~

Rules:

- the header never changes location;
- one filled primary button is visible per state;
- the full sidecar is absent;
- evidence and portfolio detail open as contextual drawers without changing
  the active state;
- `Back` is available before Commit; after Commit, the learner follows the
  resolver-authored Outcome;
- the interface names what the next action will do.

## Initial scenario context

### Board mandate

> Production reliability, quality, and workforce continuity are deteriorating.
> Authorise one evidence-building priority for Window 1 without exhausting the
> factory's constrained delivery capacity.

### Headline signals

| Signal | Current | Direction | Why it appears now |
|---|---:|---|---|
| Unplanned downtime | 12.0% | Deteriorating; target ≤7.0% | Immediate reliability pressure; M-4 creates 31% of stoppage minutes. |
| Escaped defects | 1,240 PPM | Above 1,000 PPM escalation threshold | Quality/OEM exposure is already material. |
| Workforce readiness | 52/100 | Below target ≥70 | 18% of senior technicians are retirement-eligible within 18 months. |

The learner can open `Why these three?` to see that the signals come from
PF-E01 and PF-E04. No other metric is shown in the primary orientation.

---

## State 1 — Orient

### Learner question

What requires a decision now?

### Central card

~~~text
┌─ WINDOW 1 BRIEF ────────────────────────────────────────────────────────┐
│ No previous decision: this is the opening position.                    │
│                                                                         │
│ BOARD QUESTION                                                          │
│ Which evidence-building priority should receive capacity in Q1–Q3?     │
│                                                                         │
│ 12.0% downtime       1,240 PPM defects       52/100 workforce readiness│
│                                                                         │
│ Constraint: ₹5 Cr total programme capital; research also uses scarce   │
│ data, plant, frontline, or governance capacity.                        │
│                                                                         │
│                                             [Review three priorities →] │
└─────────────────────────────────────────────────────────────────────────┘
~~~

### Interaction

- Primary: `Review three priorities`
- Secondary: `Why these signals?` opens PF-E01/PF-E04 source summaries.
- No initiative selection, allocation sliders, score, generic ROI, sidecar, or
  reflection field appears here.

### Next-state preview

> Next you will compare three research choices, their evidence, cost, and
> capacity requirements.

---

## State 2 — Compare

### Learner question

Which priority deserves research now?

### Decision packets

#### A — Predictive maintenance for critical assets

| Item | Learner-visible content |
|---|---|
| Lifecycle | Eligible for **Research**; Pilot/Scale not yet justified |
| Problem | Unplanned downtime: 12.0%; M-4 drives 31% of stoppage minutes |
| Research cost | ₹0.25 Cr |
| Window capacity | Data engineering 1/4; governance assurance 1/2 |
| First signal | One quarter |
| Relevant evidence | PF-E01 Plant performance; PF-E02 Asset-data readiness |
| Evidence boundary | Only 38% of critical assets have usable sensor history; supported for research, insufficient for scale |
| Metric to watch | Unplanned downtime; asset-data readiness |
| Key trade-off | Builds reliability evidence but produces no immediate downtime benefit |
| Status | **Eligible for research** |

#### B — AI visual quality inspection

| Item | Learner-visible content |
|---|---|
| Lifecycle | Eligible for **Research**; Pilot/Scale not yet justified |
| Problem | 1,240 escaped defects PPM; first-pass yield 91.2% |
| Research cost | ₹0.20 Cr |
| Window capacity | Data engineering 1/4; plant integration 1/3; governance assurance 1/2 |
| First signal | One quarter |
| Relevant evidence | PF-E01 Plant performance; early PF-E05 OEM/traceability excerpts |
| Evidence boundary | Root cause, labelled images, lighting stability, and override route are unresolved |
| Metric to watch | First-pass yield; escaped defects |
| Key trade-off | Addresses a material OEM exposure but competes for the same plant-change attention as reliability work |
| Status | **Eligible for research** |

#### C — Technician knowledge assistant

| Item | Learner-visible content |
|---|---|
| Lifecycle | Eligible for **Research**; Pilot/Scale not yet justified |
| Problem | Workforce readiness 52/100; 18% of senior technicians retirement-eligible |
| Research cost | ₹0.18 Cr |
| Window capacity | Data engineering 1/4; frontline change 1/3; governance assurance 1/2 |
| First signal | One quarter |
| Relevant evidence | PF-E04 Workforce continuity; PF-E07 Accountable-use controls |
| Evidence boundary | Retirement eligibility is not a departure forecast; technician quotations are not a representative survey |
| Metric to watch | Workforce readiness; technician trust |
| Key trade-off | Preserves expertise but offers indirect reliability value and consumes scarce technician review time |
| Status | **Eligible for research** |

### Wireframe

~~~text
┌─ COMPARE THREE PRIORITIES ──────────────────────────────────────────────┐
│ [A Reliability]        [B Quality]             [C Knowledge continuity]│
│ 12.0% downtime         1,240 PPM               52/100 readiness        │
│ ₹0.25 Cr               ₹0.20 Cr                ₹0.18 Cr                │
│ Data 1 · Gov 1         Data 1 · Plant 1 · Gov 1 Data 1 · Change 1 · Gov 1│
│ Evidence: E01, E02     Evidence: E01, E05      Evidence: E04, E07      │
│ [View evidence]        [View evidence]         [View evidence]         │
│ [Select]               [Select]                [Select]                │
│                                                                         │
│ Scaling now is blocked for all three: required pilot evidence is absent.│
│                                           [Continue with selected →]    │
└─────────────────────────────────────────────────────────────────────────┘
~~~

### Interaction

- Selecting a packet places a blue outline and updates the header's `Next`
  label to `Review [initiative] decision`.
- `View evidence` opens a teal drawer containing only the two named artefacts,
  each with `supports`, `does not establish`, and source/provisional status.
- `Why not pilot or scale?` opens an amber explanation of missing prerequisites.
- `Preserve capacity this window` is a secondary choice. If selected, the
  learner must identify a review trigger; it is not presented as failure.
- Primary after selection: `Continue with selected priority`.

---

## State 3 — Commit

The example below assumes Predictive Maintenance was selected. Equivalent
content is authored for the other two packets.

### Learner question

What exactly am I authorising?

### Central card

~~~text
┌─ AUTHORISE RESEARCH: PREDICTIVE MAINTENANCE ────────────────────────────┐
│ Decision: Deferred → Research                                           │
│ Owner: Maintenance lead                                                 │
│ Cost: ₹0.25 Cr        Remaining after approval: ₹4.75 Cr                │
│ Capacity: Data 1/4 · Governance 1/2                                    │
│ Evidence used: PF-E01 · PF-E02                                          │
│                                                                         │
│ What this window will test                                              │
│ • critical-asset identity, sensor history, and failure-code readiness   │
│ • ownership of asset hierarchy and read-only data access                │
│                                                                         │
│ What it will NOT do                                                     │
│ • deploy predictive alerts or reduce downtime yet                       │
│                                                                         │
│ Your prediction (choose one)                                            │
│ ( ) Evidence will support a constrained pilot                           │
│ ( ) Evidence will require more remediation                              │
│ ( ) Evidence will show this is the wrong priority                       │
│                                                                         │
│ [← Revise choice]                              [Confirm research →]      │
└─────────────────────────────────────────────────────────────────────────┘
~~~

### Interaction

- The prediction is one structured selection, not three required text fields.
- `Add a note` is optional and collapsed.
- Primary: `Confirm research`.
- The button text states the lifecycle action; it does not say merely `Submit`.

### Next-state preview

> The engine will resolve Q1–Q3 research work. It will report evidence gained,
> resources consumed, and whether a pilot decision is ready. Operating benefit
> is not expected from research alone.

---

## State 4 — Outcome

This is an illustrative provisional outcome contract, not an approved causal
parameter. It must be aligned with the resolver/content before implementation.

### Learner question

What changed because of the decision?

### Central card

~~~text
┌─ WINDOW 1 OUTCOME: RESEARCH COMPLETED ──────────────────────────────────┐
│ ✓ Decision executed: Predictive maintenance moved to Research           │
│                                                                         │
│ WHAT CHANGED                                                            │
│ • ₹0.25 Cr committed; ₹4.75 Cr remains                                  │
│ • Data 1/4 and Governance 1/2 used during this window                    │
│ • Evidence now supports a constrained M-4 pilot proposal                │
│                                                                         │
│ WHAT DID NOT CHANGE                                                     │
│ • Unplanned downtime remains 12.0%                                      │
│                                                                         │
│ WHY                                                                     │
│ Research validated problem/data scope; no alert workflow was deployed.  │
│ Sources: PF-E01 · PF-E02 · Research outcome R-PF-W1-PM                  │
│                                                                         │
│ UNCERTAINTY / NEXT CONSTRAINT                                            │
│ Sensor coverage and failure-code quality remain below the scale gate.   │
│                                             [Reflect on outcome →]       │
└─────────────────────────────────────────────────────────────────────────┘
~~~

### Rules

- Use plain `changed / did not change / why / uncertainty` structure.
- Do not show a generic ROI, adoption, risk, score, grade, or leadership label.
- Do not call research `success` because an operating metric did not move.
- Source links open the exact supporting record, not a full analytics dashboard.

---

## State 5 — Reflect

### Learner question

What will you change in the next decision?

### Central card

~~~text
┌─ ONE-MINUTE REFLECTION ─────────────────────────────────────────────────┐
│ You predicted: Evidence will support a constrained pilot.               │
│ Result: A constrained pilot is plausible, but scale evidence is absent. │
│                                                                         │
│ What is the most important condition you would require before pilot?    │
│ [_______________________________________________________________]       │
│                                                                         │
│ Reflection affects the debrief only; it does not change outcomes.       │
│ [Skip]                                             [Save and continue →] │
└─────────────────────────────────────────────────────────────────────────┘
~~~

The prompt is contextual, concise, and skippable. No self-awareness score is
calculated.

---

## State 6 — Next Window

### Learner question

What carries forward, and what decision comes next?

### Central card

~~~text
┌─ ENTER WINDOW 2 · Q4–Q6 ────────────────────────────────────────────────┐
│ PORTFOLIO CARRIED FORWARD                                               │
│ Predictive maintenance: Research complete · Pilot decision available    │
│ Capital remaining: ₹4.75 Cr · Active delivery: 0/2                     │
│                                                                         │
│ NEW BOARD QUESTION                                                       │
│ Do you pilot the reliability workflow, redirect capacity to quality,    │
│ or remediate evidence before committing a delivery slot?                │
│                                                                         │
│ Previous outcome will remain visible in the Window 2 orientation strip. │
│                                                [Enter Window 2 →]        │
└─────────────────────────────────────────────────────────────────────────┘
~~~

The primary action is the only action that advances time.

## Alternative-path outcome requirements

The storyboard walkthrough should also cover the non-selected paths at a
contract level:

| Window 1 choice | Required outcome framing |
|---|---|
| Visual-quality research | Records cost/capacity and evidence gained; first-pass yield and escaped defects do not improve before a workflow is piloted. |
| Knowledge-assistant research | Records cost/capacity and review/safety evidence; workforce readiness does not improve simply because research was funded. |
| Preserve capacity | Records explicit deferral and learner-defined review trigger; no invented neglect penalty or operating benefit. |

## Walkthrough protocol

Target: product owner plus 3–5 representative functional managers,
MBA/management learners, or facilitators.

Ask participants to think aloud without explaining the interface. Record:

1. time to identify the Window 1 board question;
2. whether they can associate each evidence item and metric with its initiative;
3. whether cost/capacity and `wrong for now` status are understood;
4. whether they can identify the one action that advances each state;
5. whether Outcome explains both movement and non-movement;
6. whether reflection feels connected rather than administrative; and
7. any element they ignored, misinterpreted, or expected but could not find.

Storyboard acceptance requires all participants to answer these unaided:

- What happened before this state?
- What decision is open?
- What evidence and constraint matter?
- What action advances the experience?
- What will be evaluated next?

## Assumptions requiring review

1. Window 1 permits one primary research authorisation; portfolio breadth is
   built through sequencing across four windows rather than simultaneous Q1
   selection of three initiatives.
2. Predictive maintenance, visual quality, and technician knowledge are the
   three opening priorities; Energy, Demand, and Supply remain accessible as
   `Other priorities` only if walkthrough evidence shows that omission harms
   understanding.
3. A defer/preserve-capacity option remains available but visually secondary.
4. The illustrative research outcome needs an authored research-result
   contract; the current causal rules focus more strongly on pilot/operational
   effects.
5. Full portfolio analytics and the ledger remain outside the active Window 1
   path and appear in the final debrief or explicit optional review.

## Decision gate

Review and revise this storyboard before creating visual wireframes or changing
production code. Approval should explicitly settle the five assumptions above,
especially the one-primary-authorisation rule and the three opening priorities.
