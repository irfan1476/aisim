import type { ScenarioOperatingProfile, ScenarioOperatingStage, OperatingLever } from '../scenarios/types';
import type { Allocation } from './state';

export type OperatingAction = 'discover' | 'pilot' | 'scale' | 'maintain' | 'pause' | 'retire' | 'inactive';

export type OperatingSignal = {
  stage: ScenarioOperatingStage;
  fit: number;
  bottleneck: OperatingLever;
  support: Record<OperatingLever, number>;
};

const LEVERS: readonly OperatingLever[] = ['infra', 'data', 'people', 'mlops', 'compliance', 'innovation'];
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

/** Translate the legacy learner action to the shared AI lifecycle vocabulary. */
export function operatingStageForAction(action: string, aiStage?: string): ScenarioOperatingStage {
  switch (action) {
    case 'discover': return 'data_readiness';
    case 'pilot': return 'pilot';
    case 'scale': return 'deploy';
    case 'maintain': return 'monitor';
    case 'pause':
    case 'retire':
    case 'inactive': return 'adapt';
    default:
      return aiStage && ['data_readiness', 'experiment', 'pilot', 'evaluate', 'deploy', 'monitor', 'adapt'].includes(aiStage)
        ? aiStage as ScenarioOperatingStage
        : 'pilot';
  }
}

/**
 * Compare the learner's mix with the initiative's stage-specific support
 * profile. A perfect match scores 1; an under-supported capability remains
 * recoverable and is surfaced as a bottleneck rather than becoming a hidden
 * hard gate. The calculation is pure and deterministic for preview/replay.
 */
export function deriveOperatingSignal(
  profile: ScenarioOperatingProfile | undefined,
  action: string,
  allocation: Partial<Allocation>,
  aiStage?: string,
): OperatingSignal {
  const stage = operatingStageForAction(action, aiStage);
  const weights = profile?.stageWeights?.[stage] || {};
  const fallbackWeight = 100 / LEVERS.length;
  const support = Object.fromEntries(LEVERS.map((lever) => {
    const target = Math.max(1, finite(weights[lever], fallbackWeight));
    // 1 means the learner met the stage recommendation; >1 is useful surplus
    // but is bounded so one lever cannot erase every other trade-off.
    return [lever, clamp(finite(allocation[lever]) / target, 0, 1.35)];
  })) as Record<OperatingLever, number>;
  const totalWeight = LEVERS.reduce((sum, lever) => sum + Math.max(0, finite(weights[lever], fallbackWeight)), 0) || 100;
  const weightedSupport = LEVERS.reduce((sum, lever) => sum + support[lever] * Math.max(0, finite(weights[lever], fallbackWeight)), 0) / totalWeight;
  const fit = Number(clamp(.7 + weightedSupport * .3, .7, 1.105).toFixed(4));
  const order = profile?.bottleneckOrder?.length ? profile.bottleneckOrder : [...LEVERS];
  const bottleneck = order.find((lever) => support[lever] < .85) || [...LEVERS].sort((a, b) => support[a] - support[b])[0];
  return { stage, fit, bottleneck, support };
}

export function profileForState(state: { operatingProfile?: ScenarioOperatingProfile; scenarioMetadata?: { operatingProfile?: ScenarioOperatingProfile } }): ScenarioOperatingProfile | undefined {
  return state.operatingProfile || state.scenarioMetadata?.operatingProfile;
}
