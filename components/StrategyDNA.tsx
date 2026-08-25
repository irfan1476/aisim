'use client';

import { GitBranch } from 'lucide-react';
import { analyticsMetrics, portfolioDecisionProfile } from '../lib/analyticsViewModel';

function clamp(value: number) { return Math.max(0, Math.min(100, value)); }

export default function StrategyDNA({ state }: { state: any }) {
  const history = Array.isArray(state.history) ? state.history : [];
  const average = (key: string) => history.length ? history.reduce((sum: number, entry: any) => sum + Number(entry.allocation?.[key] || 0), 0) / history.length : Number(state.alloc?.[key] || 0);
  const people = average('people');
  const data = average('data');
  const compliance = average('compliance');
  const profile = portfolioDecisionProfile(state);
  const latest = profile.latest;
  const latestOutcome = history.at(-1);
  const priorOutcome = history.at(-2);
  const outcomeDelta = (key: string) => Number(latestOutcome?.metrics?.[key] ?? state[key] ?? 0) - Number(priorOutcome?.metrics?.[key] ?? latestOutcome?.metrics?.[key] ?? state[key] ?? 0);
  const dimensions = {
    focus: clamp(100 - profile.breadth),
    capability: clamp(data * 0.65 + people * 0.35),
    governance: clamp(compliance * 1.3 + (100 - Number(state.risk || 0)) * 0.35),
    adaptation: clamp(50 + outcomeDelta('roi') * 3 + outcomeDelta('adoption') * 0.35),
    resilience: clamp(100 - Number(state.risk || 0) + compliance * 0.4),
    balance: clamp(100 - Math.abs(50 - people) * 1.2 - Math.abs(50 - compliance) * 0.4),
  };
  const metrics = analyticsMetrics(state);
  const weakest = metrics.reduce((a, b) => a.progress < b.progress ? a : b, metrics[0]);
  return <section className="command-content-card space-y-4 rounded-2xl p-5">
    <div className="flex items-center gap-2"><GitBranch size={17} className="command-accent"/><div><h3 className="command-accent font-bold">Strategy DNA</h3><p className="command-text-muted mt-1 text-xs">A compact interpretation of the strategy you actually practiced. It is evidence-led, not a fixed player type.</p></div></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Object.entries(dimensions).map(([key, value]) => <div key={key} className="command-content-soft rounded-lg p-3"><div className="command-text-muted flex justify-between gap-2 text-xs"><span className="capitalize">{key}</span><b className="command-accent">{Math.round(value)}</b></div><div className="command-track mt-2 h-2 rounded"><div className="command-bar h-full rounded" style={{ width: `${value}%` }}/></div></div>)}</div>
    <div className="command-text-muted grid gap-2 text-xs sm:grid-cols-3"><p>Evidence: {history.length} completed quarters</p><p>Average capability allocation: {people.toFixed(1)}% people · {data.toFixed(1)}% data</p><p>Average governance allocation: {compliance.toFixed(1)}%</p></div>
    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><p className="command-content-soft p-3"><span className="command-text-faint block">Deep focus</span><b className="command-accent mt-1 block">{profile.oneInitiativeQuarters} quarters</b></p><p className="command-content-soft p-3"><span className="command-text-faint block">Focused balance</span><b className="command-accent mt-1 block">{profile.twoInitiativeQuarters} quarters</b></p><p className="command-content-soft p-3"><span className="command-text-faint block">Portfolio breadth</span><b className="command-accent mt-1 block">{profile.threeInitiativeQuarters} quarters</b></p><p className="command-content-soft p-3"><span className="command-text-faint block">Concentration</span><b className="command-accent mt-1 block">{profile.concentration}%</b></p></div>
    <p className="command-content-soft command-text-muted p-3 text-xs">Current tension: <b className="command-accent">{weakest?.label || 'portfolio balance'}</b> is the least advanced outcome against its target. Your latest pattern is <b className="command-accent">{latest?.posture || 'not yet established'}</b>. Compare this with Evolution to see which initiatives changed, rather than treating this interpretation as a diagnosis.</p>
    <p className="command-text-faint text-[10px]">Modelled interpretation from recorded allocations, portfolio breadth, outcomes, and risk. Initiative-level changes belong in the Evolution tab.</p>
  </section>;
}
