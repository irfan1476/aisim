# Analytics V2 — Scenario Wiring Audit and Action Plan

Status: implemented Analytics V2 wiring and cross-scenario analytics correction pass; residual realism and browser-coverage work remains
Date: 2026-08-22
Branch: `feature/scenario-generic-pipeline`

## Purpose

This record audits the Analytics side panel against the four registered scenarios:

- Project Factory 2030 — manufacturing
- BankNext Transformation — banking
- Care360 Health Network — healthcare
- FutureReady University — education

The central finding is that the simulation has two valid metric layers:

1. Native portfolio metrics: ROI, adoption, efficiency, risk, data readiness, satisfaction, literacy, and related operating signals.
2. Scenario metrics: domain outcomes such as fraud pressure, credit approval time, patient wait time, student persistence, or workforce resilience.

The engine can update both layers. Analytics must not silently substitute native portfolio proxies for the active scenario’s domain outcomes.

## Evidence inspected

- `components/AnalyticsHub.tsx`
- `components/MagicAnalytics.tsx`
- `components/TransformationKPIDashboard.tsx`
- `components/FrameworkDashboard.tsx`
- `components/InitiativeEvolution.tsx`
- `components/QuarterRoadmap.tsx`
- `components/HistoricalComparison.tsx`
- `lib/analytics.ts`
- `lib/game/forecast.ts`
- `lib/game/effectResolver.ts`
- `lib/game/initiativeState.ts`
- `lib/game/state.ts`
- `stores/gameStore.ts`
- all four files in `lib/scenarios/`

## Shared analytics contract

`lib/analyticsViewModel.ts` is now the shared boundary for analytics metric interpretation.

Each metric has:

- `key`, `label`, and `unit`
- current value, start value, target, bounds, and direction
- progress toward target
- delta from baseline
- source: `scenario` or `native`
- status: `measured` or `derived`

When scenario mode is active, the scenario’s declared `progress` definitions are the primary metric catalog. Standard mode continues to use the native portfolio catalog.

This prevents each tab from independently deciding which metrics matter.

## Tab contracts and scenario relationships

### Dashboard

**Primary purpose:** show the current state and the active operating envelope.

**Correct source:** scenario progress metrics in scenario mode; native portfolio metrics in Standard mode.

**Scenario relationship:** all four packs have different primary metrics and units. The Dashboard must render the pack’s labels and units rather than assuming percentages.

**Implemented:** Dashboard now uses the shared metric catalog, shows scenario targets, identifies the current bottleneck, and distinguishes scenario metrics from native metrics. Scenario budget remaining is shown for the current quarter.

**Implemented:** the Dashboard shows cumulative per-initiative spend and the last completed quarter's spend after advancing. It no longer presents a cleared current selection as `$0` without context. The scenario budget envelope also reflects selected initiative cost.

### KPIs

**Primary purpose:** transformation scorecard.

**Correct source:** recorded history wherever the game records an event; modelled estimates only where the game has no telemetry.

**Finding:** decision accuracy, hours saved, FTE equivalent, deployment speed, override frequency, financial impact, security incidents, and workflow penetration are currently formula-derived. They are useful teaching estimates, not observed measurements.

**Required rule:** the UI must label each KPI as `Measured`, `Modelled estimate`, `Derived`, or `Unavailable`. Scenario KPI cards should use the active pack’s declared progress metrics and targets.

**Implemented:** KPI output now declares `modelled` provenance, financial cards follow the active currency, and scenario scorecard cards show current values, targets and progress.

### Trends

**Primary purpose:** show movement over time, separate from causal explanation.

**Correct source:** history snapshots. Native ROI remains a portfolio trend; scenario metrics need their own trend series.

**Implemented:** the heatmap and scenario metric catalog now use active scenario definitions. The ROI chart is explicitly labelled as portfolio ROI. Strategy DNA now uses historical allocations when available.

**Implemented:** scenario target projections now appear beside the native ROI trajectory. The projection is explicitly labelled modelled; uncertainty bands remain a future enhancement.

### Diagnostics

**Primary purpose:** explain what is weak, why it is weak, and what to change next.

**Finding:** the former weakest-capability rule only compared generic data, adoption, and risk. That was insufficient for all four domains.

**Implemented:** Diagnostics now identifies the lowest-progress metric from the active scenario catalog and compares it with the last completed snapshot.

**Implemented:** Diagnostics now renders the active scenario bottleneck, movement against the last completed snapshot, causal-chain evidence and proactive recommendations. When the new quarter has no evidence, it explicitly falls back to the latest completed quarter and includes crisis/approval evidence. Full governance-gate and crisis-cause narratives remain a future depth-layer item.

### Frameworks

**Primary purpose:** interpret the campaign through named management frameworks.

**Finding:** BCG alignment contained Project Factory-specific initiative IDs. That caused incomplete interpretation for BankNext, Care360, and FutureReady.

**Implemented:** BCG people and process signals now use campaign history and generic initiative capabilities. All four scenario packs now also declare explicit framework contribution dimensions, which are carried through the adapter and used when authored data is available.

**Remaining:** legacy Standard initiatives still use capability-text heuristics because they have no scenario-authored framework dimensions. This is an intentional compatibility fallback.

### History

**Primary purpose:** preserve the decision ledger and show what caused change.

**Finding:** the roadmap omitted Q1 spend, used a fixed dollar symbol, and showed only native metric context.

**Implemented:** Q1 spend is now taken from cumulative spend, later quarters use spend deltas, currency follows game state, and scenario values appear on roadmap cards.

**Implemented:** expanded History now shows allocation, quarter spend, scenario values/progress, synergy evidence, crisis responses and recommendation approvals. The store persists crisis and approval evidence into the latest quarter snapshot.

### Initiative Evolution / DNA

**Primary purpose:** show initiative-level maturity and reveal the player’s strategic pattern.

**Finding:** initiative evolution is strongly wired to the game state. DNA was mostly a current-state formula despite being described as a campaign pattern.

**Implemented:** DNA now uses historical allocation averages where available and reports the evidence period.

**Implemented:** DNA has its own tab and is distinct from Initiative Evolution. It uses historical allocation evidence alongside current outcomes. A deeper complete-ledger DNA model including sequencing, synergies, neglect and governance remains a future enhancement.

### Learn

**Primary purpose:** convert decisions and outcomes into reflection.

**Finding:** the former Learn panel mostly exposed provider settings and generic copy.

**Implemented:** copy now explicitly references scenario targets, spend, causal effects, and approved recommendations.

**Implemented:** the Learn tab renders a structured retrospective: decision → observed change → explanation → next-quarter question, including approved recommendation count.

## Scenario-specific wiring requirements

| Scenario | Primary analytics metrics | Important relationships | Logic must vary? |
|---|---|---|---|
| Project Factory | Downtime pressure, defect rate, energy pressure, workforce resilience, supply continuity | Maintenance and quality depend on data and frontline capability; workforce resilience is affected by knowledge investment and neglect | Shared resolver, pack-declared metric effects and gates |
| BankNext | Fraud pressure, credit approval time, compliance readiness, customer trust, digital adoption | Fraud and personalisation require governance; credit speed must trade against explainability and trust | Shared resolver, stronger governance and trust rules in pack data |
| Care360 | Patient wait time, clinical operating cost, staff burnout, patient trust, care access | Clinical initiatives require human oversight, privacy, validation and safe adoption | Shared resolver, hard clinical gates and safety events in pack data |
| FutureReady | Student persistence, faculty workload, employability readiness, learner engagement, academic governance | Analytics and copilots depend on consent, faculty co-design and learner agency | Shared resolver, governance and stakeholder rules in pack data |

The engine should not branch on these names. Different logic belongs in serializable scenario declarations: metric definitions, initiative effects, prerequisites, gates, event triggers and stakeholder impacts.

## Implemented changes in this pass

- Added `lib/analyticsViewModel.ts` as the shared scenario/native metric boundary.
- Rewired Dashboard to use scenario-aware metrics, targets, units and bottleneck detection.
- Rewired Diagnostics to use the active scenario metric catalog and last completed scenario snapshot.
- Added latest-completed-quarter fallback for Diagnostics and Learn evidence.
- Reworked the decision heatmap to show target progress, domain units and the quarter’s selected initiatives in the cell tooltip.
- Labelled the ROI chart as portfolio ROI to avoid confusing it with scenario outcome trends.
- Added historical allocation evidence to Strategy DNA.
- Made BCG alignment use campaign history and initiative capability data rather than Project Factory-only IDs.
- Fixed Q1 roadmap spend and currency presentation.
- Deducted selected initiative cost from the scenario quarter budget envelope.
- Added cumulative per-initiative spend and a defensive store-level three-initiative limit.
- Added scenario-native framework calculations and explicit modelled-proxy KPI labels.
- Split the Analytics navigation into Strategy DNA and Initiative Evolution tabs.
- Preserved Standard mode and all existing tests.

## Remaining action backlog

### P0 — required for analytics credibility

- [x] Add KPI provenance (`modelled`) and disclose it in the KPI panel.
- [x] Add scenario scorecard cards to KPIs.
- [x] Persist and display actual quarter budget allocation, initiative cost, crisis cost, and remaining envelope consistently.
- [x] Add scenario metric deltas and causal effects to History.
- [x] Persist post-decision crisis responses and recommendation approvals in the quarter ledger.

### P1 — required for a strong V2 learning loop

- [x] Add scenario target projections with explicit modelled-status explanation.
- [x] Make failure analysis consume causal chains and recommendations; governance-gate and crisis-cause explanations remain a depth-layer extension.
- [x] Replace scenario-pack BCG keyword heuristics with pack-declared framework contribution dimensions; retain a fallback for legacy Standard initiatives.
- [x] Separate Strategy DNA from Initiative Evolution and use historical allocation evidence.
- [x] Add structured Learn-tab retrospective cards.

### P2 — quality and usability

- [ ] Add unit-aware formatting for every native and scenario metric.
- [ ] Add a visible “why this changed” tooltip to Dashboard and Heatmap cells.
- [ ] Add browser assertions for each analytics tab in Standard mode and each registered scenario.
- [ ] Add deterministic fixtures covering all four scenario metric catalogs and budget flows at the analytics-view-model/UI boundary. Existing engine tests already cover all four scenario quarter loops and core budget/crisis persistence.

## Validation completed

- `npm run type-check` — passed on 2026-08-22.
- `npm run build` — passed on 2026-08-22.
- `npm test` — 39 tests passed on 2026-08-22.

## Release constraint

The current branch contains the completed Analytics V2 wiring and correction pass, including last-quarter budget evidence, cumulative per-initiative spend, history ledger, causal diagnostics fallback, recommendation-approval persistence, authored framework contributions, scenario-native forecasting, modelled-proxy labels and separate DNA/Evolution navigation. It is safe to review because Standard mode remains covered and the scenario engine remains generic. Remaining realism work is concentrated in full decision-ledger DNA, uncertainty bands, governance-gate causality, unit-aware presentation polish and browser-level tab assertions. No commit or deployment is implied by this document update.
