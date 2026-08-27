import { quarterlyDeploymentCap, type Allocation, type GameState } from './state';
import type { InitiativeAction } from './businessModel';
import { suggestedLifecycleAction } from './lifecycleResolver';

export type CapitalPace = 'cautious' | 'recommended' | 'accelerated';

export type FirstQuarterPlan = {
  initiativeId: string;
  initiativeName: string;
  action: InitiativeAction;
  allocation: Allocation;
  deploymentByPace: Record<CapitalPace, number>;
};

const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

/** Baseline answers can be sparse while a learner is clicking through them. */
export function hasCompletedBaseline(answers: number[]): boolean {
  return Array.from({ length: 5 }, (_, index) => {
    const answer = Number(answers[index]);
    return answer >= 1 && answer <= 5;
  }).every(Boolean);
}

function starterScore(initiative: GameState['initiativeStates'][string]): number {
  const readiness = finite(initiative.currentData, finite(initiative.data));
  const people = finite(initiative.currentHuman, finite(initiative.human));
  const value = finite(initiative.currentRoi, finite(initiative.roi));
  const risk = finite(initiative.riskScore, initiative.currentRisk === 'HIGH' ? 72 : initiative.currentRisk === 'MED' ? 48 : 24);
  // A first move should be understandable and achievable: favour an initiative
  // with a credible data foundation and business value, while avoiding a high-
  // risk bet that needs a lengthy explanation before it can teach the loop.
  return readiness * 22 + people * 5 + value * .12 - risk * .35;
}

function roundedRelease(value: number, cap: number, remaining: number): number {
  return Number(Math.max(0, Math.min(cap, remaining, value)).toFixed(2));
}

/**
 * A transparent starter plan. It is display guidance only: applying it uses
 * the same selected/action/allocation/deployment controls as any other turn.
 */
export function firstQuarterPlan(state: Pick<GameState,
  'initiativeStates' | 'alloc' | 'campaignBudget' | 'campaignBudgetRemaining' | 'quarterlyBudget' | 'q' | 'spent'
>): FirstQuarterPlan | null {
  const candidates = Object.values(state.initiativeStates || {})
    .filter((initiative) => initiative.lifecycle !== 'retired')
    .sort((left, right) => starterScore(right) - starterScore(left) || left.name.localeCompare(right.name));
  const initiative = candidates[0];
  if (!initiative) return null;

  const remaining = Math.max(0, finite(state.campaignBudgetRemaining));
  const cap = quarterlyDeploymentCap(
    finite(state.campaignBudget),
    remaining,
    finite(state.quarterlyBudget),
    Math.max(1, finite(state.q, 1)),
    finite(state.spent),
  );
  const pace = Math.max(0, finite(state.quarterlyBudget));
  return {
    initiativeId: initiative.id,
    initiativeName: initiative.name,
    action: suggestedLifecycleAction(initiative, Math.max(1, finite(state.q, 1))),
    allocation: { ...state.alloc },
    deploymentByPace: {
      cautious: roundedRelease(pace * .4, cap, remaining),
      recommended: roundedRelease(pace * .6, cap, remaining),
      accelerated: roundedRelease(pace * .8, cap, remaining),
    },
  };
}
