import { Activity, ArrowDownRight, ArrowUpRight, CircleDollarSign, Gauge, Target } from 'lucide-react';
import type { GameViewState, Metric } from './gameViewTypes';
import { formatBudget, formatCurrency } from '../lib/currency';
import { getScenario } from '../lib/scenarios/registry';
import { deploymentCapacity } from '../lib/game/state';

type Props = { state: GameViewState; metrics: Metric[] };

function metricTone(label: string) {
  if (label.toLowerCase().includes('risk')) return { bar: 'bg-[#1f6f3d]', tint: 'bg-[#eef7f0]', icon: ArrowDownRight };
  if (label.toLowerCase().includes('adoption')) return { bar: 'bg-[#238636]', tint: 'bg-[#eef7f0]', icon: ArrowUpRight };
  if (label.toLowerCase().includes('data')) return { bar: 'bg-[#2da44e]', tint: 'bg-[#eef7f0]', icon: Activity };
  if (label.toLowerCase().includes('efficiency')) return { bar: 'bg-[#1a7f37]', tint: 'bg-[#eef7f0]', icon: ArrowUpRight };
  return { bar: 'bg-[#6b746d]', tint: 'bg-[#f4f6f4]', icon: Target };
}

export default function GameCommandHUD({ state, metrics }: Props) {
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const budget = Number(state.campaignBudget || (state.quarterlyBudget || 10) * 12);
  const spent = Math.max(0, Number(state.spent || 0));
  const remaining = Math.max(0, Number(state.campaignBudgetRemaining ?? budget - spent));
  const deployed = Math.max(0, Number(state.deploymentAmount || 0));
  const capacity = deploymentCapacity(budget, remaining, state.quarterlyBudget, state.q, spent);
  const reserveRatio = budget > 0 ? Math.min(100, (remaining / budget) * 100) : 0;
  const progress = Math.min(100, Math.max(0, (state.q / 12) * 100));

  return (
    <section className="mb-5 rounded-3xl border border-[#d0d7de] bg-white p-4 shadow-[0_1px_3px_rgba(31,35,40,.04)] sm:p-5" aria-label="Executive scorecard">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a7f37] text-sm font-bold text-white">AI</div>
          <div className="min-w-0"><p className="break-words text-[10px] font-bold uppercase tracking-[.2em] text-[#57606a]">Executive scorecard</p><h2 className="break-words text-lg font-bold leading-6 text-[#1f2328]">{scenario?.name || 'Project Factory 2030'}</h2><p className="break-words text-xs text-[#656d76]">Quarter {state.q} of 12 · {state.scenarioMode ? scenario?.industry : 'open practice'}</p></div>
        </div>
        <div className="flex min-w-[220px] flex-1 items-center justify-end gap-3 sm:max-w-sm"><div className="min-w-0 flex-1"><div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#57606a]"><span>Campaign progress</span><span>{Math.round(progress)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eaeef2]"><div className="h-full rounded-full bg-[#1a7f37] transition-all" style={{ width: `${progress}%` }} /></div></div><span className="rounded-full bg-[#dafbe1] px-3 py-2 text-xs font-bold text-[#1a7f37]">Q{state.q}/12</span></div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.slice(0, 5).map((metric) => {
          const tone = metricTone(metric.label);
          const Icon = tone.icon;
          const value = Number(metric.value || 0);
          const width = Math.min(100, Math.max(6, metric.label.toLowerCase().includes('risk') ? 100 - value : value));
          const cardClass = `rounded-2xl border border-[#d0d7de] p-3 ${tone.tint}`;
          const iconClass = metric.label.toLowerCase().includes('risk') ? 'text-[#cf222e]' : 'text-[#6e40c9]';
          return (
            <article key={metric.label} className={cardClass}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#57606a]">{metric.label}</span>
                <Icon size={14} className="text-[#238636]" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#1f2328]">{value.toFixed(metric.label === 'ROI' ? 1 : 0)}{metric.unit}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/10">
                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${width}%` }} />
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 text-xs"><span className="flex items-center gap-2 text-[#57606a]"><CircleDollarSign size={14} className="text-[#9a6700]" /> Campaign reserve</span><b>{formatBudget(remaining, state.currencyMode)}</b></div>
        <div className="flex items-center justify-between rounded-xl border border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 text-xs"><span className="flex items-center gap-2 text-[#57606a]"><Gauge size={14} className="text-[#0969da]" /> Deployable now</span><span className="text-right"><b>{formatCurrency(capacity.maximumDeployment, state.currencyMode)}</b><small className="ml-1 text-[#57606a]">({formatCurrency(deployed, state.currencyMode)} chosen)</small></span></div>
        <div className="flex items-center justify-between rounded-xl border border-[#d0d7de] bg-[#f6f8fa] px-3 py-2 text-xs"><span className="flex items-center gap-2 text-[#57606a]"><Target size={14} className="text-[#8250df]" /> Reserve health</span><b className={reserveRatio < 25 ? 'text-[#cf222e]' : reserveRatio < 50 ? 'text-[#9a6700]' : 'text-[#1a7f37]'}>{Math.round(reserveRatio)}%</b></div>
      </div>
    </section>
  );
}
