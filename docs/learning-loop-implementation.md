# Learning Loop Implementation

This document records the agreed learning-first gameplay contract. It applies to Standard Mode and every registered scenario.

## Quarter loop

1. **Observe** — the learner sees current native metrics, scenario metrics, budget remaining, initiative maturity, and the latest completed-quarter evidence.
2. **Explain** — the Decision Coach identifies the current bottleneck, last-quarter lesson, and the trade-off implied by choosing zero, one, two, or three initiatives.
3. **Decide** — the learner chooses initiatives, sets capability allocation, and chooses how much of the campaign purse to deploy.
4. **Reflect** — the results modal and Analytics sidecar distinguish measured movement from scenario-defined or modelled guidance.

## Flexible campaign purse

- The campaign budget is finite across twelve quarters.
- The quarterly amount is a suggested pace, not a spending target.
- Deployment can be zero, partial, or up to two suggested paces in one quarter.
- Unused budget carries forward.
- The selected portfolio must fit inside the deployed amount.
- Crisis costs draw from the same campaign purse.
- The engine records `deployedAmount`, `fixedInitiativeSpend`, and the budget provenance in the quarter snapshot.

This creates a timing decision: preserve optionality, invest early to build maturity, or deploy aggressively when a crisis or opportunity requires it.

### Targeted acceleration

Capital above the selected actions' required floor is not an unlabelled pool of
benefit. It is recorded as discretionary acceleration capital and can change
how quickly eligible delivery work matures.

- **Proportional (default):** the engine distributes acceleration across the
  selected eligible initiatives using their delivery commitments. This keeps
  the first decision simple and preserves the historical behaviour for older
  saves and replays.
- **Focus by initiative:** the learner can switch on the funding panel and set
  the percentage split for each eligible initiative. The live card shows both
  the resulting amount and estimated delivery intensity, so the learner can
  see which project receives the extra release before confirming.
- The focused percentages must total exactly 100%. This is the only validation
  rule for the split; it prevents capital from disappearing or being invented.
- Pause and retire actions are not acceleration recipients. They can still be
  selected and resolved, but extra capital is only attributed to work that can
  actually advance delivery or capability.
- Acceleration is separate from the operating-system mix. The mix controls the
  type of capability being built (data, people, governance, and so on); the
  acceleration split controls which selected initiative receives the extra
  pace. Both choices are shown in the decision preview and persisted in the
  quarter snapshot, What-if draft, and counterfactual replay.

This makes an extra release a deliberate strategic choice: a learner may keep
the default portfolio pace, concentrate funding on a bottleneck, or distribute
it broadly while seeing the trade-off before committing the quarter.

## Portfolio learning

| Choice | Engine interpretation | Learning question |
| --- | --- | --- |
| 0 initiatives | Preserve capital; pressures remain exposed | What am I deliberately waiting for? |
| 1 initiative | Deep focus with higher concentration exposure | Is depth worth dependence on one bet? |
| 2 initiatives | Focused balance with selective coverage | Does this pair address the binding trade-off? |
| 3 initiatives | Portfolio breadth with coordination pressure | Can the organisation execute at this breadth? |

The selection count, posture, breadth, concentration risk, and causal effects are persisted in the quarter snapshot.

## Replay and consistency

Each run stores a serializable `runMetadata` record containing:

- run identifier;
- initiative-generation seed;
- scenario identifier, when applicable;
- rules version.

The engine is deterministic for the same seed, setup, and decisions. Different seeds may produce different initiative values and event paths. Advisor language is explanatory only; it cannot change numeric outcomes. Historical reports read frozen quarter snapshots rather than recalculating old quarters from current state.

Completed campaigns can be named and saved locally in the replay notebook. The final report proposes one deliberate next experiment so the learner changes one variable at a time.

## Verification

- Unit tests cover zero/partial/full deployment, purse carry-forward, crisis spending, reproducibility, seed variation, and advisor isolation.
- Browser tests cover Standard Mode, scenario mode, Q1 value stability, reload persistence, scenario initiative limits, and final evidence.
- The test runner reuses an existing local server when available, avoiding the previous port collision during end-to-end validation.

## Operating-system learning loop

The six operating controls are now first-class, stage-aware levers rather than
decorative percentages. Every scenario initiative receives a deterministic
profile (with safe defaults for future packs) describing the support it needs
at discovery, pilot, deployment, monitoring, and adaptation.

| Lever | Capability built | Visible trade-off |
| --- | --- | --- |
| Infrastructure | Integration readiness and rollout throughput | Faster delivery versus less room for evidence or change |
| Data | Readiness, evidence quality, and experiment confidence | Better evidence versus slower operating scale when underfunded |
| People | Change readiness, adoption, and learning capacity | Adoption and oversight versus technical throughput |
| MLOps | Reliability, monitoring, and technical-debt reduction | Safer operation versus less exploratory capacity |
| Compliance | Controls, assurance, and risk relief | Lower exposure versus less capacity for immediate delivery |
| Innovation | Hypothesis breadth and learning velocity | More options and evidence versus concentration on the current bet |

Profiles are recommendations, not hidden gates. A weak fit reduces the
relevant effect and identifies a bottleneck; it does not silently reject a
learner's plan. Capacity limits remain explicit and actionable. The learner
can use a preset, edit every point, or keep the shared mix, provided each
custom initiative totals 100%.

### Preview, resolution, and replay contract

The strategy preview submits the same decision shape to the pure turn resolver
as live confirmation, including custom initiative mixes, lifecycle actions,
funding, and deployment mode. This keeps the preview honest and makes a saved
What-if branch replayable. A resolved quarter stores `operatingEvidence` for
each active initiative with the local mix, effective portfolio mix, stage
bottleneck, per-lever signal, observed outcome effect, and explicit trade-offs.
Discovery records evidence and investment quarters but never fabricates
realised ROI.

### Learner-facing guidance

The decision surface shows the current lifecycle stage and leading operating
bottleneck beside the controls. Presets are explicit actions (recommended mix,
prioritise evidence, or protect adoption and controls); they never rebalance
silently. Results and retrospective views read the recorded operating choice
and observed movement, so learners can compare a strategy's operating logic
with its consequences rather than relying on a generic post-hoc explanation.

### Compatibility

Operating profiles and evidence are optional during hydration. Legacy saves,
scenario packs that omit profiles, Standard Mode, counterfactual traces, and
future scenario domains continue to resolve through deterministic defaults.
