# Generic Scenario Pipeline — Implementation Plan

Status date: 2026-08-20
Working branch: `feature/scenario-generic-pipeline`

> Planning addendum (2026-08-21): [Scenario Learning Research and Architecture](./scenario-learning-research-and-architecture.md) records the agreed learning direction, research basis, five recommended next domains, content standard, and proposed depth-layer architecture. [Current Scenarios: Depth-Layer Architecture and Change Approach](./current-scenarios-v2-approach.md) maps that direction onto the four committed packs; [Project Factory 2030 v2 Design Brief](./project-factory-v2-design-brief.md), [Implementation Backlog](./project-factory-v2-implementation-backlog.md), and [Content-Authoring Template](./scenario-v2-content-authoring-template.md) now define the agreed reference-pack direction. [Version and Branch Strategy](./version-branch-strategy.md) keeps v3 separate from the active v2 line until an explicit integration decision. [Project Decision Log](./decision-log.md) records shareable decisions and open questions after substantive work. This pipeline remains the source of truth for the currently implemented generic-scenario work.

This document is the source of truth for the domain-agnostic scenario work. It separates decisions already agreed from work that remains. Standard mode must remain behaviourally compatible throughout.

## Agreed architecture

- Standard mode remains the default and has no scenario ID.
- Scenario mode is optional; the player chooses a registered scenario.
- The game engine is domain-agnostic. It consumes scenario definitions and does not branch on names such as BankNext or Care360.
- Scenario definitions are serializable data. Runtime functions are not stored in game state.
- Scenario progress uses native metric values, explicit bounds, direction, and targets.
- Scenario state is separate from the existing native game metrics and is persisted.
- Existing initiative evolution, neglect, risk, synergies, recommendations, analytics, reflections, what-if, reset/export, and LLM provider selection must remain available.
- Existing saves must load safely. Standard saves must not be converted into a scenario.
- Scenario currency is display-only. Overspend penalties apply only in scenario mode.
- Scenario crises reduce budget and cumulative spend when their costs are accepted.
- Future domains should be addable by creating a scenario pack and registering it, without modifying the core engine.

## Current implementation status

### Phase 0 — Baseline protection — complete

- Existing Standard-mode tests were run before scenario changes.
- Q1 no-regeneration behaviour is covered.
- Initiative evolution, neglect, risk, synergies, scoring, generation, and migration are covered.
- Current baseline: 27 Node tests passing, TypeScript check passing, production build passing.

### Phase 1 — Generic scenario pipeline — substantially complete

- [x] `scenarioState` added to `GameState`.
- [x] Persistence version 5 and legacy migration added.
- [x] Data-only metric definitions added.
- [x] Scenario initiative adapter added.
- [x] Maturity and allocation readiness helpers added.
- [x] Scenario effect resolver added.
- [x] Funding, maturity, readiness, adoption, diminishing returns, and neglect affect scenario metrics.
- [x] Native scenario metric bounds are enforced.
- [x] Progress is calculated from bounded native values.
- [x] Scenario initialization loads the correct six initiatives and clears Standard-mode selections.
- [x] Scenario selector and challenge/constraint display added.
- [x] Four packs registered: Project Factory, BankNext, Care360, FutureReady.
- [x] Scenario save migration preserves domain initiative IDs.
- [x] Extract the existing Standard metric calculation into a separately tested `calculateStandardEffects` function; the original Standard formulas remain unchanged behind the pure resolver.

### Phase 2 — Test and integration hardening — next

#### Analytics V2 wiring audit — first pass implemented 2026-08-22

- [x] Add a shared scenario/native analytics metric view model.
- [x] Rewire Dashboard and Diagnostics to the active scenario metric catalog.
- [x] Make the decision heatmap target-progress and scenario-aware.
- [x] Use historical allocations for Strategy DNA.
- [x] Remove Project Factory-specific initiative IDs from BCG alignment heuristics.
- [x] Correct Q1 roadmap spend and scenario currency display.
- [x] Deduct selected scenario initiative cost from the quarter budget envelope.
- [ ] Add KPI provenance and scenario scorecard cards.
- [ ] Add causal-chain, gate, crisis, and recommendation evidence to Diagnostics.
- [ ] Add a complete scenario metric ledger to History.

The detailed tab-by-tab contract and remaining actions are recorded in [Analytics V2 — Scenario Wiring Audit and Action Plan](./analytics-v2-audit-and-action-plan.md).

#### P1-A: Pure-module tests

- [x] Test all implemented maturity multipliers.
- [x] Test allocation readiness bounds, including zero allocation, full allocation, and scenario readiness floor.
- [x] Test single initiative adaptation, risk mapping, base fields, and scenario metadata.
- [x] Test scenario effect immutability and missing metric definitions.
- [x] Test funded effects and progress bounds.
- [x] Add explicit multi-quarter neglect, native-boundary, and adoption-floor assertions.

#### P1-B: Quarter-flow tests

- [x] Test Q1 scenario funding changes the selected primary metric.
- [x] Test repeated funding compounds without exceeding bounds.
- [x] Test neglect over multiple quarters and penalty onset.
- [x] Test all four scenario packs through a complete 12-quarter loop.
- [x] Test scenario crisis selection, domain response impacts, cost, and cumulative spend.
- [ ] Test scenario causal-chain and recommendation output references.
- [ ] Test advisor prompt context for scenario name, domain pressures, maturity, and risk.

#### P1-C: Persistence and regression tests

- [x] Round-trip a scenario save with metrics, progress, flags, initiative states, history, and crisis state.
- [x] Migrate a v4 scenario save into v5 `scenarioState`.
- [x] Load a v4 Standard save with no scenario fields.
- [x] Confirm Standard mode does not render scenario UI or use scenario effects.
- [x] Confirm the Standard full-loop metric/score snapshot remains unchanged after Standard-effect extraction.

#### P1-D: UI tests

The repository does not currently include Jest or React Testing Library. First use the existing Node test harness for pure logic and browser/e2e coverage. Add React Testing Library only if UI assertions cannot be covered adequately through the existing Playwright setup.

- [x] Scenario selector exposes all registered scenarios alongside Standard mode.
- [x] Selecting a scenario clears stale Standard selections.
- [x] Scenario challenge cards and scenario initiatives are visible.
- [x] The player can select up to three initiatives, but never four.
- [ ] Scenario progress updates after confirming a decision.
- [x] Standard mode has no scenario progress/challenge panel.
- [x] Crisis modal and final summary show scenario-specific information.

### Phase 3 — Scenario depth and learning loop — pending

- [ ] Expand each scenario from provisional values to reviewed domain mechanics.
- [x] Add three domain-specific crises per pack.
- [x] Add scenario-specific causal explanations without hard-coding scenarios in the engine.
- [x] Add scenario-declared synergy discovery and mechanical effects using data definitions; the engine remains scenario-name agnostic.
- [x] Show native domain values and units alongside progress percentages.
- [x] Improve final diagnosis with evidence from allocations, initiatives, and metric movement.
- [x] Add scenario-aware scoring explanation; do not introduce arbitrary multipliers.

### Phase 4 — Release and deployment — pending

- [x] Run the full test/build/e2e checklist on the feature branch.
- [ ] Review the branch diff for accidental changes and unrelated files.
- [ ] Push the feature branch to GitHub.
- [ ] Deploy the branch to a separate Vercel project.
- [ ] Run a manual acceptance pass for all four scenarios.
- [ ] Only merge into `main` after explicit approval.

## Test commands

```bash
npm test
npm run type-check
npm run build
npm run test:e2e
```

The test command currently updates the generated `balance-report.json` timestamp. That generated file must not be included in scenario commits unless explicitly requested.

## Definition of done

### Campaign purse model

- [x] Let the player choose one finite campaign purse before the baseline assessment.
- [x] Derive a suggested quarterly planning pace from the purse over 12 quarters.
- [x] Deduct initiative and crisis costs from the campaign balance without replenishing it on quarter transition.
- [x] Persist and migrate `campaignBudget` and `campaignBudgetRemaining` while retaining the legacy quarterly fields.
- [x] Show purse, remaining capital, pace, and spend context in setup, decision-making, analytics, and advisor context.
- [ ] Add final-summary budget stewardship evidence and full end-to-end budget selection coverage.

The scenario work is ready for review only when:

1. All P1 tests pass.
2. Standard mode passes its regression suite with no unexplained metric or score drift.
3. Each scenario completes a 12-quarter run without crashes or missing initiative state.
4. Funding and neglect visibly change scenario metrics and initiative state.
5. Save/load preserves scenario identity and progress.
6. The UI clearly explains the selected scenario’s constraints and available initiatives.
7. No scenario-specific conditionals exist in the generic engine.
8. The branch is clean apart from intentionally ignored local artifacts.
