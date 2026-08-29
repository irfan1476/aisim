import type { InitiativeAction, InitiativeFunding } from './businessModel';

const finite = (value: unknown) => Math.max(0, Number(value) || 0);

/**
 * Extra capital speeds the work that is actually being undertaken, but it
 * cannot turn one quarter into an instant capability. These limits are
 * stage-specific: discovery buys evidence, pilots buy learning and controls,
 * scale accelerates rollout, and run funding strengthens reliability.
 */
const accelerationCap: Record<InitiativeAction, number> = {
  discover: 2,
  pilot: 1.75,
  scale: 1.5,
  maintain: 1.5,
  pause: 1,
  retire: 1,
};

export function isAccelerableAction(action: InitiativeAction | undefined): action is 'discover' | 'pilot' | 'scale' | 'maintain' {
  return action === 'discover' || action === 'pilot' || action === 'scale' || action === 'maintain';
}

/** The committed funding for the initiative's current lifecycle action. */
export function actionCommitment(funding: Partial<InitiativeFunding> | undefined, action: InitiativeAction | undefined): number {
  if (action === 'discover') return finite(funding?.discovery);
  if (action === 'pilot' || action === 'scale') return finite(funding?.delivery);
  if (action === 'maintain') return finite(funding?.run);
  if (action === 'retire') return finite(funding?.retirement);
  return 0;
}

/**
 * The bounded, local execution multiplier for one initiative. It is derived
 * only from money attributed to that initiative, so a discovery or maintain
 * choice cannot silently speed another initiative's delivery.
 */
export function accelerationMultiplierForAction(action: InitiativeAction | undefined, funding: Partial<InitiativeFunding> | undefined): number {
  const commitment = actionCommitment(funding, action);
  if (!isAccelerableAction(action) || commitment <= 0) return 1;
  return Number(Math.min(accelerationCap[action], Math.max(0, (commitment + finite(funding?.scaleUp)) / commitment)).toFixed(3));
}

export function accelerationEffectLabel(action: InitiativeAction | undefined): string {
  if (action === 'discover') return 'evidence and data readiness';
  if (action === 'pilot') return 'pilot evidence, workflow readiness, and controls';
  if (action === 'scale') return 'rollout maturity, adoption readiness, and controls';
  if (action === 'maintain') return 'monitoring, reliability, and technical-debt reduction';
  return 'no additional lifecycle work';
}
