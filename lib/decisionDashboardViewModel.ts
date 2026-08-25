import type { GameViewState } from '../components/gameViewTypes';
import { getScenario } from './scenarios/registry';
import { presentScenarioChallenge, scenarioProgressValue, scenarioProgressScore } from './scenarios/progress';

export type DashboardTrajectory = {
  key: string;
  label: string;
  unit: string;
  color: string;
  values: Array<{ quarter: number; value: number }>;
  current: number;
  min: number;
  max: number;
  target?: number;
  direction: 'higher-is-better' | 'lower-is-better';
  source: 'core' | 'scenario';
};
export type DashboardPressure = { key: string; label: string; value: number; progress: number; delta: number; status: string; tone: 'red' | 'amber' | 'blue' | 'green'; unit: string };
export type DashboardEvent = { quarter: number; selected: string[]; spend: number; synergies: number; crisis: boolean };
export type DecisionDashboardModel = { trajectory: DashboardTrajectory[]; pressures: DashboardPressure[]; events: DashboardEvent[]; allocation: Array<{ key: string; label: string; value: number; color: string }>; reserve: number };

const native = [
  { key: 'roi', label: 'ROI', unit: '%', color: '#d4a72c', min: 0, max: 60, target: 40, direction: 'higher-is-better' as const },
  { key: 'adoption', label: 'Adoption', unit: '%', color: '#1a7f37', min: 0, max: 100, target: 70, direction: 'higher-is-better' as const },
  { key: 'risk', label: 'Risk', unit: '%', color: '#cf222e', min: 0, max: 100, target: 25, direction: 'lower-is-better' as const },
];

const allocationLabels: Record<string, [string, string]> = {
  people: ['People', '#8250df'], data: ['Data', '#0969da'], infra: ['Infrastructure', '#6e7781'],
  mlops: ['Ops & maintenance', '#1a7f37'], compliance: ['Governance', '#d4a72c'], innovation: ['Innovation', '#bf8700'],
};

function number(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function historyOf(state: GameViewState) { return Array.isArray(state.history) ? state.history as any[] : []; }
function spendOf(entry: any, previous: any) {
  if (Number.isFinite(Number(entry?.fixedInitiativeSpend))) return number(entry.fixedInitiativeSpend);
  if (Number.isFinite(Number(entry?.deployedAmount))) return number(entry.deployedAmount);
  return Math.max(0, number(entry?.metrics?.spent) - number(previous?.metrics?.spent));
}

export function decisionDashboardModel(state: GameViewState): DecisionDashboardModel {
  const history = historyOf(state);
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const definitions = scenario?.progress || [];
  const trajectory: DashboardTrajectory[] = native.map((item) => ({
    ...item,
    values: history.map((entry, index) => ({ quarter: number(entry.q, index + 1), value: number(entry.metrics?.[item.key]) })),
    current: number((state as any)[item.key]),
    source: 'core' as const,
  }));
  const scenarioColors = ['#0969da', '#8250df', '#bf8700'];
  // The decision surface has room for three domain outcomes. Choose the
  // least-controlled pressures, rather than privileging whichever metric a
  // scenario author happened to list first.
  const selectedScenarioDefinitions = scenario
    ? definitions
      .map((item) => ({
        item,
        progress: scenarioProgressScore(
          scenarioProgressValue((state as any).scenarioState?.metrics, item),
          item,
        ),
      }))
      .sort((a, b) => a.progress - b.progress || a.item.label.localeCompare(b.item.label))
      .slice(0, 3)
      .map(({ item }) => item)
    : [];
  if (scenario) selectedScenarioDefinitions.forEach((item, index) => {
    trajectory.push({
      key: item.key,
      label: item.label,
      unit: item.unit,
      color: scenarioColors[index],
      min: item.min,
      max: item.max,
      target: item.target,
      direction: item.direction,
      values: history.map((entry, historyIndex) => ({
        quarter: number(entry.q, historyIndex + 1),
        value: number(entry.scenarioState?.metrics?.[item.key], item.start),
      })),
      current: number((state as any).scenarioState?.metrics?.[item.key], item.start),
      source: 'scenario',
    });
  });
  const pressures: DashboardPressure[] = scenario
    ? scenario.challenges.map((challenge) => {
      const item = presentScenarioChallenge(challenge, (state as any).scenarioState?.metrics, scenario);
      const definition = definitions.find((candidate) => candidate.key === challenge.metric);
      return { key: challenge.id, label: challenge.label, value: item.current, progress: item.progress, delta: item.delta, status: item.label, tone: item.tone, unit: definition?.unit || 'index' };
    })
    : [
      ['adoption', 'Adoption', state.adoption, '#1a7f37'], ['data', 'Data readiness', state.data, '#0969da'],
      ['risk', 'Risk exposure', state.risk, '#cf222e'], ['efficiency', 'Efficiency', state.efficiency, '#d4a72c'],
    ].map(([key, label, value]) => { const current = number(value); const good = key === 'risk' ? current <= 40 : current >= 60; return { key: String(key), label: String(label), value: current, progress: Math.min(100, current), delta: 0, status: good ? 'Controlled' : 'Watch', tone: good ? 'green' : 'amber', unit: '%' } as DashboardPressure; });
  const events = history.map((entry, index) => ({ quarter: number(entry.q, index + 1), selected: (entry.selectedIds || entry.chosen || []).map(String), spend: spendOf(entry, history[index - 1]), synergies: Array.isArray(entry.synergiesDiscovered) ? entry.synergiesDiscovered.length : 0, crisis: Boolean(entry.crisis) }));
  const entries = Object.entries(state.alloc || {}).map(([key, value]) => ({ key, label: allocationLabels[key]?.[0] || key, value: number(value), color: allocationLabels[key]?.[1] || '#6e7781' }));
  const reserve = Math.max(0, 100 - entries.reduce((sum, item) => sum + item.value, 0));
  return { trajectory, pressures, events, allocation: entries, reserve };
}
