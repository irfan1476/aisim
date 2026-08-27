import type { GameViewState } from './gameViewTypes';
import { getScenario } from '../lib/scenarios/registry';
import { scenarioProgressScore, scenarioProgressValue } from '../lib/scenarios/progress';
import ScenarioPreview from './ScenarioPreview';

type ScenarioStateView = GameViewState & {
  scenarioState?: { metrics?: Record<string, number> };
};

type Props = {
  state: GameViewState;
};

export default function ScenarioProgress({ state }: Props) {
  const scenario = getScenario(state.scenarioId);
  if (!scenario) return null;
  const viewState = state as ScenarioStateView;
  const metrics = viewState.scenarioState?.metrics || state.scenarioStartingMetrics || {};
  const overall = scenario.progress.length
    ? scenario.progress.reduce((sum, item) => sum + scenarioProgressScore(scenarioProgressValue(metrics, item), item), 0) / scenario.progress.length
    : 0;

  return (
    <section className="mb-0 rounded-2xl border border-[#8c959f] bg-[#f6f8fa] p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1a7f37]">Operating signal focus</p>
          <h2 className="mt-1 text-lg font-bold">{scenario.name}</h2>
        </div>
        <span className="rounded-full border border-[#8c959f] bg-white px-2 py-1 text-xs font-bold text-[#1a7f37]">{Math.round(overall)}% overall</span>
      </div>
      <div className="mt-4 border-t border-[#d8dee4] pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#57606a]">Operating signal focus</p>
            <p className="mt-1 text-xs text-[#57606a]">Current position, target, and movement by operating pressure.</p>
          </div>
          <span className="hidden text-[11px] font-semibold text-[#57606a] sm:inline">Updates after each quarter</span>
        </div>
        <ScenarioPreview scenario={scenario} metrics={metrics} history={state.history} />
        <p className="mt-3 text-xs text-[#57606a]">Signals change with funding, operating maturity, and crisis choices. Colour is an accent; the written status and target lane carry the meaning.</p>
      </div>
    </section>
  );
}
