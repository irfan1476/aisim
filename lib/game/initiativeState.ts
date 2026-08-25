import { initiatives, type Initiative } from './initiatives';
import type { DynamicInitiative } from './generator';
import type { FrameworkContribution } from '../scenarios/types';

export type MaturityLevel = 'nascent' | 'developing' | 'mature' | 'optimized';
export interface InitiativeState extends Initiative { currentData: number; currentRoi: number; currentRisk: 'LOW' | 'MED' | 'HIGH'; currentCost: number; currentHuman: number; quartersFunded: number; /** Delivery-equivalent funding quarters; scale-up capital can add bounded extra progress. */ maturityCredits: number; quartersSinceLastFund: number; totalInvestment: number; /** Spend used to preserve an active capability without advancing it. */ continuityInvestment: number; maturityLevel: MaturityLevel; dataInvestment: number; governanceInvestment: number; trainingInvestment: number; baseRoi?: number; baseCost?: number; baseData?: number; baseHuman?: number; baseRiskScore?: number; riskScore?: number; synergies?: string[]; scenarioMetadata?: { primaryMetric: string; baseEffect: number; effectUnit: string; neglect: { decayRate: number; penaltyThreshold: number; penaltyAmount: number }; frameworkContribution?: FrameworkContribution }; }
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
  return Object.fromEntries(generated.map(init => [init.id, { ...init, currentData: init.data, currentRoi: init.roi, currentRisk: init.risk as 'LOW' | 'MED' | 'HIGH', currentCost: init.cost, currentHuman: init.human, quartersFunded: 0, maturityCredits: 0, quartersSinceLastFund: 0, totalInvestment: 0, continuityInvestment: 0, maturityLevel: 'nascent' as MaturityLevel, dataInvestment: 0, governanceInvestment: 0, trainingInvestment: 0 }])) as Record<string, InitiativeState>;
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
