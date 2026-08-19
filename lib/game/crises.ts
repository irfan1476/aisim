export const crises = [
  { title: 'A competitor launches an AI-native quality platform.', type: 'MARKET PRESSURE', text: 'Your largest OEM has asked how quickly Project Factory can match the new standard.', options: [['Accelerate R&D', 'Invest $2M in a rapid response lab.', { roi: 5, innovation: 8 }], ['Pivot the roadmap', 'Focus the existing team on the highest-value line.', { risk: -5, efficiency: 4 }], ['Hire specialists', 'Bring in an external team for $1M.', { data: 5, roi: 3 }]] },
  { title: 'A near-miss exposes a data access gap.', type: 'GOVERNANCE ALERT', text: 'No customer data was lost, but the board wants evidence that controls are improving.', options: [['Security audit', 'Fund a full controls review.', { risk: -12, compliance: 10 }], ['Transparent update', 'Communicate the remediation plan.', { adoption: 4, risk: -4 }], ['Investigate quietly', 'Protect focus and fix the root cause.', { risk: -6, data: 3 }]] },
  { title: 'Two senior technicians announce retirement.', type: 'TALENT SIGNAL', text: 'Their tacit knowledge is essential to keeping the plants running smoothly.', options: [['Retention bonuses', 'Keep them through the transition.', { satisfaction: 8, turnover: -6 }], ['Upskill the bench', 'Accelerate knowledge transfer and training.', { literacy: 10, adoption: 5 }], ['Recruit externally', 'Add experienced operators to the team.', { satisfaction: 3, innovation: 4 }]] },
];
export function generateCrisis(index?: number) {
  const resolvedIndex = index === undefined ? Math.floor(Math.random() * crises.length) : Math.abs(Math.trunc(index)) % crises.length;
  return crises[resolvedIndex];
}
