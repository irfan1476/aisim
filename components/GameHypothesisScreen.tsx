import { ArrowRight, Compass, Lightbulb } from 'lucide-react';
import { calculateReflection } from '../lib/reflection';
import { initialGameState } from '../lib/game/state';

interface Props { answers: number[]; onBegin: () => void }

export default function GameHypothesisScreen({ answers, onBegin }: Props) {
  const reflection = calculateReflection({ ...initialGameState(), baseline: answers });
  return (
    <main className="min-h-screen grid-bg p-6 pb-20">
      <section className="mx-auto max-w-3xl pt-12">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-gold">Baseline complete · 03</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-.05em]">Your strategic hypothesis</h1>
        <p className="mt-4 text-ink/55">Your answers create a starting point for the campaign. They are a hypothesis to test—not a label to live up to.</p>
        <section className="mt-8 rounded-3xl border border-gold/30 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-4"><Compass className="mt-1 shrink-0 text-gold" size={24} /><div><p className="text-xs font-bold uppercase tracking-widest text-gold">Starting hypothesis</p><h2 className="mt-2 text-3xl font-semibold">You appear to be {reflection.hypothesis}.</h2><p className="mt-4 leading-7 text-ink/60">The campaign will test whether your decisions reinforce or challenge this instinct as value, adoption, risk, and capability evolve.</p></div></div>
        </section>
        <section className="mt-5 rounded-3xl border border-ink/10 bg-white p-7 shadow-sm"><div className="flex items-center gap-3"><Lightbulb className="text-emerald" size={22}/><h2 className="text-xl font-bold">What shaped it</h2></div><ul className="mt-5 space-y-3 text-sm leading-6 text-ink/65">{reflection.observations.map((item) => <li key={item} className="rounded-xl bg-mist px-4 py-3">{item}</li>)}</ul></section>
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white/70 p-4 text-sm text-ink/55">The initiative cards will be campaign-specific. Watch for the moments where your actions confirm—or challenge—this opening hypothesis.</div>
        <button onClick={onBegin} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white">Begin campaign <ArrowRight size={16}/></button>
      </section>
    </main>
  );
}
