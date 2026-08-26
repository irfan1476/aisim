import { FlaskConical } from 'lucide-react';
import type { UserReflections } from '../lib/game/state';

type Props = {
  quarter: number;
  constrained: boolean;
  reflections: UserReflections;
  onSave: (value: Partial<UserReflections>) => void;
};

const labels = ['Unclear', 'A useful miss', 'Interesting signal', 'Strong learning', 'Repeat / build on it'];

/** A learner-owned assessment: experimentation is recorded, never penalised. */
export default function ExperimentReflection({ quarter, constrained, reflections, onSave }: Props) {
  const key = String(quarter);
  const rating = reflections.experimentRatings?.[key];
  const note = reflections.experimentNotes?.[key] || '';
  const saveRating = (value: 1 | 2 | 3 | 4 | 5) => onSave({ experimentRatings: { ...(reflections.experimentRatings || {}), [key]: value } });
  const saveNote = (value: string) => onSave({ experimentNotes: { ...(reflections.experimentNotes || {}), [key]: value.slice(0, 500) } });
  return <section className="mt-5 rounded-2xl border border-emerald-300/35 bg-emerald-300/10 p-4 text-white">
    <div className="flex items-center gap-2 text-[#7ee787]"><FlaskConical size={17}/><b className="text-sm">Experiment log · your score</b></div>
    <p className="mt-2 text-xs leading-5 text-white/65">{constrained ? 'You chose a constrained experiment. A weak result is evidence, not a failure—what did it teach you about sequencing, readiness, or risk?' : 'Rate the learning value of this move, not whether it “won.” Surprises and misses are useful when they improve the next hypothesis.'}</p>
    <div className="mt-3 flex flex-wrap gap-2">{([1, 2, 3, 4, 5] as const).map((value) => <button type="button" key={value} onClick={() => saveRating(value)} className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${rating === value ? 'border-[#7ee787] bg-[#7ee787] text-[#0d1117]' : 'border-white/20 bg-white/5 text-white/75 hover:border-[#7ee787]/70'}`}>{value} · {labels[value - 1]}</button>)}</div>
    <textarea value={note} onChange={(event) => saveNote(event.target.value)} rows={2} maxLength={500} placeholder="What would you test, keep, stop, or sequence differently next quarter? (optional)" className="mt-3 w-full rounded-xl border border-white/15 bg-[#0d1117]/55 p-3 text-xs text-white outline-none placeholder:text-white/35 focus:border-[#7ee787]" />
    <p className="mt-2 text-[10px] text-white/45">This reflection affects your learning record only. It never reduces campaign score or blocks progress.</p>
  </section>;
}
