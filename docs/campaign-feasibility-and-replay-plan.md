# Campaign Feasibility and Replay Plan

## Problem to solve

The campaign must reward a credible strategic attempt in one twelve-quarter run,
while making a replay with one changed hypothesis worthwhile. It must not require
every scenario signal to reach its long-term target before a learner can earn an
A rating.

The former balance harness cannot answer this question. It uses the legacy
`resolveQuarter` / `deriveScore` path and does not exercise lifecycle actions,
initiative funding, capacity validation, lifecycle reviews, or the live verdict.

## Design decisions

1. Every scenario declares three outcome roles:
   - **Primary outcomes** define the mission of the campaign.
   - **Supporting outcomes** distinguish a strong, balanced transformation from
     a narrowly successful intervention.
   - **Guardrails** must not deteriorate; they prevent an apparently successful
     campaign from winning by creating unacceptable exposure.
2. The score uses a role-weighted mission-progress figure, rather than an equal
   average of every signal.
3. The final verdict may award A or A+ only when the mission and guardrails are
   credible. It never demands full completion of every supporting target.
4. A final report explains the next replay as one testable change against the
   same frozen scenario, not as an instruction to repeat all decisions.
5. Scenario target/effect changes must be based on a deterministic, action-aware
   feasibility harness, never on the retired legacy balance harness.

## Executive-curriculum mechanics selected for gameplay

The following mechanics are selected because they make the first campaign
feasible and make the next campaign a more purposeful strategy experiment.

| Curriculum concept | Game mechanic | Why it belongs |
| --- | --- | --- |
| AI OKRs and outcome mapping | Primary outcome, supporting outcome, and guardrail roles; a visible causal chain from capability to operating decision to business result | Makes the mission concrete instead of rewarding undifferentiated dashboard movement. |
| Scale / Improve / Kill rubric | Replace ambiguous repeated pilot cycles with an explicit post-pilot decision: scale, improve with one defined evidence gap, pause, or retire | Prevents pilot purgatory and makes an imperfect first run educational rather than exhausting. |
| Realisation velocity | Track quarters from first funding to first evidence, first operating effect, and payback; reward faster validated progress without treating discovery as ROI | Gives timing a strategic purpose and makes replayable sequencing visible. |
| Full-lifecycle TCO | Show data, operating, governance, monitoring, retraining, and continuity costs separately from initial delivery capital | Preserves financial realism while explaining why a late run may be sound but not yet cash-positive. |
| ADKAR / change readiness | Make awareness, capability, and reinforcement visible change conditions that affect adoption and benefit realisation | Rewards human enablement rather than allowing technical spend alone to win. |
| 70-20-10 portfolio posture | An optional portfolio posture recommendation: core, adjacent, and transformational work; it guides breadth but does not force a rigid percentage mix | Creates distinct viable strategies and replayable trade-offs. |
| Build / buy / partner | Scenario-specific sourcing choice affecting speed, recurring cost, control maturity, and data ownership | Introduces a material executive trade-off without requiring a role-playing interface. |
| Agentic autonomy and verification | Expand existing autonomy/oversight with tool boundaries, auditability, and safe fallback choices for agentic initiatives only | Keeps agentic AI materially different from ordinary automation. |

Existing mechanics already cover data readiness, lifecycle stages, evaluation,
augmentation versus automation, monitoring/drift, risk categories, human
oversight, data flywheels, scenario crises, and deterministic replay. We will
enhance them rather than duplicate them.

## Explicit exclusions

- Do not make RACI, named executive roles, or free-text owners mandatory. The
  game has no role-playing system; ownership may remain optional and record
  `No entry` when omitted.
- Do not add AI-wave history, neural-network taxonomy, or precision/recall
  formula drills across every initiative. Use an authored error-cost trade-off
  only where it is decision-relevant, such as safety, fraud, or maintenance.
- Do not add pricing architectures and marketplace mechanics to operational
  transformation scenarios. Reserve them for a future AI-native business-model
  scenario.

## Phased implementation

### Phase 1 — Make success legible (this slice)

- Add authored outcome roles to all four scenario packs.
- Calculate and persist a mission view: role progress, guardrail protection,
  mission readiness, and mastery readiness.
- Use the weighted mission progress in live campaign scoring.
- Gate A/A+ on mission readiness and show the learner exactly which role is
  blocking the next rating.

**Acceptance:** a scenario can have a successful mission without 100% progress
on every supporting signal; a deteriorating guardrail prevents an A result.

### Phase 2 — Prove feasibility

- Build action-aware deterministic strategies for each scenario using the same
  turn resolver, lifecycle decisions, capital planner, and verdict as play.
- Test a viable focused strategy, a viable balanced strategy, a recovery run,
  and a poor run for each scenario.
- Set explicit distribution targets: viable strategies should commonly reach
  A-/A; A+ remains exceptional; poor strategy must remain visibly worse.

**Acceptance:** each scenario has at least two distinct feasible routes to A;
no single route dominates; each primary outcome has a demonstrated path within
twelve quarters.

### Phase 3 — Tune authored economics and pacing

- Adjust only scenario-authored targets, base effects, lifecycle durations, and
  event impacts that fail Phase 2 evidence.
- Preserve early-stage evidence/value separation and safety requirements.
- If a primary target cannot be reached from a sound route, increase its
  in-game lever or reframe it as a longer-term supporting outcome.

### Phase 4 — Make replay compelling

- End each campaign with one replay hypothesis: keep the strongest observed
  choice and alter one timing, funding, lifecycle, or operating-mode decision.
- Compare mission, guardrail, and score movement against the saved baseline.
- Offer compact four-window framing for facilitated play while preserving the
  twelve-quarter deterministic record.

## Non-goals

- Do not turn scenario guardrails into optional cosmetic metrics.
- Do not award success for raw spend, repeated activity, or unvalidated claims.
- Do not remove discovery, pilot, evaluation, or monitoring simply to make
  financial ROI appear earlier.
