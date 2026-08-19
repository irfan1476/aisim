'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { BarChart3, LineChart, ShieldCheck } from 'lucide-react';
import { forecastMetrics } from '../lib/game/forecast';
import { bcgProfile } from '../lib/game/scoring';

const card = 'rounded-2xl border p-5 shadow-sm';
const clamp = (value: number) => Math.max(0, Math.min(100, value));

function heatCellStyle(value: number, metric: string): CSSProperties {
  const normalized = clamp(value) / 100;
  // Higher risk is worse; for the other metrics, higher values are stronger.
  const strength = metric === 'risk' ? 1 - normalized : normalized;
  const hue = 210 - strength * 155; // blue → yellow → green
  const saturation = 72;
  const lightness = 24 + strength * 22;
  return {
    backgroundColor: `hsl(${hue} ${saturation}% ${lightness}%)`,
    borderColor: `hsl(${hue} ${Math.min(90, saturation + 8)}% ${Math.min(75, lightness + 20)}% / .7)`,
    color: strength > 0.55 ? '#ffffff' : '#d0d7de',
  };
}

function RoiChart({ points }: { points: { quarter: number; value: number }[] }) {
  const width = 560; const height = 190; const pad = 28;
  const x = (index: number) => pad + (index * (width - pad * 2)) / Math.max(1, points.length - 1);
  const y = (value: number) => height - pad - (clamp(value) / 100) * (height - pad * 2);
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.value)}`).join(' ');
  return <div className="mt-4 overflow-hidden rounded-xl bg-black/15 p-2"><svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" role="img" aria-label="ROI by quarter line chart"><path d={`M ${pad} ${y(0)} H ${width - pad}`} stroke="rgba(255,255,255,.12)"/><path d={`M ${pad} ${y(50)} H ${width - pad}`} stroke="rgba(255,255,255,.12)" strokeDasharray="4 4"/><path d={`M ${pad} ${y(100)} H ${width - pad}`} stroke="rgba(255,255,255,.12)"/><text x="3" y={y(100) + 4} fill="rgba(255,255,255,.4)" fontSize="10">100%</text><text x="10" y={y(50) + 4} fill="rgba(255,255,255,.4)" fontSize="10">50%</text><text x="18" y={y(0) + 4} fill="rgba(255,255,255,.4)" fontSize="10">0%</text><path d={path} fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{points.map((point, index) => <g key={point.quarter}><circle cx={x(index)} cy={y(point.value)} r="5" fill="#0d1117" stroke="#34d399" strokeWidth="3"/><text x={x(index)} y={height - 7} textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="10">Q{point.quarter}</text><text x={x(index)} y={y(point.value) - 10} textAnchor="middle" fill="#a7f3d0" fontSize="10">{point.value.toFixed(1)}%</text></g>)}</svg></div>;
}

const heatRows: [string, string][] = [['ROI', 'roi'], ['Adoption', 'adoption'], ['Risk', 'risk'], ['Data', 'data'], ['Efficiency', 'efficiency']];

function DecisionHeatmap({ entries }: { entries: any[] }) {
  if (!entries.length) {
    return (
      <section className={`${card} border-amber-400/30 bg-amber-400/10`}>
        <div className="flex items-center gap-2"><BarChart3 size={17} className="text-amber-200" /><h3 className="font-bold text-amber-200">Decision heatmap</h3></div>
        <p className="mt-1 text-xs text-white/55">Each cell shows the metric level for a recorded quarter. Risk reverses the scale: greener means safer.</p>
        <div className="mt-4 rounded-xl bg-black/15 p-5 text-center text-xs text-white/55">Complete a quarter to populate the decision heatmap.</div>
      </section>
    );
  }

  const gridStyle: CSSProperties = { gridTemplateColumns: `110px repeat(${entries.length}, minmax(56px, 1fr))` };
  const legendStyle: CSSProperties = { background: 'linear-gradient(90deg, hsl(210 72% 30%), hsl(55 72% 42%), hsl(140 72% 46%))' };
  return (
    <section className={`${card} border-amber-400/30 bg-amber-400/10`}>
      <div className="flex items-center gap-2"><BarChart3 size={17} className="text-amber-200" /><h3 className="font-bold text-amber-200">Decision heatmap</h3></div>
      <p className="mt-1 text-xs text-white/55">Each cell shows the metric level for a recorded quarter. Risk reverses the scale: greener means safer.</p>
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[440px] space-y-2">
          <div className="grid gap-1 text-center text-[10px] text-white/45" style={gridStyle}>
            <span className="self-center text-left">Metric</span>
            {entries.map(entry => <span key={entry.q}>Q{entry.q}</span>)}
          </div>
          {heatRows.map(([label, key]) => (
            <div key={key} className="grid gap-1 text-center text-[11px]" style={gridStyle}>
              <span className="self-center text-left font-medium text-white/65">{label}</span>
              {entries.map(entry => {
                const value = Number(entry.metrics?.[key] ?? entry[key] ?? 0);
                return <span key={`${key}-${entry.q}`} title={`Q${entry.q} ${label}: ${value.toFixed(1)}%`} className="rounded-md border px-1 py-3 font-bold shadow-sm transition-transform hover:scale-[1.03]" style={heatCellStyle(value, key)}>{value.toFixed(0)}%</span>;
              })}
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-white/50"><span>Low</span><div className="h-2 flex-1 rounded-full" style={legendStyle} /><span>High</span></div>
        <p className="mt-2 text-[10px] text-white/45">Recorded quarters: {entries.map(entry => `Q${entry.q}`).join(' · ')}</p>
      </div>
    </section>
  );
}

export default function MagicAnalytics({ state }: { state: any }) {
  const [timeQuarter, setTimeQuarter] = useState(state.q);
  const forecast = useMemo(() => forecastMetrics(state), [state]);
  const dna = { ambition: Math.min(100, state.roi + state.innovation), people: state.adoption + state.alloc.people * 2, governance: state.compliance + 100 - state.risk, data: state.data, resilience: state.satisfaction + state.literacy, balance: 100 - Math.abs(50 - state.alloc.people) * 1.2 };
  const profile = bcgProfile(state); const history = state.history || []; const past = history.find((entry: any) => entry.q === timeQuarter);
  const chartPoints = [...history.map((entry: any) => ({ quarter: entry.q, value: Number(entry.metrics?.roi ?? entry.roi ?? 0) })), { quarter: state.q, value: Number(state.roi || 0) }].filter((point, index, all) => index === all.findIndex(other => other.quarter === point.quarter));
  const failures = [state.risk > 35 && 'Risk exposure is above the board threshold.', state.adoption < 50 && 'Adoption is lagging behind investment ambition.', state.data < 60 && 'Data readiness may constrain scale.'].filter(Boolean) as string[];
  return <div className="space-y-5">
    <section className={`${card} border-sky-400/30 bg-sky-400/10`}><div className="flex items-center justify-between"><div><h3 className="font-bold text-sky-200">Time Machine</h3><p className="mt-1 text-xs text-white/55">Revisit a previous decision point.</p></div><span className="rounded-full bg-sky-400/20 px-2 py-1 text-xs font-bold text-sky-200">Q{timeQuarter}</span></div><input aria-label="Time Machine quarter" type="range" min="1" max={Math.max(1, state.q)} value={timeQuarter} onChange={e => setTimeQuarter(Number(e.target.value))} className="mt-4 w-full accent-[#38bdf8]"/>{past && <p className="mt-3 rounded-lg bg-black/10 p-3 text-xs text-white/70">Chosen: {past.chosen?.join(', ') || 'No recorded initiatives'}</p>}</section>
    <section className={`${card} border-fuchsia-400/30 bg-fuchsia-400/10`}><h3 className="font-bold text-fuchsia-200">Strategy DNA</h3><p className="mt-1 text-xs text-white/55">Your decision pattern across six leadership dimensions.</p><div className="mt-4 grid grid-cols-2 gap-3">{Object.entries(dna).map(([key, value]) => <div key={key}><div className="flex justify-between text-[10px] text-white/60"><span className="capitalize">{key}</span><b className="text-fuchsia-200">{Math.round(value as number)}</b></div><div className="mt-1 h-2 rounded bg-black/15"><div className="h-full rounded bg-fuchsia-300" style={{width:`${clamp(value as number)}%`}}/></div></div>)}</div></section>
    <section className={`${card} border-emerald/30 bg-emerald/10`}><div className="flex items-center gap-2"><LineChart size={17} className="text-emerald"/><h3 className="font-bold text-emerald">ROI trend by quarter</h3></div><p className="mt-1 text-xs text-white/55">Completed quarters plus the current live position.</p>{chartPoints.length > 1 ? <RoiChart points={chartPoints}/> : <div className="mt-4 rounded-xl bg-black/15 p-5 text-center text-xs text-white/55">Complete your first quarter to create the trend line. Current ROI: <b className="text-emerald">{Number(state.roi || 0).toFixed(1)}%</b></div>}</section>
    <DecisionHeatmap entries={history.slice(-8)} />
    <section className={`${card} border-emerald/30 bg-emerald/10`}><h3 className="font-bold text-emerald">Predictive forecast</h3><p className="mt-1 text-xs text-white/55">Local projection from people, data, governance, and trajectory.</p><div className="mt-4 space-y-3">{forecast.map(item => <div key={item.quarter} className="grid grid-cols-[34px_1fr_45px] items-center gap-2 text-xs"><span className="text-white/45">Q{item.quarter}</span><div className="h-3 rounded bg-black/15"><div className="h-full rounded bg-emerald" style={{width:`${item.roi}%`}}/></div><span className="text-right text-emerald">{item.roi.toFixed(0)}%</span></div>)}</div></section>
    <section className={`${card} border-rose-400/30 bg-rose-400/10`}><h3 className="font-bold text-rose-200">Failure analysis</h3>{failures.length ? <ul className="mt-3 space-y-2 text-xs text-white/70">{failures.map(failure => <li key={failure} className="rounded-lg bg-rose-950/30 p-3">⚠ {failure}</li>)}</ul> : <p className="mt-3 text-xs text-emerald">No critical failure pattern detected.</p>}<p className="mt-3 text-[10px] text-white/45">Weakest capability: {state.data < state.adoption ? 'data readiness' : state.risk > 35 ? 'governance' : 'adoption'}.</p></section>
    <section className={`${card} border-violet-400/30 bg-violet-400/10`}><h3 className="font-bold text-violet-200">BCG 10-20-70 benchmark</h3><div className="mt-4 flex h-5 overflow-hidden rounded"><div className="bg-violet-400" style={{width:`${profile.people}%`}}/><div className="bg-emerald" style={{width:`${profile.tech}%`}}/><div className="bg-amber-400" style={{width:`${profile.process}%`}}/></div><div className="mt-2 grid grid-cols-3 text-[10px] text-white/55"><span>People {profile.people}%</span><span>Technology {profile.tech}%</span><span>Process {profile.process}%</span></div><p className="mt-3 text-xs text-white/70">Educational score influence: <b className="text-violet-200">+{profile.score}/5</b></p></section>
  </div>;
}
