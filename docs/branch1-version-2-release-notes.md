# Branch1 Version 2 — Release Notes

**Release scope:** `dc34433` → `8b949c6` on `feature/scenario-generic-pipeline`
**Release commit:** `8b949c62ba7608201cd93b598994430991b3fd01` — *Ship scenario learning loop and advisor guidance*
**Published production instance:** [aisim1.teachmeai.in](https://aisim1.teachmeai.in)

## In one sentence

Branch1 Version 2 turns the simulation from a sequence of investment selections into a repeatable executive learning loop: **observe the operating context, choose a portfolio and pace of investment, see the consequences, explain why they happened, and deliberately try a different strategy next time.**

## The headline change from the previous version

**The learner now controls both *what* they fund and *when* they release capital.**

Instead of automatically spending a fixed quarterly amount across three initiatives, each decision window now supports:

- **0, 1, 2 or 3 initiatives** — pause, deep focus, focused balance or portfolio breadth;
- a **finite campaign purse** rather than a compulsory quarterly spend;
- **partial deployment** when waiting is strategically sensible;
- **reserve carry-forward** for a later opportunity, pressure or crisis; and
- a transparent **deployment cap of two suggested quarterly paces**, preventing an unrealistic all-in move while preserving genuine timing choice.

This is the release’s core learning mechanic. It makes concentration, coordination, neglect, optionality and capital pacing visible consequences of the learner’s own strategy.

## What changed for a learner

```text
Choose a context
       ↓
Read live pressures and evidence
       ↓
Choose 0–3 initiatives, operating allocation, and deployment pace
       ↓
Resolve the quarter: outcomes, maturity, risk, crisis and synergy effects
       ↓
Review measured results, causal evidence, guidance and reflection
       ↓
Compare a new run with an earlier strategy
```

The important shift is that a learner is no longer pushed to spend a fixed amount on three initiatives every quarter. They can pause, focus deeply, balance two initiatives, or run a broad portfolio — while seeing the capital, coverage, coordination, concentration, maturity and neglect implications of that choice.

## Delivered capabilities

| What was delivered | Why it was added | What the learner experiences |
| --- | --- | --- |
| **Flexible campaign purse** | A fixed quarterly spend made every decision feel alike and weakened the strategic timing question. | A finite campaign budget can be held, partially deployed, or deployed more aggressively within a two-quarter cap. Unused capital carries forward; crisis costs draw from the same purse. |
| **0–3 initiative portfolio choices** | Selecting exactly three initiatives was an artificial constraint rather than a strategic decision. | One initiative represents deep focus, two a focused balance, three portfolio breadth, and zero a deliberate pause. The decision preview explains the trade-off before confirmation. |
| **Portfolio evidence in every completed quarter** | Reflection needs an auditable record rather than a reconstructed story. | History now retains selection count, posture, breadth, concentration signal, deployment, spend, allocation, causal evidence and recommendations for completed quarters. |
| **Decision Coach and preview** | Learners need help interpreting trade-offs without being told a single “correct” answer. | Before committing, the learner sees the current bottleneck, likely affected and neglected pressures, portfolio posture, spend and remaining capital. |
| **Board Advisor with evidence-backed fallback** | A generic response is not useful coaching, especially when an AI provider is unavailable. | Suggested and typed questions receive an immediate contextual answer grounded in live risk, adoption, data, allocation, reserve, selected initiatives, scenario progress and discovered synergies. An available LLM may add a separate perspective; it does not own the numbers. |
| **Four scenario packs on one generic engine** | The product needs to grow beyond a single manufacturing setting without writing a new game each time. | Learners can use Project Factory 2030, BankNext Transformation, Care360 Health Network, or FutureReady University. Each supplies its own initiatives, pressures, progress measures, crises and context while using the same quarter-resolution contract. |
| **Scenario-aware analytics** | Generic portfolio charts were obscuring the outcomes that actually matter in a banking, healthcare or education scenario. | The sidecar distinguishes native scenario outcomes from supporting portfolio signals and identifies the current scenario bottleneck. |
| **Analytics truth and provenance** | A calculated indicator, a forecast and a recorded outcome should never appear equally certain. | Analytics now label or separate measured, calculated, scenario-defined and modelled-proxy information. A lack of evidence is not presented as a fabricated zero. |
| **Separated analytics roles** | Trends, diagnostics and Strategy DNA previously overlapped. | Trends focus on movement and projection; Diagnostics explains the latest completed decision; DNA interprets recurring strategic behaviour; Evolution shows initiative maturity and neglect; Learn turns the record into reflection. |
| **Causal diagnostics, history and roadmap detail** | Results should explain *why*, not merely report a score. | Learners can inspect selected initiatives, allocations, initiative maturity, synergies, neglect, scenario movement, crisis responses and recommendation evidence from the latest relevant quarter. |
| **Replay notebook and run comparison** | Learning improves when a learner can test a theory, not only chase a final score. | Completed campaigns can be saved locally and compared with earlier runs. The final report encourages a purposeful next experiment rather than a blind replay. |
| **Improved final outcome report** | A final grade alone does not explain how a leadership strategy performed. | The final experience includes evidence-based outcome context, scenario performance, budget and portfolio interpretation, and an invitation to replay with one deliberate change. |

## The learning and strategy moats

### 1. Decisions become evidence, not decoration

Every resolved quarter records the decision and the context around it. That makes the simulation suitable for reflection: a learner can ask what they funded, what they spent, what changed, what caused it, and what they would change next time.

### 2. Strategic pacing and reserve management are real choices

Capital is a campaign resource rather than a “use it or lose it” quarterly target. Learners can deploy nothing, some, or up to two suggested quarterly paces; unused reserve carries forward. They can preserve optionality, invest early to build maturity, or deploy decisively when pressures justify it. The product teaches that timing is part of strategy.

### 3. Portfolio shape has explainable consequences

Depth, breadth, concentration, coordination and neglect are surfaced as explicit, bounded mechanics. The simulation does not assert that broad diversification or deep focus is always best; it makes the trade-off visible in the context of the chosen scenario.

### 4. Domain context is data-driven, not hard-wired into the engine

The core engine does not need a special BankNext, Care360 or FutureReady code path. Scenario packs provide the initiatives, native outcome metrics, targets, effects, gates, crises, synergies and framework context. This is the foundation for adding future domains without creating separate games.

### 5. Advice is useful without being allowed to change the outcome

The Board Advisor is deliberately explanatory. Numeric outcomes remain deterministic engine calculations. This keeps the game reproducible and makes it safe to provide contextual guidance even if an AI provider is unavailable.

## Design decisions and lessons learned

| Decision | Lesson behind it |
| --- | --- |
| Keep Standard Mode alongside scenario mode | New domain scenarios should extend the product, not silently replace the established Project Factory experience. |
| Keep scenario content serializable and declarative | Scenario definitions should be inspectable, persistable and portable. The engine should resolve them generically rather than contain scenario-name branches. |
| Use a single campaign purse, reserve carry-forward and a bounded deployment cap | Learners should make real pacing choices and see the opportunity cost of both under-investing and over-deploying, without being allowed an unrealistic all-in spend. |
| Preserve deterministic outcomes | The same seed, setup and decisions should produce the same numeric result. Different seeds may create controlled campaign variation; advisor text cannot alter the calculation. |
| Treat the completed-quarter snapshot as historical truth | Past results must not be recalculated from the current state after initiatives have evolved. |
| State analytical provenance | Forecasts, framework scores and heuristic interpretations are useful, but they should not masquerade as observed business telemetry. |
| Use AI as an optional perspective, not a game master | The advisor can clarify evidence, but it cannot write metrics, spend, score, risk or scenario progress. |

## Validation evidence

The release added and expanded automated coverage across the game engine, analytics view model, Board Advisor, production-readiness checks and browser campaign flow.

The completed release validation reported:

- `npm run type-check` — passed
- `npm test` — passed (59 tests reported at the final Board Advisor validation)
- `npm run build` — passed
- Focused browser test of Board Advisor behaviour with a forced LLM failure — passed
- Scenario and engine coverage includes campaign pacing, carry-forward, crisis spend, deterministic repeatability, seed variation, scenario parity, scenario initiative limits, persistence and final evidence

This is test evidence for implemented behaviour. It is not a claim that every scenario value is a validated industry benchmark or that the release has undergone formal external domain review.

## Deployment context

- The release is committed and pushed on `feature/scenario-generic-pipeline` at `8b949c6`.
- The Vercel production build completed successfully for the branch’s intended production instance.
- The active published URL reported for this release is [aisim1.teachmeai.in](https://aisim1.teachmeai.in).
- This document records the branch release; it does not state that the branch has been merged into `main`.

## Intentional exclusions and known boundaries

The following boundaries are deliberate or remain outside this release:

- Scenario values, targets, crisis severity and initiative effects are scenario-authored learning content. They require separate domain-expert review before being represented as industry benchmarks.
- Modelled forecasts, framework views and some KPI interpretations remain **modelled proxies**, not measured external telemetry.
- Scenario synergy relationships are authored in scenario definitions and revealed through play. They have real game effects, but they are not claimed to be spontaneously discovered from real-world data.
- Replay comparison is local to the learner’s browser; it is not a shared leaderboard or multi-user collaboration system.
- The Board Advisor may use an optional LLM, but the deterministic evidence response remains the reliable fallback. Provider/fallback provenance and payload hardening remain worthwhile future improvements.
- The homepage has been refreshed alongside this release so its learner story matches the flexible campaign purse, 0–3 initiative portfolios, scenario-native analytics, Board Advisor, decision support, and replay loop now in the product.

## Recommended next steps

1. **Review scenario content with domain practitioners.** Validate the direction, targets, crisis timing, initiative effects and synergy balance for all four domains.
2. **Run structured learner pilots.** Observe whether learners understand capital pacing, initiative-count trade-offs and the difference between measured outcomes and modelled guidance.
3. **Harden advisor transparency.** Show whether a response is deterministic evidence, an LLM perspective, or both; sanitize implementation-only fields before any provider call.
4. **Add a production smoke-test routine.** Verify the key decision loop, save/load, analytics, advisor fallback and final report against the deployed instance after every release.
5. **Use replay as a learning experiment.** Encourage learners to change one variable — portfolio breadth, deployment pace, allocation or scenario response — and compare the result with an earlier run.
6. **Extend through new scenario packs, not engine forks.** Future retail, insurance, utility, agriculture or public-service scenarios should use the same generic contract and documentation standard.

## Release takeaway

Branch1 Version 2 is not simply a larger feature set. It establishes a clearer educational contract: **the learner’s choices create a record, the record explains the outcome, and the next run becomes a deliberate experiment.**

---

## V2 continuation update — 2026-08-24

This addendum records the post-release V2 work currently present in the working tree. It is intentionally not a release declaration: the changes remain uncommitted and require final browser validation before they are committed or deployed.

### Learner-facing UX now implemented locally

- Quarter Coach and Decision Preview can be collapsed, keeping the decision window focused on the live evidence.
- The old static portfolio-choice summary is replaced by live decision impact: selected depth, spend, reserve, concentration, affected pressure and neglected pressure.
- Initiative cards show evolving values and movement from campaign baseline.
- The UI offers a **60% deployment suggestion** as an editable starting pace. It is guidance, not a minimum, maximum or forced spend rule.
- Scenario challenges are presented as dynamic **Critical**, **Watch**, **Recovering** or **Controlled** states, with current value, movement from start and contextual explanation.
- The Analytics Dashboard uses the latest completed quarter for spend evidence after a quarter transition; it does not treat an unresolved current quarter as a zero-outcome quarter.
- Strategy DNA is positioned as strategic decision-pattern interpretation. Initiative Evolution is the measured ledger for funding, maturity, neglect, risk and spend.
- Modelled analytics and proxies are labelled so learners can distinguish recorded outcomes from interpretation.

### Four-scenario documentation boundary

| Scenario pack | Domain-native evidence | Dynamic pressures learners should see | Content status |
| --- | --- | --- | --- |
| Project Factory 2030 | Maintenance reliability, quality, demand, energy and workforce/knowledge signals | Asset reliability, quality, demand volatility, energy cost and capability continuity | Provisional synthetic learning content |
| BankNext Transformation | Fraud pressure, credit approval time, compliance readiness, customer trust and digital adoption | Fraud, competitive speed, regulatory evidence and responsible growth | Provisional synthetic learning content |
| Care360 Health Network | Patient wait time, clinician burnout, patient safety, privacy trust and care access | Access surges, workforce pressure, safety signals and privacy review | Provisional synthetic learning content |
| FutureReady University | Student persistence, engagement, faculty workload, employability readiness and academic governance | Student engagement, faculty resistance, competition and consent/data governance | Provisional synthetic learning content |

The engine remains generic: scenario packs declare metrics, initiatives, effects, synergies, crises and context; the core quarter loop does not contain a separate hard-coded game for each domain.

### Release status for this continuation

- **Implemented locally:** yes, across the V2 UX and analytics workstreams.
- **Evidence reported by workstreams:** type-check, automated tests, production compilation and diff checks passed for the relevant tracks; the reported suite was 65/65.
- **Still required:** one clean full test/build run from the reconciled tree, browser walkthrough of all four scenarios, review of provisional domain values and targets, final diff review, commit and push.
- **Not done in this continuation:** no commit, push, merge, Vercel deployment or V3 modification.

## V2 continuation — decision-window and analytics UX

**Status:** implemented in the current V2 working tree; pending final review and release validation.

The latest V2 refinement keeps the same learning contract while making the decision window easier to read and the sidecar more trustworthy:

- Quarter Coach and Decision Preview are collapsible, so guidance is available without dominating the decision surface.
- The former static portfolio summary is replaced by live decision impact: selected depth, initiative spend, reserve, pressure, neglected coverage and likely trade-offs.
- **60% is a suggested starting pace in the UI**, not a rule. Learners can edit deployment and retain the freedom to spend less or carry reserve forward.
- Initiative cards show current evolved values and movement from campaign baseline.
- Scenario challenges use live Critical, Watch, Recovering and Controlled states with scenario-native values and explanations.
- Strategy DNA focuses on decision patterns, while Initiative Evolution owns measured initiative history.
- Dashboard and Diagnostics prefer the latest completed-quarter evidence when the next decision window has not yet produced new results.
- Modelled forecasts, framework interpretations and heuristic indicators are labelled as modelled proxies rather than observed business telemetry.

These changes are not yet a new production release. The current working tree still requires the manual four-scenario walkthrough, browser assertions, provisional content review, final diff review and explicit commit/deployment approval.
