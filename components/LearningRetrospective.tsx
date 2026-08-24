'use client';

import { ArrowRight, CircleDollarSign, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../lib/currency';
import { getScenario } from '../lib/scenarios/registry';
import { portfolioDecisionProfile } from '../lib/analyticsViewModel';
import { generateProactiveRecommendations } from '../lib/game/recommendations';

export default function LearningRetrospective({ state }: { state: any }) {
  const currentHasEvidence = (Array.isArray(state.causalChain) && state.causalChain.length > 0) || (Array.isArray(state.proactiveRecommendations) && state.proactiveRecommendations.length > 0);
  const latestCompleted = state.history?.[state.history.length - 1];
  const latest = currentHasEvidence ? state : latestCompleted;
  const usingHistoryFallback = !currentHasEvidence && Boolean(latestCompleted);
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const decisionProfile = portfolioDecisionProfile(state);

  if (!latest) {
    return <section className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/55">Complete the first quarter to unlock a decision-by-decision retrospective.</section>;
  }

  const selected = latest.chosen || latest.selectedIds || [];
  const effects = latest.causalChain || [];
  const approved = latest.approvedRecommendations || [];
  const crisis = latest.crisis;
  const crisisResponse = latest.crisisResponse;
  const recordedRecommendations = latest.recommendations || latest.proactiveRecommendations || [];
  const recommendations = recordedRecommendations.length ? recordedRecommendations : generateProactiveRecommendations(state);
  const metric = scenario?.progress
    .map((definition) => ({
      definition,
      progress: Number(latest.scenarioState?.progress?.[definition.key] ?? 0),
    }))
    .sort((a, b) => a.progress - b.progress)[0];

  return <section className="rounded-xl border border-emerald/30 bg-emerald/10 p-5">
    <div className="flex items-center gap-2"><Lightbulb size={17} className="text-emerald"/><div><b>{usingHistoryFallback ? `Latest completed quarter · Q${latest.q}` : `Quarter ${latest.q} retrospective`}</b><p className="text-xs text-white/50">Turn the last decision into a deliberate next move.</p></div></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg bg-ink/30 p-3"><p className="text-[10px] uppercase tracking-wider text-white/40">Decision</p><p className="mt-2 text-sm font-semibold text-white/85">{selected.length ? selected.join(' · ') : 'No initiative recorded'}</p><p className="mt-2 text-xs text-fuchsia-200">{selected.length} initiative{selected.length === 1 ? '' : 's'} · {decisionProfile.latest?.posture || 'recorded choice'}</p><p className="mt-2 flex items-center gap-1 text-xs text-gold"><CircleDollarSign size={12}/>{formatCurrency(Number(latest.metrics?.spent || 0), state.currencyMode)} cumulative spend</p></div>
      <div className="rounded-lg bg-ink/30 p-3"><p className="text-[10px] uppercase tracking-wider text-white/40">Observed change</p><p className="mt-2 text-sm text-white/75">{metric ? `${metric.definition.label}: ${metric.progress.toFixed(0)}% toward target` : `Portfolio ROI: ${Number(latest.metrics?.roi || 0).toFixed(1)}%`}</p><p className="mt-2 text-xs text-white/45">Use History for the full metric and allocation ledger.</p></div>
      <div className="rounded-lg bg-ink/30 p-3"><p className="text-[10px] uppercase tracking-wider text-white/40">Recommended next move</p><p className="mt-2 text-sm font-semibold text-white/85">{state.nextQuarterGuidance?.action || recommendations[0]?.action || (metric ? `Monitor ${metric.definition.label.toLowerCase()} before scaling.` : 'Preserve optionality and review the next capability investment.')}</p>{recommendations[0]?.message && <p className="mt-2 text-xs text-white/55">{recommendations[0].message}</p>}<p className="mt-2 text-xs text-emerald">{approved.length ? `${approved.length} recommendation${approved.length === 1 ? '' : 's'} approved` : recommendations.length ? 'Recommendation available — not yet approved' : 'No urgent recommendation — continue monitoring'}</p></div>
    </div>
    {effects.length > 0 && <div className="mt-4 rounded-lg bg-ink/25 p-3"><p className="text-xs font-bold uppercase tracking-wider text-white/50">Why it happened</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">{effects.slice(0, 3).map((item: any, index: number) => <span key={`${item.name}-${index}`} className="inline-flex items-center gap-2 rounded-md bg-white/5 px-2 py-1"><b>{item.name}</b>{index < Math.min(2, effects.length - 1) && <ArrowRight size={12} className="text-emerald"/>}</span>)}</div></div>}
    {(crisis || recommendations.length > 0) && <div className="mt-4 rounded-lg bg-ink/25 p-3"><p className="text-xs font-bold uppercase tracking-wider text-white/50">Evidence to carry forward</p>{crisis && <p className="mt-2 text-xs text-rose-200"><b>Crisis:</b> {crisis.title || crisis.type || 'Recorded crisis'}{crisisResponse ? ` · Response: ${Object.entries(crisisResponse).map(([key, value]) => `${key} ${Number(value) >= 0 ? '+' : ''}${value}`).join(', ')}` : ''}</p>}{recommendations.length > 0 && <p className="mt-2 text-xs text-white/65"><b>Recommendation:</b> {recommendations[0].title || recommendations[0].action}</p>}{approved.length > 0 && <p className="mt-2 text-xs text-emerald"><b>Approved:</b> {approved.join(', ')}</p>}</div>}
  </section>;
}
