'use client';

import { BarChart3, Clock3, DollarSign, Eye, ShieldCheck, Target, Users, Zap } from 'lucide-react';
import type { TransformationKPIs } from '../lib/analytics';

export default function TransformationKPIDashboard({ state, kpis }: { state: any; kpis: TransformationKPIs }) {
  const cards = [
    ['Time-to-value', `${kpis.timeToValue.average || '—'} qtrs`, Clock3, `Benchmark ${kpis.timeToValue.benchmark} qtrs`, kpis.timeToValue.average > 0 && kpis.timeToValue.average <= 3],
    ['Adoption & utilization', `${kpis.adoption.currentRate.toFixed(0)}%`, Users, `Active ${kpis.adoption.activeUsage.toFixed(0)}% · activation ${kpis.adoption.activationRate.toFixed(0)}%`, kpis.adoption.currentRate >= 60],
    ['Decision accuracy', `${kpis.decisionAccuracy.current.toFixed(0)}%`, Target, `+${kpis.decisionAccuracy.improvement.toFixed(0)}% vs baseline`, kpis.decisionAccuracy.current >= 80],
    ['Capacity created', `${kpis.capacity.hoursSaved}h`, Zap, `${kpis.capacity.FTEEquivalent} FTE · ${kpis.capacity.workloadShift.toFixed(0)}% workload shift`, true],
    ['Override frequency', `${kpis.overrideMetrics.rate.toFixed(0)}%`, Eye, kpis.overrideMetrics.insight, kpis.overrideMetrics.rate < 30],
    ['Financial impact', `$${(kpis.financial.totalValue / 1000).toFixed(0)}K`, DollarSign, `Revenue $${(kpis.financial.estimatedRevenue / 1000).toFixed(0)}K · savings $${(kpis.financial.estimatedCostSavings / 1000).toFixed(0)}K`, true],
    ['Security posture', kpis.security.riskScore, ShieldCheck, `${kpis.security.incidentsThisQuarter} incident this quarter · ${kpis.security.preventionRate.toFixed(0)}% prevented`, kpis.security.riskScore === 'low'],
    ['Workflow penetration', `${kpis.workflowPenetration.percentage.toFixed(0)}%`, BarChart3, `${kpis.workflowPenetration.workflowsEmbedded}/${kpis.workflowPenetration.totalWorkflows} workflows embedded`, kpis.workflowPenetration.percentage >= 50],
    ['Scale leverage', `${kpis.scaleLeverage.benefitCostRatio.toFixed(1)}x`, BarChart3, `Scale reached ${kpis.scaleLeverage.currentScale.toFixed(0)}%`, kpis.scaleLeverage.benefitCostRatio >= 1],
  ] as const;
  const onTrack = cards.filter(card => card[4]).length;
  return <div className="space-y-4"><div className="rounded-xl border border-gold/30 bg-gold/10 p-4"><div className="flex items-center gap-2"><Target size={18} className="text-gold"/><b>Transformation KPIs</b><span className="ml-auto text-[10px] text-white/40">Updated Q{state.q}</span></div><p className="mt-1 text-xs text-white/55">A practical scorecard for value, adoption, capability, risk, and scale.</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cards.map(([label, value, Icon, detail, good]) => <article key={label} className={`rounded-xl border p-4 ${good ? 'border-emerald/30 bg-emerald/10' : 'border-gold/30 bg-gold/10'}`}><div className="flex items-center justify-between"><Icon size={16} className={good ? 'text-emerald' : 'text-gold'}/><span className="text-[9px] font-bold uppercase text-white/45">{good ? 'On track' : 'Attention'}</span></div><p className="mt-3 text-xs text-white/55">{label}</p><p className="text-xl font-bold capitalize">{value}</p><p className="mt-2 text-[10px] leading-4 text-white/55">{detail}</p></article>)}</div><div className="grid grid-cols-3 gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-center"><div><p className="text-[10px] uppercase text-white/40">On track</p><b className="text-xl text-emerald">{onTrack}</b></div><div><p className="text-[10px] uppercase text-white/40">Attention</p><b className="text-xl text-gold">{cards.length - onTrack}</b></div><div><p className="text-[10px] uppercase text-white/40">Qtrs tracked</p><b className="text-xl">{state.history?.length || 0}</b></div></div></div>;
}
