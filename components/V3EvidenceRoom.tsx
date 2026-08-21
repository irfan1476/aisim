import { FileText, Info, ShieldCheck } from 'lucide-react';
import type { V3EvidenceArtifact, V3ScenarioPack } from '../lib/scenarios/types';

type Props = {
  pack: V3ScenarioPack;
  selectedIds?: string[];
  onOpen?: (evidence: V3EvidenceArtifact) => void;
  onCite?: (evidence: V3EvidenceArtifact) => void;
};

/** Opt-in V3 evidence room. It is intentionally data-only and safe to mount beside V2 screens. */
export default function V3EvidenceRoom({ pack, selectedIds = [], onOpen, onCite }: Props) {
  const evidence = pack.evidence || [];
  return <section aria-labelledby="v3-evidence-title" className="rounded-3xl border border-ink/8 bg-white p-5">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-gold">Evidence room</p><h2 id="v3-evidence-title" className="mt-2 text-xl font-bold">Inspect before you commit</h2><p className="mt-1 text-sm leading-6 text-ink/55">Each artefact shows what it can support, how it was sourced, and where uncertainty remains.</p></div><ShieldCheck size={20} className="text-emerald" aria-hidden="true" /></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2">{evidence.map((item) => <article key={item.id} className={`rounded-2xl border p-4 ${selectedIds.includes(item.id) ? 'border-emerald bg-emerald/5' : 'border-ink/8 bg-ink/[.02]'}`}>
      <div className="flex items-start justify-between gap-3"><div className="flex gap-2"><FileText size={17} className="mt-0.5 text-gold" aria-hidden="true" /><div><h3 className="font-bold">{item.title || item.id}</h3><p className="mt-1 text-xs text-ink/50">{item.authorRole || 'Source role not specified'} · {item.version || 'Unversioned'}</p></div></div>{item.sourceStatus && <span className="rounded-full bg-gold/15 px-2 py-1 text-[10px] font-bold text-ink/65">{item.sourceStatus}</span>}</div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-ink/8 px-2 py-1">Claim: {item.claimStatus || 'not stated'}</span>{item.availableFrom && <span className="rounded-full bg-ink/8 px-2 py-1">Available {item.availableFrom}</span>}</div>
      {item.limitations?.length ? <p className="mt-3 flex gap-2 text-xs leading-5 text-ink/55"><Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{item.limitations.join(' ')}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">{onOpen && <button type="button" onClick={() => onOpen(item)} className="rounded-lg border border-ink/10 px-3 py-2 text-xs font-bold hover:bg-ink/5">Open artefact</button>}{onCite && <button type="button" aria-pressed={selectedIds.includes(item.id)} onClick={() => onCite(item)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${selectedIds.includes(item.id) ? 'border-emerald bg-emerald/10 text-emerald' : 'border-ink/10 hover:bg-ink/5'}`}>{selectedIds.includes(item.id) ? 'Cited in decision' : 'Cite in decision'}</button>}</div>
    </article>)}</div>
    {!evidence.length && <p className="mt-5 rounded-xl bg-gold/10 p-4 text-sm text-ink/60">No evidence has been authored for this pack yet.</p>}
  </section>;
}
