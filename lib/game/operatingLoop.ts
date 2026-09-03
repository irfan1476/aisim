import type { InitiativeAction } from './businessModel';
import type { Allocation } from './state';
import { resolveOperatingProfile } from '../scenarios/scenarioHelpers';
import type { OperatingLever, ScenarioOperatingProfile, ScenarioOperatingStage } from '../scenarios/types';

export const OPERATING_LEVER_LABELS: Record<OperatingLever, string> = {
  infra: 'Infrastructure',
  data: 'Data',
  people: 'People',
  mlops: 'Ops & maintenance',
  compliance: 'Governance',
  innovation: 'Innovation',
};

export const OPERATING_LEVER_ROLES: Record<OperatingLever, string> = {
  infra: 'integration and rollout throughput',
  data: 'data readiness and evidence quality',
  people: 'workflow adoption and change capacity',
  mlops: 'reliability, monitoring, and drift control',
  compliance: 'assurance, safeguards, and risk control',
  innovation: 'hypothesis breadth and learning velocity',
};

const ACTION_STAGE: Record<InitiativeAction, ScenarioOperatingStage> = {
  discover: 'discover',
  pilot: 'pilot',
  scale: 'scale',
  maintain: 'maintain',
  pause: 'pause',
  retire: 'retire',
};

const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export type OperatingLoopReadout = {
  profile: ScenarioOperatingProfile;
  stage: ScenarioOperatingStage;
  bottleneck: OperatingLever;
  recommended: Array<{ lever: OperatingLever; value: number }>;
  gaps: Array<{ lever: OperatingLever; current: number; recommended: number; gap: number }>;
  summary: string;
  tradeoff: string;
};

type OperatingFacts = { risk: string; data: number; human: number; operatingProfile?: ScenarioOperatingProfile };

export function operatingProfileFor(initiative: OperatingFacts): ScenarioOperatingProfile {
  if (initiative.operatingProfile) return initiative.operatingProfile;
  const risk = initiative.risk === 'HIGH' || initiative.risk === 'MED' || initiative.risk === 'LOW' ? initiative.risk : 'MED';
  return resolveOperatingProfile({ ...initiative, risk });
}

export function operatingLoopReadout(
  initiative: OperatingFacts,
  action: InitiativeAction,
  allocation: Partial<Allocation> | undefined,
): OperatingLoopReadout {
  const profile = operatingProfileFor(initiative);
  const stage = ACTION_STAGE[action] || 'pilot';
  const weights = profile.stageWeights[stage] || profile.stageWeights.pilot || {};
  const recommended = Object.entries(weights)
    .map(([lever, value]) => ({ lever: lever as OperatingLever, value: Number(finite(value)) }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);
  const gaps = recommended
    .map(({ lever, value: recommendedValue }) => {
      const current = finite(allocation?.[lever]);
      return { lever, current, recommended: recommendedValue, gap: Number((recommendedValue - current).toFixed(1)) };
    })
    .filter((item) => item.gap > 2)
    .sort((left, right) => right.gap - left.gap);
  const bottleneck = gaps[0]?.lever || recommended[0]?.lever || profile.bottleneckOrder[0] || 'data';
  const stageLabel = stage.replaceAll('_', ' ');
  const summary = `${OPERATING_LEVER_LABELS[bottleneck]} is the leading support need for ${stageLabel}. It supports ${OPERATING_LEVER_ROLES[bottleneck]}.`;
  const tradeoff = gaps.length
    ? `${OPERATING_LEVER_LABELS[gaps[0].lever]} is ${gaps[0].gap.toFixed(0)} points below the stage recommendation; increasing it means taking points from another capability.`
    : `Your mix covers the main ${stageLabel} support needs. Moving points elsewhere may improve a different capability but creates a visible trade-off.`;
  return { profile, stage, bottleneck, recommended, gaps, summary, tradeoff };
}

export function formatOperatingMix(readout: OperatingLoopReadout, limit = 3): string {
  return readout.recommended.slice(0, limit).map(({ lever, value }) => `${OPERATING_LEVER_LABELS[lever]} ${value.toFixed(0)}%`).join(' · ');
}

/** A learner-facing preset: explicit, editable, and always a valid 100% mix. */
export function recommendedOperatingAllocation(readout: OperatingLoopReadout): Allocation {
  const weights = readout.profile.stageWeights[readout.stage] || {};
  const allocation = Object.fromEntries((Object.keys(OPERATING_LEVER_LABELS) as OperatingLever[]).map((lever) => [
    lever,
    Math.min(50, Math.max(5, Math.round(finite(weights[lever], 100 / 6)))),
  ])) as Allocation;
  let remainder = 100 - Object.values(allocation).reduce((sum, value) => sum + value, 0);
  const order = [...readout.profile.bottleneckOrder, ...Object.keys(OPERATING_LEVER_LABELS) as OperatingLever[]];
  for (const lever of order) {
    if (!remainder) break;
    const room = remainder > 0 ? 50 - allocation[lever] : allocation[lever] - 5;
    const change = Math.sign(remainder) * Math.min(Math.abs(remainder), Math.max(0, room));
    allocation[lever] += change;
    remainder -= change;
  }
  return allocation;
}
