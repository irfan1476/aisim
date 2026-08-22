# Pre-production readiness review

Date: 2026-08-22
Branch reviewed: `feature/scenario-generic-pipeline`

This review was performed without modifying core production code. The only additions for this review are:

- `tests/production-readiness.test.cjs`
- `docs/pre-production-checklist.md`

## Scope confirmed

- Standard Mode remains available and is not replaced by scenario mode.
- The generic engine is shared by all four scenario packs:
  - Project Factory 2030
  - BankNext Transformation
  - Care360 Health Network
  - FutureReady University
- Numeric outcomes are calculated by the engine, not by advisor wording.
- Quarter history is recorded and is the source of truth for retrospective reporting.
- Same seed, setup, and decisions are expected to produce the same numeric outcome.
- Different seeds are allowed to produce controlled campaign variation.

## Test coverage added in this review

`tests/production-readiness.test.cjs` covers:

1. Recommendation application currently preserves a valid 100% allocation and clears queued guidance.
2. Advisor prompt provenance: scenario context, purse, remaining budget, selected initiatives, causal evidence, and recommendation evidence are available to the advisor prompt.
3. Advisor boundary: the prompt states that archetypes and seeds should not be revealed and numeric outcomes remain engine-owned.
4. Scenario parity: all four scenarios expose six initiatives, progress definitions, crises, allocations, and the same generic quarter-resolution contract.
5. Deterministic repeated runs for every scenario.
6. Seed variation while preserving the same scenario contract.

Run with:

```bash
npm test
npm run type-check
npm run lint
npm run build
npm run test:e2e
```

## Concrete production blocker

### Recommendation application is incomplete

Current flow:

1. The learner approves a recommendation in `components/GameResultsModal.tsx`.
2. `stores/gameStore.ts` stores the recommendation as `nextQuarterGuidance`.
3. `components/NextQuarterGuidance.tsx` offers **Apply suggestion**.
4. `stores/gameStore.ts` `applyRecommendation()` changes one allocation bucket, shifting points from `infra` (or the fallback source) to the mapped bucket.

What it does **not** currently do:

- select the initiative implied by the recommendation;
- adjust the deployment amount to cover that initiative;
- identify which initiative the recommendation refers to;
- show the learner exactly what selection and spend were applied;
- preserve an explicit “applied recommendation” event in the quarter ledger before confirmation.

This does not make the game numerically unsafe, but it contradicts the intended learner experience: clicking Apply suggestion should prepare the next quarter decision, including initiative selection and operating-system spend. It must be fixed in production code before release.

Recommended acceptance test for the future core-code change:

```text
Given a recommendation that identifies initiative X and allocation bucket Y,
when the learner clicks Apply suggestion,
then X is selected, Y is increased using a bounded rebalance,
deployment is raised only when required and available,
the total allocation remains 100%,
and the decision screen explains every applied change.
```

## Advisor readiness and provenance

The Board Advisor is intentionally hybrid:

- If an LLM provider is configured and available, the advisor receives current state and scenario context through `/api/llm/chat`.
- If the provider is unavailable, `components/Game.tsx` returns deterministic persona-specific fallback guidance.
- The advisor prompt includes current state, dynamic initiative values, funding history, scenario progress, causal chain, and recommendations.

This is useful and safe because the advisor does not own numeric resolution. Before production, consider two hardening improvements:

- sanitize the serialized advisor state so internal fields such as the seed and implementation metadata are never sent to a provider;
- record advisor provenance in the UI or question history (`AI provider/model` versus `local fallback`) so learners know whether they received generated or deterministic guidance.

These are important quality improvements, but the current hybrid behavior is not itself a deployment blocker if the provider boundary is documented and keys are configured safely.

## Scenario parity review

All four packs use the shared initiative, allocation, portfolio, crisis, persistence, analytics, and replay pathways. Scenario-specific behavior is supplied through scenario data and progress definitions rather than scenario-name branches in the quarter engine.

The parity tests verify the contract, not the realism of every provisional domain value. A separate content review is still advisable for:

- industry benchmark provenance;
- metric direction and target calibration;
- crisis severity and timing;
- initiative synergy balance;
- whether the final grade rewards learning and reflection rather than only score maximization.

## Determinism and replay review

The engine is deterministic for a fixed state, seed, and decision. Different seeds can change generated initiative inputs and therefore produce different campaigns with the same broad strategic logic.

The final report should continue reading completed-quarter snapshots rather than recalculating prior quarters from current initiative state. Any future LLM integration must remain explanatory-only and must never write metrics, spend, score, risk, or scenario progress.

## Final checklist

- [x] Standard Mode preserved
- [x] Four scenario packs use the generic engine
- [x] 0/1/2/3 initiative decisions represented
- [x] Campaign purse and carry-forward represented
- [x] Crisis costs use the campaign purse
- [x] Decision coaching and portfolio preview present
- [x] Final report and run comparison present
- [x] Deterministic engine tests present
- [x] Advisor context tests present
- [ ] Apply suggestion selects the relevant initiative
- [ ] Apply suggestion balances deployment spend when required
- [ ] Advisor provider/fallback provenance visible to learner
- [ ] Advisor payload sanitizes seed/internal metadata
- [ ] Final browser smoke test on production-like environment
- [ ] Vercel environment variables and GitHub deployment checks verified

## Recommendation

Do not deploy the current branch as the final production release until the recommendation-application blocker is resolved and a production-like browser smoke test confirms the next-quarter flow. The rest of the reviewed architecture is suitable for a controlled staging deployment, subject to the provisional content review and advisor hardening noted above.
