"use client";

import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Gauge,
  GitBranch,
  History,
  LineChart,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import Game from "../components/Game";
import TransparencyFlow from "../components/TransparencyFlow";
import HowToPlayGuide from "../components/HowToPlayGuide";
import {
  hasCampaignProgress,
  readPersistedGameState,
} from "../lib/game/persistence";

const features = [
  [
    Target,
    "A living portfolio",
    "Every campaign starts with different initiative costs, returns, readiness, and risk. Consistent funding builds capability; neglect causes decay.",
  ],
  [
    Gauge,
    "Risk that responds",
    "Initiative and portfolio risk move continuously with maturity, governance, funding choices, and neglect—not just a static LOW, MED, or HIGH label.",
  ],
  [
    GitBranch,
    "Combinations you discover",
    "Some initiatives reinforce one another. Discover capability combinations through play and earn changes to ROI, adoption, risk, and delivery cost.",
  ],
  [
    BrainCircuit,
    "Evidence-based coaching",
    "Ask a cloud or local board advisor about current initiative maturity, spend, risk, and history, then receive a final strategy diagnosis grounded in all 12 quarters.",
  ],
];
const moats = [
  [
    Sparkles,
    "Strategy is inferred—not selected",
    "Players never choose a flattering label. The final pattern is inferred from baseline instincts, all 12 allocation decisions, initiative choices, risk trajectory, and discoveries—with a confidence score and closest alternative.",
  ],
  [
    RefreshCw,
    "A stateful operating system",
    "This is one continuous campaign, not 12 disconnected questions. Every initiative carries maturity, spend, readiness, human effort, cost, ROI, risk, and neglect into the next decision.",
  ],
  [
    GitBranch,
    "Consequences you can inspect",
    "The engine resolves the initiative values shown before confirmation. Baseline comparisons, causal chains, roadmaps, history, and diagnostics make the result explainable instead of mysterious.",
  ],
  [
    Gauge,
    "Balanced, not scripted",
    "The mechanics are calibrated across 600 seeded campaigns and six strategic patterns. Every path has a distinct trade-off, while no tested strategy dominates the field by more than 10 average score points.",
  ],
  [
    BrainCircuit,
    "AI guidance grounded in live state",
    "The board advisor can reason over current initiative economics, maturity, funding history, risk, allocations, recommendations, and discoveries—using cloud providers or a local Ollama model.",
  ],
  [
    History,
    "Replay creates deliberate practice",
    "Saved campaign memory and an evidence-based strategy autopsy make each replay a controlled leadership experiment: change the thesis, compare the outcome, and build judgment.",
  ],
];
const steps = [
  [
    ClipboardList,
    "Establish the context",
    "2 minutes",
    "Complete five baseline questions. They shape the hidden operating context and the campaign-specific initiative conditions—without asking you to choose a strategy type.",
  ],
  [
    Target,
    "Make the quarter decision",
    "5 minutes per quarter",
    "Read the current initiative values, choose up to three bets, allocate the six-part operating budget to exactly 100%, and test alternatives if needed.",
  ],
  [
    BarChart3,
    "Resolve the consequences",
    "Immediate feedback",
    "The engine resolves the same values you were shown. Funding changes maturity, data, people capability, cost, ROI, and risk; neglected initiatives begin to deteriorate.",
  ],
  [
    RefreshCw,
    "Learn and adapt",
    "Across 12 quarters",
    "Review the causal chain, roadmap, risk movement, discoveries, analytics, and recommendations. Your complete decision history shapes the final strategic pattern and CEO verdict.",
  ],
];
const tools = [
  [
    BrainCircuit,
    "Board Advisor + Ollama",
    "Ask CFO, CTO, CHRO, or Risk perspectives using a configured cloud or local model.",
    "Choose a provider, enter a model, and ask a question.",
    "Decision window → Board advisor",
  ],
  [
    BarChart3,
    "Analytics Hub",
    "Eight icon-led views keep live scorecards, KPIs, trends, diagnostics, frameworks, history, DNA, and learning available.",
    "Open Analytics at any point in the campaign.",
    "Always-on analysis panel",
  ],
  [
    Target,
    "Strategy DNA + KPIs",
    "See how choices shape leadership dimensions and transformation KPIs over time.",
    "Review DNA and KPI signals after each result.",
    "Analytics → DNA / KPIs",
  ],
  [
    Search,
    "Decision Heatmap",
    "Compare quarter-by-quarter metric intensity and spot momentum, trade-offs, and risk.",
    "Scan the color-coded grid and values.",
    "Analytics → Trends",
  ],
  [
    History,
    "Time Machine",
    "Revisit earlier decisions, metrics, initiatives, and historical comparisons.",
    "Move the quarter slider or expand a completed quarter.",
    "Analytics → History",
  ],
  [
    GitBranch,
    "What-If analysis",
    "Test portfolios, allocations, risk, reward, saved scenarios, and apply an approved draft.",
    "Open Strategy Simulator before committing.",
    "Decision window",
  ],
  [
    Gauge,
    "BCG 10-20-70",
    "Translate people, technology, and process investment into a strategic alignment score that influences outcomes.",
    "Review the framework scorecard and final result.",
    "Analytics → Frameworks",
  ],
  [
    LineChart,
    "Predictive forecasting",
    "Project the next three quarters from current ROI, adoption, data, people, and governance trajectory.",
    "Read the projection after each quarter.",
    "Analytics → Trends",
  ],
  [
    ShieldCheck,
    "Failure analysis",
    "Diagnose weak outcomes, identify the weakest capability, and connect it to a corrective action.",
    "Open diagnostics when a metric falls.",
    "Analytics → Diagnostics",
  ],
  [
    GitBranch,
    "Causal chain + recommendations",
    "Trace decisions to metric effects, then preview and approve the next recommendation.",
    "Read the results modal after submitting.",
    "Quarter results",
  ],
  [
    History,
    "Initiative evolution + roadmap",
    "Follow each initiative's maturity, cumulative spend, current ROI, data readiness, risk movement, and quarter-by-quarter funding history.",
    "Compare the live card against its campaign baseline, then review the roadmap and Evolution view after each quarter.",
    "Decision window / Analytics → History",
  ],
  [
    RefreshCw,
    "Reset and persistence",
    "Refresh safely, resume campaigns, reset a campaign, or erase all local data when you want a clean run.",
    "Use Campaign Tools in the analytics panel.",
    "Analytics → Campaign Tools",
  ],
];

export default function Home() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const persisted = readPersistedGameState();
    if (persisted && hasCampaignProgress(persisted)) setStarted(true);
  }, []);

  if (started) return <Game />;
  return (
    <main className="min-h-screen grid-bg">
      <nav className="sticky top-0 z-20 border-b border-white/10 bg-[#0d1117] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#08872b] text-sm font-bold">
              AI
            </span>
            <span className="text-sm font-bold tracking-[.12em]">
              THE AI INVESTMENT CHALLENGE
            </span>
          </a>
          <div className="hidden items-center gap-6 text-xs font-medium text-white/60 md:flex">
            <a href="#simulation" className="transition hover:text-white">
              The simulation
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#how-to-play" className="transition hover:text-white">
              How to play
            </a>
            <span className="rounded-md border border-white/20 px-3 py-2 text-white">
              Executive lab · 2026
            </span>
          </div>
        </div>
      </nav>
      <section
        id="top"
        className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-20 lg:grid-cols-[1.04fr_.96fr] lg:items-center"
      >
        <div className="reveal">
          <div className="mb-7 inline-flex items-center gap-2 rounded-md border border-[#08872b]/30 bg-[#08872b]/8 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#08872b]">
            <Sparkles size={14} /> A strategic practice lab
          </div>
          <h1 className="max-w-3xl text-6xl font-bold leading-[.98] tracking-[-.06em] text-[#1f2328] md:text-8xl">
            Practice AI leadership{" "}
            <span className="serif font-normal italic text-[#08872b]">
              before
            </span>{" "}
            you lead for real.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-[#656d76]">
            Run a living 12-quarter AI transformation where initiative economics
            vary, capabilities compound, risk mutates, and your strategic
            identity emerges from what you actually do.
          </p>
          <button
            onClick={() => setStarted(true)}
            className="mt-9 flex items-center gap-4 rounded-md bg-[#08872b] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#08872b]/20 transition hover:-translate-y-0.5 hover:bg-[#077324]"
          >
            Start your transformation <ArrowRight size={17} />
          </button>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#656d76]">
            No account required · 12 quarters · 20–30 minutes
          </p>
        </div>
        <div className="relative reveal">
          <div className="absolute -inset-10 rounded-full bg-[#08872b]/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] p-7 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#3fb950]">
                  Live board view
                </p>
                <p className="mt-1 text-xl font-semibold">
                  Project Factory 2030
                </p>
              </div>
              <span className="rounded-md bg-[#3fb950]/15 px-3 py-1 text-xs font-bold text-[#3fb950]">
                Q4 / 12
              </span>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                ["ROI", "42.8%", "+8.4%"],
                ["Adoption", "67%", "+12%"],
                ["Risk exposure", "24%", "−6%"],
                ["Data readiness", "76%", "+9%"],
              ].map(([a, b, c]) => (
                <div
                  key={a}
                  className="rounded-lg border border-white/10 bg-[#161b22] p-4"
                >
                  <p className="text-xs text-white/45">{a}</p>
                  <p className="mt-2 text-2xl font-semibold">{b}</p>
                  <p className="mt-1 text-xs font-bold text-[#3fb950]">
                    {c} this quarter
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-[#3fb950]/30 bg-[#3fb950]/10 p-4">
              <div className="flex gap-3">
                <BrainCircuit className="mt-1 text-[#3fb950]" size={20} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#3fb950]">
                    Board advisor · CFO
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    “Your people allocation is creating a faster path to value.
                    Can you defend the payback period to the board?”
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-7 flex items-end gap-2">
              {[16, 24, 20, 32, 40].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h * 4}px` }}
                  className={`flex-1 rounded-t-lg ${i === 4 ? "bg-[#3fb950]" : "bg-[#08872b]/60"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      <section
        id="simulation"
        className="scroll-mt-24 border-y border-[#d0d7de] bg-white"
      >
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">
              The simulation
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-.04em] md:text-6xl">
              You are the Chief AI Officer of a ₹2,500 Cr manufacturer.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#656d76]">
              Five plants. 7,000 employees. 24×7 production. Your mandate is to
              deliver AI value without losing the people or trust that make the
              business work.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {features.map(([Icon, title, copy]) => (
              <article key={title as string} className="github-card p-6">
                <Icon className="text-[#08872b]" size={24} />
                <h3 className="mt-5 text-xl font-bold">{title as string}</h3>
                <p className="mt-2 leading-7 text-[#656d76]">
                  {copy as string}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-20 overflow-hidden rounded-3xl bg-[#0d1117] p-7 text-white md:p-10">
            <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.25em] text-[#3fb950]">
                  Why this simulation is different
                </p>
                <h3 className="mt-4 text-4xl font-bold tracking-[-.04em]">
                  Built to develop judgment—not reward guessing.
                </h3>
              </div>
              <p className="max-w-2xl leading-7 text-white/65">
                The moat is the connected learning system: campaign variation,
                persistent initiative state, responsive risk, emergent
                combinations, explainable outcomes, and a diagnosis drawn from
                the complete decision record.
              </p>
            </div>
            <div className="mt-9 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {moats.map(([Icon, title, copy]) => (
                <article
                  key={title as string}
                  className="rounded-2xl border border-white/10 bg-[#161b22] p-5"
                >
                  <Icon className="text-[#3fb950]" size={21} />
                  <h4 className="mt-4 font-bold">{title as string}</h4>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {copy as string}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-7 md:grid-cols-4">
              {[
                ["600", "calibration campaigns"],
                ["6", "emergent patterns"],
                ["12", "connected quarters"],
                ["1", "evidence ledger"],
              ].map(([value, label]) => (
                <div key={label}>
                  <b className="text-3xl text-[#3fb950]">{value}</b>
                  <p className="mt-1 text-xs uppercase tracking-wider text-white/45">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">
              Your decision toolkit
            </p>
            <h3 className="mt-3 text-3xl font-bold tracking-[-.03em]">
              The strategic tools at your fingertips.
            </h3>
            <p className="mt-3 max-w-2xl leading-7 text-[#656d76]">
              Every tool answers a different leadership question. Use them when
              you need evidence, a second opinion, or a safer way to test a
              move.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tools.map(([Icon, title, copy, how, where], i) => (
                <article
                  key={title as string}
                  className={`rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${i % 4 === 0 ? "border-emerald-200 bg-emerald-50/60" : i % 4 === 1 ? "border-amber-200 bg-amber-50/60" : i % 4 === 2 ? "border-purple-200 bg-purple-50/60" : "border-sky-200 bg-sky-50/60"}`}
                >
                  <Icon size={22} className="text-[#08872b]" />
                  <h4 className="mt-4 font-bold">{title as string}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#656d76]">
                    {copy as string}
                  </p>
                  <p className="mt-4 text-xs leading-5">
                    <b>How:</b> {how as string}
                  </p>
                  <p className="mt-1 text-xs text-[#656d76]">
                    <b>Find it:</b> {where as string}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl bg-[#0d1117] p-7 text-white">
              <div className="flex gap-4">
                <ShieldCheck className="shrink-0 text-[#3fb950]" size={25} />
                <div>
                  <h3 className="text-xl font-bold">Safe to fail</h3>
                  <p className="mt-2 leading-7 text-white/65">
                    Experiment without real-world consequences. Learn from
                    mistakes, try again, and build the intuition to lead under
                    pressure.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["Confidence builder", "Practice boardroom conversations"],
                ["Strategic compass", "Test investment theses"],
                ["Decision lab", "Make mistakes safely"],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="rounded-xl border border-[#d0d7de] bg-[#f6f8fa] p-4"
                >
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm text-[#656d76]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="mt-10 flex items-center gap-3 rounded-md bg-[#08872b] px-6 py-4 text-sm font-bold text-white"
          >
            Start your transformation <ArrowRight size={17} />
          </button>
        </div>
      </section>
      <section id="how-it-works" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-.04em] md:text-6xl">
              Your strategy emerges through play.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#656d76]">
              There is no strategy mode to select. Your baseline shapes the
              starting conditions; every quarter then changes initiative
              capability, risk, cost, and momentum. The campaign remembers what
              you funded, neglected, and discovered.
            </p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-4">
            {steps.map(([Icon, title, time, copy], index) => (
              <article
                key={title as string}
                className="relative rounded-2xl border border-[#d0d7de] bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#08872b]/10 font-bold text-[#08872b]">
                    {index + 1}
                  </span>
                  <Icon className="text-[#08872b]" size={24} />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#656d76]">
                  {time as string}
                </p>
                <h3 className="mt-2 text-xl font-bold">{title as string}</h3>
                <p className="mt-3 text-sm leading-6 text-[#656d76]">
                  {copy as string}
                </p>
                {index < 3 && (
                  <ArrowRight
                    className="absolute -right-3 top-1/2 hidden text-[#08872b] lg:block"
                    size={20}
                  />
                )}
              </article>
            ))}
          </div>
          <TransparencyFlow />
          <div className="mt-16">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">
              Always-on analysis
            </p>
            <h3 className="mt-3 text-3xl font-bold">
              Analytics and insights, available when you need them.
            </h3>
            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["Live dashboard", "See your current scorecard at a glance."],
                ["Trends", "Follow metric movement and forecasts."],
                ["Diagnostics", "Find the reason behind weak outcomes."],
                ["Frameworks", "View BCG, McKinsey, and PwC lenses."],
                [
                  "Campaign memory",
                  "See what was funded, neglected, and learned.",
                ],
                ["Recommendations", "Turn evidence into your next move."],
                [
                  "Initiative evolution",
                  "Track maturity, spend, ROI, data, and risk.",
                ],
                [
                  "Causal chain",
                  "Connect decisions to measurable consequences.",
                ],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-sm"
                >
                  <Users size={19} className="text-[#08872b]" />
                  <h4 className="mt-3 font-bold">{title}</h4>
                  <p className="mt-1 text-sm leading-6 text-[#656d76]">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-[#d0d7de] bg-white p-7">
            <div className="flex items-start gap-4">
              <GitBranch className="mt-1 text-[#08872b]" size={24} />
              <div>
                <h3 className="text-xl font-bold">
                  Strategy Simulator: test before you commit.
                </h3>
                <p className="mt-2 leading-7 text-[#656d76]">
                  Preview alternative portfolios, explore What-If outcomes,
                  compare risk and reward, save a strategy, and apply it to your
                  next decision.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 rounded-2xl bg-[#0d1117] p-7 text-white">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-[#3fb950]" />
              <h3 className="text-xl font-bold">Your transformation journey</h3>
            </div>
            <div className="mt-6 grid gap-4 text-sm md:grid-cols-3">
              <p>
                <b className="text-[#3fb950]">Quarters 1–4</b>
                <span className="block mt-1 text-white/60">
                  Foundation building
                </span>
              </p>
              <p>
                <b className="text-[#3fb950]">Quarters 5–8</b>
                <span className="block mt-1 text-white/60">Scaling impact</span>
              </p>
              <p>
                <b className="text-[#3fb950]">Quarters 9–12</b>
                <span className="block mt-1 text-white/60">
                  Transformation complete
                </span>
              </p>
            </div>
            <p className="mt-6 text-sm text-white/60">
              Finish the journey to earn your CEO rating: A+ Transformation
              Leader · A Strategic Driver · B+ Capable Executor · B Developing
              Practitioner. Your strategic pattern is revealed only after the
              full campaign.
            </p>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="mt-10 flex items-center gap-3 rounded-md bg-[#08872b] px-6 py-4 text-sm font-bold text-white"
          >
            Start your transformation <ArrowRight size={17} />
          </button>
        </div>
      </section>
      <HowToPlayGuide />
    </main>
  );
}
