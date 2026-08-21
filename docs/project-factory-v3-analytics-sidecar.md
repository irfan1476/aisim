# Project Factory V3 — Analytics Sidecar

Status: approved design; implementation scheduled after the PF2/PF3 runtime contract is stable  
Date: 2026-08-21  
Related: [V3 design brief](./project-factory-v3-design-brief.md), [V3 implementation backlog](./project-factory-v3-implementation-backlog.md), [decision log](./decision-log.md)

## Purpose

The analytics sidecar is a read-only, evidence-led analysis surface for a V3 run. It makes the simulation inspectable while the learner is deciding and gives the facilitator a compact replay surface during debrief. It is not a second simulation engine, a second source of truth, or an AI coach.

The sidecar must help a learner answer:

- What is happening, and against which target?
- What did we decide, predict, and assume?
- What actually happened after resolution?
- Which gates, stakeholders, exposures, capacity limits, and evidence explain the movement?

## Non-negotiable boundaries

1. **Read-only projection:** derive a `V3AnalyticsProjection` from the current V3 state, scenario pack, and history. Do not persist derived metrics or mutate resolver state from an analytics view.
2. **Source-grounded:** every displayed metric, rating, status, and insight links to a visible evidence artefact, decision-ledger entry, authored rule, gate, event, stakeholder rule, or exposure.
3. **Truth labels:** distinguish observed, estimated, and not-yet-observable values. Preserve provisional-synthetic provenance and confidence labels.
4. **No composite judgement:** do not add a composite score, CEO grade, archetype, personality/trait diagnosis, or automated blind-spot diagnosis. The formative scorecard remains dimension-based.
5. **No causal contamination:** baseline answers, confidence, reflection text, timestamps, evidence-open telemetry, and sidecar navigation cannot affect outcomes or scorecard dimensions.
6. **No hidden causality:** the sidecar may explain authored relationships; it must not infer a causal story from correlation or from usage telemetry alone.
7. **Opt-in compatibility:** if a pack has no V3 metadata, the sidecar is hidden or returns an empty projection. Standard, v1, and v2 runs retain their existing behavior.

## Projection contract

The implementation should expose pure selectors (names illustrative):

```ts
type V3AnalyticsProjection = {
  availability: 'hidden' | 'available';
  run: { scenarioId: string; scenarioName: string; quarter: number; window?: number; seed: string; version: string };
  dashboard: DashboardProjection;
  metrics: MetricProjection[];
  ledger: DecisionWindowProjection[];
  gates: GateProjection[];
  stakeholders: StakeholderProjection[];
  capacity: CapacityProjection;
  events: EventProjection[];
  exposures: ExposureProjection[];
  evidence: EvidenceProjection[];
  resources: ResourceProjection[];
};
```

Selectors must be deterministic for the same pack, state, history, and seed. They read `state.v3State` for V3-owned state, the static `scenarioDefinition.v3` pack for authored metadata, and `state.history` for trends. They must reconcile the actual V3 schema rather than assuming legacy paths such as `state.scenarioState.ledger` or scalar generic scorecard fields.

Derived values are computed at projection time only. Persistence stores raw V3 state, decision-ledger records, reflection records, and explicitly authored interaction telemetry according to the retention policy; it does not store sidecar aggregates.

## Tabs and minimum contract

### 1. Dashboard — always available

Show scenario, quarter/window, seed/version, scenario-owned metrics, direction-aware progress to target, dimension scorecard snapshot, and an uncertainty/provenance banner. Each card links to its metric authority, evidence, rule, or ledger entry.

### 2. Decision Ledger — after the first material window

Replay each window as **You said → You did → What happened → What you learned**. Show the immutable pre-resolution snapshot, prediction, key assumption/known unknown, owner, confidence, cited evidence, lifecycle actions, resolver-authored outcome, metric deltas, gates, events, stakeholder effects, and optional learner reflection. Windows are collapsible and deep-link to supporting tabs.

### 3. Metrics & Targets — always available

Show current value, target, direction-aware progress, trend from history, owner, reporting lag, unit/time basis, and whether the value is observed, estimated, or not-yet-observable. Do not substitute a generic ROI/adoption/risk metric for a pack-owned metric.

### 4. Governance & Gates — always available

Show gate status (`allowed`, `limited`, `blocked`, or pending), accountable owner, required evidence, conditions, explanation, and next review trigger. A gate card links to evidence and ledger decisions.

### 5. Stakeholders — always available

Show authored stakeholder states, priorities, red lines, support/trust movement, response rule, and history. Do not label a learner or team with a trait. Stakeholder changes must link to the authored rule and the relevant decision/event.

### 6. Capacity & Budget — always available

Show capital envelope, committed/spent/remaining amounts, run cost, active-delivery count, and capacity-pool usage by quarter. Warn when the two-active-pilot/scale limit or a declared pool limit is reached. Currency and units come from the pack metadata.

### 7. Events & Exposures — when present or relevant

Separate triggered events from unresolved exposures. For each event show trigger conditions, supporting evidence, response, cost, consequences, seed, and stakeholder effects. For each exposure show owner, current condition, review trigger/date, mitigation status, and event-eligibility relationship. Do not create a generic “unfunded for N quarters” event.

### 8. Evidence Room — always available

List artefacts with provenance/source type, confidence, claim status, learning purpose, accessible summary, limitations, availability, and decision use. Evidence opened/cited indicators are interaction telemetry only; they never change outcomes. Cross-links from ledger, gates, metrics, and events must resolve to the same artefact.

### 9. Learn / Resources — static reference

Provide the scenario glossary, relevant frameworks, facilitator notes, accessibility guidance, and the educational-use/provisional-content disclaimer. Resources have no mechanism effect and are not presented as evidence of scenario outcomes.

## Interaction and accessibility requirements

- Persistent tabs on wide screens; an accessible dropdown or scrollable tab list on narrow screens.
- Keyboard navigation, visible focus, semantic headings, screen-reader labels, non-colour status indicators, and text alternatives for charts.
- Expand/collapse for ledger windows and long evidence cards to control cognitive load.
- Cross-tab deep links preserve the selected source record and return path.
- Exports are optional and source-labelled: metrics CSV and ledger/board-memo Markdown must not include hidden derived claims.
- Responsive layout and dark-mode support may be added without changing projection semantics.

## Delivery sequence

1. **Contract preparation (P1):** freeze the projection interface and source-link model once PF2/PF3 state and pack APIs are stable; add selector-level invariants and compatibility fixtures.
2. **Core sidecar (P2):** implement Dashboard, Decision Ledger, Metrics & Targets, Evidence Room, and Governance & Gates against the approved PF2/PF3 selectors.
3. **Operational sidecar (P3):** add Stakeholders, Capacity & Budget, Events & Exposures, Learn/Resources, export, and facilitator-oriented post-run view.
4. **Pilot calibration:** test usefulness, cognitive load, accessibility, provenance comprehension, and whether the sidecar improves debrief quality. Do not infer traits or introduce an AI reflection coach from sidecar telemetry.

The sidecar UI must not block the PF2/PF3 engine slices. It may be developed as a separate read-only lane once the contracts it consumes exist.

## Verification gates

- Same input state produces byte-equivalent projection (apart from explicitly local UI state).
- V3 state mutation before/after opening or navigating the sidecar is identical.
- Every displayed claim has a source reference or is explicitly labelled derived/progress calculation.
- Direction-aware progress is clamped and handles lower-is-better metrics.
- No composite score, trait label, baseline causal input, or generic scenario metric appears in V3 projections unless authored by the pack.
- Legacy/non-V3 fixtures return `availability: 'hidden'` and pass the existing regression suite.
- Accessibility and export tests cover each tab delivered in the pilot slice.
