"use client";

import { ArrowRight, BarChart3, FileText, GitBranch, History, RefreshCw, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";
import Game from "../components/Game";
import HomepageVisualPanels from "../components/HomepageVisualPanels";
import { hasCampaignProgress, readPersistedGameState } from "../lib/game/persistence";
import { scenarioList } from "../lib/scenarios/registry";

const moats = [
  [BarChart3, "Capital truth, not a points counter", "Every release is reconciled across delivery, run cost, retirement, crisis response, realised benefit, and payback."],
  [GitBranch, "Lifecycle economics", "Discover, pilot, scale, run, pause, or retire. Capability, adoption, readiness, risk, and value evolve together."],
  [Sparkles, "Productive experimentation", "Readiness gaps create slower, riskier experiments—not dead ends. The learner sees why, scores the learning, and adapts."],
  [History, "Replayable executive evidence", "Decision ledger, causal chain, financial record, reflection, and counterfactual replay make each campaign reusable."],
] as const;

const heroProof = [
  ["Real capital", "Delivery, run, exit & payback"],
  ["Living portfolio", "Maturity, readiness & risk"],
  ["Learning loop", "Experiment, reflect & replay"],
] as const;

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={`text-xs font-bold uppercase tracking-[.25em] ${dark ? "text-[#7ee787]" : "text-[#08872b]"}`}>{children}</p>;
}

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
          <a href="#top" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#08872b] text-sm font-bold">AI</span><span className="text-sm font-bold tracking-[.12em]">THE AI INVESTMENT CHALLENGE</span></a>
          <div className="hidden items-center gap-6 text-xs font-medium text-white/60 md:flex">
            <a href="#simulation" className="transition hover:text-white">The simulation</a>
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#why-it-compounds" className="transition hover:text-white">Why it compounds</a>
            <a href="#how-to-play" className="transition hover:text-white">Replay</a>
            <span className="rounded-md border border-white/20 px-3 py-2 text-white">Executive lab · 2026</span>
          </div>
        </div>
      </nav>

      <section id="top" className="homepage-hero-type mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-20 lg:grid-cols-[1.04fr_.96fr] lg:items-center">
        <div className="reveal">
          <div className="mb-7 inline-flex items-center gap-2 rounded-md border border-[#08872b]/30 bg-[#08872b]/8 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#08872b]"><Sparkles size={14}/> A strategic practice lab</div>
          <h1 className="max-w-3xl text-6xl font-bold leading-[.98] tracking-[-.06em] text-[#1f2328] md:text-8xl">Practice AI leadership <span className="serif font-normal italic text-[#08872b]">before</span> you lead for real.</h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-[#656d76]">An executive AI investment simulator that makes strategy tangible: release real campaign capital, run a portfolio through its lifecycle, test a hypothesis, then learn from the evidence—not a black-box score.</p>
          <div className="mt-7 grid max-w-xl gap-2 sm:grid-cols-3">{heroProof.map(([title, copy]) => <div key={title} className="rounded-xl border border-[#d0d7de] bg-white/75 p-3 shadow-sm"><p className="text-xs font-bold text-[#1f2328]">{title}</p><p className="mt-1 text-[11px] leading-4 text-[#656d76]">{copy}</p></div>)}</div>
          <button type="button" onClick={startSimulation} className="mt-9 flex items-center gap-4 rounded-md bg-[#08872b] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-[#08872b]/20 transition hover:-translate-y-0.5 hover:bg-[#077324]">Choose your simulation <ArrowRight size={17}/></button>
          {resumeAvailable && <button type="button" onClick={resumeSimulation} className="mt-3 block text-left text-sm font-semibold text-[#1f2328] underline decoration-[#08872b]/40 underline-offset-4 transition hover:text-[#08872b]">Resume saved campaign</button>}
          <a href="#simulation" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1f2328] underline decoration-[#08872b]/40 underline-offset-4">See how the learning loop works <ArrowRight size={15}/></a>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#656d76]">No account required · 12 quarters · 20–30 minutes</p>
        </div>
        <div className="relative reveal">
          <div className="absolute -inset-10 rounded-full bg-[#08872b]/10 blur-3xl" />
          <div aria-label="Illustrative live campaign cockpit" className="homepage-cockpit relative overflow-hidden rounded-2xl border border-[#30363d] bg-[#0d1117] p-5 text-white shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#3fb950]">Live campaign cockpit</p><p className="mt-2 text-lg font-semibold sm:text-xl">See the decision system respond.</p></div><span className="shrink-0 rounded-md bg-[#3fb950]/15 px-3 py-1.5 text-xs font-bold text-[#7ee787]">Q4 / 12</span></div>
            <div className="mt-5 grid grid-cols-3 gap-2">{[["ROI", "+8.4%", "68%"], ["Adoption", "67%", "74%"], ["Risk", "24%", "32%"]].map(([label, value, width]) => <div key={label} className="rounded-lg border border-white/10 bg-[#161b22] p-3"><div className="flex items-center justify-between gap-2"><p className="text-[9px] font-bold uppercase tracking-[.15em] text-white/55">{label}</p><span className="text-[9px] text-[#7ee787]">↗</span></div><p className="mt-2 text-base font-bold sm:text-lg">{value}</p><div className="mt-2 h-1 rounded-full bg-white/10"><div className="h-1 rounded-full bg-[#3fb950]" style={{ width }}/></div></div>)}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[.86fr_1.14fr]">
              <div className="rounded-lg border border-white/10 bg-[#161b22] p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/55">Operating pressures</p><span className="text-[10px] text-[#7ee787]">live</span></div><div className="mt-4 space-y-3">{[["Capability", "Building", "72%"], ["Adoption", "Watch", "58%"], ["Reserve", "$42M available", "84%"]].map(([label, status, width]) => <div key={label}><div className="flex items-center justify-between gap-2 text-xs"><span className="text-white/65">{label}</span><span className="font-semibold text-white">{status}</span></div><div className="mt-1.5 h-1 rounded-full bg-white/10"><div className="h-1 rounded-full bg-[#3fb950]" style={{ width }}/></div></div>)}</div></div>
              <div className="rounded-lg border border-white/10 bg-[#161b22] p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/55">Campaign trajectory</p><p className="mt-1 text-xs text-white/65">Outcomes become evidence each quarter.</p></div><BarChart3 size={18} className="text-[#7ee787]"/></div><svg className="mt-3 h-24 w-full" viewBox="0 0 240 100" role="img" aria-label="Illustrative trajectory rising from quarter one to quarter four"><path d="M8 82H232 M8 56H232 M8 30H232" stroke="rgba(255,255,255,.1)" strokeWidth="1"/><path d="M8 64 C42 62, 63 57, 87 55 S134 47, 158 42 S202 34, 232 24" fill="none" stroke="#3fb950" strokeWidth="3" strokeLinecap="round"/><path d="M8 48 C42 48, 67 47, 91 46 S137 44, 164 42 S205 41, 232 40" fill="none" stroke="rgba(126,231,135,.4)" strokeWidth="1.5" strokeDasharray="4 4"/>{["8,64", "87,55", "158,42", "232,24"].map((point) => { const [cx, cy] = point.split(","); return <circle key={point} cx={cx} cy={cy} r="4" fill="#0d1117" stroke="#7ee787" strokeWidth="2"/>; })}</svg><div className="flex justify-between text-[10px] text-white/45"><span>Q1</span><span>Q4</span></div></div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#3fb950]/30 bg-[#3fb950]/10 p-3"><div className="flex min-w-0 items-center gap-3"><FileText className="shrink-0 text-[#7ee787]" size={18}/><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#7ee787]">Next decision</p><p className="mt-1 truncate text-sm font-semibold">Choose your next bets</p></div></div><span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#7ee787]">Review evidence <ArrowRight size={14}/></span></div>
            <p className="mt-3 text-[10px] text-white/45">Example campaign state · compare the record, then replay with intent.</p>
          </div>
        </div>
      </section>

      <section id="simulation" className="scroll-mt-24 border-y border-[#c8d4ce] bg-white/72">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:min-h-[720px] lg:grid-cols-[1.04fr_.96fr] lg:items-center">
          <HomepageVisualPanels variant="scenario" />
          <div>
            <Eyebrow>Choose your practice world</Eyebrow>
            <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-[-.05em] text-[#101820] md:text-6xl">One decision engine. Different pressure systems.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#526159]">Open practice lets you test your own thesis. Scenario mode changes the operating context, evidence, crises, and success conditions—without taking away agency.</p>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">{scenarioList.map((scenario) => <article key={scenario.id} className="rounded-xl border border-[#d0d7de] bg-[#f6f8fa] p-4"><div className="flex items-start justify-between gap-3"><span className="text-xl" aria-hidden="true">{scenario.icon}</span><span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#08872b]">{scenario.industry}</span></div><h3 className="mt-4 font-bold text-[#1f2328]">{scenario.name}</h3><p className="mt-1 text-xs leading-5 text-[#65736b]">A distinct operating challenge, measured in its own terms.</p></article>)}</div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-y border-[#c8d4ce] bg-[#f1f7f4]">
        <div className="mx-auto max-w-7xl px-6 py-12 text-center md:py-14">
          <Eyebrow>How the learning works</Eyebrow>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-[-.05em] text-[#101820] md:text-5xl">Make the call. Read the outcome. Build the next thesis.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#526159]">One compact loop connects a decision to a measurable consequence, an explicit reflection, and a deliberate replay.</p>
          <div className="mx-auto mt-7 max-w-5xl rounded-2xl border border-[#30363d] bg-[#0d1117] p-4 text-left text-white shadow-xl shadow-[#0d1117]/10 sm:p-5">
            <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch">
              {[["01", "Decide", "Action + capital", "Scale customer service"], ["02", "Observe", "Outcome + risk", "Adoption 67% · risk 24%"], ["03", "Reflect", "Learning score", "Trust gates slowed uptake"], ["04", "Replay", "One changed thesis", "Pilot one quarter longer"]].map(([number, title, label, detail], index) => <div key={title} className="contents"><article className={`rounded-xl border p-3 ${index === 2 ? "border-[#3fb950]/60 bg-[#3fb950]/10" : "border-white/10 bg-white/5"}`}><p className="text-[9px] font-bold tracking-[.16em] text-[#7ee787]">{number} · {label}</p><h3 className="mt-2 text-sm font-bold">{title}</h3><p className="mt-1 text-[11px] leading-4 text-white/55">{detail}</p></article>{index < 3 && <div className="hidden self-center text-center text-lg font-bold text-[#7ee787] md:block">→</div>}</div>)}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-[10px] text-white/45"><span>Every turn leaves evidence for the next one.</span><span className="font-bold text-[#7ee787]">Value · readiness · risk · learning</span></div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#c8d4ce] bg-white/72">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:min-h-[680px] lg:grid-cols-[.96fr_1.04fr] lg:items-center">
          <div>
            <Eyebrow>Capital + lifecycle</Eyebrow>
            <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-[-.05em] text-[#101820] md:text-6xl">Build a portfolio you could defend in the boardroom.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#526159]">The model separates delivery capital from ongoing run costs, exits, and crisis response. It asks what is funded now, what keeps running, and when value becomes real.</p>
            <div className="mt-7 space-y-3">{[[FileText, "Priced before release", "See the quarterly commitment before capital leaves the purse."], [GitBranch, "Action, not checkbox", "Move every initiative deliberately through discovery, pilot, scale, run, pause, or retirement."], [BarChart3, "Value that has to arrive", "Track realised benefit, net value, ROI, and payback—not just activity."]].map(([Icon, title, copy]) => { const ToolIcon = Icon as typeof FileText; return <div key={title as string} className="flex gap-3 rounded-xl border border-[#d0d7de] bg-white p-4"><ToolIcon className="mt-0.5 shrink-0 text-[#08872b]" size={19}/><div><h3 className="font-bold text-[#1f2328]">{title as string}</h3><p className="mt-1 text-sm leading-5 text-[#65736b]">{copy as string}</p></div></div>; })}</div>
          </div>
          <HomepageVisualPanels variant="capital" />
        </div>
      </section>

      <section className="bg-[#f1f7f4]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:min-h-[680px] lg:grid-cols-[1.04fr_.96fr] lg:items-center">
          <HomepageVisualPanels variant="experiment" />
          <div>
            <Eyebrow>Builder mindset</Eyebrow>
            <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-[-.05em] text-[#101820] md:text-6xl">A failed hypothesis is only wasted if it teaches nothing.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#526159]">You can move ahead with imperfect readiness. The system exposes the drag and risk, then gives you a place to score the learning, name the evidence, and plan the next test.</p>
            <div className="mt-7 rounded-2xl border border-[#8fb99c] bg-[#e8f5ee] p-5"><p className="text-sm font-bold text-[#176b36]">Experiment with intent</p><p className="mt-2 text-sm leading-6 text-[#3d5a47]">The goal is not to find a single correct answer. It is to make strategic trade-offs legible, learn faster, and build a stronger next move.</p></div>
          </div>
        </div>
      </section>

      <section id="why-it-compounds" className="scroll-mt-24 bg-[#0d1117] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-end"><div><Eyebrow dark>Why it compounds</Eyebrow><h2 className="mt-4 text-4xl font-bold tracking-[-.05em] md:text-6xl">A game is easy. A credible consequence system is not.</h2></div><p className="max-w-2xl text-base leading-7 text-white/65">Most simulations offer scenarios or scores. This one connects financial logic, operating reality, decision evidence, and reflection—so each replay begins from a better question.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{moats.map(([Icon, title, copy], index) => { const ToolIcon = Icon; return <article key={title} className="rounded-2xl border border-white/10 bg-[#161b22] p-5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3fb950]/15 text-[#7ee787]"><ToolIcon size={18}/></span><p className="mt-5 text-[10px] font-bold tracking-[.18em] text-white/40">0{index + 1}</p><h3 className="mt-2 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/60">{copy}</p></article>; })}</div>
        </div>
      </section>

      <section id="how-to-play" className="scroll-mt-24 border-y border-[#c8d4ce] bg-white/72">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[.96fr_1.04fr] lg:items-center">
          <div>
            <Eyebrow>Replay with intent</Eyebrow>
            <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-[-.05em] text-[#101820] md:text-6xl">Keep the context. Change one thesis.</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#526159]">A completed campaign is not a verdict. It is an evidence record: what you funded, what changed, what constrained value, and what you would test next.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">{[[Target, "Before", "Test a thesis."], [BarChart3, "During", "Watch the system respond."], [FileText, "After", "Read the evidence."], [RefreshCw, "Replay", "Change one move."]].map(([Icon, title, copy]) => { const ToolIcon = Icon as typeof Target; return <div key={title as string} className="rounded-xl border border-[#d0d7de] bg-[#f6f8fa] p-4"><ToolIcon className="text-[#08872b]" size={19}/><h3 className="mt-3 font-bold">{title as string}</h3><p className="mt-1 text-xs leading-5 text-[#65736b]">{copy as string}</p></div>; })}</div>
          </div>
          <HomepageVisualPanels variant="replay" />
        </div>
      </section>

      <section className="bg-[#0d1117] text-white"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-12 md:flex-row md:items-center"><div className="flex max-w-3xl gap-4"><ShieldCheck className="mt-0.5 shrink-0 text-[#7ee787]" size={25}/><div><h2 className="text-2xl font-bold">Safe to experiment. Serious enough to matter.</h2><p className="mt-2 text-sm leading-6 text-white/60">Build a thesis, make the call, learn from the consequence, and return with a sharper next move.</p></div></div><button type="button" onClick={startSimulation} className="flex shrink-0 items-center gap-3 rounded-md bg-[#08872b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#077324]">Start your transformation <ArrowRight size={17}/></button></div></section>
    </main>
  );
}
