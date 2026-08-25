'use client';

import { useEffect, useMemo, useState } from 'react';
import { FlaskConical, GitCompareArrows, Play } from 'lucide-react';
import { replayCounterfactual, type CounterfactualTrace, type RecordedDecision } from '../lib/counterfactual';
import type { Allocation, GameState } from '../lib/game/state';

type CounterfactualLabProps = {
  trace: CounterfactualTrace;
  originalState?: GameState;
};

const allocationLabels: Record<keyof Allocation, string> = {
  infra: 'Infrastructure', data: 'Data', people: 'People', mlops: 'MLOps', compliance: 'Governance', innovation: 'Innovation',
};

function decisionFor(trace: CounterfactualTrace, q: number): RecordedDecision | undefined {
  return trace.actions.find((action): action is RecordedDecision => action.type === 'decision' && action.q === q);
}

export default function CounterfactualLab({ trace, originalState }: CounterfactualLabProps) {
  const decisions = useMemo(() => trace.actions.filter((action): action is RecordedDecision => action.type === 'decision'), [trace]);
  const baselineState = useMemo(() => {
    if (originalState) return originalState;
    const first = decisions[0];
    if (!first) return trace.initialState;
    return replayCounterfactual(trace, {
      q: first.q,
      selected: first.selected,
      alloc: first.alloc,
      deploymentAmount: first.deploymentAmount,
    }).state;
  }, [decisions, originalState, trace]);
  const [quarter, setQuarter] = useState(decisions[0]?.q || 1);
  const original = decisionFor(trace, quarter) || decisions[0];
  const [selected, setSelected] = useState<string[]>(original?.selected || []);
  const [alloc, setAlloc] = useState<Allocation>(original?.alloc || baselineState.alloc);
  const [deploymentAmount, setDeploymentAmount] = useState(original?.deploymentAmount || 0);
  const [result, setResult] = useState<ReturnType<typeof replayCounterfactual> | null>(null);

  useEffect(() => {
    const next = decisionFor(trace, quarter);
    if (!next) return;
    setSelected([...next.selected]);
    setAlloc({ ...next.alloc });
    setDeploymentAmount(next.deploymentAmount);
    setResult(null);
  }, [quarter, trace]);

  const allocationTotal = Object.values(alloc).reduce((sum, value) => sum + Number(value || 0), 0);
  const initiatives = Object.values(trace.initialState.initiativeStates || {});
  const toggle = (id: string) => setSelected((current) => current.includes(id)
    ? current.filter((item) => item !== id)
    : current.length < 3 ? [...current, id] : current);
  const run = () => setResult(replayCounterfactual(trace, { q: quarter, selected, alloc, deploymentAmount }));

  if (!decisions.length) return null;
  return <section className="mt-6 rounded-3xl border border-[#0969da]/30 bg-[#ddf4ff]/45 p-6 shadow-sm md:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex items-center gap-3"><FlaskConical className="text-[#0969da]"/><h2 className="text-2xl font-bold">Counterfactual lab</h2></div><p className="mt-2 max-w-2xl text-sm leading-6 text-[#57606a]">Change one recorded board decision, then replay the same seed and rules. Your original campaign stays frozen.</p></div>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0969da]">Seed {trace.seed} · rules {trace.rulesVersion}</span>
    </div>

    <div className="mt-6 grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
      <label className="rounded-2xl border border-[#0969da]/15 bg-white p-4 text-sm font-bold text-[#24292f]">Decision to test
        <select value={quarter} onChange={(event) => setQuarter(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-[#d0d7de] bg-white px-3 py-2 font-normal">
          {decisions.map((decision) => <option key={decision.q} value={decision.q}>Quarter {decision.q}</option>)}
        </select>
        <p className="mt-3 text-xs font-normal leading-5 text-[#57606a]">Later original decisions are replayed when still viable. If your change creates a different crisis or blocks a later plan, the lab shows the first divergence rather than inventing a choice.</p>
      </label>
      <div className="rounded-2xl border border-[#0969da]/15 bg-white p-4">
        <p className="text-sm font-bold text-[#24292f]">Replace the Quarter {quarter} plan</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{initiatives.map((initiative) => <button key={initiative.id} type="button" aria-pressed={selected.includes(initiative.id)} onClick={() => toggle(initiative.id)} className={`rounded-lg border p-3 text-left text-xs transition ${selected.includes(initiative.id) ? 'border-[#0969da] bg-[#ddf4ff] text-[#0969da]' : 'border-[#d0d7de] text-[#57606a]'}`}><b className="block text-[#24292f]">{initiative.name}</b><span className="mt-1 block">{selected.includes(initiative.id) ? 'Included' : 'Add to plan'}</span></button>)}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(Object.keys(alloc) as (keyof Allocation)[]).map((key) => <label key={key} className="text-xs font-bold text-[#57606a]">{allocationLabels[key]}<input type="number" min="0" max="100" value={alloc[key]} onChange={(event) => setAlloc((current) => ({ ...current, [key]: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-[#d0d7de] px-2 py-1.5 text-sm font-normal text-[#24292f]"/></label>)}</div>
        <label className="mt-4 block text-xs font-bold text-[#57606a]">Deployment amount<input type="number" min="0" step="0.1" value={deploymentAmount} onChange={(event) => setDeploymentAmount(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-[#d0d7de] px-2 py-1.5 text-sm font-normal text-[#24292f]"/></label>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className={`text-xs ${allocationTotal === 100 ? 'text-[#1a7f37]' : 'text-[#cf222e]'}`}>{allocationTotal === 100 ? '100% allocated' : `${allocationTotal}% allocated — use 100% to run the comparison.`}</p><button type="button" disabled={allocationTotal !== 100} onClick={run} className="inline-flex items-center gap-2 rounded-xl bg-[#0969da] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Play size={15}/> Replay this branch</button></div>
      </div>
    </div>

    {result && <div className="mt-5 rounded-2xl border border-[#0969da]/20 bg-white p-5">
      <div className="flex items-center gap-2"><GitCompareArrows size={18} className="text-[#0969da]"/><h3 className="font-bold text-[#24292f]">{result.status === 'complete' ? 'Original vs counterfactual' : 'Replay paused at a meaningful divergence'}</h3></div>
      {result.status === 'complete' ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[
        ['Score', `${baselineState.score}/100`, `${result.state.score}/100`], ['ROI', `${baselineState.roi.toFixed(1)}%`, `${result.state.roi.toFixed(1)}%`], ['Adoption', `${baselineState.adoption.toFixed(0)}%`, `${result.state.adoption.toFixed(0)}%`], ['Risk', `${baselineState.risk.toFixed(0)}%`, `${result.state.risk.toFixed(0)}%`], ['Spend', `${baselineState.spent.toFixed(1)}M`, `${result.state.spent.toFixed(1)}M`],
      ].map(([label, originalValue, branchValue]) => <div key={label} className="rounded-xl bg-[#f6f8fa] p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#57606a]">{label}</p><p className="mt-2 text-xs text-[#57606a]">Original <b className="text-[#24292f]">{originalValue}</b></p><p className="mt-1 text-xs text-[#0969da]">Branch <b>{branchValue}</b></p></div>)}</div> : <p className="mt-3 text-sm leading-6 text-[#57606a]">{result.reason} The branch is reproducible through Quarter {result.appliedThroughQuarter}; continue it later by recording a deliberate response or revised decision.</p>}
    </div>}
  </section>;
}
