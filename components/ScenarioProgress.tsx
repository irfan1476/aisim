import type { GameViewState } from './gameViewTypes';
import { getScenario } from '../lib/scenarios/registry';
import { scenarioProgressScore, scenarioProgressValue } from '../lib/scenarios/progress';
import ScenarioPreview from './ScenarioPreview';

type ScenarioStateView = GameViewState & {
  scenarioState?: { metrics?: Record<string, number> };
};

function valueLabel(value: number, unit: string) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
}

export default function ScenarioProgress({ state }: { state: GameViewState }) {
  const scenario = getScenario(state.scenarioId);
  if (!scenario) return null;
  const viewState = state as ScenarioStateView;
  const metrics = viewState.scenarioState?.metrics || state.scenarioStartingMetrics || {};
  const overall = scenario.progress.length
    ? scenario.progress.reduce((sum, item) => sum + scenarioProgressScore(scenarioProgressValue(metrics, item), item), 0) / scenario.progress.length
    : 0;

  return (
    <section className="mb-5 rounded-3xl border border-[#54aeff]/35 bg-[#f6f8fa] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#0969da]">Scenario progress</p>
          <h2 className="mt-1 text-lg font-bold">{scenario.name}</h2>
        </div>
        <span className="text-sm font-bold text-[#0969da]">{Math.round(overall)}% overall</span>
      </div>
      <div className="mt-4 rounded-2xl border border-[#d0d7de] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#57606a]">Operating constraints</p>
            <p className="mt-1 text-xs text-[#57606a]">Live pressure signals based on the current scenario state.</p>
          </div>
          <span className="text-[11px] font-semibold text-[#57606a]">Updates after each quarter</span>
        </div>
        <ScenarioPreview scenario={scenario} metrics={metrics} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {scenario.progress.map((item) => {
          const value = scenarioProgressValue(metrics, item);
          const score = scenarioProgressScore(value, item);
          return (
            <div key={item.key} className="rounded-xl border border-[#d0d7de] bg-white p-3">
              <div className="flex items-start justify-between gap-3 text-xs font-bold">
                <span>{item.label}</span>
                <span className="text-right text-[#0969da]">{valueLabel(value, item.unit)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#d0d7de]">
                <div className="h-full rounded-full bg-[#0969da] transition-all" style={{ width: `${score}%` }} />
              </div>
              <div className="mt-2 flex justify-between gap-2 text-[11px] text-[#57606a]">
                <span>{Math.round(score)}% toward target</span>
                <span>Start {valueLabel(item.start, item.unit)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-[#57606a]">The challenge responds to your funding, operating maturity, and crisis choices. A controlled signal can still worsen if neglected.</p>
    </section>
  );
}
