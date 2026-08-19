export function forecastMetrics(state: any, quarters = 3) {
  const results = []; let roi = state.roi || 0; let adoption = state.adoption || 0; let risk = state.risk || 30;
  const peopleBonus = (state.alloc?.people || 15) - 15; const dataBonus = (state.data || 50) / 100;
  for (let i = 0; i < quarters; i++) {
    roi += roi * (0.05 + peopleBonus / 300 + dataBonus * 0.02) * (1 - risk / 200);
    adoption += (3 + peopleBonus * 0.3 + dataBonus * 2) * (1 - risk / 400);
    risk = Math.max(5, risk - 1 - (state.alloc?.compliance || 10) / 20);
    results.push({ quarter: (state.q || 1) + i + 1, roi: Math.min(95, roi), adoption: Math.min(95, adoption), risk });
  }
  return results;
}
