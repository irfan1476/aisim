"use client";

import { CheckCircle2, ChevronRight, Compass, X } from 'lucide-react';
import type { CapitalPace, FirstQuarterPlan } from '../lib/game/firstQuarter';
import type { CurrencyMode } from '../lib/scenarios/types';

type Props = {
  plan: FirstQuarterPlan;
  currencyMode: CurrencyMode;
  onApply: (pace: CapitalPace) => void;
  onDismiss: () => void;
};

const copyFor = (action: FirstQuarterPlan['action']) => {
  if (action === 'discover') return 'Build evidence and data readiness first. This quarter does not create operating ROI yet.';
  if (action === 'pilot') return 'Run a contained pilot to turn evidence into delivery learning.';
  if (action === 'scale') return 'Fund a ready capability for operating delivery this quarter.';
  return 'Keep the next step simple, then use the result as evidence for your next decision.';
};

function formatBudget(value: number, currency: CurrencyMode): string {
  return `${currency}${value.toFixed(value % 1 ? 1 : 0)}${currency === '$' ? 'M' : ' Cr'}`;
}

export default function FirstQuarterQuickStart({ plan, currencyMode, onApply, onDismiss }: Props) {
  const action = plan.action === 'discover' ? 'Discover' : plan.action === 'pilot' ? 'Pilot' : plan.action === 'scale' ? 'Scale' : plan.action;
  const options: Array<{ pace: CapitalPace; label: string; note: string }> = [
    { pace: 'cautious', label: 'Cautious', note: 'Preserve more reserve' },
    { pace: 'recommended', label: 'Recommended', note: 'Balanced first move' },
    { pace: 'accelerated', label: 'Accelerated', note: 'Learn faster; reduce runway' },
  ];
  const defaultMix = Object.entries(plan.allocation).map(([key, value]) => `${key === 'mlops' ? 'Ops' : key[0].toUpperCase() + key.slice(1)} ${value}%`).join(' · ');

  return (
    <section aria-label="Quarter one quick start" className="mx-auto mt-4 max-w-[1500px] px-5 sm:px-8">
      <div className="overflow-hidden rounded-2xl border border-[#1a7f37]/35 bg-[#dafbe1]/55 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-[#1a7f37]/20 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a7f37] text-white"><Compass size={17} /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#1a7f37]">Quarter 1 quick start</p>
              <h2 className="mt-0.5 text-base font-bold text-ink">Make one clear investment, then learn from the result.</h2>
            </div>
          </div>
          <button type="button" onClick={onDismiss} aria-label="Dismiss Quarter 1 guidance" className="rounded-lg p-1.5 text-ink/55 transition hover:bg-white/70 hover:text-ink"><X size={16} /></button>
        </div>

        <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[1.15fr_.9fr_1.35fr] lg:items-stretch">
          <div className="rounded-xl border border-[#1a7f37]/20 bg-white/70 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-ink/50">Recommended first move</p>
            <p className="mt-2 text-lg font-bold text-ink">{action} {plan.initiativeName}</p>
            <p className="mt-2 text-xs leading-5 text-ink/65">{copyFor(plan.action)}</p>
          </div>

          <div className="rounded-xl border border-[#1a7f37]/20 bg-white/70 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-ink/50">Default operating mix</p>
            <p className="mt-2 text-sm font-bold text-ink">Ready to use</p>
            <p className="mt-2 text-xs leading-5 text-ink/65">{defaultMix}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#1a7f37]"><CheckCircle2 size={14} /> You can tune this later.</p>
          </div>

          <div className="rounded-xl border border-[#1a7f37]/20 bg-white/70 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-ink/50">Money to invest this quarter</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {options.map(({ pace, label, note }) => (
                <button key={pace} type="button" onClick={() => onApply(pace)} className={`group rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-[#1a7f37] hover:bg-[#dafbe1] ${pace === 'recommended' ? 'border-[#1a7f37] bg-[#dafbe1]/70' : 'border-[#d0d7de] bg-white'}`}>
                  <span className="flex items-center justify-between gap-2"><b className="text-xs text-ink">{label}</b>{pace === 'recommended' && <span className="rounded-full bg-[#1a7f37] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">Start here</span>}</span>
                  <span className="mt-2 block text-lg font-bold tracking-tight text-ink">{formatBudget(plan.deploymentByPace[pace], currencyMode)}</span>
                  <span className="mt-1 block text-[10px] leading-4 text-ink/55">{note}</span>
                  <span className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#1a7f37]">Use this plan <ChevronRight size={13} className="transition group-hover:translate-x-0.5" /></span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="px-4 pb-4 text-[11px] leading-5 text-ink/55 sm:px-5">This is guidance, not autopilot. Choosing a pace fills the card, action, operating mix, and amount above; you can still edit every part of the decision.</p>
      </div>
    </section>
  );
}
