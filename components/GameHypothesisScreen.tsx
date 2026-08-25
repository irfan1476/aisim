import { ArrowRight, CheckCircle2, Compass, Lightbulb } from 'lucide-react';
import { calculateReflection } from '../lib/reflection';
import { initialGameState } from '../lib/game/state';

interface Props { answers: number[]; onBegin: () => void }

export default function GameHypothesisScreen({ answers, onBegin }: Props) {
  const reflection = calculateReflection({ ...initialGameState(), baseline: answers });
  const answered = answers.filter((answer) => answer >= 1 && answer <= 5).length;
  return (
    <main className="min-h-screen grid-bg px-4 pb-16 pt-8 sm:px-8 sm:pt-10">
      <section className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#1a7f37]">Baseline complete · 03</p>
            <h1 className="mt-3 text-4xl font-bold tracking-[-.06em] sm:text-6xl">Your strategic hypothesis</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">Your responses are an opening hypothesis for the campaign to test—not a label to live up to.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-[#8c959f] bg-white p-3 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dafbe1] text-[#1a7f37]"><CheckCircle2 size={22} /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#1a7f37]">Opening profile</p>
              <p className="mt-1 text-sm font-bold text-ink">{answered} of 5 responses captured</p>
              <p className="mt-1 text-[10px] text-ink/45">Ready to test through play.</p>
            </div>
          </div>
        </header>

        <section className="mt-8 overflow-hidden rounded-3xl border border-[#8c959f] bg-white shadow-[0_14px_36px_rgba(31,35,40,.10)]">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(250px,.85fr)] lg:items-stretch">
            <section className="rounded-2xl border border-[#1a7f37] bg-white p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#dafbe1] text-[#1a7f37]"><Compass size={19} /></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#1a7f37]">Opening strategic lens</p>
                  <h2 className="mt-2 break-words text-3xl font-bold tracking-[-.04em] sm:text-4xl">Your initial lens favours {reflection.hypothesis}.</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/60">The campaign will show whether your decisions reinforce or challenge this starting instinct as value, adoption, risk, and capability evolve.</p>
                </div>
              </div>
            </section>

            <aside className="rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] p-6">
              <div className="flex items-center gap-3"><Lightbulb className="text-[#1a7f37]" size={21}/><h2 className="text-lg font-bold">What shaped it</h2></div>
              <ul className="mt-4 space-y-2.5 text-sm leading-6 text-ink/65">{reflection.observations.map((item) => <li key={item} className="rounded-xl border border-[#d0d7de] bg-white px-4 py-3 break-words">{item}</li>)}</ul>
            </aside>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#d0d7de] bg-[#f6f8fa] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="max-w-2xl text-sm leading-6 text-ink/60">Initiatives will be specific to your campaign. Look for moments where the record of your choices confirms—or challenges—this opening hypothesis.</p>
            <button onClick={onBegin} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1a7f37] px-6 text-sm font-bold text-white transition hover:bg-[#2da44e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] focus-visible:ring-offset-2">Begin campaign <ArrowRight size={16}/></button>
          </div>
        </section>
      </section>
    </main>
  );
}
