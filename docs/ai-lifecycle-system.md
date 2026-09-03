# AI Lifecycle System

## Purpose

The AI lifecycle system makes each initiative behave like an operating AI capability rather than a static investment card. It adds evidence gates, accountable deployment choices, monitoring, drift, adaptation, and replayable governance without replacing AISim's established quarter-by-quarter portfolio model.

The system is implemented as an overlay on the existing operating lifecycle. It does not introduce a second game engine or a `v3` rules directory.

## Design principles

1. Preserve the operating model. Existing initiative actions, capital planning, capacity validation, scenario effects, financial ledger, and counterfactual replay remain the authoritative systems.
2. Separate persistent capability from this-quarter investment. Initiative data readiness is a persistent asset; allocation to data, people, MLOps, and compliance is a current-quarter operating choice.
3. Allow learning before certainty. Weak readiness can create a constrained experiment. It does not silently become a successful deployment.
4. Keep the learner accountable without creating artificial roles. Deployment mode and adaptation choices are explicit, but all rationale, owner, and reason fields are optional; blanks are stored explicitly as `No Entry`.
5. Keep rules deterministic. Evidence, drift, risk, lifecycle transitions, capital charges, and replay depend only on recorded state and decisions. No lifecycle rule uses randomness.
6. Make scenario context authoritative. A healthcare radiology assistant and a manufacturing workflow optimiser do not receive the same automation, oversight, or drift treatment.

## Lifecycle mapping

The learner sees the following lifecycle:

```text
Data readiness → Experiment → Pilot → Evaluate → Deploy → Monitor → Adapt
```

It maps to the existing operating lifecycle as follows:

| Learner-facing lifecycle | Existing operating lifecycle/action | Meaning |
|---|---|---|
| Data readiness | `discovery` / `discover` | Build a usable data asset and establish the preconditions for experimentation. |
| Experiment | `discovery` / `discover` | Explore the hypothesis without claiming operating value. |
| Pilot | `pilot` | Run a limited capability with small realised benefit and collect evidence. |
| Evaluate | Post-pilot review | The learner records Go, No-Go, or Pause. |
| Deploy | `scale` | Commit the deployment mode and expand the capability. |
| Monitor | `run` / `maintain` | Track performance, drift, risk, and oversight. |
| Adapt | Review action in monitoring | Retrain, tune, roll back, or deprecate. |

`paused` and `retired` remain operating-lifecycle states. They map to a paused or completed Adapt state rather than being removed.

## Data readiness

Each initiative continues to use `currentData` on the existing 1–5 scale. The lifecycle UI displays the equivalent percentage as `dataReadiness`.

```text
data readiness (%) = currentData / 5 × 100
```

Scenario packs may author a more precise starting readiness value. That value is used by the gate before the capability begins evolving, then the percentage tracks the initiative's persistent data asset as discovery, pilot, and scale investment increases `currentData`.

Scenario profiles can also set `experimentQuarters` and `pilotQuarters`. The action guide and deterministic resolver both enforce those durations: a learner continues discovery through the authored experiment period, then runs the limited pilot until its evaluation becomes due.

The readiness gate is deliberately asymmetric:

- Low readiness can produce a constrained experiment with slower delivery and additional risk.
- Data readiness and control maturity remain visible in the normal readiness gate.
- A pilot must produce a completed evaluation before a new capability can scale.

This preserves the simulation's existing principle that a learner may test an imperfect hypothesis, while preventing that test from being mistaken for a production-ready deployment.

## Evaluation

Scenario profiles author one or more success criteria. A criterion contains a stable ID, label, metric, target, direction, and optionally a purpose: `outcome`, `evidence`, or `safety`. A safety criterion can be marked `required`.

```ts
{
  id: 'downtime-signal',
  label: 'Reduce unplanned downtime pressure',
  metric: 'downtimePressure',
  threshold: -2,
  direction: 'lower-is-better'
}
```

Evidence is produced deterministically at the end of a pilot:

- Scenario metrics use their measured quarter-over-quarter movement for small movement targets, or their current value for absolute targets.
- Operational criteria without a visible scenario metric use deterministic virtual measures: `operationalEvidence` combines data readiness, control maturity, change readiness, and monitored performance; `safetyEvidence` weights controls most heavily.
- Lower-is-better criteria retain negative movement targets. For example, a movement from 65 to 62 has an actual result of `-3`, which meets a target of `-2`.

The system derives an evidence signal from the proportion of criteria met and the scenario's `goThreshold` / `conditionalThreshold`:

| Evidence result | Signal |
|---|---|
| All intended criteria meet the authored Go threshold | Go · high confidence |
| Enough evidence for the authored conditional threshold, with every required safety/control criterion met | Go with conditions · medium confidence |
| Weak evidence or a failed required safety/control criterion | No-Go · high confidence |

Default profiles use a modest directional outcome test plus a readiness/evidence test. They do not demand full ROI from a pilot. For high-risk defaults, the safety/control test is mandatory. Detailed scenario profiles preserve their domain-specific criteria: for example, clinician review coverage and cohort equity remain mandatory in Care360.

The signal is advisory. The learner records the actual `go`, `no_go`, or `pause` decision. A rationale and decision contact are invited on the first pass but never block progress; blank fields are stored as `No Entry` in the quarter ledger and executable counterfactual trace.

## Strategy evaluation and early-stage value

Discovery and experiment intentionally create no realised ROI. A pilot creates limited realised benefit. Treating the absence of early ROI as failure would reward premature deployment, so the campaign score records two distinct truths:

- **Realised value** remains the financial component. It only credits observed net benefit in the financial ledger.
- **Validated learning** credits deliberate initiatives for data readiness, control maturity, change readiness, completed evaluation evidence, and meaningful lifecycle progression.

Validated learning is capped at 10% of the score in scenario mode (and proportionally in Standard mode). It cannot compensate for poor operating health or a lack of realised value over a full campaign, but it makes a disciplined early portfolio visible and achievable. The quarter-results view exposes the current validated-learning signal, while the final strategy autopsy shows each score contribution in points.

The current score weights are:

| Dimension | Scenario mode | Standard mode behaviour |
|---|---:|---|
| Scenario target progress | 35% | Excluded; remaining weights are renormalised |
| Realised value | 20% | Included |
| Operating health | 20% | Included |
| Execution discipline | 10% | Included |
| Responsible AI | 5% | Included |
| Validated learning | 10% | Included |

Only initiatives with a recorded operating action can earn validated-learning credit; passive starting readiness is never a free score.

## Deployment mode

Before a newly approved capability can proceed, the learner records one of two modes:

- **Augmentation** — AI assists people within an accountable workflow.
- **Automation** — AI executes defined, reversible workflow steps within stated boundaries.

The effects are scenario-authored per initiative rather than globally fixed:

```ts
deployment: {
  modes: {
    augmentation: { efficiencyDelta, riskDelta, trustDelta, oversightUnits },
    automation: { efficiencyDelta, riskDelta, trustDelta, oversightUnits }
  }
}
```

Those effects alter deployed capability efficiency, adoption and satisfaction through trust, risk drivers, and required oversight. They are recorded as the initiative's selected deployment impact so the effect persists and remains inspectable.

## Risk, monitoring, and oversight

The established `riskScore` and `currentRisk` remain in place because campaign scoring, crises, analytics, and existing UI already use them. The lifecycle system adds explainable drivers beneath that aggregate:

- `modelRisk`: data gap, technical debt, performance degradation, and drift.
- `operationalRisk`: change readiness, autonomy, and deployment exposure.
- `legalRisk`: control maturity, autonomous exposure, and deployment exposure.

The aggregate is derived from these drivers; it is not fed back into itself.

```text
aggregate risk = 45% model + 30% operational + 25% legal
```

Monitoring applies only after a capability is deployed or running. Scenario profiles set susceptibility, quarterly drift rate, degradation threshold, and monitoring expectations. MLOps allocation relieves drift pressure, while technical debt increases it.

When performance falls below the authored degradation threshold, the capability becomes degraded and the learner must record an adaptation decision before progressing.

Human oversight is a fifth capacity pool alongside delivery teams, change capacity, data engineering capacity, and governance review capacity. Available oversight derives from people and compliance allocation. Demand derives from autonomy, deployment mode, and risk drivers.

When a capacity pool blocks confirmation, the decision screen explains the exact demand-versus-availability gap and names the affected selected initiatives. For human oversight it also suggests the smallest useful levers: add People or Compliance allocation, select fewer deployed/maintained initiatives, or pause one for the quarter. The message distinguishes a hard operating limit from a lifecycle or budget issue, so the learner knows whether to edit the operating mix, the portfolio action, or the release amount.

## Adaptation and capital

The learner can choose:

- `retrain`
- `tune`
- `rollback`
- `deprecate`

Adaptation is not a free reset. It uses the initiative's authored or derived retraining cost:

| Action | Capital charge |
|---|---|
| Retrain | 100% of retraining cost |
| Tune | 40% |
| Roll back | 20% |
| Deprecate | 10% |

The charge reduces campaign reserve, increases recorded investment, updates the financial ledger, and is written back to the current quarter's history snapshot. An unaffordable adaptation is rejected without changing the initiative.

## Data flywheel

Data flywheels reuse the existing scenario-authored relationship model rather than providing a universal, automatic bonus. A source initiative must:

1. Be in `scale` or `run`.
2. Be marked as an active flywheel source.
3. Have authored data quality of at least 70.
4. List explicit recipient initiative IDs.

Eligible recipients receive a small capped increase in persistent data readiness. This prevents unrelated initiatives from receiving unjustified benefits.

## Scenario authoring

`ScenarioInitiative.lifecycleProfile` is optional. If omitted, `resolveLifecycleProfile` supplies safe generic defaults so all four scenarios remain playable.

The Project Factory and Care360 packs include detailed profiles for high-stakes initiatives, including:

- Predictive Maintenance
- AI Knowledge Assistant
- AI Radiology Assistant
- Predictive Patient Risk Scoring

These profiles author stricter controls, augmentation-first defaults, concrete success criteria, drift rates, oversight demand, autonomy boundaries, and relevant flywheel relationships.

## State, migration, and compatibility

`InitiativeState` stores the lifecycle overlay, evaluation record, deployment impact, risk drivers, monitoring state, oversight, autonomy, flywheel settings, retraining details, and adaptation history.

Saved campaigns are migration-safe:

- Legacy `scale` initiatives migrate as deployed.
- Legacy `run` initiatives migrate as monitored.
- Legacy `pilot` initiatives remain pilots.
- Paused and retired initiatives preserve their operating status.

This avoids trapping a learner with an active legacy campaign behind a new evaluation or deployment-mode form.

The game persistence version is now `9`; newly created campaigns use rules version `3.0`.

## Deterministic replay

Counterfactual traces are now version `3`, while versions `1` and `2` remain readable.

Recorded decisions now preserve:

- `initiativeActions`
- evaluation decisions
- deployment-mode decisions
- adaptation decisions
- the shared or tailored initiative operating-mix decision

Lifecycle reviews occur after the quarter's board decision. `recordLifecycleDecisions` therefore updates the existing recorded quarter rather than creating a second decision action. A replay preserves every original lifecycle decision unless an explicit counterfactual edit replaces it.

## UI behaviour

`AiLifecycleReview` appears in the quarter results workflow. It presents a compact lifecycle progress strip plus data readiness, performance, drift, risk-driver, and oversight evidence.

Required evaluation, deployment-mode, or degradation reviews lock the Continue button. The Zustand store also applies the same guard, so programmatic advancement cannot bypass the UI.

When a decision-screen action conflicts with the lifecycle, a decision-path panel directly beneath the initiative cards identifies the affected initiative, its current stage, the chosen action, the blocking condition, and the valid next action where one is available. Capital readiness is shown separately so the learner can distinguish a governance or evidence decision from a funding constraint.

### Initiative funding and operating mix

The decision screen also presents a funding and operating plan directly below the initiative cards. It answers two distinct questions before the quarter is resolved:

1. **Where does the released capital go?** Each selected initiative shows its action commitment, its attributed quarter spend, and any scale-up capital. Extra delivery capital is distributed proportionally to the committed delivery cost of eligible lifecycle work by default. The learner can switch to **Focus by initiative** and assign the extra pool explicitly; the card shows the resulting amount and estimated delivery intensity before confirmation.
2. **What will the operating mix change this quarter?** The plan displays the amount of each initiative's attributed spend directed to infrastructure, data, people, operations and maintenance, compliance, and innovation. It names the direct initiative effects: data asset/readiness, change readiness, control maturity, technical debt, monitoring, and oversight.

The default is a **shared mix**: one operating allocation applies consistently to every selected initiative. The learner may switch to **tailor by initiative**. In tailored mode, each initiative owns an independent six-lever mix; moving one lever does not redistribute the others. The current total is shown per initiative, and the quarter cannot be confirmed until every funded initiative totals exactly 100%. Once balanced, each mix is applied to that initiative's state evolution and scenario effect. The spend-weighted aggregate of the charged mixes becomes the portfolio capacity mix, so local choices still truthfully constrain delivery teams, data engineering, governance review, and human oversight.

The shared mix remains a convenient default and a reset path. In tailored mode the right-hand operating-system panel becomes a read-only, derived capacity envelope so the learner cannot mistake an organisation-level capacity result for an unrecorded global setting.

Acceleration routing is a separate decision from the operating mix. The operating
mix determines what capability is built; the acceleration split determines which
eligible initiative receives additional pace. A focused split must total exactly
100%, while pause and retire actions cannot receive acceleration because they do
not advance delivery. Both choices are retained in the quarter snapshot and
counterfactual replay.

Selection and lifecycle action are separate controls. Selecting or deselecting a tile changes the quarter's portfolio scope without rewriting the initiative's existing action; the learner can then change the action explicitly when it is part of the selected plan.

The result is a visible executive decision flow:

```text
Pilot evidence
  → Go / No-Go / Pause decision
  → deployment mode and rationale
  → monitored performance and drift
  → funded adaptation when performance degrades
  → evidence retained for final report and counterfactual replay
```

## Verification coverage

The lifecycle regression suite verifies:

- Every scenario initiative receives a complete lifecycle profile.
- High-stakes profiles use safer controls and concrete criteria.
- Trace v3 preserves actions, lifecycle decisions, and tailored operating mixes.
- Trace v1 and v2 remain replayable.
- Lifecycle reviews update the existing recorded quarter.
- An end-to-end discovery → pilot → evaluation → deployment → adaptation flow works and charges capital.
- Lower-is-better evidence criteria evaluate correctly and produce an advisory signal.
- Tailored data, people, compliance, and MLOps mixes change the individual initiative state and replay exactly.
