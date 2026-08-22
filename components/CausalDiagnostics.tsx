'use client';

import { ArrowRight, Lightbulb } from 'lucide-react';

export default function CausalDiagnostics({ state }: { state: any }) {
  const currentChain = Array.isArray(state.causalChain) ? state.causalChain : [];
  const currentRecommendations = Array.isArray(state.proactiveRecommendations) ? state.proactiveRecommendations : [];
  const latestCompleted = Array.isArray(state.history) && state.history.length ? state.history[state.history.length - 1] : undefined;
  const usingHistoryFallback = currentChain.length === 0 && currentRecommendations.length === 0 && Boolean(latestCompleted);
  const chain = currentChain.length ? currentChain : (latestCompleted?.causalChain || []);
  const recommendations = currentRecommendations.length ? currentRecommendations : (latestCompleted?.recommendations || []);
  const evidence = currentChain.length || currentRecommendations.length ? state : latestCompleted;
  const crisis = evidence?.crisis;
  const crisisResponse = evidence?.crisisResponse;
  const approved = evidence?.approvedRecommendations || [];
  return <div className="space-y-4">
    <section className="rounded-xl border border-emerald/25 bg-emerald/10 p-4">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ArrowRight size={16} className="text-emerald"/><b>Decision → consequence</b></div>{usingHistoryFallback && <span className="text-[10px] uppercase tracking-wider text-emerald/80">Latest completed quarter · Q{latestCompleted?.q}</span>}</div>
      {chain.length ? <div className="mt-3 space-y-2">{chain.slice(0, 4).map((item: any) => <article key={item.name} className="rounded-lg bg-black/15 p-3"><b className="text-sm">{item.name}</b><p className="mt-1 text-xs leading-5 text-white/60">{item.explanation || 'The selected initiative changed the current portfolio.'}</p>{item.effects?.map((effect: any) => <p key={`${item.name}-${effect.metric}`} className="mt-2 text-xs text-emerald">{effect.delta >= 0 ? '+' : ''}{Number(effect.delta).toFixed(1)} {effect.unit || 'points'} · {effect.metric}</p>)}</article>)}</div> : <p className="mt-3 text-xs text-white/55">Complete a quarter to create an evidence-backed causal chain.</p>}
    </section>
    <section className="rounded-xl border border-gold/25 bg-gold/10 p-4">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Lightbulb size={16} className="text-gold"/><b>Next actions</b></div>{usingHistoryFallback && <span className="text-[10px] uppercase tracking-wider text-gold/80">From Q{latestCompleted?.q}</span>}</div>
      {recommendations.length ? <div className="mt-3 space-y-2">{recommendations.slice(0, 3).map((item: any) => <article key={item.title} className="rounded-lg bg-black/15 p-3"><div className="flex items-center justify-between gap-2"><b className="text-sm">{item.title}</b><span className="text-[10px] uppercase text-gold">{item.priority}</span></div><p className="mt-1 text-xs text-white/60">{item.message}</p><p className="mt-2 text-xs font-bold text-gold">Next: {item.action}</p></article>)}</div> : <p className="mt-3 text-xs text-white/55">No recommendation has been generated for the current state.</p>}
      {(crisis || approved.length > 0) && <div className="mt-3 space-y-2 border-t border-gold/15 pt-3">{crisis && <p className="text-xs text-white/65"><b className="text-rose-200">Crisis:</b> {crisis.title || crisis.type || 'Recorded crisis'}{crisisResponse ? ` · Response: ${Object.entries(crisisResponse).map(([key, value]) => `${key} ${Number(value) >= 0 ? '+' : ''}${value}`).join(', ')}` : ''}</p>}{approved.length > 0 && <p className="text-xs text-emerald"><b>Approved:</b> {approved.join(', ')}</p>}</div>}
    </section>
  </div>;
}
