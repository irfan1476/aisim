# Initiative-count learning loop

Status: contract for the 1/2/3 initiative learning loop

## Purpose

The learner should be able to fund one, two, or three initiatives in a quarter. The count is a strategic choice, not a hidden UI constraint:

- **1 — deep focus:** concentrate capital and operating attention on one bet.
- **2 — focused balance:** connect two bets while retaining more depth than a broad portfolio.
- **3 — portfolio breadth:** cover more pressures, accepting higher coordination and funding demands.

The game must not assume that three initiatives is always optimal. The best choice should depend on the active scenario, available capital, current maturity, neglected capabilities, and the learner's prior decisions.

## Required serializable quarter evidence

Every completed-quarter snapshot must record these fields in addition to the existing `selectedIds` and `chosen` fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `selectedCount` | `number` | Number of initiatives funded in the quarter: `0`, `1`, `2`, or `3`. |
| `portfolioPosture` | `'deep-focus' \| 'focused-balance' \| 'portfolio-breadth' \| 'pause'` | Human-readable strategic posture derived from count. |
| `breadth` | `number` | Normalized coverage: `selectedCount / availableInitiatives`, clamped to `0..1`; the maximum selectable count remains three. |
| `concentrationRisk` | `number` | A bounded `0..100` signal for dependency created by repeatedly concentrating investment. |
| `portfolioProvenance` | `'calculated-from-portfolio-choice'` | States that the posture fields are calculated from the recorded portfolio choice, not observed business telemetry. |

These fields are derived evidence, not UI-only state. They must be persisted in `history`, survive JSON save/load, and default safely when loading older saves:

- infer `selectedCount` from `selectedIds.length`, or the legacy `chosen.length` when IDs are unavailable;
- infer `portfolioPosture` from the count;
- infer `breadth` from the count;
- default missing historical `concentrationRisk` to a clearly documented neutral value rather than silently inventing a historical trend.

The snapshot should also carry `portfolioProvenance: 'calculated-from-portfolio-choice'`. This is distinct from scenario metric provenance: it tells the learner that posture is a calculated interpretation of their selection count.

The core engine must remain scenario-agnostic. It may use generic portfolio mechanics and scenario data, but it must not branch on `bankNext`, `Care360`, or other scenario names.

## Mechanical model

The initiative count should affect the game through separate, explainable dimensions:

1. **Depth.** When one initiative is selected, available operating attention can compound that initiative's maturity and capability. This must be bounded and must not make one initiative a dominant strategy in every scenario.
2. **Breadth.** Selecting more initiatives exposes more scenario metrics to positive movement. Breadth is not a direct ROI multiplier.
3. **Concentration.** Repeatedly funding one initiative increases dependency exposure and leaves other capabilities vulnerable. Concentration should be visible as risk, not hidden as a score adjustment.
4. **Coordination.** Selecting three initiatives increases coordination and adoption demands. Low people, MLOps, or governance allocation should make breadth harder to execute.
5. **Neglect.** Unfunded initiatives continue to accumulate quarters since last funding and can decay after the existing threshold. A pause is therefore a deliberate choice with consequences, not a free optimisation.
6. **Synergy.** Two or three initiatives may activate scenario-declared synergies. Synergy effects must remain mechanically visible in causal evidence and must not be confused with generic breadth.
7. **Capital pacing.** Spend is deducted from the finite campaign purse. A smaller portfolio may preserve capital; a larger portfolio may improve coverage but spend faster. Budget efficiency must remain distinct from outcome quality.

At a conceptual level:

```text
initiative effect
  = base effect × funding intensity × maturity × readiness × adoption
  + synergy effect
  - neglect / coordination penalties

portfolio evidence
  = breadth + concentration + coordination + capital pacing
```

The terms should be bounded and scenario definitions should supply domain-specific metric effects, gates, and synergies. Avoid arbitrary global multipliers that make the count mechanically superior without an educational rationale.

## Analytics truth contract

The sidecar should answer five questions for every quarter:

1. What did I choose?
2. What did I spend?
3. What changed?
4. What caused the change?
5. What should I reconsider?

### Dashboard

Show current scenario metrics, campaign purse, actual spend, remaining capital, selected count, posture, and the binding pressure. The spend label must say whether it is current-quarter, last-completed-quarter, or cumulative campaign spend.

### Trends

Show metric movement over time alongside a selection-count strip and spend-per-quarter series. The learner should be able to see whether one-, two-, or three-initiative quarters were associated with different movement. Forecast values must be labelled as modelled.

### Diagnostics

Explain the latest completed decision with a causal chain containing selected initiatives, allocation/readiness, maturity, synergy, neglect, crisis, and recommendation evidence where available. If the current quarter has no completed result, fall back explicitly to the latest completed quarter.

### Strategy DNA

Use the full history to describe recurring behaviour: average initiatives per quarter, concentration, breadth, governance timing, people investment, risk posture, and budget pacing. DNA is an interpretation of recorded decisions, not a directly measured business metric.

### Initiative Evolution

Keep this separate from DNA. Show per-initiative maturity, data readiness, human capability, risk, funding quarters, neglected quarters, and cumulative investment over time.

### History and roadmap

Each quarter must retain selected IDs, selected count, posture, allocation, quarter spend, cumulative spend, scenario metrics, progress, causal evidence, crisis responses, and recommendation approvals. Roadmap cards should show the quarter's spend rather than lifetime spend.

### Learn

Turn the evidence into a reflection prompt, for example:

> You used deep focus in four of the last five quarters. The primary initiative matured quickly, while two scenario pressures remained below target. Would you repeat that trade-off with the same remaining capital?

## Provenance labels

Every analytical statement or displayed value must use one of these labels:

| Label | Use when |
| --- | --- |
| `measured` | Directly recorded from game state or a completed quarter snapshot, such as scenario metric value, selected count, or actual spend. |
| `calculated` | Deterministically derived from recorded values, such as breadth, cumulative spend, progress percentage, or concentration risk. |
| `scenario-defined` | Supplied by the active scenario pack, such as an authored initiative effect, gate, crisis impact, or synergy. |
| `modelled-proxy` | Heuristic interpretation or estimate, such as a forecast, framework score, or non-telemetry KPI. |
| `counterfactual` | An alternative-path estimate from What-If analysis; never present it as observed history. |
| `unavailable` | No evidence exists yet; do not display a fabricated zero. |

Use the label near the value or conclusion, with a tooltip explaining the source. “0%” must not be used to mean both “measured zero” and “not yet available.”

## Acceptance criteria

- A learner can complete a quarter with 1, 2, or 3 initiatives.
- The decision preview states the posture, expected spend, budget remaining, affected pressures, neglected pressures, and potential synergies.
- The resolved snapshot records `selectedCount`, `portfolioPosture`, `breadth`, and `concentrationRisk`.
- The same fields are visible or inspectable in History, Trends, Diagnostics, DNA, and Learn.
- Analytics values agree with the active scenario's native metric definitions and units.
- Forecasts, framework views, and other heuristics are labelled `modelled-proxy`.
- Actual spend and scenario metrics are labelled `measured`; deterministic summaries are labelled `calculated`.
- Legacy saves load without crashing and infer missing count evidence from existing selected IDs where possible.
- Standard mode remains behaviourally compatible and does not receive scenario-specific effects.
- All four registered scenarios complete a 12-quarter run with the same generic evidence contract.

## Testing dependencies for the production track

The test track adds contract coverage in:

- `tests/game-engine.test.cjs` — 1/2/3 selection mechanics and quarter snapshot evidence.
- `tests/analytics-view-model.test.cjs` — metric provenance expectations.

Those tests require the production track to add the explicit snapshot fields and analytics provenance field without changing the existing `selectedIds` compatibility path. No production files are changed by this track.
