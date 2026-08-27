"use client";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  History,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useState } from "react";

const steps = [
  {
    label: "Choose",
    title: "Choose one clear next move",
    copy: "Start with the Quarter 1 recommendation or compare the initiative cards yourself. Pick up to three capabilities, but a focused first move is usually easier to understand.",
    action:
      "For each selected capability, choose its next valid lifecycle action. Discovery builds evidence and readiness; it does not create operating ROI yet.",
    watch:
      "The lifecycle hint tells you what is possible now and what must happen before a pilot or scale-up.",
    Icon: Target,
  },
  {
    label: "Fund",
    title: "Fund the move, not every control",
    copy: "Release the money you want to invest this quarter. The default operating mix is ready to use; change it only when you have a reason to test a different thesis.",
    action:
      "Use Cautious, Recommended, or Accelerated capital pace for a simple first decision. The recommended pace balances learning with reserve.",
    watch:
      "Your campaign purse is finite. Faster release can build earlier evidence, but shortens the runway for later quarters.",
    Icon: ClipboardList,
  },
  {
    label: "See results",
    title: "Read the cause and effect",
    copy: "Confirm the quarter to evolve the exact initiative values you saw on screen. Results show what changed, what did not change yet, and the next evidence or operating decision needed.",
    action:
      "Check investment quarters separately from delivery quarters. Discovery counts as investment, while pilots and scaling are what create delivery progress.",
    watch:
      "A discovery result can be successful even without immediate ROI: the question is whether it produced enough evidence to justify the next step.",
    Icon: Activity,
  },
  {
    label: "Learn",
    title: "Use evidence to improve the next quarter",
    copy: "The roadmap and Analytics Hub preserve what you funded, how much you spent, how initiatives evolved, and which outcomes followed. The Strategy Simulator is there when you want to explore trade-offs.",
    action:
      "Keep what worked, adjust what did not, and deliberately pause or retire weak bets. You can always take a more advanced route once the core loop is familiar.",
    watch:
      "Look for momentum, not one-quarter perfection. At Q12, the campaign reviews the complete record—not an opening label.",
    Icon: History,
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
