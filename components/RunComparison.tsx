import { FlaskConical, GitCompareArrows, Trash2 } from 'lucide-react';
import type { ReplayRun } from '../lib/replay';

type RunComparisonProps = {
  runs: ReplayRun[];
  currentRun: ReplayRun;
  onDelete: (id: string) => void;
  onOpenTrace: (run: ReplayRun) => void;
};

const money = (value: number) => `$${value.toFixed(2)}M`;

export default function RunComparison({ runs, currentRun, onDelete, onOpenTrace }: RunComparisonProps) {
  const comparable = runs.filter((run) => run.id !== currentRun.id).slice(0, 3);
  if (!comparable.length) {
    return (
      <section className="mt-6 rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-3"><GitCompareArrows className="text-[#0969da]" /><h2 className="text-2xl font-bold">Replay notebook</h2></div>
        <p className="mt-3 text-sm leading-6 text-[#656d76]">Save another campaign to compare strategies side by side. The notebook stores the recorded results of each run; it never rewrites history.</p>
      </section>
    );
  }
  return (
    <section className="mt-6 rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-3"><GitCompareArrows className="text-[#0969da]" /><h2 className="text-2xl font-bold">Replay notebook</h2></div><p className="mt-2 text-sm text-[#656d76]">Compare the strategy you just played with earlier experiments.</p></div><span className="rounded-full bg-[#ddf4ff] px-3 py-1 text-xs font-bold text-[#0969da]">{comparable.length} saved</span></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-[#d0d7de] text-xs uppercase tracking-wide text-[#656d76]"><tr><th className="pb-3 pr-4">Campaign</th><th className="pb-3 pr-4">Score</th><th className="pb-3 pr-4">ROI</th><th className="pb-3 pr-4">Adoption</th><th className="pb-3 pr-4">Risk</th><th className="pb-3 pr-4">Spend</th><th className="pb-3"> </th></tr></thead><tbody>{[currentRun, ...comparable].map((run, index) => <tr key={run.id} className="border-b border-[#eaeef2] last:border-0"><td className="py-4 pr-4 font-bold">{run.name}{index === 0 && <span className="ml-2 rounded-full bg-[#fff8c5] px-2 py-1 text-[10px] uppercase tracking-wide text-[#6e5620]">current</span>}<p className="mt-1 text-xs font-normal text-[#656d76]">{run.scenarioId || 'Standard'} · {run.quarters.length} quarters</p></td><td className="py-4 pr-4 font-bold text-[#0969da]">{run.score}/100</td><td className="py-4 pr-4">{run.roi.toFixed(1)}%</td><td className="py-4 pr-4">{run.adoption.toFixed(0)}%</td><td className="py-4 pr-4">{run.risk.toFixed(0)}%</td><td className="py-4 pr-4">{money(run.spent)}</td><td className="py-4 text-right"><div className="flex justify-end gap-3">{index > 0 && run.counterfactualTrace && <button type="button" onClick={() => onOpenTrace(run)} aria-label={`Open counterfactual lab for ${run.name}`} className="inline-flex items-center gap-1 text-[#0969da] hover:text-[#0550ae]"><FlaskConical size={16} /><span className="sr-only">Open lab</span></button>}{index > 0 && <button type="button" onClick={() => onDelete(run.id)} aria-label={`Delete ${run.name}`} className="text-[#656d76] hover:text-[#cf222e]"><Trash2 size={16} /></button>}</div></td></tr>)}</tbody></table></div>
      <p className="mt-4 text-xs leading-5 text-[#656d76]">A higher score is not the only lesson: compare whether a run traded early ROI for lower risk, stronger adoption, or better scenario progress.</p>
    </section>
  );
}
