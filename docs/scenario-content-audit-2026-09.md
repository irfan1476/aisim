# Four-scenario content audit

Date: 2026-09-03

## Outcome

The four packs are structurally compatible with the current generic engine and
remain feasible. No scenario data change is justified without domain review.
The main content debt is source-level completeness: Project Factory still
contains several legacy initiatives without an authored lifecycle profile or
operating override. The adapter intentionally resolves those omissions to
deterministic defaults, so this is an authoring-quality issue rather than a
runtime blocker.

## Checks performed

- Each pack has six initiatives, five progress metrics, three crises, and a
  declared synergy set.
- Every progress metric has a direction, unit, start, target, and role.
- Initiative `baseEffect` directions agree with the affected metric direction.
- Crisis options have bounded costs and named trade-offs.
- High-risk initiatives have stricter lifecycle profiles and human-oversight
  defaults after hydration.
- Operating profiles resolve for every current initiative, including omitted
  authoring, through `resolveOperatingProfile`.
- Synergy effects remain small enough to reward pairings without being required
  for a viable campaign.

## Pack findings

### Project Factory 2030

The target set is coherent: downtime and defects are lower-is-better, energy
is lower-is-better, workforce and supply continuity are higher-is-better. The
two authored lifecycle profiles (maintenance and knowledge assistant) correctly
represent longer evidence and higher oversight needs. The four remaining
initiatives use safe defaults based on their data, human, and risk inputs.

The crisis costs (0.3–1.2 against a 5-unit quarterly budget) represent a
meaningful but survivable trade-off. The four synergies are sensible operating
loops: planning, knowledge/maintenance, asset/quality, and efficient uptime.

Follow-up: author explicit evidence, control-boundary, and operating overrides
for visual quality and supply continuity after manufacturing review. Do not
raise their targets or crisis costs before that review.

### BankNext Transformation

Fraud pressure and approval time are correctly lower-is-better. Compliance and
trust are guardrails, while digital adoption is supporting progress. High-risk
credit and personalisation initiatives have stricter authored readiness,
evaluation, and safety requirements. The three crises create a useful speed
versus control tension, and the largest paid response is below one unit against
the five-unit quarterly budget.

The control-tower, responsible-growth, and assisted-service synergies are
domain-plausible and bounded.

Follow-up: have a banking reviewer confirm that the 120-to-24-hour approval
target is an advanced stretch target rather than a baseline promise. Keep it as
an advanced scenario target unless review says otherwise.

### Care360 Health Network

Wait time and burnout are correctly lower-is-better. Safety and privacy are
guardrails, and access is supporting. Radiology and risk scoring are correctly
high-risk, augmentation-first, and require human review/equity evidence. Crisis
choices make safety, access, and operating capacity trade-offs visible without
allowing autonomous clinical decisions.

The three synergies reward safe access, clinician capacity, and proactive care;
none bypasses safety or privacy gates.

Follow-up: require clinical and privacy review of the numeric thresholds before
using the pack for formal assessment. The current values are credible synthetic
teaching values, not clinical benchmarks.

### FutureReady University

Persistence and engagement are correctly higher-is-better. Faculty workload is
lower-is-better, while employability and academic governance are higher-is-
better. High-risk success prediction and learning analytics receive stricter
default lifecycle controls. The crises distinguish co-design, competitive
pressure, and consent repair rather than treating adoption as a technology-only
problem.

The three synergies form understandable learning loops: evidence-led support,
teaching capacity, and learning-to-career.

Follow-up: have an education reviewer confirm the persistence/engagement
targets and the academic-governance guardrail before formal use.

## Balance conclusion

No pack is currently missing a playable route. The deterministic feasibility
matrix still produces an A route for all four scenarios, while focused and
balanced routes remain below A. That spread is useful: it creates a reason to
replay without requiring one hidden combination.

The current synergy boosts are intentionally modest (roughly 4–8% ROI boost,
0–3 risk reduction, and 0–3 adoption lift per pairing). They should remain
optional. A learner can reach an A without discovering every synergy.

## Required before publication

1. Obtain one domain review per pack for targets, crisis impacts, and units.
2. Add explicit source-level lifecycle/operating authoring for the four legacy
   Project Factory initiatives, or document the adapter defaults as an
   intentional content policy.
3. Add one known-seed content fixture per pack with expected metric movement,
   lifecycle stage, crisis outcome, and synergy explanation.
4. Keep all values labelled as synthetic or expert-reviewed; none should be
   presented as an industry benchmark without provenance.

## Verification

The following focused checks passed on this audit:

```text
node --test tests/scenario-mission.test.cjs tests/balance-harness.test.cjs \
  tests/lifecycle-contracts.test.cjs tests/operating-profile-contracts.test.cjs \
  tests/feasibility-harness.test.cjs

38 tests passed
```

The audit found no clearly justified numeric content edit that should be made
without domain-owner approval.
