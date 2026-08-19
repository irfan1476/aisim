export const initiatives = [
  { id: 'maintenance', name: 'Predictive Maintenance', desc: 'Predict component failures weeks in advance.', cost: 2.8, roi: 187, risk: 'MED', data: 4, human: 3, impact: 'Cuts downtime and extends asset life.' },
  { id: 'quality', name: 'AI Visual Quality', desc: 'Detect defects in real time on the line.', cost: 2.1, roi: 164, risk: 'LOW', data: 3, human: 2, impact: 'Improves first-pass yield and OEM trust.' },
  { id: 'demand', name: 'Demand Forecasting', desc: 'Align raw stock with OEM pull schedules.', cost: 1.5, roi: 142, risk: 'LOW', data: 5, human: 4, impact: 'Reduces inventory volatility.' },
  { id: 'energy', name: 'Energy Optimization', desc: 'Use AI to offset rising energy costs.', cost: 1.8, roi: 156, risk: 'LOW', data: 3, human: 3, impact: 'Improves efficiency across five plants.' },
  { id: 'knowledge', name: 'AI Knowledge Assistant', desc: 'Capture IP from retiring technicians.', cost: 1.2, roi: 198, risk: 'HIGH', data: 2, human: 5, impact: 'Builds resilience and workforce confidence.' },
  { id: 'supply', name: 'Supply Chain Risk', desc: 'Flag supplier delivery issues early.', cost: 2.3, roi: 134, risk: 'MED', data: 4, human: 3, impact: 'Protects tier-one OEM commitments.' },
];
export type Initiative = typeof initiatives[number];
