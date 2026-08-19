export type Allocation = { infra: number; data: number; people: number; mlops: number; compliance: number; innovation: number };
export type Effect = { metric: string; delta: number; color: string };
export type CausalItem = { name: string; effects: Effect[] };
export type Recommendation = { priority: 'high' | 'medium' | 'low'; title: string; message: string; action: string; metric: string };
export type GameState = {
  q: number; stage: 'decide' | 'results' | 'done'; selected: string[]; alloc: Allocation;
  roi: number; revenue: number; efficiency: number; adoption: number; risk: number; data: number;
  satisfaction: number; literacy: number; turnover: number; compliance: number; innovation: number;
  spent: number; score: number; history: any[]; achievements: string[]; crisis: any; feedback: string;
  baseline: number[]; experimental: boolean; causalChain: CausalItem[]; proactiveRecommendations: Recommendation[];
};

export function initialGameState(): GameState {
  return { q: 1, stage: 'decide', selected: ['demand', 'energy'], alloc: { infra: 35, data: 25, people: 15, mlops: 10, compliance: 10, innovation: 5 }, roi: 0, revenue: 0, efficiency: 8, adoption: 38, risk: 36, data: 54, satisfaction: 61, literacy: 35, turnover: 14, compliance: 62, innovation: 42, spent: 0, score: 0, history: [], achievements: [], crisis: null, feedback: 'The board is watching for a balanced portfolio. You have room to build momentum.', baseline: [], experimental: false, causalChain: [], proactiveRecommendations: [] };
}
