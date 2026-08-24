export function forecastMetrics(state: any, quarters = 3) {
  const results: Array<{
    quarter: number;
    roi: number;
    adoption: number;
    risk: number;
    ranges: { roi: { low: number; high: number }; adoption: { low: number; high: number }; risk: { low: number; high: number } };
    provenance: 'directional-model';
    confidence: 'medium' | 'low';
  }> = [];
  let roi = Number(state.roi || 0); let adoption = Number(state.adoption || 0); let risk = Number(state.risk || 30);
  const history = Array.isArray(state.history) ? state.history : [];
  const peopleBonus = Number(state.alloc?.people || 15) - 15; const dataBonus = Number(state.data || 50) / 100;
  const recent = history.slice(-4);
  const volatility = (key: string, fallback: number) => {
    const values = recent.map((entry: any) => Number(entry[key] ?? entry.metrics?.[key])).filter(Number.isFinite);
    const changes = values.slice(1).map((value: number, index: number) => value - values[index]);
    if (changes.length < 2) return fallback;
    const mean = changes.reduce((sum: number, value: number) => sum + value, 0) / changes.length;
    return Math.max(fallback, Math.sqrt(changes.reduce((sum: number, value: number) => sum + (value - mean) ** 2, 0) / changes.length));
  };
  for (let i = 0; i < quarters; i++) {
    roi += roi * (0.05 + peopleBonus / 300 + dataBonus * 0.02) * (1 - risk / 200);
    adoption += (3 + peopleBonus * 0.3 + dataBonus * 2) * (1 - risk / 400);
    risk = Math.max(5, risk - 1 - (state.alloc?.compliance || 10) / 20);
    const roiSpread = volatility('roi', 1) * (i + 1);
    const adoptionSpread = volatility('adoption', 1.5) * (i + 1);
    const riskSpread = volatility('risk', 1) * (i + 1);
    results.push({
      quarter: (state.q || 1) + i + 1,
      roi: Math.min(95, roi),
      adoption: Math.min(95, adoption),
      risk,
      ranges: {
        roi: { low: Math.max(0, roi - roiSpread), high: Math.min(95, roi + roiSpread) },
        adoption: { low: Math.max(0, adoption - adoptionSpread), high: Math.min(95, adoption + adoptionSpread) },
        risk: { low: Math.max(5, risk - riskSpread), high: Math.min(100, risk + riskSpread) },
      },
      provenance: 'directional-model',
      confidence: history.length >= 3 ? 'medium' : 'low',
    });
  }
  return results;
}
