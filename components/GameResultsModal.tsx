"use client";

import { ArrowRight, CheckCircle2, CircleAlert, CircleDollarSign, GitBranch, Lightbulb, ShieldAlert, Users } from "lucide-react";
import type { GameViewState, LifecycleAdaptationPayload, LifecycleDeploymentPayload, LifecycleEvaluationPayload } from "./gameViewTypes";
import ReflectionCard from "./ReflectionCard";
import { calculateReflection } from "../lib/reflection";
import type { UserReflections } from "../lib/game/state";
import { formatBudget } from "../lib/currency";
import { deriveOperatingModelAdvisory } from "../lib/game/operatingModelAdvisory";
import { affordableCrisisResponseCost } from "../lib/game/turnResolver";
import ExperimentReflection from "./ExperimentReflection";
import AiLifecycleReview, { pendingLifecycleReviewCount } from "./AiLifecycleReview";
import { validatedLearningScore } from "../lib/game/scoring";
import { realisedROI } from "../lib/game/economics";
import { allocationForInitiative } from "../lib/game/initiativeAllocation";
import { OPERATING_LEVER_LABELS } from "../lib/game/operatingLoop";

interface Props {
  state: GameViewState;
  onRespond: (impact: Record<string, number>, cost?: number) => void;
  onAdvance: () => void;
  onApproveRecommendation: (title: string) => void;
  onSaveReflection: (value: Partial<UserReflections>) => void;
  onLifecycleEvaluation?: (payload: LifecycleEvaluationPayload) => void;
  onLifecycleDeployment?: (payload: LifecycleDeploymentPayload) => void;
  onLifecycleAdaptation?: (payload: LifecycleAdaptationPayload) => void;
}

function RingMetric({ label, value, color }: { label: string; value: string; color: string }) {
  const numeric = Math.max(0, Math.min(100, Number.parseFloat(value) || 0));
  return <div className="command-content-soft flex min-w-0 items-center gap-3 rounded-2xl border p-3 sm:justify-center sm:rounded-full sm:bg-transparent sm:p-0"><div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full p-1 sm:h-28 sm:w-28" style={{ background: `conic-gradient(${color} ${numeric}%, #4a5b51 0)` }}><div className="command-content-card flex h-full w-full flex-col items-center justify-center rounded-full border"><span className="command-text-muted text-[10px] uppercase tracking-wider">{label}</span><b className="command-text mt-1 text-xl leading-none sm:text-2xl">{value}</b></div></div><span className="command-text-muted text-xs font-semibold sm:hidden">Current quarter position</span></div>;
}

function EvidenceItem({ icon: Icon, label, value, detail }: { icon: typeof CircleDollarSign; label: string; value: string; detail?: string }) {
  return <div className="command-content-soft flex items-start gap-3 rounded-xl border p-3"><span className="command-status mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"><Icon size={16} /></span><div className="min-w-0"><p className="command-text-muted text-[10px] font-bold uppercase tracking-[.14em]">{label}</p><p className="command-text mt-1 break-words text-sm font-bold">{value}</p>{detail && <p className="command-text-muted mt-1 break-words text-[11px] leading-4">{detail}</p>}</div></div>;
}

export default function GameResultsModal({ state, onRespond, onAdvance, onApproveRecommendation, onSaveReflection, onLifecycleEvaluation, onLifecycleDeployment, onLifecycleAdaptation }: Props) {
  if (state.stage !== "results") return null;
  const recommendations = state.proactiveRecommendations as any[];
  const approved = new Set(state.approvedRecommendations || []);
  const reflection = calculateReflection(state as any);
  const fundedInitiatives = state.selected.map((id) => state.initiativeStates?.[id]?.name).filter((name): name is string => Boolean(name));
  const latestQuarter = (state.history as any[]).at(-1) as any;
  const operatingEmphasis = Object.entries(state.alloc || {}).sort(([, left], [, right]) => Number(right) - Number(left)).slice(0, 2).map(([key, value]) => `${key === "mlops" ? "Ops & Maintenance" : key[0].toUpperCase() + key.slice(1)} ${value}%`);
  const operatingDecisionDetail = state.selected.map((id) => {
    const initiative = state.initiativeStates?.[id];
    if (!initiative) return undefined;
    const allocation = allocationForInitiative(id, latestQuarter?.allocationMode || state.initiativeAllocationMode, latestQuarter?.initiativeAllocations || state.initiativeAllocations, latestQuarter?.allocation || state.alloc);
    const top = Object.entries(allocation).sort(([, left], [, right]) => Number(right) - Number(left)).slice(0, 3).map(([key, value]) => `${OPERATING_LEVER_LABELS[key as keyof typeof OPERATING_LEVER_LABELS]} ${value}%`).join(' · ');
    return `${initiative.name}: ${top}`;
  }).filter((item): item is string => Boolean(item));
  const operatingEvidenceDetail = (latestQuarter?.operatingEvidence || []).map((evidence: any) => {
    const initiative = state.initiativeStates?.[evidence.initiativeId];
    const observed = evidence.outcomeEffects?.[0];
    const bottleneck = OPERATING_LEVER_LABELS[evidence.bottleneck as keyof typeof OPERATING_LEVER_LABELS] || evidence.bottleneck;
    return `${initiative?.name || evidence.initiativeId}: ${evidence.action} · bottleneck ${bottleneck}${observed ? ` · ${observed.metric} ${Number(observed.delta) >= 0 ? '+' : ''}${Number(observed.delta).toFixed(1)}` : ''}`;
  });
  const initiativeSpend = Number(state.lastQuarterDeployment || 0);
  const crisisSpend = Number(state.quarterlyCrisisCost || 0);
  const quarterSpend = initiativeSpend + crisisSpend;
  const operatingModel = deriveOperatingModelAdvisory(state);
  const campaignRemaining = Math.max(0, Number(state.campaignBudgetRemaining ?? state.campaignBudget ?? 0));
  const lifecycleReviews = pendingLifecycleReviewCount(state);
  const validatedLearning = validatedLearningScore(state as any);
  const discoveryNames = (latestQuarter?.discoveryIds || []).map((id: string) => state.initiativeStates?.[id]?.name || id);
  const deliveryNames = (latestQuarter?.deliveryIds || []).map((id: string) => state.initiativeStates?.[id]?.name || id);
  const evidenceOnly = discoveryNames.length > 0 && deliveryNames.length === 0;
  const resultReadout = evidenceOnly
    ? {
        changed: 'Evidence and data readiness advanced for the discovery work.',
        notYet: 'Operating ROI and scenario outcomes wait for a later pilot or scale decision.',
        next: 'Use the evidence to decide whether the initiative is ready to pilot.',
      }
    : deliveryNames.length > 0
      ? {
          changed: 'Delivery outcomes, adoption, risk, and value have responded to this quarter’s operating decision.',
          notYet: 'Full value still depends on sustained adoption and continued operating discipline.',
          next: 'Review the evidence, then run, adapt, or deliberately expand the capability.',
        }
      : {
          changed: 'The portfolio record and operating conditions were updated for this quarter.',
          notYet: 'No new delivery outcome was claimed without an active pilot or scale decision.',
          next: 'Choose the next capability action when you are ready to invest again.',
        };

  return <div data-testid="quarter-results" className="command-overlay fixed inset-0 z-20 flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-6"><div className="command-modal my-auto max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[28px] text-white">
    <header className="border-b border-[#30363d] px-5 py-6 text-center sm:px-10 sm:py-8"><p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#7ee787]">Quarter {state.q} results</p><h2 className="mt-2 break-words text-3xl font-bold tracking-[-.04em] sm:text-5xl">The operating system responded.</h2><p className="mx-auto mt-3 max-w-3xl break-words text-sm leading-6 text-white/60">{state.feedback}</p></header>
    <section className="grid gap-3 border-b border-[#30363d] px-5 py-5 sm:px-10 sm:py-7"><RingMetric label="Modelled ROI" value={`${state.roi.toFixed(1)}%`} color="#34d399"/><RingMetric label="Adoption" value={`${state.adoption.toFixed(0)}%`} color="#c9b896"/><RingMetric label="Risk" value={`${state.risk.toFixed(0)}%`} color="#f59e0b"/><RingMetric label="Validated learning" value={`${validatedLearning.toFixed(0)}%`} color="#7ee787"/><p className="col-span-full text-center text-xs text-white/50">Realised cash ROI: <span className="font-bold text-white/80">{realisedROI(state.financialLedger).toFixed(1)}%</span> · observed net benefit divided by cumulative investment</p></section>
    <section className="grid gap-2 border-b border-[#30363d] px-5 py-5 sm:grid-cols-3 sm:px-8" aria-label="Quarter decision readout">
      <div className="rounded-xl border border-[#7ee787]/25 bg-[#1a7f37]/10 p-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7ee787]">What changed</p><p className="mt-2 text-xs leading-5 text-white/75">{resultReadout.changed}</p></div>
      <div className="rounded-xl border border-[#f0a736]/25 bg-[#f0a736]/10 p-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#f0c36a]">What has not changed yet</p><p className="mt-2 text-xs leading-5 text-white/75">{resultReadout.notYet}</p></div>
      <div className="rounded-xl border border-[#58a6ff]/25 bg-[#0969da]/15 p-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#79c0ff]">Next decision</p><p className="mt-2 text-xs leading-5 text-white/75">{resultReadout.next}</p></div>
    </section>
    {state.crisis && <section className="border-b border-[#30363d] px-5 py-5 sm:px-8"><div className="rounded-2xl border border-[#cf222e]/40 bg-[#cf222e]/10 p-5"><div className="flex items-center gap-2 text-[#ff7b72]"><ShieldAlert size={18}/><p className="text-xs font-bold uppercase tracking-[.16em]">{state.crisis.type} · response needed</p></div><p className="mt-3 text-xl font-bold">{state.crisis.title}</p><p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">{state.crisis.text} Choose a response below; the quarter evidence remains visible underneath.</p><p className="mt-2 text-xs text-white/55">Campaign capital available: {formatBudget(campaignRemaining, state.currencyMode)}</p><div className="mt-5 grid gap-2 sm:grid-cols-2">{state.crisis.options.map((option) => { const requestedCost = Number(option[3] || 0); const affordable = requestedCost <= 0 || affordableCrisisResponseCost(state as any, requestedCost) >= requestedCost - 1e-9; return <button key={option[0]} disabled={!affordable} onClick={() => onRespond(option[2], option[3])} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[#30363d] bg-[#161b22] p-4 text-left transition hover:border-[#7ee787] hover:bg-[#1f2933] disabled:cursor-not-allowed disabled:opacity-45"><span className="min-w-0 break-words"><b>{option[0]}</b><span className="mt-1 block text-xs text-white/50">{option[1]}</span>{requestedCost ? <span className="mt-2 block text-xs font-bold text-[#ff7b72]">{affordable ? `Cost ${requestedCost}` : `Requires ${requestedCost}; unavailable`}</span> : null}</span><ArrowRight size={16} className="shrink-0 text-[#7ee787]"/></button>; })}</div></div></section>}
    <AiLifecycleReview state={state} onEvaluation={onLifecycleEvaluation || (() => undefined)} onDeployment={onLifecycleDeployment || (() => undefined)} onAdaptation={onLifecycleAdaptation || (() => undefined)} />
    {operatingDecisionDetail.length > 0 && <section className="border-b border-[#30363d] px-5 py-4 sm:px-8" aria-label="Recorded operating choices"><div className="rounded-xl border border-[#58a6ff]/25 bg-[#0969da]/10 p-3"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#79c0ff]">Recorded operating choices</p><p className="mt-1 text-[11px] leading-5 text-white/65">These are the initiative-level mixes used for this quarter. Compare them with the observed outcome before changing one lever.</p><p className="mt-2 text-xs font-semibold leading-5 text-white/85">{operatingDecisionDetail.join(' · ')}</p>{operatingEvidenceDetail.length > 0 && <div className="mt-2 border-t border-[#58a6ff]/15 pt-2 text-[10px] leading-4 text-white/60"><b className="text-[#79c0ff]">Observed loop:</b> {operatingEvidenceDetail.join(' · ')}</div>}</div></section>}
      <div className="grid gap-5 p-5 sm:p-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"><section><div className="flex items-center gap-2"><GitBranch size={18} className="text-[#7ee787]"/><h3 className="text-xl font-bold">System insights &amp; evidence</h3></div><p className="mt-2 text-xs leading-5 text-white/50">The quarter record explains what was funded, how it was operated, and which outcomes moved.</p><p className="mt-2 text-xs leading-5 text-white/60"><span className="font-bold text-[#7ee787]">{operatingModel.label}:</span> {operatingModel.resultInsight}</p><div className="mt-4 space-y-2"><EvidenceItem icon={CircleDollarSign} label="Capital committed" value={formatBudget(quarterSpend, state.currencyMode)} detail={crisisSpend ? `${formatBudget(initiativeSpend, state.currencyMode)} portfolio · ${formatBudget(crisisSpend, state.currencyMode)} response` : `Recorded for Quarter ${state.q}`}/><EvidenceItem icon={Users} label="Funded this quarter" value={fundedInitiatives.length ? fundedInitiatives.join(" · ") : "No initiatives selected"}/><EvidenceItem icon={GitBranch} label="Operating emphasis" value={operatingEmphasis.join(" · ") || "No allocation recorded"}/></div>{state.causalChain.length ? <div className="mt-4 rounded-xl border border-[#30363d] bg-[#161b22] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7ee787]">Causal chain</p><div className="mt-3 space-y-2">{state.causalChain.slice(0, 4).map((item: any) => <div key={item.name} className="border-l-2 border-[#7ee787]/60 pl-3"><b className="text-sm">{item.name}</b>{item.explanation && <p className="mt-1 text-xs leading-5 text-white/50">{item.explanation}</p>}<p className="mt-1 text-[11px] text-white/60">{item.effects?.map((effect: any) => `${effect.metric} ${effect.delta > 0 ? "+" : ""}${Number(effect.delta).toFixed(1)}${effect.unit ? ` ${effect.unit}` : "%"}`).join(" · ")}</p></div>)}</div></div> : <p className="mt-4 rounded-xl border border-[#30363d] bg-[#161b22] p-4 text-sm text-white/50">The causal chain will appear after the next decision.</p>}</section>
      <section><div className="flex items-center gap-2"><Lightbulb size={18} className="text-[#c9b896]"/><h3 className="text-xl font-bold">Top recommendations</h3></div>{recommendations.length ? <div className="mt-4 space-y-3">{recommendations.slice(0, 3).map((rec: any) => <div key={rec.title} className="rounded-xl border border-[#30363d] bg-[#161b22] p-4"><b className="break-words text-sm">{rec.title}</b><p className="mt-2 break-words text-xs leading-5 text-white/55">{rec.message}</p><p className="mt-2 break-words text-xs font-bold text-white/70">Next: {rec.action} · {rec.metric}</p><button onClick={() => onApproveRecommendation(rec.title)} className={`mt-3 rounded-lg px-3 py-2 text-xs font-bold transition ${approved.has(rec.title) ? "bg-[#34d399]/20 text-[#7ee787]" : "bg-[#f0f6fc] text-[#0d1117] hover:bg-[#7ee787]"}`}>{approved.has(rec.title) ? "✓ Approved for next decision" : "Approve recommendation"}</button></div>)}</div> : <p className="mt-4 rounded-xl border border-[#30363d] bg-[#161b22] p-4 text-sm text-white/50">No immediate recommendation overrides the current plan.</p>}</section></div>
      <div className="px-5 pb-5 sm:px-8"><ExperimentReflection quarter={state.q} constrained={state.feedback.startsWith("Experiment recorded:")} reflections={state.userReflections || {}} onSave={onSaveReflection}/>{(state.q === 1 || state.q === 6) && <ReflectionCard quarter={state.q as 1 | 6} reflection={reflection} userReflections={state.userReflections || {}} onSave={onSaveReflection}/>}</div>
      <div className="border-t border-[#30363d] px-5 py-5 sm:px-8"><button type="button" data-testid="advance-quarter" onClick={onAdvance} disabled={Boolean(state.crisis) || lifecycleReviews > 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a7f37] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#2da44e] disabled:cursor-not-allowed disabled:opacity-45">{state.crisis ? <ShieldAlert size={16}/> : lifecycleReviews > 0 ? <CircleAlert size={16}/> : <CheckCircle2 size={16}/>} {state.crisis ? "Resolve the event to continue" : lifecycleReviews > 0 ? `Complete ${lifecycleReviews} lifecycle review${lifecycleReviews === 1 ? "" : "s"} to continue` : state.q >= 12 ? "View final verdict" : "Continue to next quarter"}{!state.crisis && lifecycleReviews === 0 && <ArrowRight size={16}/>}</button></div>
  </div></div>;
}
