# Codebase overview

## What this application is

The AI Investment Challenge is a browser-first, single-player executive simulation. A learner manages an AI initiative portfolio over 12 quarters: chooses a scenario and starting posture, commits campaign capital, moves initiatives through their lifecycle, handles crises, reviews outcomes, and can replay a completed campaign with one changed decision.

It is a Next.js 14 App Router application using React, TypeScript, Tailwind CSS, and Zustand. The simulation itself is deterministic and runs in the browser; an LLM is an optional advisory layer and never changes the numerical game result.

## Runtime map

```text
app/page.tsx
  └─ landing page; starts or resumes the simulation
       └─ components/Game.tsx
            ├─ setup → assessment → hypothesis → game → done screens
            ├─ stores/gameStore.ts (persistent campaign state and user actions)
            ├─ stores/llmStore.ts (optional provider settings)
            └─ components/* (decision cockpit, results, analytics, replay, etc.)

gameStore action
  └─ lib/game/turnResolver.ts: applyTurnDecision()
       ├─ validates lifecycle, capital, allocation, and capacity
       ├─ lib/game/engine.ts: resolveQuarter()
       │    └─ initiative evolution + effects + scenario effects + snapshot
       ├─ updates finance, score, causal chain, recommendations, and crisis
       └─ records history for analytics, export, reflection, and replay
```

The browser is the system of record for a campaign. The app does not require a database or login for normal play.

## Application layers

| Area | Main files | Responsibility |
| --- | --- | --- |
| App shell | `app/layout.tsx`, `app/page.tsx`, `app/globals.css` | Metadata, global styling, landing page, and the start/resume entry point. |
| Game flow | `components/Game.tsx` | Owns the client-only screen flow and connects UI callbacks to the stores. |
| Decision UI | `components/GameDecisionView.tsx`, `components/OperatingSystemControls.tsx`, `components/GameResultsModal.tsx` | Lets the learner select initiatives, allocate capital, receive results, address crises, and complete lifecycle reviews. |
| State | `stores/gameStore.ts`, `lib/game/state.ts`, `lib/game/persistence.ts` | Defines `GameState`, initializes a run, handles UI actions, validates/restores persisted state, and manages checkpoints. |
| Simulation engine | `lib/game/turnResolver.ts`, `lib/game/engine.ts` | Applies a decision to a state and produces the next state and an immutable quarterly snapshot. |
| Domain rules | `lib/game/*.ts` | Models capital, capacity, initiative maturity, effects, lifecycle, risk, scoring, forecasts, crises, and recommendations. |
| Scenario content | `lib/scenarios/*.ts` | Declares the four selectable business worlds and their metrics, initiatives, capacity rules, synergies, and crises. |
| Learning/reporting | `lib/analytics*.ts`, `lib/reflection.ts`, `lib/replay.ts`, `lib/counterfactual.ts`, `lib/exportGameplay.ts` | Translates historical data into dashboards, reflection, exported files, comparison runs, and deterministic replays. |
| Optional AI | `components/LLMSettings.tsx`, `stores/llmStore.ts`, `lib/llm/*`, `app/api/llm/*` | Supplies advisory chat via a selected external/local model. |

## A campaign from start to finish

1. `GameSetupScreen` collects the learner name, mode, scenario, currency, and campaign budget.
2. `GameAssessmentScreen` collects five baseline answers. `createInferredGeneration()` uses them to assign a starting archetype and seeded initiative-generation context.
3. `initialGameState()` creates the base campaign. If a scenario is selected, `initializeScenario()` replaces the relevant starting metrics, allocation, initiative set, and scenario progress state.
4. In the decision cockpit, the learner may select up to three delivery initiatives, choose lifecycle actions (`discover`, `pilot`, `scale`, `maintain`, `pause`, or `retire`), allocate operating investment, and release campaign capital.
5. `confirmDecisions()` calls `applyTurnDecision()`. It rejects invalid decisions with user-facing feedback; otherwise it resolves the quarter and changes the stage to `results`.
6. The results modal shows evidence, recommendations, reflections, lifecycle tasks, and—when generated—a crisis. A crisis response spends only available campaign capital.
7. `advanceQuarter()` blocks progression until required lifecycle reviews are complete. It creates a new decision checkpoint, or finishes the game after quarter 12.
8. `GameDoneScreen` presents the verdict, retrospective, replay notebook, and counterfactual lab. Starting again clears campaign state but retains browser-level settings unless all data is reset.

## How a quarterly decision is resolved

`lib/game/turnResolver.ts` is the orchestration boundary for a turn.

1. It normalizes the incoming state so older save formats are safe to use.
2. It applies lifecycle reviews, deployment choices, and adaptation choices supplied with the decision.
3. It validates lifecycle eligibility, required capital, per-initiative allocation totals, and available operating capacity. Readiness is intentionally not a hard stop: constrained experiments are permitted and produce slower/riskier outcomes.
4. `calculateActionCapitalPlan()` prices discovery, delivery, scale-up, run/continuity, and retirement commitments. The campaign purse is the hard financial limit; the quarterly pace is guidance rather than a spending gate.
5. `resolveQuarter()` evolves initiative state, calculates portfolio dynamics and synergies, applies standard effects, and, for scenario campaigns, applies scenario-specific effects and progress.
6. The resolver updates the financial ledger, risk, campaign budget remaining, score breakdown, causal chain, recommendation list, and history.
7. On eligible quarters, the seeded crisis roll may create a scenario-authored or generated crisis. The seed means identical state and decisions produce identical results.

### Core game concepts

- **Initiative state:** Each initiative tracks lifecycle, maturity, investment, readiness, risk, adoption/value-related attributes, and evidence. `initiativeState.ts` updates these values.
- **Operating allocation:** Six buckets—`infra`, `data`, `people`, `mlops`, `compliance`, and `innovation`—must form a valid portfolio mix. The learner can use one shared mix or custom per-initiative mixes.
- **Capital:** Financial tracking distinguishes investment, ongoing run cost, crisis cost, gross benefit, net benefit, cumulative values, realised ROI, and payback.
- **Capacity and readiness:** `capacity.ts` supplies hard capacity gates. `readiness.ts` and lifecycle rules shape the delivery multiplier/risk penalty of an allowed experiment.
- **Portfolio dynamics:** Up to three concurrent delivery initiatives are evaluated for focus, breadth, coordination pressure, concentration risk, and optional initiative synergies.
- **Score:** `scoring.ts` combines realised financial value, operating health, execution discipline, responsible AI, validated learning, and scenario progress where applicable.

## Scenarios and standard mode

`lib/scenarios/registry.ts` exposes four scenario packs:

- `projectFactory` — default manufacturing/project-factory scenario.
- `bankNext` — banking context.
- `care360` — healthcare context.
- `futureReady` — workforce/future-readiness context.

A scenario implements the `ScenarioDefinition` contract in `lib/scenarios/types.ts`. It can provide a company context, challenges, starting state, progress definitions, initiative catalogue, capacity rules, lifecycle profile, synergies, crises, currency, and advisor context. Standard mode instead uses the seeded generic initiative catalogue from `lib/game/generator.ts` and `lib/game/initiatives.ts`.

## Persistence, reproducibility, and exports

Zustand persistence writes normalized `GameState` data to `localStorage` under `ai-investment-game`. `persistence.ts` also supports legacy saves, versioned migration, manual/automatic decision checkpoints, and a what-if draft. It deliberately validates and fills missing fields before reusing a saved state.

Each run carries seed and rules-version metadata. `counterfactual.ts` records decisions and crisis responses as an executable trace; replaying a trace runs the same deterministic resolver without mutating the original. `replay.ts` stores completed campaign summaries for comparisons, while `exportGameplay.ts` exports the current campaign as text, Markdown, CSV, or JSON.

## Analytics and learning features

The UI is composed from focused presentational components rather than a routing tree of separate pages. Common examples are:

- `AnalyticsHub` and `MagicAnalytics` use `analytics.ts` and `analyticsViewModel.ts` for trends, KPI views, forecasts, budgets, and framework views.
- `DecisionDashboardVisuals`, `StrategySimulator`, and `DecisionCoach` expose decision consequences before commitment.
- `ReflectionCard`, `ExperimentReflection`, and `YouSaidYouDid` compare baseline beliefs with observed behavior and outcomes.
- `BoardAdvisor` has a deterministic, evidence-based local answer from `boardAdvisor.ts`; this keeps advice available even without a network connection.

## API routes and optional LLM use

| Route | Purpose | Notes |
| --- | --- | --- |
| `POST /api/game/whatif` | Compares a current and alternative people/compliance allocation. | A lightweight heuristic endpoint; it does not alter campaign state. |
| `POST /api/llm/chat` | Proxies advisor-chat requests to OpenAI, Gemini, Claude, OpenCode, Ollama, or an OpenAI-compatible local endpoint. | Credentials and provider/model settings are read from the browser’s LLM settings store and sent with the request. |
| `POST /api/llm/test` | Sends a fixed connection test to the selected provider. | Used to verify settings. |
| `POST /api/advisor` | Legacy/direct OpenAI board-advisor route. | Uses `OPENAI_API_KEY` if configured and otherwise returns a built-in fallback. |

The live UI first renders a deterministic advisor answer and then appends an optional LLM perspective if the request succeeds. LLM output is advisory text only; it does not enter the game-engine calculation.

The environment variables documented in `.env.example` (`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TEMPERATURE`, and `OPENAI_MAX_TOKENS`) apply to the direct advisor route. The core simulation works without them.

## Testing and local development

```bash
npm install
npm run dev
npm run type-check
npm test
npm run test:e2e
npm run build
```

Unit and integration-style tests use Node’s built-in test runner with a small TypeScript require hook. They cover deterministic resolution, lifecycle/capital/capacity rules, scoring, persistence migration, scenarios, counterfactual replay, analytics view models, and SEO metadata. Playwright runs the end-to-end campaign flow against the local development server.

## Where to make changes

- Add or change a business-world scenario: start with `lib/scenarios/types.ts`, then add/update the scenario module and `scenarioRegistry`.
- Change the meaning of a decision or quarter outcome: work in `turnResolver.ts` and the relevant focused rule module, then update engine tests.
- Change campaign state or a persisted field: update `state.ts`, `persistence.ts`, and corresponding store/UI consumers together.
- Change the experience of setup, decision, results, or completion: start with `components/Game.tsx`, then the screen/component responsible for that stage.
- Add a new AI provider: update `LLMProvider`, `providerDefaults`, and `lib/llm/providers.ts`; keep its response isolated from the deterministic resolver.

## Important implementation boundaries

- Keep game calculations in `lib/game` pure and deterministic. Components and route handlers should orchestrate or display results, not implement rules.
- Treat persisted browser data as untrusted. Use `normalizeGameState()` before deriving rules or displaying legacy state.
- Preserve the separation between a **portfolio decision** (selection and lifecycle) and an **advisory suggestion** (recommendations or LLM text).
- The `supabase/schema.sql` file is future-facing; no current runtime path depends on Supabase.
