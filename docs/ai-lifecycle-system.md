# AI Lifecycle System

## Purpose

The AI lifecycle system makes each initiative behave like an operating AI capability rather than a static investment card. It adds evidence gates, accountable deployment choices, monitoring, drift, adaptation, and replayable governance without replacing AISim's established quarter-by-quarter portfolio model.

The system is implemented as an overlay on the existing operating lifecycle. It does not introduce a second game engine or a `v3` rules directory.

## Design principles

1. Preserve the operating model. Existing initiative actions, capital planning, capacity validation, scenario effects, financial ledger, and counterfactual replay remain the authoritative systems.
2. Separate persistent capability from this-quarter investment. Initiative data readiness is a persistent asset; allocation to data, people, MLOps, and compliance is a current-quarter operating choice.
3. Allow learning before certainty. Weak readiness can create a constrained experiment. It does not silently become a successful deployment.
4. Keep the learner accountable without creating artificial roles. Deployment mode and adaptation decisions require a rationale; evaluation notes and decision contact are optional, with blanks stored explicitly as `No Entry`.
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

Scenario profiles author one or more success criteria. A criterion contains a stable ID, label, metric, target, and direction.

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
- Operational criteria without a visible scenario metric use a deterministic composite of data readiness, control maturity, change readiness, and monitored performance.
- Lower-is-better criteria retain negative movement targets. For example, a movement from 65 to 62 has an actual result of `-3`, which meets a target of `-2`.

The system derives an evidence signal from the proportion of criteria met and the scenario's `goThreshold`:

| Evidence result | Signal |
|---|---|
| Meets or exceeds the authored threshold | Go · high confidence |
| Mixed evidence | Go with conditions · medium confidence |
| Weak evidence | No-Go · high confidence |

The signal is advisory. The learner records the actual `go`, `no_go`, or `pause` decision. A rationale and decision contact are invited on the first pass but never block progress; blank fields are stored as `No Entry` in the quarter ledger and executable counterfactual trace.

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

1. **Where does the released capital go?** Each selected initiative shows its action commitment, its attributed quarter spend, and any scale-up capital. Extra delivery capital is distributed proportionally to the committed delivery cost of the selected pilot/scale initiatives; this keeps a shared campaign release reconciled to the financial ledger.
2. **What will the operating mix change this quarter?** The plan displays the amount of each initiative's attributed spend directed to infrastructure, data, people, operations and maintenance, compliance, and innovation. It names the direct initiative effects: data asset/readiness, change readiness, control maturity, technical debt, monitoring, and oversight.

The default is a **shared mix**: one operating allocation applies consistently to every selected initiative. The learner may switch to **tailor by initiative**. Each tailored initiative mix remains at 100%; it is applied to that initiative's state evolution and scenario effect. The spend-weighted aggregate of all charged initiative mixes becomes the portfolio capacity mix, so local choices still truthfully constrain delivery teams, data engineering, governance review, and human oversight.

The shared mix remains a convenient default and a reset path. In tailored mode the right-hand operating-system panel becomes a read-only, derived capacity envelope so the learner cannot mistake an organisation-level capacity result for an unrecorded global setting.

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
