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
