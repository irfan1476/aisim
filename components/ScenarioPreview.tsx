import { Activity, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { ScenarioDefinition } from '../lib/scenarios/types';
import { presentScenarioChallenge } from '../lib/scenarios/progress';

type Props = {
  scenario: ScenarioDefinition;
  metrics?: Record<string, number>;
};

const tone = {
  red: { border: 'border-[#cf222e]/25', bg: 'bg-[#fff1f2]', icon: 'text-[#cf222e]', badge: 'bg-[#cf222e]/10 text-[#cf222e]' },
  amber: { border: 'border-[#bf8700]/25', bg: 'bg-[#fff8c5]', icon: 'text-[#9a6700]', badge: 'bg-[#fff8c5] text-[#9a6700]' },
  blue: { border: 'border-[#54aeff]/30', bg: 'bg-[#ddf4ff]', icon: 'text-[#0969da]', badge: 'bg-[#ddf4ff] text-[#0969da]' },
  green: { border: 'border-[#1a7f37]/25', bg: 'bg-[#dafbe1]', icon: 'text-[#1a7f37]', badge: 'bg-[#dafbe1] text-[#1a7f37]' },
} as const;

function valueLabel(value: number, unit: string) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
}

export default function ScenarioPreview({ scenario, metrics }: Props) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {scenario.challenges.map((challenge) => {
        const item = presentScenarioChallenge(challenge, metrics, scenario);
        const colors = tone[item.tone];
        const Icon = item.tone === 'red' ? ShieldAlert : item.tone === 'green' ? CheckCircle2 : item.tone === 'amber' ? AlertTriangle : Activity;
        return (
          <div key={challenge.id} className={`rounded-xl border p-3 ${colors.border} ${colors.bg}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                <Icon size={15} className={`mt-0.5 shrink-0 ${colors.icon}`} />
                <span className="text-sm font-bold text-ink">{challenge.label}</span>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${colors.badge}`}>
                {item.label}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-ink/60">{item.explanation}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-ink/55">
              <span>Now {valueLabel(item.current, scenario.progress.find((progress) => progress.key === challenge.metric)?.unit || 'index')}</span>
              <span>{item.deltaLabel} vs start</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
