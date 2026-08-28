"use client";

import { ArrowRight, CircleHelp } from "lucide-react";

type Props = { answers: number[]; onBegin: () => void };

const labels = [
  "People enablement and model quality",
  "Speed and risk",
  "Governance before scale",
  "Balanced portfolio",
  "Explaining payback to a CFO",
];

/** V3 baseline framing: reflective context only, never a diagnosis or game input. */
export default function V3BaselineReflectionScreen({ answers, onBegin }: Props) {
  return <main className="min-h-screen bg-mist px-5 py-10">
    <section className="mx-auto max-w-3xl rounded-3xl border border-ink/10 bg-white p-7 shadow-sm" aria-labelledby="v3-baseline-title">
      <div className="flex items-start gap-3"><CircleHelp className="mt-1 text-gold" size={22} aria-hidden="true" /><div><p className="text-xs font-bold uppercase tracking-[.18em] text-gold">V3 reflection baseline</p><h1 id="v3-baseline-title" className="mt-2 text-3xl font-semibold tracking-[-.04em]">Keep these instincts in view.</h1></div></div>
      <p className="mt-5 text-sm leading-6 text-ink/65">Your responses are a starting point for reflection and the final debrief only. They do not change the scenario seed, outcomes, scorecard, or which priority is “right.” The board will test your reasoning through evidence and execution.</p>
      <div className="mt-6 space-y-2">{labels.map((label, index) => <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-mist px-4 py-3"><span className="text-sm font-medium">{label}</span><span className="rounded-full bg-white px-3 py-1 text-sm font-bold" aria-label={`${label}: ${answers[index] || "not answered"} out of 5`}>{answers[index] || "—"}/5</span></div>)}</div>
      <p className="mt-5 text-xs text-ink/50">No answer is scored as correct or incorrect. You will revisit this baseline after the decision loop.</p>
      <button type="button" onClick={onBegin} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white">Begin the V3 board window <ArrowRight size={17} /></button>
    </section>
  </main>;
}
