import { BookOpen, FileCheck2, Gauge, LayoutDashboard, Scale, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { GameState } from '../lib/game/state';
import type { V3ScenarioPack } from '../lib/scenarios/types';
import { projectV3Analytics } from '../lib/game/analyticsProjection';

type Props = { state: Pick<GameState, 'v3State' | 'history' | 'score' | 'roi' | 'revenue' | 'efficiency' | 'adoption'>; pack?: V3ScenarioPack };
type Tab = 'dashboard' | 'ledger' | 'metrics' | 'evidence' | 'governance';
const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'ledger', label: 'Ledger', icon: BookOpen }, { id: 'metrics', label: 'Metrics', icon: Gauge }, { id: 'evidence', label: 'Evidence', icon: FileCheck2 }, { id: 'governance', label: 'Governance', icon: Scale },
];

/** V3-only analytics sidecar. It deliberately has no actions that mutate game state. */
export default function V3AnalyticsSidecar({ state, pack }: Props) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const projection = useMemo(() => pack && state.v3State ? projectV3Analytics(state.v3State, pack, state.history as Array<Record<string, unknown>>, state) : null, [pack, state]);
  if (!projection) return null;
  return <aside aria-label="V3 analytics" className="rounded-3xl border border-ink/8 bg-white p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Scenario analytics</p><h2 className="mt-1 text-lg font-bold">Decision sidecar</h2></div><ShieldCheck size={18} className="text-emerald" aria-hidden="true" /></div>
    <div role="tablist" aria-label="Analytics views" className="mt-4 grid grid-cols-5 gap-1 rounded-xl bg-ink/5 p-1">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} aria-label={label} onClick={() => setTab(id)} className={`flex items-center justify-center rounded-lg px-1 py-2 text-[10px] font-bold ${tab === id ? 'bg-white text-ink shadow-sm' : 'text-ink/45 hover:text-ink'}`}><Icon size={14} /></button>)}</div>
    <div className="mt-4" role="tabpanel">{tab === 'dashboard' && <Dashboard projection={projection} />}{tab === 'ledger' && <Ledger projection={projection} />}{tab === 'metrics' && <Metrics projection={projection} />}{tab === 'evidence' && <Evidence projection={projection} />}{tab === 'governance' && <Governance projection={projection} />}</div>
  </aside>;
}

type Projection = NonNullable<ReturnType<typeof projectV3Analytics>>;
function Dashboard({ projection: p }: { projection: Projection }) { return <div className="grid grid-cols-2 gap-2">{[['Quarter', p.dashboard.quarter], ['Budget left', p.dashboard.budgetRemaining], ['Active bets', p.dashboard.activeInitiatives], ['Gate health', `${Math.round(p.dashboard.gateHealth)}%`], ['Stakeholders', Math.round(p.dashboard.stakeholderHealth)], ['Evidence', p.dashboard.evidenceCount]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-ink/8 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>)}</div>; }
function Ledger({ projection: p }: { projection: Projection }) { return <div className="space-y-2">{p.ledger.length ? p.ledger.map((entry) => <article key={entry.id} className="rounded-xl border border-ink/8 p-3"><p className="text-xs font-bold">Q{entry.quarter} · {entry.initiativeIds.join(', ') || 'Portfolio'}</p><p className="mt-1 text-xs leading-5 text-ink/60">{entry.rationale}</p><p className="mt-2 text-[10px] text-ink/40">Evidence: {entry.evidenceIds.join(', ') || 'Not cited'}</p></article>) : <Empty label="No ledger entries yet." />}</div>; }
function Metrics({ projection: p }: { projection: Projection }) { return <div className="space-y-2">{Object.entries(p.metrics).map(([key, metric]) => <div key={key} className="rounded-xl border border-ink/8 p-3"><div className="flex justify-between gap-2"><span className="text-xs font-bold">{metric.current}{metric.unit} <span className="font-normal text-ink/45">{key}</span></span><span className="text-[10px] text-ink/45">Owner: {metric.owner || '—'}</span></div><p className="mt-2 text-[10px] text-ink/45">Sources: {[...metric.sourceRuleIds, ...metric.sourceEvidenceIds].join(', ') || 'Declared baseline'}</p></div>)}</div>; }
function Evidence({ projection: p }: { projection: Projection }) { const evidence = p.evidence || []; return <div className="space-y-2">{evidence.length ? evidence.map((item) => <article key={item.id} className="rounded-xl border border-ink/8 p-3"><p className="text-xs font-bold">{item.title || item.id}</p><p className="mt-1 text-[10px] text-ink/45">{item.sourceStatus || 'Source status not stated'} · Claim: {item.claimStatus || 'not stated'}</p></article>) : <Empty label="No evidence authored." />}</div>; }
function Governance({ projection: p }: { projection: Projection }) { return <div className="space-y-2">{Object.values(p.gates).map((gate) => <div key={gate.id} className="flex items-center justify-between rounded-xl border border-ink/8 p-3"><span className="text-xs font-bold">{gate.id}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${gate.status === 'met' || gate.status === 'repaired' ? 'bg-emerald/10 text-emerald' : 'bg-gold/15 text-ink/60'}`}>{gate.status}</span></div>)}<p className="mt-3 text-[10px] text-ink/45">Gate status is reported from authored evidence and conditions; this panel does not change it.</p></div>; }
function Empty({ label }: { label: string }) { return <p className="rounded-xl bg-ink/5 p-4 text-xs text-ink/50">{label}</p>; }
