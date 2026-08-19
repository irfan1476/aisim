import type { GameState, Recommendation } from './state';
export function generateProactiveRecommendations(state: GameState): Recommendation[] {
  const recs: Recommendation[] = [];
  if (state.alloc.people < 15) recs.push({ priority: 'high', title: 'People Allocation Alert', message: 'People investment is below the simulation’s value-realization threshold.', action: 'Review people allocation', metric: 'Adoption risk is rising' });
  if (state.data < 50 && state.selected.includes('maintenance')) recs.push({ priority: 'medium', title: 'Data Readiness Gap', message: 'Predictive maintenance needs stronger data foundations.', action: 'Review data engineering investment', metric: 'Projected ROI may soften' });
  if (state.risk > 35) recs.push({ priority: 'high', title: 'Risk Exposure Warning', message: 'Risk exposure is high enough to trigger governance scrutiny.', action: 'Increase compliance budget', metric: 'Risk reduction potential' });
  if (state.adoption < 45 && state.alloc.people >= 15) recs.push({ priority: 'medium', title: 'Adoption Lag Detected', message: 'Adoption is below the expected change-management curve.', action: 'Increase training investment', metric: 'Adoption potential' });
  if (state.selected.length === 3 && state.alloc.people >= 15 && state.alloc.compliance >= 10) recs.push({ priority: 'low', title: 'Balanced Portfolio', message: 'Your current portfolio funds both value and the operating system around it.', action: 'Maintain course', metric: 'Steady growth predicted' });
  return recs;
}
