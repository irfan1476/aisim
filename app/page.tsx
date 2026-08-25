"use client";

import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  FileText,
  Gauge,
  GitBranch,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import Game from "../components/Game";
import TransparencyFlow from "../components/TransparencyFlow";
import HowToPlayGuide from "../components/HowToPlayGuide";
import LearningLoopVisual from "../components/LearningLoopVisual";
import CampaignEvidenceReplayVisual from "../components/CampaignEvidenceReplayVisual";
import {
  hasCampaignProgress,
  readPersistedGameState,
} from "../lib/game/persistence";
import { scenarioList } from "../lib/scenarios/registry";

const features = [
  [
    Target,
    "Choose a world, then a thesis",
    "Start in open Standard mode or choose an operating environment. The core decision loop stays consistent while the pressures, initiatives, measures, crises, and success conditions change.",
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
    "Living system",
    "Capital, initiative maturity, readiness, risk, and reserve carry forward. The next decision begins where the previous one left you.",
  ],
  [
    FileText,
    "Decision evidence",
    "Every quarter leaves a readable record: what you chose, deployed, deferred, changed, and learned—so outcomes are explainable rather than mysterious.",
  ],
  [
    History,
    "Replay laboratory",
    "Save or export the campaign, keep the context steady, change one decision pattern, and compare the evidence from a more deliberate next run.",
  ],
];
const steps = [
  [
    ClipboardList,
    "Set the context and capital",
    "Start",
    "Choose an operating environment, set a finite campaign purse, and answer five baseline questions.",
  ],
  [
    Target,
    "Shape the quarter",
    "Decide",
    "Select zero to three bets, choose what to deploy now, and support the operating conditions around them.",
  ],
  [
    BarChart3,
    "Preview, resolve, and explain",
    "Observe",
    "Preview the trade-off, resolve the quarter, and see the evidence behind what changed.",
  ],
  [
    RefreshCw,
    "Reflect, compare, and adapt",
    "Reflect",
    "Use the final report, saved record, and replay comparison to test a stronger thesis.",
  ],
];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [resumeRequested, setResumeRequested] = useState(false);

  useEffect(() => {
    const persisted = readPersistedGameState();
    setResumeAvailable(Boolean(persisted && hasCampaignProgress(persisted)));
  }, []);

  const startSimulation = () => {
    setResumeRequested(false);
    setStarted(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const resumeSimulation = () => {
    setResumeRequested(true);
    setStarted(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  if (started) return <Game resume={resumeRequested} />;
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
            type="button"
            onClick={startSimulation}
            className="mt-9 flex items-center gap-4 rounded-md bg-[#08872b] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#08872b]/20 transition hover:-translate-y-0.5 hover:bg-[#077324]"
          >
            Choose your simulation <ArrowRight size={17} />
          </button>
          {resumeAvailable && (
            <button
              type="button"
              onClick={resumeSimulation}
              className="mt-3 block text-left text-sm font-semibold text-[#1f2328] underline decoration-[#08872b]/40 underline-offset-4 transition hover:text-[#08872b]"
            >
              Resume saved campaign
            </button>
          )}
          <a href="#simulation" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1f2328] underline decoration-[#08872b]/40 underline-offset-4">
            See how the learning loop works <ArrowRight size={15} />
          </a>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#656d76]">
            No account required · 12 quarters · 20–30 minutes
          </p>
        </div>
        <div className="relative reveal">
          <div className="absolute -inset-10 rounded-full bg-[#08872b]/10 blur-3xl" />
          <div className="homepage-record-card relative overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] p-7 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#3fb950]">
                  A living decision record
                </p>
                <p className="mt-1 text-xl font-semibold">
                  Make choices worth learning from.
                </p>
              </div>
              <span className="rounded-md bg-[#3fb950]/15 px-3 py-1 text-xs font-bold text-[#3fb950]">
                12 quarters
              </span>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ["01", "Choose a context", "Open practice or an operating environment"],
                ["02", "Set your pace", "Deploy capital now or keep a reserve"],
                ["03", "Read the evidence", "See capability, pressure, and trade-offs move"],
                ["04", "Replay with intent", "Compare one changed strategic thesis"],
              ].map(([number, title, copy], index) => (
                <div key={title} className={`rounded-lg border p-4 ${index === 3 ? "border-[#3fb950]/40 bg-[#3fb950]/10" : "border-white/10 bg-[#161b22]"}`}>
                  <p className="text-[10px] font-bold tracking-[.18em] text-[#3fb950]">{number}</p>
                  <p className="mt-2 font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{copy}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/75">
              <FileText className="shrink-0 text-[#3fb950]" size={20} />
              <span>Finish with a personalised strategy report—not just a score.</span>
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
              Begin with open practice or select an operating environment. The
              decision loop is consistent; the challenge you uncover is not.
            </p>
          </div>
          <div className="mt-10 grid overflow-hidden rounded-2xl border border-[#d0d7de] md:grid-cols-2">
            <article className="bg-white p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#656d76]">Standard mode</p>
              <h3 className="mt-3 text-2xl font-bold">Build your own thesis.</h3>
              <p className="mt-2 text-sm leading-6 text-[#656d76]">Open practice with the full capital, initiative, evidence, and replay loop.</p>
            </article>
            <article className="border-t border-[#d0d7de] bg-[#ddf4ff] p-6 md:border-l md:border-t-0 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#0969da]">Scenario mode</p>
              <h3 className="mt-3 text-2xl font-bold">Lead in a new context.</h3>
              <p className="mt-2 text-sm leading-6 text-[#57606a]">A different organisation changes the evidence, pressure system, and final diagnosis—not your agency.</p>
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
                Scenario mode is optional. Pick a world now; discover its
                pressure system and possible paths through play.
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
                  <p className="mt-2 text-sm leading-6 text-[#656d76]">A {scenario.industry.toLowerCase()} operating environment with its own evidence, trade-offs, and final diagnosis.</p>
                  <p className="mt-5 border-t border-[#d0d7de] pt-4 text-xs font-bold uppercase tracking-wider text-[#0969da]">Discover the pressure system in play</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-xs leading-5 text-[#656d76]">Select a scenario and campaign purse before the baseline assessment. Your answers shape starting conditions; the chosen environment supplies the operating challenge.</p>
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
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {[
              ["Flexible capital", "Deploy what supports the quarter; preserve reserve for later."],
              ["Living choices", "Funded and neglected initiatives carry their condition forward."],
              ["Explainable outcome", "See direct evidence, reflective models, and your next experiment."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-xl border border-[#d0d7de] bg-white p-5">
                <p className="font-bold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[#656d76]">{copy}</p>
              </div>
            ))}
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
            <div className="mt-9 grid gap-3 md:grid-cols-3">
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
                ["12", "connected quarters"],
                ["0–3", "initiative choices"],
                ["4", "optional scenarios"],
                ["1", "saved evidence record"],
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
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">Your decision workspace</p>
            <h3 className="mt-3 text-3xl font-bold tracking-[-.03em]">Three moments. The right evidence at each one.</h3>
            <div className="mt-8 grid overflow-hidden rounded-2xl border border-[#d0d7de] md:grid-cols-3">
              {[
                [Target, "Before you commit", "Decision Coach and What-If make the possible trade-off visible. Suggestions are editable starting points—not automatic decisions.", "bg-[#fff8c5]"],
                [BarChart3, "After the quarter", "Analytics, causal explanations, history, and the Board Advisor help separate direct outcomes from reflective modelled views.", "bg-[#ddf4ff]"],
                [History, "Across replays", "The final report, saved campaign record, and comparison tools turn a completed run into a more intentional next experiment.", "bg-[#dafbe1]"],
              ].map(([Icon, title, copy, tone], index) => {
                const ToolIcon = Icon as typeof Target;
                return (
                  <article key={title as string} className={`p-6 ${tone as string} ${index > 0 ? "border-t border-[#d0d7de] md:border-l md:border-t-0" : ""}`}>
                    <ToolIcon size={22} className="text-[#08872b]" />
                    <h4 className="mt-4 text-xl font-bold">{title as string}</h4>
                    <p className="mt-2 text-sm leading-6 text-[#57606a]">{copy as string}</p>
                  </article>
                );
              })}
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
            type="button"
            onClick={startSimulation}
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
          <CampaignEvidenceReplayVisual className="mt-8" />
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
              A sidecar that helps you see, not second-guess.
            </h3>
            <p className="mt-3 max-w-2xl leading-7 text-[#656d76]">Live outcomes stay distinct from forecast and framework views, so the learner can tell what happened from what is being interpreted.</p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {[
                ["Live record", "Capital, reserve, initiative condition, scenario outcomes, and the decision ledger."],
                ["Interpretation", "Trends, diagnostics, causal evidence, and clearly labelled modelled outlooks."],
                ["Reflection", "Recommendations, the final report, and a concrete next experiment for the replay."],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="rounded-xl border border-[#d0d7de] bg-white p-5 shadow-sm"
                >
                  <BarChart3 size={19} className="text-[#08872b]" />
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
            type="button"
            onClick={startSimulation}
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
