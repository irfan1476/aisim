import { initiatives, type Initiative } from './initiatives';
import type { DynamicInitiative } from './generator';

export type MaturityLevel = 'nascent' | 'developing' | 'mature' | 'optimized';
export interface InitiativeState extends Initiative { currentData: number; currentRoi: number; currentRisk: 'LOW' | 'MED' | 'HIGH'; currentCost: number; currentHuman: number; quartersFunded: number; quartersSinceLastFund: number; totalInvestment: number; maturityLevel: MaturityLevel; dataInvestment: number; governanceInvestment: number; trainingInvestment: number; baseRoi?: number; baseCost?: number; baseData?: number; baseHuman?: number; baseRiskScore?: number; riskScore?: number; synergies?: string[]; }
const roundMetric = (value: number) => Number(value.toFixed(2));
const riskScoreFor = (item: InitiativeState) => item.riskScore ?? (item.currentRisk === 'LOW' ? 24 : item.currentRisk === 'MED' ? 48 : 72);
const riskBandFor = (score: number): 'LOW' | 'MED' | 'HIGH' => score < 35 ? 'LOW' : score < 65 ? 'MED' : 'HIGH';
const maturityFor = (funded: number, neglected: number): MaturityLevel => {
  const levels: MaturityLevel[] = ['nascent', 'developing', 'mature', 'optimized'];
  const earned = funded >= 6 ? 3 : funded >= 4 ? 2 : funded >= 2 ? 1 : 0;
  const decay = neglected >= 6 ? 2 : neglected >= 3 ? 1 : 0;
  return levels[Math.max(0, earned - decay)];
};

export function initializeInitiativeStates(generated: DynamicInitiative[] = initiatives as DynamicInitiative[]): Record<string, InitiativeState> {
  return Object.fromEntries(generated.map(init => [init.id, { ...init, currentData: init.data, currentRoi: init.roi, currentRisk: init.risk as 'LOW' | 'MED' | 'HIGH', currentCost: init.cost, currentHuman: init.human, quartersFunded: 0, quartersSinceLastFund: 0, totalInvestment: 0, maturityLevel: 'nascent' as MaturityLevel, dataInvestment: 0, governanceInvestment: 0, trainingInvestment: 0 }])) as Record<string, InitiativeState>;
}

export function updateInitiativeStates(states: Record<string, InitiativeState>, selected: string[], allocation: any, metrics: { adoption: number }): Record<string, InitiativeState> {
  const next = Object.fromEntries(Object.entries(states || initializeInitiativeStates()).map(([id, value]) => [id, { ...value }]));
  Object.values(next).forEach(item => {
    if (!selected.includes(item.id)) {
      item.quartersSinceLastFund += 1;
      const neglectRisk = item.quartersSinceLastFund > 3 ? 3 : .75;
      item.riskScore = roundMetric(Math.min(96, riskScoreFor(item) + neglectRisk));
      if (item.quartersSinceLastFund > 3) { item.currentData = roundMetric(Math.max(1, item.currentData - .2)); item.currentRoi = Math.round(Math.max(item.roi * .7, item.currentRoi * .98)); }
      item.currentRisk = riskBandFor(riskScoreFor(item)); item.maturityLevel = maturityFor(item.quartersFunded, item.quartersSinceLastFund); return;
    }
    item.quartersSinceLastFund = 0; item.quartersFunded += 1;
    item.dataInvestment = roundMetric(item.dataInvestment + Number(allocation.data || 0) / 10); item.governanceInvestment = roundMetric(item.governanceInvestment + Number(allocation.compliance || 0) / 10); item.trainingInvestment = roundMetric(item.trainingInvestment + Number(allocation.people || 0) / 10);
    item.currentData = roundMetric(Math.min(5, item.currentData + Number(allocation.data || 0) / 50 + .12));
    item.currentHuman = roundMetric(Math.min(5, item.currentHuman + Number(allocation.people || 0) / 75 + metrics.adoption / 1000));
    const evolutionBonus = Math.min(.15, item.quartersFunded * .02);
    item.currentRoi = Math.round(Math.min(item.roi * 1.15, Math.max(item.roi, item.currentRoi) * (1 + Math.min(.03, evolutionBonus))));
    item.currentCost = roundMetric(item.cost * (1 - Math.min(.2, item.quartersFunded * .03)));
    item.riskScore = roundMetric(Math.max(8, riskScoreFor(item) - 4 - Number(allocation.compliance || 0) / 12)); item.currentRisk = riskBandFor(item.riskScore); item.totalInvestment = roundMetric(item.totalInvestment + item.currentCost); item.maturityLevel = maturityFor(item.quartersFunded, 0);
  });
  return next;
}
