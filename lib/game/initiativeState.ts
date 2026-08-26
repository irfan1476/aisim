import { initiatives, type Initiative } from './initiatives';
import type { DynamicInitiative } from './generator';
import type { FrameworkContribution } from '../scenarios/types';
import type { InitiativeAction, InitiativeActionSet, InitiativeFunding, InitiativeLifecycle } from './businessModel';
import type { Allocation } from './state';

export type MaturityLevel = 'nascent' | 'developing' | 'mature' | 'optimized';
export interface InitiativeState extends Initiative {
  currentData: number; currentRoi: number; currentRisk: 'LOW' | 'MED' | 'HIGH'; currentCost: number; currentHuman: number;
  quartersFunded: number; /** Delivery-equivalent funding quarters; scale-up capital can add bounded extra progress. */ maturityCredits: number;
  quartersSinceLastFund: number; totalInvestment: number; /** Spend used to preserve an active capability without advancing it. */ continuityInvestment: number;
  maturityLevel: MaturityLevel; dataInvestment: number; governanceInvestment: number; trainingInvestment: number;
  /** Explicit operating lifecycle. Legacy saves are migrated from quartersFunded. */ lifecycle: InitiativeLifecycle;
  lifecycleQuarter: number; benefitRealization: number; controlMaturity: number; changeReadiness: number; technicalDebt: number; runCost: number;
  baseRoi?: number; baseCost?: number; baseData?: number; baseHuman?: number; baseRiskScore?: number; riskScore?: number; synergies?: string[];
  scenarioMetadata?: { primaryMetric: string; baseEffect: number; effectUnit: string; neglect: { decayRate: number; penaltyThreshold: number; penaltyAmount: number }; frameworkContribution?: FrameworkContribution };
}
const roundMetric = (value: number) => Number(value.toFixed(2));
const riskScoreFor = (item: InitiativeState) => item.riskScore ?? (item.currentRisk === 'LOW' ? 24 : item.currentRisk === 'MED' ? 48 : 72);
const riskBandFor = (score: number): 'LOW' | 'MED' | 'HIGH' => score < 35 ? 'LOW' : score < 65 ? 'MED' : 'HIGH';
export const maturityFor = (funded: number, neglected: number): MaturityLevel => {
  const levels: MaturityLevel[] = ['nascent', 'developing', 'mature', 'optimized'];
  const earned = funded >= 6 ? 3 : funded >= 4 ? 2 : funded >= 2 ? 1 : 0;
  const decay = neglected >= 6 ? 2 : neglected >= 3 ? 1 : 0;
  return levels[Math.max(0, earned - decay)];
};

export function initializeInitiativeStates(generated: DynamicInitiative[] = initiatives as DynamicInitiative[]): Record<string, InitiativeState> {
  return Object.fromEntries(generated.map(init => [init.id, { ...init, currentData: init.data, currentRoi: init.roi, currentRisk: init.risk as 'LOW' | 'MED' | 'HIGH', currentCost: init.cost, currentHuman: init.human, quartersFunded: 0, maturityCredits: 0, quartersSinceLastFund: 0, totalInvestment: 0, continuityInvestment: 0, maturityLevel: 'nascent' as MaturityLevel, lifecycle: 'discovery' as InitiativeLifecycle, lifecycleQuarter: 0, benefitRealization: 0, controlMaturity: 0, changeReadiness: 0, technicalDebt: 0, runCost: roundMetric(init.cost * .08), dataInvestment: 0, governanceInvestment: 0, trainingInvestment: 0 }])) as Record<string, InitiativeState>;
}

const lifecycleActions: InitiativeAction[] = ['discover', 'pilot', 'scale', 'maintain', 'pause', 'retire'];
const lifecycleValues: InitiativeLifecycle[] = ['discovery', 'pilot', 'scale', 'run', 'paused', 'retired'];

export function isInitiativeAction(value: unknown): value is InitiativeAction {
  return typeof value === 'string' && lifecycleActions.includes(value as InitiativeAction);
}

export function isInitiativeLifecycle(value: unknown): value is InitiativeLifecycle {
  return typeof value === 'string' && lifecycleValues.includes(value as InitiativeLifecycle);
}

/** Hydrate a state record while retaining every historic metric unchanged. */
export function migrateInitiativeState(saved: Partial<InitiativeState> | undefined, base: InitiativeState): InitiativeState {
  const source = saved && typeof saved === 'object' ? saved : {};
  const quartersFunded = Number.isFinite(Number(source.quartersFunded)) ? Math.max(0, Number(source.quartersFunded)) : base.quartersFunded;
  const lifecycle = isInitiativeLifecycle(source.lifecycle)
    ? source.lifecycle
    : (quartersFunded > 0 ? 'run' : base.lifecycle);
  const currentCost = Number.isFinite(Number(source.currentCost)) ? Math.max(0, Number(source.currentCost)) : base.currentCost;
  const currentHuman = Number.isFinite(Number(source.currentHuman)) ? Math.max(0, Number(source.currentHuman)) : base.currentHuman;
  const bounded = (value: unknown, fallback: number, min = 0, max = 1) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(min, Math.min(max, numeric)) : fallback;
  };
  return {
    ...base,
    ...source,
    quartersFunded,
    currentCost,
    lifecycle,
    lifecycleQuarter: Math.max(0, Number.isFinite(Number(source.lifecycleQuarter)) ? Number(source.lifecycleQuarter) : (quartersFunded > 0 ? quartersFunded : base.lifecycleQuarter)),
    benefitRealization: bounded(source.benefitRealization, quartersFunded > 0 ? 1 : base.benefitRealization),
    controlMaturity: bounded(source.controlMaturity, base.controlMaturity),
    changeReadiness: bounded(source.changeReadiness, bounded(currentHuman / 5, base.changeReadiness)),
    technicalDebt: bounded(source.technicalDebt, base.technicalDebt, 0, 100),
    runCost: Math.max(0, Number.isFinite(Number(source.runCost)) ? Number(source.runCost) : (base.runCost || currentCost * .08)),
  };
}

/** Pure transition table used by both the UI and the resolver integration. */
export function transitionInitiativeLifecycle(current: InitiativeLifecycle, action: InitiativeAction): InitiativeLifecycle {
  if (action === 'discover') return current === 'retired' ? 'retired' : 'discovery';
  if (action === 'pilot') return current === 'retired' ? 'retired' : 'pilot';
  if (action === 'scale') return current === 'retired' ? 'retired' : 'scale';
  if (action === 'maintain') return current === 'retired' ? 'retired' : 'run';
  if (action === 'pause') return current === 'retired' ? 'retired' : 'paused';
  return 'retired';
}

export type LifecycleUpdateMetrics = {
  adoption: number;
  fundingIntensity?: number;
  investmentMultiplier?: number;
  fundingByInitiative?: Record<string, InitiativeFunding>;
};

const emptyFunding = (): InitiativeFunding => ({ discovery: 0, delivery: 0, scaleUp: 0, run: 0, continuity: 0, retirement: 0, total: 0 });

/**
 * Evolves initiatives from explicit lifecycle actions. This is additive to
 * updateInitiativeStates, which remains the compatibility path for old saves.
 */
export function updateInitiativeStatesForActions(
  states: Record<string, InitiativeState>,
  actions: InitiativeActionSet,
  allocation: Allocation,
  metrics: LifecycleUpdateMetrics,
): Record<string, InitiativeState> {
  const next = Object.fromEntries(Object.entries(states || {}).map(([id, value]) => [id, { ...value }])) as Record<string, InitiativeState>;
  const intensity = Math.max(0, Math.min(1.35, Number(metrics.fundingIntensity) || 1));
  const investmentMultiplier = Math.max(0, Number(metrics.investmentMultiplier) || 1);
  Object.values(next).forEach((item) => {
    const action = isInitiativeAction(actions[item.id]) ? actions[item.id] : (item.lifecycle === 'run' ? 'maintain' : 'discover');
    const funding = metrics.fundingByInitiative?.[item.id] || emptyFunding();
    const priorLifecycle = isInitiativeLifecycle(item.lifecycle) ? item.lifecycle : (item.quartersFunded > 0 ? 'run' : 'discovery');
    const lifecycle = transitionInitiativeLifecycle(priorLifecycle, action);
    item.lifecycle = lifecycle;
    item.lifecycleQuarter = Math.max(0, Number(item.lifecycleQuarter) || 0) + 1;
    item.runCost = roundMetric(Number(item.runCost) > 0 ? item.runCost : item.currentCost * .08);
    item.benefitRealization = Math.max(0, Math.min(1, Number(item.benefitRealization) || 0));
    item.controlMaturity = Math.max(0, Math.min(1, Number(item.controlMaturity) || 0));
    item.changeReadiness = Math.max(0, Math.min(1, Number(item.changeReadiness) || 0));
    item.technicalDebt = Math.max(0, Math.min(100, Number(item.technicalDebt) || 0));

    if (action === 'discover') {
      item.benefitRealization = roundMetric(item.benefitRealization * .95);
      item.technicalDebt = roundMetric(Math.min(100, item.technicalDebt + .5));
      item.quartersSinceLastFund += 1;
    } else if (action === 'pilot' || action === 'scale') {
      const delivery = Math.max(0, Number(funding.delivery) || Number(funding.total) || 0);
      const progress = action === 'pilot' ? .5 : 1;
      item.quartersFunded += 1;
      item.quartersSinceLastFund = 0;
      item.totalInvestment = roundMetric(item.totalInvestment + Math.max(delivery, funding.total || 0));
      item.maturityCredits = roundMetric((Number(item.maturityCredits) || 0) + progress + Math.min(1, Math.max(0, investmentMultiplier - 1)));
      item.benefitRealization = roundMetric(Math.min(1, item.benefitRealization + (action === 'pilot' ? .18 : .3) * intensity));
      item.controlMaturity = roundMetric(Math.min(1, item.controlMaturity + (Number(allocation.compliance) || 0) / 1000 * intensity));
      item.changeReadiness = roundMetric(Math.min(1, item.changeReadiness + (Number(allocation.people) || 0) / 500 * intensity));
      item.technicalDebt = roundMetric(Math.max(0, item.technicalDebt - (Number(allocation.mlops) || 0) / 20));
      item.maturityLevel = maturityFor(item.maturityCredits, 0);
    } else if (action === 'maintain') {
      item.quartersSinceLastFund = 0;
      item.totalInvestment = roundMetric(item.totalInvestment + Math.max(0, Number(funding.run) || Number(funding.continuity) || 0));
      item.continuityInvestment = roundMetric(item.continuityInvestment + Math.max(0, Number(funding.continuity) || Number(funding.run) || 0));
      item.benefitRealization = roundMetric(Math.min(1, item.benefitRealization + .02 * intensity));
      item.technicalDebt = roundMetric(Math.max(0, item.technicalDebt - .5));
      item.maturityLevel = maturityFor(Number(item.maturityCredits) || item.quartersFunded, 0);
    } else if (action === 'pause') {
      item.quartersSinceLastFund += 1;
      item.benefitRealization = roundMetric(item.benefitRealization * .9);
      item.technicalDebt = roundMetric(Math.min(100, item.technicalDebt + 2));
      item.maturityLevel = maturityFor(Number(item.maturityCredits) || item.quartersFunded, item.quartersSinceLastFund);
    } else {
      item.quartersSinceLastFund += 1;
      item.benefitRealization = 0;
      item.technicalDebt = roundMetric(Math.min(100, item.technicalDebt + 1));
    }
  });
  return next;
}

export function updateInitiativeStates(states: Record<string, InitiativeState>, selected: string[], allocation: any, metrics: { adoption: number; fundingIntensity?: number; investmentMultiplier?: number; continuityAllocations?: Record<string, number> }): Record<string, InitiativeState> {
  const next = Object.fromEntries(Object.entries(states || initializeInitiativeStates()).map(([id, value]) => [id, { ...value }]));
  const fundingIntensity = Math.max(1, Math.min(1.35, Number(metrics.fundingIntensity) || 1));
  const investmentMultiplier = Math.max(0, Number(metrics.investmentMultiplier) || 1);
  Object.values(next).forEach(item => {
    if (!selected.includes(item.id)) {
      const continuitySpend = Math.max(0, Number(metrics.continuityAllocations?.[item.id]) || 0);
      if (continuitySpend > 0) {
        // Continuity is preservation, not a disguised new delivery quarter.
        // It prevents neglect while leaving new capability progress to selected work.
        item.quartersSinceLastFund = 0;
        item.totalInvestment = roundMetric(item.totalInvestment + continuitySpend);
        item.continuityInvestment = roundMetric((item.continuityInvestment || 0) + continuitySpend);
        item.maturityCredits = Number.isFinite(item.maturityCredits) ? item.maturityCredits : item.quartersFunded;
        item.maturityLevel = maturityFor(item.maturityCredits, 0);
        item.currentRisk = riskBandFor(riskScoreFor(item));
        return;
      }
      item.quartersSinceLastFund += 1;
      const neglectRisk = item.quartersSinceLastFund > 3 ? 3 : .75;
      item.riskScore = roundMetric(Math.min(96, riskScoreFor(item) + neglectRisk));
      if (item.quartersSinceLastFund > 3) { item.currentData = roundMetric(Math.max(1, item.currentData - .2)); item.currentRoi = Math.round(Math.max(item.roi * .7, item.currentRoi * .98)); }
      item.maturityCredits = Number.isFinite(item.maturityCredits) ? item.maturityCredits : item.quartersFunded;
      item.currentRisk = riskBandFor(riskScoreFor(item)); item.maturityLevel = maturityFor(item.maturityCredits, item.quartersSinceLastFund); return;
    }
    // Charge the same live quarterly cost the learner saw before confirming.
    // The next-quarter estimate may improve with maturity, but it cannot
    // retroactively change the cost of this quarter's decision.
    const fundedCost = item.currentCost * investmentMultiplier;
    item.quartersSinceLastFund = 0; item.quartersFunded += 1;
    const priorCredits = Number.isFinite(item.maturityCredits) ? item.maturityCredits : item.quartersFunded - 1;
    // At floor cost this is one delivery quarter. At 2x the floor (or more),
    // it earns at most one additional credit: fast, but never instant maturity.
    const accelerationCredit = Math.min(1, Math.max(0, investmentMultiplier - 1));
    item.maturityCredits = roundMetric(priorCredits + 1 + accelerationCredit);
    item.dataInvestment = roundMetric(item.dataInvestment + Number(allocation.data || 0) / 10 * fundingIntensity); item.governanceInvestment = roundMetric(item.governanceInvestment + Number(allocation.compliance || 0) / 10 * fundingIntensity); item.trainingInvestment = roundMetric(item.trainingInvestment + Number(allocation.people || 0) / 10 * fundingIntensity);
    item.currentData = roundMetric(Math.min(5, item.currentData + (Number(allocation.data || 0) / 50 + .12) * fundingIntensity));
    item.currentHuman = roundMetric(Math.min(5, item.currentHuman + (Number(allocation.people || 0) / 75 + metrics.adoption / 1000) * fundingIntensity));
    // Maturity credits affect the next and subsequent quarters' economics,
    // so accelerated delivery compounds instead of disappearing after one turn.
    const evolutionBonus = Math.min(.15, item.maturityCredits * .02);
    item.currentRoi = Math.round(Math.min(item.roi * 1.15, Math.max(item.roi, item.currentRoi) * (1 + Math.min(.03, evolutionBonus) * fundingIntensity)));
    item.currentCost = roundMetric(item.cost * (1 - Math.min(.2, item.quartersFunded * .03)));
    item.riskScore = roundMetric(Math.max(8, riskScoreFor(item) - 4 * fundingIntensity - Number(allocation.compliance || 0) / 12)); item.currentRisk = riskBandFor(item.riskScore); item.totalInvestment = roundMetric(item.totalInvestment + fundedCost); item.maturityLevel = maturityFor(item.maturityCredits, 0);
  });
  return next;
}
