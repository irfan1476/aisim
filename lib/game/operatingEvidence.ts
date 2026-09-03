import type { InitiativeState } from './initiativeState';
import type { Allocation, Effect, OperatingEvidence, OperatingEvidenceSignal } from './state';
import { allocationForInitiative } from './initiativeAllocation';
import { deriveOperatingSignal, operatingStageForAction, profileForState } from './operatingEffects';
import type { OperatingLever } from '../scenarios/types';

const LEVERS: readonly OperatingLever[] = ['infra', 'data', 'people', 'mlops', 'compliance', 'innovation'];
const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const round = (value: number) => Number(value.toFixed(3));

/**
 * Build the learner-facing explanation for one initiative. This is deliberately
 * derived from the same profile/allocation functions used by the engine, so a
 * replay produces the same evidence as live play.
 */
export function buildOperatingEvidence(
  initiative: InitiativeState,
  action: string,
  sharedAllocation: Allocation,
  mode: 'shared' | 'custom' = 'shared',
  initiativeAllocations?: Record<string, Allocation>,
  effectivePortfolioAllocation: Allocation = sharedAllocation,
  previousMetrics: Record<string, number> = {},
  nextMetrics: Record<string, number> = {},
): OperatingEvidence {
  const localAllocation = allocationForInitiative(initiative.id, mode, initiativeAllocations, sharedAllocation);
  const stage = operatingStageForAction(action, initiative.aiLifecycle?.stage);
  const profile = profileForState(initiative);
  const operatingSignal = deriveOperatingSignal(profile, action, localAllocation, initiative.aiLifecycle?.stage);
  const weights = profile?.stageWeights?.[stage] || {};
  const signals: Record<string, OperatingEvidenceSignal> = {};
  LEVERS.forEach((lever, index) => {
    const target = Math.max(1, finite(weights[lever], 100 / LEVERS.length));
    const allocation = finite(localAllocation[lever]);
    // The small deterministic baseline keeps every lever visible even when a
    // learner happens to land exactly on its stage target. Allocation still
    // changes the signal materially, making the explanation useful in replay.
    let delta = round((allocation - target) * 0.1 + (index + 1) * 0.01);
    if (delta === 0) delta = (index + 1) * 0.01;
    signals[lever] = {
      allocation: round(allocation),
      target: round(target),
      delta,
      explanation: allocation >= target
        ? `${lever} support is at or above the ${stage} requirement.`
        : `${lever} is below the ${stage} requirement and is the trade-off to watch.`,
    };
  });

  const primaryMetric = initiative.scenarioMetadata?.primaryMetric;
  const observedDelta = primaryMetric && !['discover', 'pause', 'retire'].includes(action)
    ? round(finite(nextMetrics[primaryMetric]) - finite(previousMetrics[primaryMetric]))
    : 0;
  const outcomeEffects: Effect[] = [{
    metric: primaryMetric || 'operating_capability',
    delta: observedDelta,
    color: observedDelta > 0 ? 'green' : observedDelta < 0 ? 'red' : 'gray',
    explanation: action === 'discover'
      ? 'Discovery records evidence and readiness; it does not claim realised operating value.'
      : action === 'pause' || action === 'retire'
        ? 'This action preserves or closes the option; it does not claim a positive delivery effect this quarter.'
      : observedDelta === 0
        ? 'This cycle strengthened capability without a material primary-metric movement yet.'
        : `${stage} produced a measurable movement in the initiative outcome.`,
  }];
  const tradeOffs = LEVERS
    .filter((lever) => lever !== operatingSignal.bottleneck && signals[lever].allocation < signals[lever].target)
    .slice(0, 3)
    .map((lever) => `${lever} is under-supported for ${stage}; increasing it may improve execution but requires reducing another lever.`);
  if (tradeOffs.length === 0) tradeOffs.push(`The current mix prioritises ${stage} support; watch ${operatingSignal.bottleneck} as the limiting lever.`);

  return {
    initiativeId: initiative.id,
    action,
    localAllocation: { ...localAllocation },
    effectivePortfolioAllocation: { ...effectivePortfolioAllocation },
    bottleneck: operatingSignal.bottleneck,
    signals,
    outcomeEffects,
    tradeOffs,
  };
}

export function buildOperatingEvidenceForPortfolio(
  initiatives: Record<string, InitiativeState>,
  actions: Record<string, string>,
  sharedAllocation: Allocation,
  mode: 'shared' | 'custom' = 'shared',
  initiativeAllocations?: Record<string, Allocation>,
  effectivePortfolioAllocation: Allocation = sharedAllocation,
  previousMetrics: Record<string, number> = {},
  nextMetrics: Record<string, number> = {},
): OperatingEvidence[] {
  return Object.entries(actions)
    .filter(([id, action]) => Boolean(initiatives[id]) && action !== 'inactive')
    .map(([id, action]) => buildOperatingEvidence(
      initiatives[id], action, sharedAllocation, mode, initiativeAllocations,
      effectivePortfolioAllocation, previousMetrics, nextMetrics,
    ));
}
