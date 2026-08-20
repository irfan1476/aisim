# Generic Scenario Pipeline — Implementation Plan

Status date: 2026-08-20  
Working branch: `feature/scenario-generic-pipeline`

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
- Current baseline: 17 tests passing, TypeScript check passing, production build passing.

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
- [ ] Extract the existing Standard metric calculation into a separately tested `calculateStandardEffects` function. This remains deliberately pending because the first pass preserved the existing engine path to reduce regression risk.

### Phase 2 — Test and integration hardening — next

#### P1-A: Pure-module tests

- [x] Test all implemented maturity multipliers.
- [x] Test allocation readiness bounds, including zero allocation, full allocation, and scenario readiness floor.
- [x] Test single initiative adaptation, risk mapping, base fields, and scenario metadata.
- [x] Test scenario effect immutability and missing metric definitions.
- [x] Test funded effects and progress bounds.
- [ ] Add explicit multi-quarter neglect, native-boundary, and adoption-floor assertions.

#### P1-B: Quarter-flow tests

- [ ] Test Q1 scenario funding changes the selected primary metric.
- [ ] Test repeated funding compounds without exceeding bounds.
- [ ] Test neglect over multiple quarters and penalty onset.
- [x] Test all four scenario packs through a complete 12-quarter loop.
- [ ] Test scenario crisis selection, response impacts, cost, cumulative spend, and budget.
- [ ] Test scenario causal-chain and recommendation output references.
- [ ] Test advisor prompt context for scenario name, domain pressures, maturity, and risk.

#### P1-C: Persistence and regression tests

- [ ] Round-trip a scenario save with metrics, progress, flags, initiative states, history, and crisis state.
- [ ] Migrate a v4 scenario save into v5 `scenarioState`.
- [ ] Load a v4 Standard save with no scenario fields.
- [ ] Confirm Standard mode does not render scenario UI or use scenario effects.
- [ ] Confirm the Standard full-loop metric/score snapshot remains unchanged after Standard-effect extraction.

#### P1-D: UI tests

The repository does not currently include Jest or React Testing Library. First use the existing Node test harness for pure logic and browser/e2e coverage. Add React Testing Library only if UI assertions cannot be covered adequately through the existing Playwright setup.

- [ ] Scenario selector exposes Standard plus all registered scenarios.
- [ ] Selecting a scenario clears stale Standard selections.
- [ ] Scenario challenge cards and scenario initiatives are visible.
- [ ] The player can select zero, one, two, or three initiatives, but never four.
- [ ] Scenario progress updates after confirming a decision.
- [ ] Standard mode has no scenario progress/challenge panel.
- [ ] Crisis modal and final summary show scenario-specific information.

### Phase 3 — Scenario depth and learning loop — pending

- [ ] Expand each scenario from provisional values to reviewed domain mechanics.
- [ ] Add three to five domain-specific crises per pack.
- [ ] Add scenario-specific causal explanations without hard-coding scenarios in the engine.
- [ ] Add emergent scenario synergy discovery and mechanical effects using data definitions.
- [ ] Show native domain values and units alongside progress percentages.
- [ ] Improve final diagnosis with evidence from allocations, initiatives, crises, and metric movement.
- [ ] Add scenario-aware scoring explanation; do not introduce arbitrary multipliers.

### Phase 4 — Release and deployment — pending

- [ ] Run the full test/build/e2e checklist on the feature branch.
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

The scenario work is ready for review only when:

1. All P1 tests pass.
2. Standard mode passes its regression suite with no unexplained metric or score drift.
3. Each scenario completes a 12-quarter run without crashes or missing initiative state.
4. Funding and neglect visibly change scenario metrics and initiative state.
5. Save/load preserves scenario identity and progress.
6. The UI clearly explains the selected scenario’s constraints and available initiatives.
7. No scenario-specific conditionals exist in the generic engine.
8. The branch is clean apart from intentionally ignored local artifacts.
