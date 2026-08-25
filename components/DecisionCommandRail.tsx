'use client';

import { Activity, BookOpenCheck, BrainCircuit, Compass, Download, FileArchive, FlaskConical, GitBranch, RotateCcw, Save, Settings2, PanelRightOpen, type LucideIcon } from 'lucide-react';

type Props = {
  quarter: number;
  onAdvisor: () => void;
  onCoach: () => void;
  onSimulator: () => void;
  onDNA: () => void;
  onEvolution: () => void;
  onLearn: () => void;
  onAnalytics: () => void;
  onSave: () => void;
  onExportSummary: () => void;
  onExportFull: () => void;
  onExportMetrics: () => void;
  onReset: () => void;
  onRoadmap: () => void;
};

type RailActionProps = {
  label: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  onClick: () => void;
  testId?: string;
};

function RailAction({ label, description, icon: Icon, tone, onClick, testId }: RailActionProps) {
  return <button type="button" title={description} aria-label={`Open ${label}`} data-testid={testId} onClick={onClick} className={`group/action flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(0,0,0,.18)] focus-visible:outline-none focus-visible:ring-2 ${tone}`}>
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20"><Icon size={17}/></span>
    <span className="min-w-0">
      <span className="block break-words text-xs font-bold leading-4">{label}</span>
      <span className="mt-0.5 block break-words text-[10px] leading-4 opacity-65">{description}</span>
    </span>
  </button>;
}

/**
 * A persistent labelled decision sidebar. Detailed views remain on-demand,
 * but the navigation itself stays visible so learners always know where the
 * supporting tools live.
 */
export default function DecisionCommandRail({ quarter, onAdvisor, onCoach, onSimulator, onDNA, onEvolution, onLearn, onAnalytics, onSave, onExportSummary, onExportFull, onExportMetrics, onReset, onRoadmap }: Props) {
  return <aside className="order-1 relative hidden w-64 shrink-0 border-r border-[#30363d] bg-[#0d1117] p-3 lg:order-1 lg:block">
    <nav aria-label="Decision command sidebar" className="sticky top-24 flex h-[calc(100vh-7rem)] min-h-[600px] flex-col rounded-2xl border border-[#30363d] bg-[#161b22] p-3 shadow-[0_14px_34px_rgba(1,4,9,.28)]">
      <div className="flex items-center gap-3 border-b border-[#30363d] px-2 pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2da44e]/50 bg-[#1a7f37] text-white"><PanelRightOpen size={20}/></span>
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-white">Decision tools</p><p className="mt-1 text-[10px] leading-4 text-white/50">Open a lens when you need it</p></div>
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-5">
        <section aria-label="Act"><p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#7ee787]">Decide</p><div className="space-y-2"><RailAction label="Board advisor" description="Ask from a board lens" icon={BrainCircuit} tone="border-[#30363d] bg-[#161b22] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onAdvisor}/><RailAction label="Quarter coach" description="Read the trade-offs" icon={Compass} tone="border-[#30363d] bg-[#161b22] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onCoach}/><RailAction label="Strategy simulator" description="Preview before committing" icon={FlaskConical} tone="border-[#30363d] bg-[#161b22] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onSimulator}/></div></section>
        <section aria-label="Reflect" className="border-y border-[#30363d] py-5"><p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#7ee787]">Reflect</p><div className="space-y-2"><RailAction label="Strategy DNA" description="Pattern across decisions" icon={GitBranch} tone="border-[#30363d] bg-[#0d1117] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onDNA}/><RailAction label="Initiative evolution" description="Maturity, risk, and spend" icon={Activity} tone="border-[#30363d] bg-[#0d1117] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onEvolution}/><RailAction label="Learning loop" description="Carry evidence forward" icon={BookOpenCheck} tone="border-[#30363d] bg-[#0d1117] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onLearn}/></div></section>
        <section aria-label="Evidence"><p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#7ee787]">Evidence</p><div className="space-y-2"><RailAction label="Analytics" description={`Open Q${quarter} evidence`} icon={Activity} tone="border-[#2da44e] bg-[#1a7f37] text-white focus-visible:ring-[#2da44e]" onClick={onAnalytics} testId="analytics-trigger"/><RailAction label="Campaign roadmap" description="See what carried forward" icon={GitBranch} tone="border-[#30363d] bg-[#0d1117] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onRoadmap}/></div></section>
        <section aria-label="Campaign" className="border-t border-[#30363d] pt-5"><p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#7ee787]">Campaign</p><div className="space-y-2"><RailAction label="Save checkpoint" description="Keep this decision record" icon={Save} tone="border-[#30363d] bg-[#0d1117] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onSave}/><RailAction label="Export summary" description="Download a quick report" icon={Download} tone="border-[#30363d] bg-[#0d1117] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onExportSummary}/><RailAction label="Export full record" description="Download report and metrics" icon={FileArchive} tone="border-[#30363d] bg-[#0d1117] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onExportFull}/><RailAction label="Export metrics" description="Download quarter data" icon={Download} tone="border-[#30363d] bg-[#0d1117] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onExportMetrics}/><RailAction label="Reset campaign" description="Start this campaign again" icon={RotateCcw} tone="border-[#30363d] bg-[#0d1117] text-white focus-visible:ring-[#2da44e] hover:border-[#2da44e]" onClick={onReset}/></div></section>
      </div>
      <div className="border-t border-[#30363d] px-2 pt-3"><p className="flex items-center gap-2 text-[10px] font-bold text-white/60"><Settings2 size={12} className="text-[#7ee787]"/> Q{quarter} workspace</p><p className="mt-1 text-[10px] leading-4 text-white/40">Tools stay available without competing with the decision.</p></div>
    </nav>
  </aside>;
}
