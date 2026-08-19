"use client";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Eye,
  GitBranch,
  History,
  RefreshCw,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";
import { useState } from "react";

const steps = [
  {
    label: "Brief",
    title: "Create your campaign context",
    copy: "Review Project Factory 2030 and answer five baseline questions. There is no archetype or strategy mode to select: your answers quietly shape organisation, data, and team maturity.",
    action:
      "Answer honestly, then enter the boardroom. A new campaign receives reproducible but varied initiative conditions.",
    watch:
      "Initiative ROI, cost, readiness, human effort, and risk can differ from an earlier campaign.",
    Icon: ClipboardList,
  },
  {
    label: "Read",
    title: "Inspect the living initiative cards",
    copy: "Each card shows its current investment, ROI, data readiness, delivery risk, maturity, and funding history. These are campaign values—not fixed catalogue values.",
    action:
      "Compare the initiatives before selecting. Hover the metric row to see the campaign baseline and use the risk arrow to spot improvement or deterioration.",
    watch:
      "A rising risk score means neglect or weak safeguards are accumulating. A falling score means the initiative is becoming safer.",
    Icon: Eye,
  },
  {
    label: "Decide",
    title: "Build the quarter portfolio",
    copy: "Choose up to three initiatives and divide the quarterly envelope across infrastructure, data, people, MLOps, compliance, and innovation.",
    action:
      "Keep the allocation at exactly 100%. Fund value and the operating system around it: data, people, maintenance, and governance all change what the initiatives can deliver.",
    watch:
      "Repeated funding compounds maturity. Switching bets is valid, but prolonged neglect raises risk and eventually erodes capability.",
    Icon: Target,
  },
  {
    label: "Test",
    title: "Challenge the decision before committing",
    copy: "Use Strategy Simulator for What-If comparisons and ask the CFO, CTO, CHRO, or Risk advisor about the current portfolio.",
    action:
      "Compare alternative selections and allocations. Apply a useful draft, or return to the decision window and adjust manually.",
    watch:
      "The advisor can use current maturity, spend, risk, funding history, and discovered combinations. It does not choose for you.",
    Icon: GitBranch,
  },
  {
    label: "Resolve",
    title: "See the operating system respond",
    copy: "Confirm the quarter to evolve the exact initiative values shown on screen. Funding improves capability; neglect and weak governance create consequences.",
    action:
      "Read the new metrics, causal chain, recommendations, and any crisis. Approving a recommendation creates guidance for the next decision—it does not secretly change your plan.",
    watch:
      "Compatible initiatives may reveal a capability combination that changes ROI, adoption, risk, and delivery cost.",
    Icon: Activity,
  },
  {
    label: "Learn",
    title: "Use the quarter as evidence",
    copy: "The roadmap and Analytics Hub preserve what you funded, how much you spent, how initiatives evolved, and which outcomes followed.",
    action:
      "Review trends, diagnostics, KPIs, initiative evolution, frameworks, history, and the Time Machine before choosing the next quarter.",
    watch:
      "Look for momentum, not one-quarter perfection. Decide which capabilities deserve consistency and which should be intentionally deprioritised.",
    Icon: History,
  },
  {
    label: "Finish",
    title: "Read your strategy autopsy",
    copy: "After Q12, the simulation infers your strategic pattern from the complete campaign—not from a mode selected at the beginning.",
    action:
      "Review the CEO rating, allocation averages, most-funded bets, risk movement, discovered combinations, quarter timeline, pattern confidence, closest alternative, and your roadmap to A+.",
    watch:
      "Your verdict rewards sustainable value: ROI matters, but so do adoption, risk control, people investment, and portfolio discipline.",
    Icon: Trophy,
  },
];

export default function HowToPlayGuide() {
  const [active, setActive] = useState(0);
  const step = steps[active];
  const Icon = step.Icon;
  return (
    <section
      id="how-to-play"
      className="scroll-mt-24 border-y border-[#d0d7de] bg-[#f6f8fa]"
    >
      <div className="mx-auto max-w-7xl px-6 py-24">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">
          How to play
        </p>
        <h2 className="mt-4 text-4xl font-bold tracking-[-.04em] md:text-6xl">
          Lead the portfolio, not just the quarter.
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#656d76]">
          The goal is not to find one perfect initiative. Build a system in
          which valuable initiatives can mature, combine, scale safely, and
          survive leadership trade-offs.
        </p>
        <div className="mt-12 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <nav className="grid gap-2" aria-label="How to play steps">
            {steps.map((item, index) => (
              <button
                key={item.label}
                onClick={() => setActive(index)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left ${active === index ? "border-[#08872b] bg-white shadow-sm" : "border-transparent bg-white/60"}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active === index ? "bg-[#08872b] text-white" : "bg-[#08872b]/10 text-[#08872b]"}`}
                >
                  <item.Icon size={17} />
                </span>
                <span>
                  <b className="block text-sm">
                    {index + 1}. {item.label}
                  </b>
                  <small className="text-[#656d76]">{item.title}</small>
                </span>
              </button>
            ))}
          </nav>
          <article className="rounded-2xl bg-[#0d1117] p-7 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[.2em] text-[#3fb950]">
                Step {active + 1} of {steps.length}
              </span>
              <Icon className="text-[#3fb950]" size={24} />
            </div>
            <h3 className="mt-8 text-3xl font-bold">{step.title}</h3>
            <p className="mt-4 max-w-xl leading-7 text-white/65">{step.copy}</p>
            <div className="mt-8 rounded-xl border border-[#3fb950]/30 bg-[#3fb950]/10 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#3fb950]">
                What to do
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80">
                {step.action}
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#79c0ff]">
                <ShieldCheck size={15} /> What to watch
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {step.watch}
              </p>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                disabled={!active}
                onClick={() => setActive(active - 1)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/70 disabled:opacity-30"
              >
                ← Previous
              </button>
              <button
                onClick={() =>
                  setActive(active === steps.length - 1 ? 0 : active + 1)
                }
                className="flex items-center gap-2 rounded-lg bg-[#3fb950] px-4 py-2 text-sm font-bold text-[#0d1117]"
              >
                {active === steps.length - 1 ? "Start again" : "Next step"}{" "}
                <ArrowRight size={15} />
              </button>
            </div>
          </article>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Values are real",
              "The quarter resolves the same initiative conditions shown before confirmation.",
            ],
            [
              "Consistency compounds",
              "Repeated funding improves maturity, ROI, readiness, cost, and risk.",
            ],
            [
              "Neglect has a cost",
              "Unfunded initiatives accumulate risk before deeper capability decay begins.",
            ],
            [
              "Your history is the strategy",
              "All quarters—not a preset label—shape the final diagnosis.",
            ],
          ].map(([title, copy]) => (
            <div
              key={title}
              className="rounded-xl border border-[#d0d7de] bg-white p-4"
            >
              <CheckCircle2 size={16} className="text-[#08872b]" />
              <p className="mt-2 font-bold">{title}</p>
              <p className="mt-1 text-sm leading-6 text-[#656d76]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
