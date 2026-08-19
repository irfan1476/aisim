# The AI Investment Challenge

A guest-play, single-player executive simulation for practicing AI investment decisions. The MVP includes the complete 12-quarter Project Factory 2030 scenario, initiative portfolio selection, budget allocation, metrics, board advisor personas, crisis events, local save/load, a baseline mindset assessment, experimental practice mode, progressive learning cues, adaptive advisor feedback, and a final CEO verdict.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The app works without environment variables: advisor responses use a built-in fallback. Add `OPENAI_API_KEY` to enable live advisor responses. No database is required for the MVP; state is stored in the browser via localStorage. `supabase/schema.sql` is included for a future persistence layer.

## Quality checks

```bash
npm run type-check
npm run lint
npm run build
```

GitHub Actions runs these checks on pushes and pull requests. The Vercel deployment workflow expects `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` repository secrets.

## Vercel

Import the repository into Vercel and use the default Next.js build settings. Add `OPENAI_API_KEY` (and optional model/temperature/token variables) under Project Settings → Environment Variables. Deploy with `npm run build` locally before publishing.

## Product notes

The simulation is intentionally self-paced for classroom use. Scores and saves are local to the browser. A `/api/game/whatif` endpoint is included for alternative budget comparisons, and `lib/analytics.ts` contains reusable trend, traffic-light, and human-capital calculations. Authentication, persistent leaderboards, additional scenarios, PDF export, and a full charting suite remain Phase 2 features.
