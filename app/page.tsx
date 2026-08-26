"use client";

import {
  ArrowRight,
  BarChart3,
  FileText,
  GitBranch,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import Game from "../components/Game";
import LearningLoopVisual from "../components/LearningLoopVisual";
import CampaignEvidenceReplayVisual from "../components/CampaignEvidenceReplayVisual";
import {
  hasCampaignProgress,
  readPersistedGameState,
} from "../lib/game/persistence";
import { scenarioList } from "../lib/scenarios/registry";

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
          <div
            aria-label="Illustrative live campaign cockpit"
            className="homepage-cockpit relative overflow-hidden rounded-2xl border border-[#30363d] bg-[#0d1117] p-5 text-white shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#3fb950]">
                  Live campaign cockpit
                </p>
                <p className="mt-2 text-lg font-semibold sm:text-xl">
                  See the decision system respond.
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-[#3fb950]/15 px-3 py-1.5 text-xs font-bold text-[#7ee787]">
                Q4 / 12
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ["ROI", "+8.4%", "68%"],
                ["Adoption", "67%", "74%"],
                ["Risk", "24%", "32%"],
              ].map(([label, value, width]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-[#161b22] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-[.15em] text-white/55">{label}</p>
                    <span className="text-[9px] text-[#7ee787]">↗</span>
                  </div>
                  <p className="mt-2 text-base font-bold sm:text-lg">{value}</p>
                  <div className="mt-2 h-1 rounded-full bg-white/10">
                    <div className="h-1 rounded-full bg-[#3fb950]" style={{ width }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[.86fr_1.14fr]">
              <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/55">Operating pressures</p>
                  <span className="text-[10px] text-[#7ee787]">live</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    ["Capability", "Building", "72%"],
                    ["Adoption", "Watch", "58%"],
                    ["Reserve", "$42M available", "84%"],
                  ].map(([label, status, width]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-white/65">{label}</span>
                        <span className="font-semibold text-white">{status}</span>
                      </div>
                      <div className="mt-1.5 h-1 rounded-full bg-white/10">
                        <div className="h-1 rounded-full bg-[#3fb950]" style={{ width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#161b22] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/55">Campaign trajectory</p>
                    <p className="mt-1 text-xs text-white/65">Outcomes become evidence each quarter.</p>
                  </div>
                  <BarChart3 size={18} className="text-[#7ee787]" />
                </div>
                <svg
                  className="mt-3 h-24 w-full"
                  viewBox="0 0 240 100"
                  role="img"
                  aria-label="Illustrative trajectory rising from quarter one to quarter four"
                >
                  <path d="M8 82H232 M8 56H232 M8 30H232" stroke="rgba(255,255,255,.1)" strokeWidth="1" />
                  <path d="M8 64 C42 62, 63 57, 87 55 S134 47, 158 42 S202 34, 232 24" fill="none" stroke="#3fb950" strokeWidth="3" strokeLinecap="round" />
                  <path d="M8 48 C42 48, 67 47, 91 46 S137 44, 164 42 S205 41, 232 40" fill="none" stroke="rgba(126,231,135,.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                  {["8,64", "87,55", "158,42", "232,24"].map((point) => {
                    const [cx, cy] = point.split(",");
                    return <circle key={point} cx={cx} cy={cy} r="4" fill="#0d1117" stroke="#7ee787" strokeWidth="2" />;
                  })}
                </svg>
                <div className="flex justify-between text-[10px] text-white/45"><span>Q1</span><span>Q4</span></div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#3fb950]/30 bg-[#3fb950]/10 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="shrink-0 text-[#7ee787]" size={18} />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#7ee787]">Next decision</p>
                  <p className="mt-1 truncate text-sm font-semibold">Choose your next bets</p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#7ee787]">Review evidence <ArrowRight size={14} /></span>
            </div>
            <p className="mt-3 text-[10px] text-white/45">Example campaign state · compare the record, then replay with intent.</p>
          </div>
        </div>
      </section>
      <section id="simulation" className="scroll-mt-24 border-y border-[#d0d7de] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">Choose your practice world</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-.04em] md:text-5xl">One engine. Different pressures.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#656d76]">Open practice or a domain challenge. The rules stay legible; the operating context, evidence, and diagnosis change.</p>
          </div>

          <div className="mt-8 grid overflow-hidden rounded-2xl border border-[#d0d7de] md:grid-cols-2">
            <article className="bg-white p-6 md:p-7">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#656d76]">Standard mode</p>
              <h3 className="mt-2 text-2xl font-bold">Build your own thesis.</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[#656d76]">A clean practice environment for testing capital pace, portfolio breadth, and operating-system choices.</p>
            </article>
            <article className="border-t border-[#d0d7de] bg-[#e8f5ee] p-6 md:border-l md:border-t-0 md:p-7">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#08872b]">Scenario mode</p>
              <h3 className="mt-2 text-2xl font-bold">Lead in a real operating context.</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[#3d4b43]">A different organisation supplies its own pressures, measures, crises, and success conditions—without taking away your agency.</p>
            </article>
          </div>

          <div className="mt-8 rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] p-5 md:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">Four optional domains</p>
                <h3 className="mt-2 text-2xl font-bold tracking-[-.03em]">Discover the pressure system in play.</h3>
              </div>
              <p className="max-w-sm text-sm leading-6 text-[#656d76]">Pick a world, answer five baseline questions, and let the campaign reveal what matters.</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {scenarioList.map((scenario) => (
                <article key={scenario.id} className="min-w-0 rounded-xl border border-[#d0d7de] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#08872b] hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xl" aria-hidden="true">{scenario.icon}</span>
                    <span className="max-w-[75%] break-words rounded-full bg-[#e8f5ee] px-2 py-1 text-right text-[9px] font-bold uppercase tracking-wider text-[#08872b]">{scenario.industry}</span>
                  </div>
                  <h4 className="mt-4 break-words text-base font-bold">{scenario.name}</h4>
                  <p className="mt-1 text-sm leading-5 text-[#656d76]">A {scenario.industry.toLowerCase()} challenge with its own evidence trail.</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              ["Flexible capital", "Choose your purse, pace, and reserve."],
              ["Living choices", "Funded and neglected work carries forward."],
              ["Explainable outcomes", "See what changed and why it mattered."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-xl border border-[#d0d7de] bg-white p-5">
                <p className="font-bold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[#656d76]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-[#f6f8fa]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">How it works</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-.04em] md:text-5xl">Your strategy emerges through play.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#656d76]">Baseline answers set the opening hypothesis. Each quarter records your funding, operating mix, outcomes, and trade-offs—then carries the consequences into the next decision.</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
            <div className="min-w-0 overflow-hidden rounded-2xl bg-[#0d1117] p-6 text-white md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.22em] text-[#3fb950]">The living engine</p>
                  <h3 className="mt-2 text-2xl font-bold">Allocate. Observe. Reflect. Adapt.</h3>
                </div>
                <span className="shrink-0 rounded-full bg-[#3fb950]/15 px-3 py-1 text-xs font-bold text-[#7ee787]">12 quarters</span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["01", "Set the context", "Choose the world and capital runway."],
                  ["02", "Make the call", "Fund 0–3 bets and balance capability."],
                  ["03", "Read the response", "See direct outcomes and trade-offs."],
                  ["04", "Replay with intent", "Change a thesis and compare the record."],
                ].map(([number, title, copy]) => (
                  <div key={number} className="min-w-0 rounded-xl border border-white/10 bg-[#161b22] p-4">
                    <span className="text-[10px] font-bold tracking-[.2em] text-[#7ee787]">{number}</span>
                    <h4 className="mt-3 font-bold">{title}</h4>
                    <p className="mt-1 text-sm leading-5 text-white/60">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#d0d7de] bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#08872b]">The moats</p>
              <div className="mt-4 space-y-4">
                {moats.map(([Icon, title, copy]) => {
                  const ToolIcon = Icon as typeof Sparkles;
                  return <div key={title as string} className="flex gap-3"><ToolIcon className="mt-0.5 shrink-0 text-[#08872b]" size={20} /><div className="min-w-0"><h4 className="font-bold">{title as string}</h4><p className="mt-1 text-sm leading-5 text-[#656d76]">{copy as string}</p></div></div>;
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 overflow-hidden"><LearningLoopVisual /></div>
            <div className="rounded-2xl border border-[#d0d7de] bg-white p-6 md:p-7">
              <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">One connected record</p>
              <h3 className="mt-2 text-2xl font-bold">The campaign remembers.</h3>
              <p className="mt-2 text-sm leading-6 text-[#656d76]">Your decisions are not isolated turns. Initiative condition, reserve, risk, operating maturity, recommendations, and reflections remain visible as the campaign evolves.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[[FileText, "Decision ledger"], [BarChart3, "Live evidence"], [GitBranch, "Causal links"], [History, "Replay record"]].map(([Icon, label]) => { const ToolIcon = Icon as typeof FileText; return <div key={label as string} className="flex min-w-0 items-center gap-2 rounded-lg bg-[#f6f8fa] p-3 text-sm font-semibold"><ToolIcon className="shrink-0 text-[#08872b]" size={17} /><span className="break-words">{label as string}</span></div>; })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-to-play" className="scroll-mt-24 border-t border-[#d0d7de] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">How to play</p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-.04em] md:text-5xl">Play once. Learn more each time.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#656d76]">A completed run is not the end state. Save the evidence, understand the trade-offs, then replay with one deliberate change.</p>
          </div>
          <CampaignEvidenceReplayVisual className="mt-8" />
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {[
              [Target, "Before", "Use the coach and simulator to test a thesis."],
              [BarChart3, "During", "Watch capability, pressure, and reserve move."],
              [FileText, "After", "Read the personalised final strategy report."],
              [RefreshCw, "Replay", "Keep context steady and change one move."],
            ].map(([Icon, title, copy]) => { const ToolIcon = Icon as typeof Target; return <article key={title as string} className="min-w-0 rounded-xl border border-[#d0d7de] bg-[#f6f8fa] p-5"><ToolIcon className="text-[#08872b]" size={21} /><h3 className="mt-3 font-bold">{title as string}</h3><p className="mt-1 text-sm leading-5 text-[#656d76]">{copy as string}</p></article>; })}
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#0d1117] p-6 text-white md:flex-row md:items-center md:p-7">
            <div className="flex min-w-0 gap-4"><ShieldCheck className="mt-0.5 shrink-0 text-[#3fb950]" size={24} /><div><h3 className="text-xl font-bold">Safe to experiment.</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-white/60">There is no single perfect move. The value is in seeing what your pace, focus, and operating choices bought you—and what a different replay might unlock.</p></div></div>
            <button type="button" onClick={startSimulation} className="flex shrink-0 items-center gap-3 rounded-md bg-[#08872b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#077324]">Start your transformation <ArrowRight size={17} /></button>
          </div>
        </div>
      </section>
    </main>
  );
}
