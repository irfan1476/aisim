import { initiatives, type Initiative } from './initiatives';

export type MaturityLevel = 'nascent' | 'developing' | 'mature' | 'optimized';
export interface InitiativeState extends Initiative { currentData: number; currentRoi: number; currentRisk: 'LOW' | 'MED' | 'HIGH'; currentCost: number; currentHuman: number; quartersFunded: number; quartersSinceLastFund: number; totalInvestment: number; maturityLevel: MaturityLevel; dataInvestment: number; governanceInvestment: number; trainingInvestment: number; }

export function initializeInitiativeStates(): Record<string, InitiativeState> {
  return Object.fromEntries(initiatives.map(init => [init.id, { ...init, currentData: init.data, currentRoi: init.roi, currentRisk: init.risk as 'LOW' | 'MED' | 'HIGH', currentCost: init.cost, currentHuman: init.human, quartersFunded: 0, quartersSinceLastFund: 0, totalInvestment: 0, maturityLevel: 'nascent' as MaturityLevel, dataInvestment: 0, governanceInvestment: 0, trainingInvestment: 0 }])) as Record<string, InitiativeState>;
}

export function updateInitiativeStates(states: Record<string, InitiativeState>, selected: string[], allocation: any, metrics: { adoption: number }): Record<string, InitiativeState> {
  const next = Object.fromEntries(Object.entries(states || initializeInitiativeStates()).map(([id, value]) => [id, { ...value }]));
  Object.values(next).forEach(item => { if (!selected.includes(item.id)) { item.quartersSinceLastFund += 1; if (item.quartersSinceLastFund > 3) item.currentData = Math.max(1, item.currentData - .2); return; } item.quartersSinceLastFund = 0; item.quartersFunded += 1; item.dataInvestment += Number(allocation.data || 0) / 10; item.governanceInvestment += Number(allocation.compliance || 0) / 10; item.trainingInvestment += Number(allocation.people || 0) / 10; item.currentData = Math.min(5, item.currentData + Number(allocation.data || 0) / 50 + .12); item.currentRoi = Math.round(item.roi * (1 + (item.currentData - item.data) / 10) * (1 + item.quartersFunded / 20)); const riskLevels = ['LOW', 'MED', 'HIGH'] as const; item.currentRisk = riskLevels[Math.max(0, riskLevels.indexOf(item.currentRisk) - Math.floor(Number(allocation.compliance || 0) / 20 + item.quartersFunded / 6))]; item.currentCost = Math.max(item.cost * .6, Math.round((item.cost - item.quartersFunded * .05) * 100) / 100); item.currentHuman = Math.min(5, item.currentHuman + metrics.adoption / 500); item.totalInvestment += item.currentCost; item.maturityLevel = item.quartersFunded >= 6 ? 'optimized' : item.quartersFunded >= 4 ? 'mature' : item.quartersFunded >= 2 ? 'developing' : 'nascent'; });
  return next;
}
