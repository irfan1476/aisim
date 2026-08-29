import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import type { ScenarioDefinition } from '../lib/scenarios/types';
import { presentScenarioChallenge } from '../lib/scenarios/progress';

type Props = {
  scenario: ScenarioDefinition;
  metrics?: Record<string, number>;
  history?: unknown[];
};

const tone = {
  red: { accent: 'border-l-[#cf222e]', icon: 'text-[#cf222e] bg-[#fff1f2]', badge: 'text-[#cf222e] bg-[#fff1f2]', line: '#cf222e' },
  amber: { accent: 'border-l-[#bf8700]', icon: 'text-[#9a6700] bg-[#fff8c5]', badge: 'text-[#9a6700] bg-[#fff8c5]', line: '#bf8700' },
  blue: { accent: 'border-l-[#0969da]', icon: 'text-[#0969da] bg-[#ddf4ff]', badge: 'text-[#0969da] bg-[#ddf4ff]', line: '#0969da' },
  green: { accent: 'border-l-[#1a7f37]', icon: 'text-[#1a7f37] bg-[#dafbe1]', badge: 'text-[#1a7f37] bg-[#dafbe1]', line: '#1a7f37' },
} as const;

function valueLabel(value: number, unit: string) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
}

function clampPosition(value: number, min: number, max: number) {
  return Math.min(1, Math.max(0, (value - min) / Math.max(1, max - min)));
}

function Gauge({
  current,
  target,
  min,
  max,
  direction,
  unit,
  label,
}: {
  current: number;
  target: number;
  min: number;
  max: number;
  direction: 'higher-is-better' | 'lower-is-better';
  unit: string;
  label: string;
}) {
  const currentPosition = clampPosition(current, min, max);
  const targetPosition = clampPosition(target, min, max);

  return (
    <div
      className="mt-3 rounded-xl border border-[#8c959f] bg-[#f6f8fa] p-3"
      role="img"
      aria-label={`${label}: ${valueLabel(current, unit)} current. Target ${valueLabel(target, unit)}. ${direction === 'lower-is-better' ? 'Lower is better.' : 'Higher is better.'}`}
    >
      <div className="relative px-1 pt-1" aria-hidden="true">
        <div className="relative h-1.5 overflow-visible rounded-full" style={{ background: direction === 'lower-is-better' ? 'linear-gradient(90deg,#2da44e,#d4a72c 55%,#cf222e)' : 'linear-gradient(90deg,#cf222e,#d4a72c 55%,#2da44e)' }}>
          <span className="absolute -top-1.5 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-[#24292f] shadow" style={{ left: `${currentPosition * 100}%` }} />
          <span className="absolute -top-1 h-3.5 border-l-2 border-dashed border-[#24292f]" style={{ left: `${targetPosition * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-[#57606a]"><span>Current ●</span><span>Target |</span></div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#d8dee4] pt-2 text-[10px] font-bold uppercase tracking-wide">
        <span className="text-[#24292f]">{direction === 'lower-is-better' ? 'Lower is better' : 'Higher is better'}</span>
        <span className="text-[#57606a]">Target · {valueLabel(target, unit)}</span>
      </div>
    </div>
  );
}

function trendPoints(values: number[]) {
  const width = 84;
  const height = 24;
  const safe = values.length > 1 ? values : [values[0] || 0, values[0] || 0];
  const min = Math.min(...safe);
  const max = Math.max(...safe);
  return safe.map((value, index) => {
    const x = (index * width) / Math.max(1, safe.length - 1);
    const y = height - 3 - ((value - min) / Math.max(1, max - min)) * (height - 6);
    return `${x},${y}`;
  }).join(' ');
}

function historyFor(history: unknown[] | undefined, key: string, start: number, current: number) {
  const values = (history || [])
    .map((entry: any) => Number(entry?.scenarioState?.metrics?.[key]))
    .filter((value) => Number.isFinite(value));
  return [start, ...values.slice(-4), current];
}

export default function ScenarioPreview({ scenario, metrics, history }: Props) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {scenario.challenges.map((challenge) => {
        const item = presentScenarioChallenge(challenge, metrics, scenario);
        const colors = tone[item.tone];
        const Icon = item.tone === 'red' ? ShieldAlert : item.tone === 'green' ? CheckCircle2 : item.tone === 'amber' ? AlertTriangle : Activity;
        const definition = scenario.progress.find((progress) => progress.key === challenge.metric);
        const unit = definition?.unit || 'index';
        const min = definition?.min ?? 0;
        const max = definition?.max ?? 100;
        const trend = historyFor(history, challenge.metric, item.start, item.current);
        const improving = challenge.direction === 'higher-is-better' ? item.delta >= 0 : item.delta <= 0;
        const TrendIcon = improving ? TrendingUp : TrendingDown;

        return (
          <article key={challenge.id} title={`${challenge.label}: ${item.label}. ${item.explanation}`} className={`rounded-xl border border-[#8c959f] border-l-4 bg-white p-3 ${colors.accent}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors.icon}`}><Icon size={15} aria-hidden="true" /></span>
                <span className="min-w-0 break-words text-sm font-bold leading-5 text-ink">{challenge.label}</span>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${colors.badge}`}>
                {item.label}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 items-end gap-2">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-ink/45">Current</span>
                <b className="text-xl text-ink">{valueLabel(item.current, unit)}</b>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-ink/45">Target</span>
                <b className="text-sm text-ink/65">{valueLabel(item.target, unit)}</b>
              </div>
              <div className="text-right"><span className="block text-[10px] font-bold uppercase tracking-widest text-ink/45">Gap</span><b className={`text-sm ${item.progress >= 70 ? 'text-[#1a7f37]' : 'text-[#9a6700]'}`}>{item.delta > 0 ? '+' : ''}{valueLabel(item.current - item.target, unit)}</b></div>
            </div>

            <Gauge
              current={item.current}
              target={item.target}
              min={min}
              max={max}
              direction={challenge.direction}
              unit={unit}
              label={challenge.label}
            />

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#d8dee4] pt-2">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-ink/55"><TrendIcon size={12} className={improving ? 'text-[#1a7f37]' : 'text-[#cf222e]'} />{item.deltaLabel} vs start</span>
              <span className="text-[10px] text-ink/55">Operating pressure: <b className={item.progress >= 70 ? 'text-[#1a7f37]' : 'text-[#9a6700]'}>{Math.round(100 - item.progress)}% {item.progress >= 70 ? 'Nominal' : 'Elevated'}</b></span>
              <svg viewBox="0 0 84 24" className="h-6 w-20" role="img" aria-label={`${challenge.label} historical trend`}>
                <polyline points={trendPoints(trend)} fill="none" stroke={colors.line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </article>
        );
      })}
    </div>
  );
}
