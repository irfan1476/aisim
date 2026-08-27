import type { ScenarioInitiative, ScenarioLifecycleProfile, ScenarioProgressDefinition, ScenarioSynergyDefinition } from './types';

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
  return { ...value, provisional: true, lifecycleProfile: resolveLifecycleProfile(value) };
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
): ScenarioProgressDefinition {
  return { key, label, unit, start, target, min, max, direction };
}

export function synergy(
  value: ScenarioSynergyDefinition,
): ScenarioSynergyDefinition {
  return value;
}
