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
import LearningLoopVisual from "../components/LearningLoopVisual";
import {
  hasCampaignProgress,
  readPersistedGameState,
} from "../lib/game/persistence";
import { scenarioList } from "../lib/scenarios/registry";

const features = [
  [
    Target,
    "Choose a world, then a thesis",
    "Start in open Standard mode or lead a manufacturing, banking, healthcare, or education organisation. The core decision loop stays consistent while the pressures, initiatives, metrics, crises, and success conditions change.",
  ],
  [
    Gauge,
    "Capital is a campaign decision",
    "Set a finite campaign purse, choose how much to deploy this quarter, and keep the remainder for later. You may fund zero, one, two, or three initiatives—depth, breadth, timing, and reserve all have consequences.",
  ],
  [
    GitBranch,
    "Preview before you commit",
    "The Decision Coach turns the live state into a readable preview: what your selection, deployment, and operating allocation could improve, constrain, or leave exposed. Apply a suggestion, then adjust it yourself.",
  ],
  [
    BrainCircuit,
    "Reflect with evidence",
    "The Board Advisor answers from the current campaign even without an LLM. Ask about a bottleneck, reserve, risk, people, data, or portfolio mix; a connected model can add an optional perspective.",
  ],
];
const moats = [
  [
    Sparkles,
    "A replayable decision laboratory",
    "A campaign keeps its initiative conditions, scenario state, funding history, and results. Replaying is a deliberate experiment: hold a thesis steady, change one decision, and compare what followed.",
  ],
  [
    RefreshCw,
    "A stateful operating system",
    "This is one connected campaign, not twelve quiz questions. Every initiative carries maturity, cumulative spend, readiness, human effort, cost, ROI, risk, and neglect into the next decision.",
  ],
  [
    GitBranch,
    "Scenario-native, not merely reskinned",
    "Each domain has its own operating pressures, success metrics, initiative catalogue, crisis context, targets, and advisory language. Analytics use those domain outcomes as the primary signal.",
  ],
  [
    Gauge,
    "Consequences you can inspect",
    "Causal explanations, budget ledgers, initiative roadmaps, history, diagnostics, and recommendations make a result traceable. The engine resolves the values you saw before confirming the quarter.",
  ],
  [
    BrainCircuit,
    "Guidance without surrendering agency",
    "Coach previews and board questions are grounded in live state. Suggestions can pre-fill a portfolio, deployment, and operating allocation, but the learner always sees and edits the decision before it is resolved.",
  ],
  [
    History,
    "A strategy autopsy, not just a score",
    "The final report connects the rating to allocation patterns, capital pace, initiative choices, scenario progress, risk, causal evidence, and a practical route to improve the next run.",
  ],
];
const steps = [
  [
    ClipboardList,
    "Set the context and capital",
    "2 minutes",
    "Choose Standard mode or a domain scenario, set a finite campaign purse, and answer five baseline questions. Your answers shape the starting organisation, data, and team conditions without forcing a strategy label.",
  ],
  [
    Target,
    "Shape the quarter",
    "5 minutes per quarter",
    "Read the current initiative conditions, select zero to three bets, decide how much of the campaign purse to deploy now, and distribute the operating allocation across the capabilities that make the bets work.",
  ],
  [
    BarChart3,
    "Preview, resolve, and explain",
    "Immediate feedback",
    "Use the Decision Coach or Board Advisor before committing. The engine then resolves the exact conditions shown, explaining how funding, operating investment, neglect, and combinations changed the portfolio and domain pressures.",
  ],
  [
    RefreshCw,
    "Reflect, compare, and adapt",
    "Across 12 quarters",
    "Review the causal chain, roadmap, scenario-native analytics, recommendations, and replay notebook. The final strategy autopsy turns all twelve quarters into evidence for your next campaign.",
  ],
];
const tools = [
  [
    BrainCircuit,
    "Evidence Board Advisor",
    "Ask CFO, CTO, CHRO, or Risk questions grounded in the live campaign. It produces an evidence-based answer without an LLM; a configured cloud or local model can add a separate perspective.",
    "Choose a persona, select a question or type your own, then use the evidence to challenge your decision.",
    "Decision window → Board advisor",
  ],
  [
    BarChart3,
    "Scenario-native Analytics Hub",
    "Live scorecards lead with the active scenario’s pressures and targets, alongside capital pace, initiative spend, KPIs, trends, diagnostics, history, and learning views.",
    "Open Analytics after a decision or whenever you need to check the evidence.",
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
    "Decision Coach + What-If",
    "Preview portfolios, deployment amounts, operating allocation, risk, reward, and reserve before committing. Apply a useful suggestion as an editable starting point.",
    "Use the Decision Coach first, then open Strategy Simulator when you want to compare alternatives.",
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
            Lead a living 12-quarter transformation across open play or four
            domain scenarios. Set the campaign purse, choose your deployment
            pace, see capability and risk respond, and learn from the record
            your decisions create.
          </p>
          <button
            onClick={() => setStarted(true)}
            className="mt-9 flex items-center gap-4 rounded-md bg-[#08872b] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#08872b]/20 transition hover:-translate-y-0.5 hover:bg-[#077324]"
          >
            Choose your simulation <ArrowRight size={17} />
          </button>
          <a href="#simulation" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1f2328] underline decoration-[#08872b]/40 underline-offset-4">
            See how the learning loop works <ArrowRight size={15} />
          </a>
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
                  A campaign, not a quiz
                </p>
                <p className="mt-1 text-xl font-semibold">
                  Choose a world. Set your capital pace.
                </p>
              </div>
              <span className="rounded-md bg-[#3fb950]/15 px-3 py-1 text-xs font-bold text-[#3fb950]">
                0–3 bets
              </span>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                ["Standard mode", "Open play", "Project Factory"],
                ["BankNext", "Banking", "Fraud + trust"],
                ["Care360", "Healthcare", "Access + safety"],
                ["FutureReady", "Education", "Engagement + skills"],
              ].map(([a, b, c]) => (
                <div
                  key={a}
                  className="rounded-lg border border-white/10 bg-[#161b22] p-4"
                >
                  <p className="text-xs text-white/45">{a}</p>
                  <p className="mt-2 text-lg font-semibold">{b}</p>
                  <p className="mt-1 text-xs font-bold text-[#3fb950]">{c}</p>
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
                    “Your reserve and people allocation both protect the next
                    constraint. What evidence would justify deploying more now?”
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
              One decision engine. Multiple worlds to lead.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#656d76]">
              Start in Standard mode for open-ended practice, or choose a
              domain-specific scenario. The decision loop stays consistent;
              the organisation, pressures, initiatives, metrics, crisis context,
              targets, and advisory evidence change with the world you lead.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-[#d0d7de] bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#656d76]">Standard mode</p>
              <h3 className="mt-3 text-2xl font-bold">Build your own thesis.</h3>
              <p className="mt-2 text-sm leading-6 text-[#656d76]">
                The original Project Factory practice lab stays open-ended. Set
                your own campaign purse, then use the same flexible deployment,
                initiative evolution, coaching, analytics, and final autopsy as
                every scenario.
              </p>
            </article>
            <article className="rounded-2xl border border-[#54aeff]/40 bg-[#ddf4ff] p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#0969da]">Scenario mode</p>
              <h3 className="mt-3 text-2xl font-bold">Lead inside a real pressure system.</h3>
              <p className="mt-2 text-sm leading-6 text-[#57606a]">
                Choose a domain with its own organisation, pressures, metrics,
                initiatives, crisis context, targets, and advisor evidence. Your
                progress is measured against that world without replacing the
                core learning loop.
              </p>
            </article>
          </div>
          <div className="mt-12 rounded-3xl border border-[#d0d7de] bg-[#f6f8fa] p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.25em] text-[#0969da]">
                  Choose your challenge
                </p>
                <h3 className="mt-3 text-2xl font-bold tracking-[-.03em]">
                  Four domains. One reflective leadership loop.
                </h3>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#656d76]">
                Scenario mode is optional. Pick a world, set a finite campaign
                purse, deploy when the evidence supports it, and learn how a
                focused or broad portfolio changes its real pressures.
              </p>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {scenarioList.map((scenario) => (
                <article
                  key={scenario.id}
                  className="rounded-2xl border border-[#d0d7de] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#54aeff] hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl" aria-hidden="true">{scenario.icon}</span>
                    <span className="rounded-full bg-[#ddf4ff] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0969da]">
                      {scenario.industry}
                    </span>
                  </div>
                  <h4 className="mt-5 text-lg font-bold">{scenario.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#656d76]">
                    {scenario.description}
                  </p>
                  <div className="mt-5 border-t border-[#d0d7de] pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#656d76]">
                      You will balance
                    </p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#1f2328]">
                      {scenario.challenges.slice(0, 3).map((challenge) => challenge.label).join(" · ")}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-[#656d76]">
                      <span className="rounded-full bg-[#f6f8fa] px-2 py-1">{scenario.difficulty}</span>
                      <span className="rounded-full bg-[#f6f8fa] px-2 py-1">default pace {scenario.currency.defaultSymbol}{scenario.startingState.budget} {scenario.currency.defaultLabel}</span>
                      <span className="rounded-full bg-[#f6f8fa] px-2 py-1">6 initiatives</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-6 text-xs leading-5 text-[#656d76]">
              Select a scenario and campaign purse before the baseline
              assessment. Your answers still shape the starting conditions while
              the chosen domain supplies the operating challenge and its native
              measures of progress.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-[#d0d7de] pt-5 text-xs font-bold text-[#1f2328]">
              {[
                "Choose a mode",
                "Answer five questions",
                "Set a campaign purse",
                "Deploy 0–3 initiatives",
                "Balance the operating system",
                "Resolve, reflect, replay",
              ].map((label, index) => (
                <span key={label} className="flex items-center gap-2">
                  <span className="rounded-full bg-[#1f2328] px-2 py-1 text-white">{index + 1}</span>
                  {label}
                  {index < 5 && <ArrowRight size={14} className="text-[#0969da]" />}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#d0d7de] bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#656d76]">Always included</p>
              <ul className="mt-4 grid gap-2 text-sm leading-6 text-[#57606a]">
                <li>• Five baseline questions, twelve connected quarters, and a finite campaign purse</li>
                <li>• Flexible deployment: fund zero, one, two, or three initiatives and carry reserve forward</li>
                <li>• Operating allocation, initiative evolution, responsive risk, crises, and trade-offs</li>
                <li>• Decision Coach, causal explanations, Board Advisor, analytics, replay comparison, and final autopsy</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#54aeff]/40 bg-[#ddf4ff] p-6">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#0969da]">Scenario mode adds</p>
              <ul className="mt-4 grid gap-2 text-sm leading-6 text-[#57606a]">
                <li>• A domain-specific organisation, pressure system, and initiative catalogue</li>
                <li>• Native outcome metrics, targets, constraints, and scenario progress</li>
                <li>• Domain crisis context and evidence tailored for the Board Advisor</li>
                <li>• Scenario-native analytics and a final performance diagnosis</li>
              </ul>
            </div>
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
                The defensible value is the connected learning system: a finite
                capital runway, persistent initiative state, scenario-native
                pressures, responsive risk, explainable outcomes, and a final
                diagnosis drawn from the complete decision record.
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
              Every tool has a different job: inspect the current state, test a
              decision, explain what changed, or compare this campaign with the
              next attempt. They are designed to make reflection practical, not
              to make the decision for you.
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
                    Experiment without real-world consequences. Deliberately
                    keep a reserve, concentrate on one initiative, spread across
                    three, or change your operating allocation—then replay the
                    campaign to compare the strategic consequences.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ["Confidence builder", "Practice evidence-led boardroom conversations"],
                ["Strategic compass", "Test capital pace and portfolio theses"],
                ["Replay notebook", "Compare attempts and learn from the difference"],
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
              You choose the operating world and capital runway—not a flattering
              strategy label. Your baseline shapes the starting conditions;
              every quarter then changes initiative capability, risk, cost,
              reserve, and momentum. The campaign remembers what you funded,
              deferred, neglected, and discovered.
            </p>
          </div>
          <div className="mt-10">
            <LearningLoopVisual />
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
              Analytics that explain the campaign you are actually running.
            </h3>
            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["Live scenario state", "See the active domain pressures, target progress, capital remaining, and pace."],
                ["Trends", "Follow portfolio and scenario-native metric movement; forecasts are labelled as modelled outlooks."],
                ["Diagnostics", "Trace weak outcomes to evidence, the last completed decision, and the next constraint."],
                ["Frameworks", "Use BCG, McKinsey, and PwC lenses as reflective models alongside the direct scenario outcomes."],
                [
                  "Capital and campaign memory",
                  "See what was deployed, kept in reserve, funded, deferred, and learned.",
                ],
                ["Coach and recommendations", "Turn evidence into an editable next-quarter starting point."],
                [
                  "Initiative evolution",
                  "Track maturity, cumulative spend, ROI, data, risk, and neglect.",
                ],
                [
                  "Causal chain",
                  "Connect initiative choices, deployment, and operating allocation to measurable consequences.",
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
                  Preview alternative portfolios, deployment amounts, operating
                  allocations, risk, reward, and reserve use before committing.
                  Compare the outcomes, save a useful draft, and apply it as an
                  editable starting point for your next decision.
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
                  Build evidence, capability, and an intentional capital pace
                </span>
              </p>
              <p>
                <b className="text-[#3fb950]">Quarters 5–8</b>
                <span className="block mt-1 text-white/60">Scale what is working; correct what is not</span>
              </p>
              <p>
                <b className="text-[#3fb950]">Quarters 9–12</b>
                <span className="block mt-1 text-white/60">
                  Consolidate value, resilience, and the final diagnosis
                </span>
              </p>
            </div>
            <p className="mt-6 text-sm text-white/60">
              Finish the journey for a CEO rating and strategy autopsy. The
              report explains the result through scenario progress, capital pace,
              allocation patterns, initiative choices, risk movement, causal
              evidence, and what to test differently on the next replay.
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
