import { Compass, MessageCircle } from 'lucide-react';
import type { ReflectionData } from '../lib/reflection';
import type { UserReflections } from '../lib/game/state';

interface Props { quarter: 1 | 6; reflection: ReflectionData; userReflections: UserReflections; onSave: (value: Partial<UserReflections>) => void }

export default function ReflectionCard({ quarter, reflection, userReflections, onSave }: Props) {
  if (quarter === 1) return (
    <section className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-ink">
      <div className="flex items-center gap-2"><Compass size={18} className="text-sky-700"/><b>Your first decision</b></div>
      <p className="mt-2 text-sm leading-6 text-ink/65">Your opening hypothesis was about {reflection.hypothesis}. Does this first allocation reflect it?</p>
      <div className="mt-4 flex flex-wrap gap-2">{([['yes','Yes'],['partial','Partially'],['no','Not yet']] as const).map(([value, label]) => <button key={value} onClick={() => onSave({ q1: value })} className={`rounded-lg border px-3 py-2 text-xs font-bold ${userReflections.q1 === value ? 'border-sky-700 bg-sky-700 text-white' : 'border-ink/10 bg-white text-ink/65'}`}>{label}</button>)}</div>
      <p className="mt-3 text-[11px] text-ink/45">This is a self-assessment, not a score penalty. You can continue whenever you are ready.</p>
    </section>
  );
  return (
    <section className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-ink">
      <div className="flex items-center gap-2"><MessageCircle size={18} className="text-violet-700"/><b>Halfway strategy review</b></div>
      <p className="mt-2 text-sm leading-6 text-ink/65">Your campaign is halfway through. {reflection.evidence[2]} What caused your strategy to change? (Optional)</p>
      <textarea value={userReflections.q6 || ''} onChange={(event) => onSave({ q6: event.target.value })} rows={2} maxLength={500} placeholder="e.g. I realised adoption needed more support before scaling..." className="mt-4 w-full rounded-xl border border-ink/10 bg-white p-3 text-sm outline-none focus:border-violet-500" />
      <p className="mt-2 text-[11px] text-ink/45">Your explanation helps distinguish a deliberate pivot from a strategic tension. You can continue without writing anything.</p>
    </section>
  );
}
