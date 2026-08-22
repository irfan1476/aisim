export type PortfolioPosture = 'deep-focus' | 'focused-balance' | 'portfolio-breadth' | 'pause';

export type PortfolioDecision = {
  selectedCount: number;
  posture: PortfolioPosture;
  breadth: number;
  concentrationRisk: number;
};

/**
 * Converts the number of funded bets into a stable, explainable portfolio
 * posture. The engine uses this as a decision signal; it is not a score.
 */
export function describePortfolio(selectedCount: number, availableCount = 6): PortfolioDecision {
  const count = Math.max(0, Math.min(3, Math.round(Number(selectedCount) || 0)));
  const breadth = Number((count / Math.max(1, availableCount)).toFixed(2));
  const posture: PortfolioPosture = count === 0
    ? 'pause'
    : count === 1
      ? 'deep-focus'
      : count === 2
        ? 'focused-balance'
        : 'portfolio-breadth';
  // A single bet is intentionally more concentrated; three bets diversify
  // exposure. This is an explanatory signal, not a punitive score multiplier.
  const concentrationRisk = count === 0 ? 0 : count === 1 ? 28 : count === 2 ? 12 : 4;
  return { selectedCount: count, posture, breadth, concentrationRisk };
}

export function portfolioPostureLabel(posture: PortfolioPosture): string {
  return posture === 'deep-focus'
    ? 'Deep focus'
    : posture === 'focused-balance'
      ? 'Focused balance'
      : posture === 'portfolio-breadth'
        ? 'Portfolio breadth'
        : 'Pause and preserve';
}
