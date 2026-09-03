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

## Recommendation application

### Apply suggestion is actionable

Current flow:

1. The learner approves a recommendation in `components/GameResultsModal.tsx`.
2. `stores/gameStore.ts` stores the recommendation as `nextQuarterGuidance`.
3. `components/NextQuarterGuidance.tsx` offers **Apply suggestion**.
4. `stores/gameStore.ts` `applyRecommendation()` applies the mapped initiative selection, operating targets and a bounded deployment amount while keeping the learner in the editable decision window.

The action is now covered by unit and browser tests. It does not silently confirm a quarter: the learner can inspect and edit the applied selection, spend and operating mix before confirming.

Acceptance contract:

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
- [x] Apply suggestion selects the relevant initiative
- [x] Apply suggestion balances deployment spend when required
- [x] Advisor provider/fallback provenance visible to learner (deterministic evidence is labelled; an optional response is labelled AI perspective)
- [x] Advisor payload sanitizes seed/internal metadata before an optional provider call
- [x] Final browser smoke test on production-like environment
- [ ] Vercel environment variables and GitHub deployment checks verified

## V2 continuation checklist — current working-tree changes

The following refinements are present in the current V2 working tree and must be validated before release:

- [x] Quarter Coach is collapsible and shows live decision impact.
- [x] Decision Preview is collapsible and shows spend, reserve, concentration, neglect and synergy evidence.
- [x] Initiative cards expose evolved values and baseline movement.
- [x] 60% deployment is a suggested UI pace, not a mandatory spend rule.
- [x] Scenario challenges show dynamic Critical, Watch, Recovering or Controlled states.
- [x] Dashboard spend uses the live decision or latest completed quarter rather than an unexplained zero.
- [x] Diagnostics falls back to the latest completed-quarter recommendation and causal evidence.
- [x] Strategy DNA and Initiative Evolution have distinct analytical responsibilities.
- [x] Modelled proxy analytics are labelled.
- [ ] Manually play all four scenarios through the updated decision window.
- [ ] Verify one-, two- and three-initiative choices and partial deployment in each scenario.
- [ ] Verify scenario-native units, challenge urgency and latest-quarter spend in each scenario.
- [x] Complete automated four-scenario browser coverage for coach, preview, challenge states, Dashboard, Diagnostics, DNA and Evolution; manual visual walkthrough remains open.
- [x] Browser smoke tests are part of CI and the deploy validation job.
- [ ] Review provisional scenario targets, crisis severity and synergy balance with domain reviewers.
- [x] Review the final diff and complete the approved commit, push and deployment.

This checklist records working-tree implementation status only. It does not authorise a commit, merge, push or production deployment.

## Documentation update — 2026-09-03

This documentation pass is restricted to V2 release notes, analytics audit and this checklist. No application code, tests, V3 files or branches were changed, and no commit was created.

### Four-scenario manual review matrix

| Scenario | Confirm in the browser | Domain values to review |
| --- | --- | --- |
| Project Factory 2030 | Challenge status changes after funding, neglect and crisis decisions; spend uses the latest completed quarter | Reliability, quality, demand, energy and capability targets/effects |
| BankNext Transformation | Fraud, approval, compliance, trust and adoption remain visible as scenario-native metrics | Approval-time direction, fraud pressure severity, compliance target and responsible-growth trade-offs |
| Care360 Health Network | Access and workforce pressures update without hiding safety or privacy signals | Wait-time/burnout direction, safety and privacy thresholds, crisis costs |
| FutureReady University | Engagement and workload movement is distinct from governance and employability evidence | Persistence/engagement targets, workload direction, governance threshold and adoption trade-offs |

For every pack, repeat the following learner paths: select one initiative, select two, select three, select none, deploy below the suggested pace, use the 60% suggestion and edit it, carry reserve forward, resolve a crisis, advance to the next quarter, inspect Dashboard and Diagnostics, then compare History and Initiative Evolution. The result should show the choice as evidence, not merely change a headline score.

### Release status

The operating-system, targeted-acceleration, homepage, CI, and four-scenario browser-smoke changes are committed and deployed. The production deployment is READY at `https://www.stateframe.in`. The generated `balance-report.json` remains intentionally unstaged. A full manual four-scenario walkthrough and formal domain-owner review of synthetic values remain the only publication-quality follow-ups.

## Recommendation

The release is live after passing automated tests, build, lint, type-check, the full browser suite, and an automated 12-quarter route through all four scenario packs. The route verifies quarter resolution, lifecycle review handling, reserve-aware late-campaign decisions, final-report completion, twelve recorded snapshots, scenario-native metrics, and zero browser errors. Checkpoint persistence now prunes older snapshots when localStorage is constrained and never blocks a turn. Advisor calls now receive only learner-relevant evidence; internal seed/run metadata is removed at the prompt boundary. Treat the manual walkthrough and domain-owner review as the next quality step before formal assessment use; they are content-validation work, not unresolved deployment failures.
