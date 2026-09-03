import type { InitiativeAction } from '../game/businessModel';
import type {
  OperatingLever,
  OperatingWeightSet,
  ScenarioInitiative,
  ScenarioLifecycleStage,
  ScenarioLifecycleProfile,
  ScenarioOperatingCapacitySensitivity,
  ScenarioOperatingProfile,
  ScenarioOperatingProfileOverride,
  ScenarioOperatingStage,
  ScenarioOutcomeRole,
  ScenarioProgressDefinition,
  ScenarioSynergyDefinition,
} from './types';

export const OPERATING_LEVERS: readonly OperatingLever[] = ['infra', 'data', 'people', 'mlops', 'compliance', 'innovation'];
export const OPERATING_STAGES: readonly ScenarioOperatingStage[] = [
  'data_readiness', 'experiment', 'pilot', 'evaluate', 'deploy', 'monitor', 'adapt',
  'discover', 'scale', 'maintain', 'pause', 'retire',
];

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const finite = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const round = (value: number) => Number(value.toFixed(4));

const normaliseWeights = (values: OperatingWeightSet, fallback: OperatingWeightSet): Record<OperatingLever, number> => {
  const raw = Object.fromEntries(OPERATING_LEVERS.map((lever) => [
    lever,
    Math.max(0, finite(values[lever], finite(fallback[lever], 0))),
  ])) as Record<OperatingLever, number>;
  const total = OPERATING_LEVERS.reduce((sum, lever) => sum + raw[lever], 0);
  if (total <= 0) return normaliseWeights(fallback, Object.fromEntries(OPERATING_LEVERS.map((lever) => [lever, 1])) as OperatingWeightSet);
  const scaled = Object.fromEntries(OPERATING_LEVERS.map((lever) => [lever, round(raw[lever] / total * 100)])) as Record<OperatingLever, number>;
  const remainder = round(100 - OPERATING_LEVERS.reduce((sum, lever) => sum + scaled[lever], 0));
  scaled.infra = round(scaled.infra + remainder);
  return scaled;
};

const orderedLevers = (needs: Record<OperatingLever, number>): OperatingLever[] => [...OPERATING_LEVERS].sort((left, right) => needs[right] - needs[left] || OPERATING_LEVERS.indexOf(left) - OPERATING_LEVERS.indexOf(right));

const stageTemplates: Record<ScenarioLifecycleStage, OperatingWeightSet> = {
  data_readiness: { infra: 10, data: 32, people: 18, mlops: 10, compliance: 10, innovation: 20 },
  experiment: { infra: 12, data: 28, people: 18, mlops: 12, compliance: 10, innovation: 20 },
  pilot: { infra: 16, data: 24, people: 22, mlops: 16, compliance: 12, innovation: 10 },
  evaluate: { infra: 12, data: 22, people: 20, mlops: 16, compliance: 22, innovation: 8 },
  deploy: { infra: 24, data: 16, people: 22, mlops: 18, compliance: 14, innovation: 6 },
  monitor: { infra: 18, data: 14, people: 20, mlops: 26, compliance: 18, innovation: 4 },
  adapt: { infra: 12, data: 18, people: 18, mlops: 22, compliance: 18, innovation: 12 },
};

const lifecycleStageFor = (stage: ScenarioOperatingStage): ScenarioLifecycleStage => {
  if (stage in stageTemplates) return stage as ScenarioLifecycleStage;
  switch (stage as InitiativeAction) {
    case 'discover': return 'data_readiness';
    case 'pilot': return 'pilot';
    case 'scale': return 'deploy';
    case 'maintain': return 'monitor';
    case 'pause':
    case 'retire': return 'adapt';
    default: return 'pilot';
  }
};

const capacityFor = (needs: Record<OperatingLever, number>): ScenarioOperatingCapacitySensitivity => ({
  integration: round(clamp(.55 + needs.infra * .35 + needs.mlops * .1, .25, 1)),
  delivery: round(clamp(.45 + needs.infra * .25 + needs.mlops * .15, .25, 1)),
  change: round(clamp(.4 + needs.people * .45 + needs.innovation * .1, .25, 1)),
  data: round(clamp(.4 + needs.data * .5, .25, 1)),
  governance: round(clamp(.4 + needs.compliance * .45 + needs.people * .1, .25, 1)),
});

/**
 * Build a deterministic operating profile from the initiative facts already
 * present in every scenario pack.  It is intentionally a recommendation, not
 * a gate: later engine work may use it to explain trade-offs without making
 * old or newly-authored initiatives incomplete.
 */
export function defaultOperatingProfile(
  initiative: Pick<ScenarioInitiative, 'risk' | 'data' | 'human'>,
): ScenarioOperatingProfile {
  const dataNeed = clamp((6 - finite(initiative.data, 3)) / 5, .2, 1);
  const peopleNeed = clamp(finite(initiative.human, 3) / 5, .2, 1);
  const controlNeed = initiative.risk === 'HIGH' ? .95 : initiative.risk === 'MED' ? .65 : .35;
  const needs: Record<OperatingLever, number> = {
    infra: clamp(.45 + dataNeed * .2 + peopleNeed * .2, .2, 1),
    data: dataNeed,
    people: peopleNeed,
    mlops: clamp(.35 + dataNeed * .3 + controlNeed * .2, .2, 1),
    compliance: controlNeed,
    innovation: clamp(.35 + (1 - dataNeed) * .2, .2, .8),
  };
  const stageWeights = Object.fromEntries(Object.entries(stageTemplates).map(([stage, template]) => {
    const weighted = Object.fromEntries(OPERATING_LEVERS.map((lever) => [lever, finite(template[lever]) * (.7 + needs[lever] * .6)])) as OperatingWeightSet;
    return [stage, normaliseWeights(weighted, template)];
  })) as Record<ScenarioLifecycleStage, Record<OperatingLever, number>>;
  const allStages = Object.fromEntries(OPERATING_STAGES.map((stage) => [stage, stageWeights[lifecycleStageFor(stage)]])) as Record<ScenarioOperatingStage, OperatingWeightSet>;
  return {
    revision: 1,
    bottleneckOrder: orderedLevers(needs),
    stageWeights: allStages,
    capacitySensitivity: capacityFor(needs),
  };
}

/** Resolve partial authoring into a complete, immutable operating profile. */
export function resolveOperatingProfile(
  initiative: Pick<ScenarioInitiative, 'risk' | 'data' | 'human'> & { operatingProfile?: ScenarioOperatingProfileOverride },
): ScenarioOperatingProfile {
  const base = defaultOperatingProfile(initiative);
  const override = initiative.operatingProfile || {};
  const authoredOrder = Array.isArray(override.bottleneckOrder)
    ? override.bottleneckOrder.filter((lever, index, values): lever is OperatingLever => OPERATING_LEVERS.includes(lever) && values.indexOf(lever) === index)
    : [];
  const bottleneckOrder = [...authoredOrder, ...base.bottleneckOrder.filter((lever) => !authoredOrder.includes(lever))];
  const stageWeights = Object.fromEntries(OPERATING_STAGES.map((stage) => {
    const stageOverride = override.stageWeights?.[stage] || {};
    return [stage, normaliseWeights({ ...base.stageWeights[stage], ...stageOverride }, base.stageWeights[stage])];
  })) as Record<ScenarioOperatingStage, OperatingWeightSet>;
  const authoredCapacity = override.capacitySensitivity || {};
  const capacitySensitivity = Object.fromEntries((Object.keys(base.capacitySensitivity) as Array<keyof ScenarioOperatingCapacitySensitivity>).map((key) => [
    key,
    round(clamp(finite(authoredCapacity[key], base.capacitySensitivity[key]), .25, 1)),
  ])) as ScenarioOperatingCapacitySensitivity;
  return { revision: 1, bottleneckOrder, stageWeights, capacitySensitivity };
}

export function defaultLifecycleProfile(initiative: Pick<ScenarioInitiative, 'baseEffect' | 'primaryMetric' | 'risk' | 'data' | 'human'>): ScenarioLifecycleProfile {
  const higherIsBetter = initiative.baseEffect >= 0;
  const risk = initiative.risk === 'HIGH' ? 72 : initiative.risk === 'MED' ? 48 : 24;
  const dataReadiness = Math.max(20, Math.min(100, initiative.data * 20));
  return {
    dataReadiness,
    experimentQuarters: 1,
    pilotQuarters: 2,
    evaluation: {
      criteria: [
        {
          id: 'directional-outcome',
          label: `See a directional ${initiative.primaryMetric} signal`,
          metric: initiative.primaryMetric,
          // Pilots test whether the signal is moving, rather than demanding
          // the full production benefit before the learner can decide.
          threshold: Number(((higherIsBetter ? 1 : -1) * Math.max(.5, Math.abs(initiative.baseEffect) * .2)).toFixed(2)),
          direction: higherIsBetter ? 'higher-is-better' : 'lower-is-better',
          kind: 'outcome',
        },
        {
          id: 'evidence-readiness',
          label: 'Build sufficient data, workflow, and monitoring evidence',
          metric: 'operationalEvidence',
          threshold: 42,
          direction: 'higher-is-better',
          kind: 'evidence',
        },
        ...(initiative.risk === 'HIGH' ? [{
          id: 'safety-control',
          label: 'Demonstrate required safety and control readiness',
          metric: 'safetyEvidence',
          threshold: 45,
          direction: 'higher-is-better' as const,
          kind: 'safety' as const,
          required: true,
        }] : []),
      ],
      goThreshold: initiative.risk === 'HIGH' ? .67 : .5,
      conditionalThreshold: initiative.risk === 'HIGH' ? .5 : .34,
    },
    deployment: {
      defaultMode: initiative.risk === 'HIGH' ? 'augmentation' : 'automation',
      modes: {
        augmentation: { efficiencyDelta: 6, riskDelta: -4, trustDelta: 3, oversightUnits: Math.max(1, Math.ceil(initiative.human / 3)) },
        automation: { efficiencyDelta: 14, riskDelta: 8, trustDelta: -4, oversightUnits: Math.max(2, Math.ceil(initiative.human / 2)) },
      },
    },
    risks: {
      model: risk,
      operational: Math.max(20, Math.min(90, 40 + initiative.human * 5)),
      legal: initiative.risk === 'HIGH' ? 65 : initiative.risk === 'MED' ? 42 : 24,
    },
    drift: {
      susceptibility: initiative.data <= 2 ? 75 : initiative.data === 3 ? 55 : 35,
      quarterlyRate: initiative.data <= 2 ? 5 : 3,
      degradationThreshold: 50,
      monitoringRequired: initiative.risk !== 'LOW',
    },
    oversight: {
      baseUnits: Math.max(1, Math.ceil(initiative.human / 3)),
      automationUnits: Math.max(1, Math.ceil(initiative.human / 2)),
    },
    autonomy: initiative.risk === 'HIGH' ? 'advisory' : initiative.risk === 'MED' ? 'semi_autonomous' : 'autonomous',
    autonomyBoundaries: initiative.risk === 'HIGH' ? 'Human owner retains final accountability for consequential decisions.' : 'Escalate exceptions, safety signals, and low-confidence outputs to the named owner.',
    flywheel: { active: false, quality: 0, recipientIds: [] },
  };
}

/** Resolve partial scenario authoring into a stable, serialisable profile. */
export function resolveLifecycleProfile(initiative: Pick<ScenarioInitiative, 'baseEffect' | 'primaryMetric' | 'risk' | 'data' | 'human'> & { lifecycleProfile?: Partial<ScenarioLifecycleProfile> }): ScenarioLifecycleProfile {
  const base = defaultLifecycleProfile(initiative);
  const override = initiative.lifecycleProfile || {};
  return {
    ...base,
    ...override,
    evaluation: { ...base.evaluation, ...(override.evaluation || {}), criteria: override.evaluation?.criteria || base.evaluation.criteria },
    deployment: {
      ...base.deployment,
      ...(override.deployment || {}),
      modes: {
        ...base.deployment.modes,
        ...(override.deployment?.modes || {}),
      },
    },
    risks: { ...base.risks, ...(override.risks || {}) },
    drift: { ...base.drift, ...(override.drift || {}) },
    oversight: { ...base.oversight, ...(override.oversight || {}) },
    flywheel: override.flywheel ? { ...base.flywheel, ...override.flywheel } : base.flywheel,
  };
}

export function initiative(
  value: Omit<ScenarioInitiative, 'provisional'>,
): ScenarioInitiative {
  return {
    ...value,
    provisional: true,
    lifecycleProfile: resolveLifecycleProfile(value),
    operatingProfile: resolveOperatingProfile(value),
  };
}

export function metric(
  key: string,
  label: string,
  unit: string,
  start: number,
  target: number,
  direction: ScenarioProgressDefinition['direction'],
  min = 0,
  max = 100,
  role?: ScenarioOutcomeRole,
): ScenarioProgressDefinition {
  return { key, label, unit, start, target, min, max, direction, ...(role ? { role } : {}) };
}

export function synergy(
  value: ScenarioSynergyDefinition,
): ScenarioSynergyDefinition {
  return value;
}
