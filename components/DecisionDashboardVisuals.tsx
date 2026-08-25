import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { GameViewState } from './gameViewTypes';
import {
  decisionDashboardModel,
  type DashboardPressure,
  type DashboardTrajectory,
} from '../lib/decisionDashboardViewModel';
import { formatCurrency } from '../lib/currency';

function Pressure({ item }: { item: DashboardPressure }) {
  const styles = {
    red: 'border-l-[#cf222e] text-[#cf222e]',
    amber: 'border-l-[#bf8700] text-[#9a6700]',
    blue: 'border-l-[#0969da] text-[#0969da]',
    green: 'border-l-[#1a7f37] text-[#1a7f37]',
  }[item.tone];
  const Icon = item.tone === 'red' ? AlertTriangle : item.tone === 'green' ? CheckCircle2 : Activity;

  return (
    <div className={`rounded-xl border border-[#d0d7de] border-l-4 bg-white p-3 ${styles}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-ink">
          <Icon size={14} />
          <span className="truncate">{item.label}</span>
        </span>
        <b className="text-[10px] uppercase tracking-wide">{item.status}</b>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-current transition-all" style={{ width: `${Math.max(4, Math.min(100, item.progress))}%` }} />
        </div>
        <b className="text-sm text-ink">{item.value.toFixed(item.unit === '%' ? 0 : 1)}{item.unit === '%' ? '%' : ` ${item.unit}`}</b>
      </div>
    </div>
  );
}

function position(value: number, item: DashboardTrajectory) {
  const raw = ((value - item.min) / Math.max(1, item.max - item.min)) * 100;
  const normalised = Math.max(0, Math.min(100, raw));
  return item.direction === 'lower-is-better' ? 100 - normalised : normalised;
}

function display(value: number, unit: string) {
  const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return unit === '%' ? `${rounded}%` : `${rounded} ${unit}`;
}

function MetricCard({ item, events }: { item: DashboardTrajectory; events: Array<{ quarter: number; crisis: boolean; synergies: number }> }) {
  const width = 190;
  const height = 64;
  const pad = 5;
  const points = item.values.length ? item.values : [{ quarter: 1, value: item.current }];
  const count = Math.max(2, points.length);
  const x = (index: number) => pad + (index * (width - pad * 2)) / Math.max(1, count - 1);
  const y = (value: number) => height - pad - (position(value, item) / 100) * (height - pad * 2);
  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ');
  const first = points[0]?.value ?? item.current;
  const rawDelta = item.current - first;
  const improving = item.direction === 'higher-is-better' ? rawDelta >= 0 : rawDelta <= 0;
  const targetY = item.target === undefined ? undefined : y(item.target);
  const eventByQuarter = new Map(events.map((event) => [event.quarter, event]));

  return (
    <article className="rounded-xl border border-[#8c959f] bg-white p-3 shadow-[0_2px_8px_rgba(31,35,40,.06)]" title={`${item.label}: ${display(item.current, item.unit)}. ${item.target === undefined ? 'No target configured.' : `Target ${display(item.target, item.unit)}.`}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-[#24292f]"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="min-w-0 break-words leading-4">{item.label}</span></span>
        <span className="shrink-0 text-[10px] font-semibold text-[#57606a]">{item.source === 'scenario' ? 'Scenario' : 'Core'}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <b className="text-xl tracking-tight text-[#24292f]">{display(item.current, item.unit)}</b>
        <span className={`text-[10px] font-bold ${improving ? 'text-[#1a7f37]' : 'text-[#cf222e]'}`}>{rawDelta === 0 ? '—' : `${improving ? '↑' : '↓'} ${display(Math.abs(rawDelta), item.unit)} vs start`}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-14 w-full" role="img" aria-label={`${item.label} trajectory by quarter`}>
        <path d={`M ${pad} ${height / 2} H ${width - pad}`} stroke="#d8dee4" strokeDasharray="3 3" />
        {targetY !== undefined && <path d={`M ${pad} ${targetY} H ${width - pad}`} stroke={item.color} strokeOpacity=".35" strokeDasharray="2 3" />}
        <polyline points={line} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => {
          const event = eventByQuarter.get(point.quarter);
          return <g key={`${item.key}-${point.quarter}`}>
            {event && <line x1={x(index)} x2={x(index)} y1="2" y2={height - 3} stroke={event.crisis ? '#cf222e' : '#8250df'} strokeOpacity=".45" strokeDasharray="2 2"><title>{event.crisis ? `Q${point.quarter}: crisis response` : `Q${point.quarter}: synergy activated`}</title></line>}
            <circle cx={x(index)} cy={y(point.value)} r="2.7" fill="white" stroke={item.color} strokeWidth="1.8"><title>Q{point.quarter}: {display(point.value, item.unit)}</title></circle>
          </g>;
        })}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] text-[#57606a]"><span>Q1</span><span>{item.target === undefined ? 'Relative trend' : `Target ${display(item.target, item.unit)}`}</span><span>Q{Math.max(1, points.length)}</span></div>
    </article>
  );
}

function Trajectory({ items, events }: { items: DashboardTrajectory[]; events: Array<{ quarter: number; crisis: boolean; synergies: number }> }) {
  const core = items.filter((item) => item.source === 'core');
  const scenario = items.filter((item) => item.source === 'scenario');
  const group = (label: string, groupItems: DashboardTrajectory[]) => groupItems.length > 0 && (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-px flex-1 bg-[#d0d7de]" />
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#57606a]">{label}</p>
        <span className="h-px flex-1 bg-[#d0d7de]" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
        {groupItems.map((item) => <MetricCard key={item.key} item={item} events={events} />)}
      </div>
    </div>
  );
  return (
    <div className="rounded-2xl border border-[#8c959f] bg-[#eef1f3] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#1a7f37]">Campaign trajectory performance</p>
          <p className="mt-1 text-[10px] text-[#57606a]">Solid line = target · markers = completed quarters · click a card for detail.</p>
        </div>
        <span className="rounded-full border border-[#8c959f] bg-white px-2 py-1 text-[10px] font-bold text-[#57606a]">{items.length} signals</span>
      </div>
      <div className="mt-3 space-y-3">
        {group('Core signals', core)}
        {group('Scenario signals', scenario)}
      </div>
    </div>
  );
}

export default function DecisionDashboardVisuals({ state }: { state: GameViewState }) {
  const model = decisionDashboardModel(state);
  const deployed = Number(state.deploymentAmount || 0);
  const budget = Number(state.campaignBudget || 0);
  const showNativePressures = !state.scenarioMode;

  return (
    <section className="mb-0 rounded-2xl border border-[#8c959f] bg-[#f6f8fa] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1a7f37]">Outcome context</p>
          <h2 className="mt-1 text-lg font-bold">{showNativePressures ? 'Campaign movement and active pressures' : 'Campaign trajectory performance'}</h2>
        </div>
        <p className="flex items-center gap-2 text-xs font-bold text-ink/60">
          <CircleDollarSign size={15} className="text-[#9a6700]" />
          {formatCurrency(deployed, state.currencyMode)} planned · {formatCurrency(Math.max(0, budget - Number(state.spent || 0)), state.currencyMode)} reserve
        </p>
      </div>
      <div className={`grid items-start gap-4 ${showNativePressures ? 'xl:grid-cols-[minmax(0,1fr)_minmax(290px,.48fr)]' : ''}`}>
        <Trajectory items={model.trajectory} events={model.events} />
        {showNativePressures && <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {model.pressures.slice(0, 4).map((item) => <Pressure key={item.key} item={item} />)}
        </div>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-ink/45">
        <TrendingUp size={13} className="text-[#1a7f37]" />
        {model.events.length ? `${model.events.length} completed quarter${model.events.length === 1 ? '' : 's'} recorded` : 'No completed quarters yet'}
        {model.events.some((event) => event.synergies) && <><span>·</span><TrendingDown size={13} className="text-[#8250df]" /> Synergy activation recorded</>}
      </div>
    </section>
  );
}
