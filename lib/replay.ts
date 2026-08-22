import type { GameState, QuarterSnapshot } from './game/state';

export const REPLAY_STORAGE_KEY = 'aisim-replay-notebook-v1';

export type ReplayQuarter = {
  q: number;
  selectedIds: string[];
  spend: number;
  roi: number;
  adoption: number;
  risk: number;
  scenarioMetrics: Record<string, number>;
  portfolioPosture?: string;
  selectedCount?: number;
};

export type ReplayRun = {
  id: string;
  name: string;
  createdAt: string;
  scenarioId?: string;
  scenarioMode: boolean;
  seed?: number;
  rulesVersion: string;
  score: number;
  roi: number;
  adoption: number;
  risk: number;
  spent: number;
  campaignBudget: number;
  quarters: ReplayQuarter[];
  strongestQuarter?: number;
  mostUsedInitiative?: string;
};

const finite = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const stringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function snapshotToQuarter(snapshot: QuarterSnapshot): ReplayQuarter {
  const metrics = snapshot.metrics || {};
  const portfolio = snapshot.portfolio;
  const scenarioMetrics = snapshot.scenarioState?.metrics || {};
  return {
    q: finite(snapshot.q),
    selectedIds: stringArray(snapshot.selectedIds || snapshot.chosen),
    spend: finite(metrics.spent),
    roi: finite(metrics.roi),
    adoption: finite(metrics.adoption),
    risk: finite(metrics.risk),
    scenarioMetrics: Object.fromEntries(
      Object.entries(scenarioMetrics).filter(([, value]) => typeof value === 'number' && Number.isFinite(value)),
    ),
    portfolioPosture: portfolio?.portfolioPosture || snapshot.portfolioPosture,
    selectedCount: portfolio?.selectedCount ?? snapshot.selectedCount,
  };
}

export function buildReplayRun(state: GameState, name: string): ReplayRun {
  const quarters = (state.history || []).map(snapshotToQuarter);
  const frequency = quarters.flatMap((quarter) => quarter.selectedIds).reduce<Record<string, number>>((counts, id) => {
    counts[id] = (counts[id] || 0) + 1;
    return counts;
  }, {});
  const strongestQuarter = quarters.reduce<number | undefined>((best, quarter) =>
    best === undefined || quarter.roi > (quarters.find((item) => item.q === best)?.roi ?? -Infinity)
      ? quarter.q
      : best,
  undefined);
  const mostUsedInitiative = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    // This identifier is notebook metadata only; gameplay is never seeded from it.
    id: `run-${Date.now()}`,
    name: name.trim() || `${state.scenarioId || 'standard'} campaign`,
    createdAt: new Date().toISOString(),
    scenarioId: state.scenarioId,
    scenarioMode: state.scenarioMode,
    seed: state.runMetadata?.seed ?? state.initiativeGeneration?.seed,
    rulesVersion: state.runMetadata?.rulesVersion || '2.0',
    score: finite(state.score),
    roi: finite(state.roi),
    adoption: finite(state.adoption),
    risk: finite(state.risk),
    spent: finite(state.spent),
    campaignBudget: finite(state.campaignBudget),
    quarters,
    strongestQuarter,
    mostUsedInitiative,
  };
}

export function readReplayRuns(): ReplayRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(REPLAY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is ReplayRun => Boolean(item && typeof item === 'object')) : [];
  } catch {
    return [];
  }
}

export function saveReplayRun(run: ReplayRun): ReplayRun[] {
  const runs = [run, ...readReplayRuns().filter((existing) => existing.id !== run.id)].slice(0, 12);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(runs));
    } catch {
      // A completed campaign remains usable even when storage is unavailable.
    }
  }
  return runs;
}

export function deleteReplayRun(id: string): ReplayRun[] {
  const runs = readReplayRuns().filter((run) => run.id !== id);
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(runs)); } catch { /* ignore */ }
  }
  return runs;
}
