'use client';

import { GitBranch } from 'lucide-react';
import { analyticsMetrics, portfolioDecisionProfile } from '../lib/analyticsViewModel';

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }

export default function StrategyDNA({ state }: { state: any }) {
  const history = Array.isArray(state.history) ? state.history : [];
  const average = (key: string) => history.length ? history.reduce((sum: number, entry: any) => sum + Number(entry.allocation?.[key] || 0), 0) / history.length : Number(state.alloc?.[key] || 0);
  const people = average('people');
  const compliance = average('compliance');
  const metrics = analyticsMetrics(state);
  const profile = portfolioDecisionProfile(state);
  const dimensions = {
    ambition: clamp(Number(state.roi || 0) + Number(state.innovation || 0)),
    people: clamp(Number(state.adoption || 0) + people * 2),
    governance: clamp(Number(state.compliance || 0) + 100 - Number(state.risk || 0)),
    data: clamp(Number(state.data || 0)),
    resilience: clamp(Number(state.satisfaction || 0) + Number(state.literacy || 0)),
    balance: clamp(100 - Math.abs(50 - people) * 1.2),
  };
  const weakest = metrics.reduce((a, b) => a.progress < b.progress ? a : b, metrics[0]);
  return <section className="space-y-4 rounded-2xl border border-fuchsia-400/30 bg-fuchsia-400/10 p-5">
    <div className="flex items-center gap-2"><GitBranch size={17} className="text-fuchsia-200"/><div><h3 className="font-bold text-fuchsia-200">Strategy DNA</h3><p className="mt-1 text-xs text-white/55">Your strategic identity inferred from decisions, allocations, outcomes, and risk—not selected at setup.</p></div></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(dimensions).map(([key, value]) => <div key={key} className="rounded-lg bg-black/15 p-3"><div className="flex justify-between gap-2 text-xs text-white/65"><span className="capitalize">{key}</span><b className="text-fuchsia-200">{Math.round(value)}</b></div><div className="mt-2 h-2 rounded bg-black/15"><div className="h-full rounded bg-fuchsia-300" style={{ width: `${value}%` }}/></div></div>)}</div>
    <div className="grid gap-2 text-xs text-white/60 sm:grid-cols-3"><p>Evidence: {history.length} completed quarters</p><p>Average people allocation: {people.toFixed(1)}%</p><p>Average governance allocation: {compliance.toFixed(1)}%</p></div>
    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><p className="rounded-lg bg-black/15 p-3"><span className="block text-white/40">Deep focus</span><b className="mt-1 block text-fuchsia-200">{profile.oneInitiativeQuarters} quarters</b></p><p className="rounded-lg bg-black/15 p-3"><span className="block text-white/40">Focused balance</span><b className="mt-1 block text-fuchsia-200">{profile.twoInitiativeQuarters} quarters</b></p><p className="rounded-lg bg-black/15 p-3"><span className="block text-white/40">Portfolio breadth</span><b className="mt-1 block text-fuchsia-200">{profile.threeInitiativeQuarters} quarters</b></p><p className="rounded-lg bg-black/15 p-3"><span className="block text-white/40">Concentration</span><b className="mt-1 block text-fuchsia-200">{profile.concentration}%</b></p></div>
    <p className="rounded-lg bg-black/15 p-3 text-xs text-white/70">Current tension: <b className="text-fuchsia-200">{weakest?.label || 'portfolio balance'}</b> is the least advanced outcome against its target. Your campaign pattern is <b className="text-fuchsia-200">{profile.latest?.posture || 'not yet established'}</b>; test whether changing breadth changes the result.</p>
  </section>;
}
