/**
 * The CEO verdict is intentionally separate from the numeric score.
 *
 * The score measures outcomes; the verdict also recognises the quality of the
 * strategic attempt. A campaign that deliberately discovers, pilots, and
 * delivers can therefore earn a meaningful B+ even when adoption or realised
 * value still needs work. This keeps the report honest without making effort
 * invisible.
 */
export type CampaignVerdictInput = {
  score: number;
  adoption: number;
  risk: number;
  validatedLearning?: number;
  deliveryQuarters?: number;
  discoveryQuarters?: number;
  /** Scenario campaigns need their authored mission gate before an A rating. */
  scenarioMode?: boolean;
  /** Primary outcomes are materially moving and no guardrail has deteriorated. */
  missionReady?: boolean;
  /** Mission, supporting outcomes, and guardrails are all strongly established. */
  masteryReady?: boolean;
};

export type CampaignVerdict = {
  grade: "A+" | "A" | "B+" | "B" | "C";
  archetype: string;
  message: string;
  tone: string;
  strategicEffort: number;
};

const clamp = (value: unknown) => Math.max(0, Math.min(100, Number(value) || 0));

export function deriveCampaignVerdict(input: CampaignVerdictInput): CampaignVerdict {
  const score = clamp(input.score);
  const adoption = clamp(input.adoption);
  const risk = clamp(input.risk);
  const learning = clamp(input.validatedLearning);
  const delivery = Math.max(0, Number(input.deliveryQuarters) || 0);
  const discovery = Math.max(0, Number(input.discoveryQuarters) || 0);

  // A deliberate portfolio is observable even when its financial payoff has
  // not arrived yet. Cap the effort bonus so reckless repetition cannot turn
  // into an A without operating health.
  const strategicEffort = Math.round(Math.min(100, learning * .45 + Math.min(40, delivery * 4) + Math.min(20, discovery * 3)));
  const scenarioMode = Boolean(input.scenarioMode);
  // A scenario mission is earned through its primary outcomes and guardrails.
  // Standard mode has no authored mission contract, so it remains score-led.
  const missionReady = scenarioMode ? input.missionReady === true : true;
  const masteryReady = scenarioMode ? input.masteryReady === true : true;

  // The report and the reusable resolver deliberately share these thresholds.
  // The score already incorporates realised value, operating health, execution,
  // governance, and validated learning. Applying separate adoption/risk gates
  // here previously contradicted the player-facing report and turned a 66/100
  // mission-ready strategy into an unexplained A-. Mission readiness is the
  // additional scenario-specific protection against a hollow high score.
  if (score >= 82 && masteryReady) {
    return { grade: "A+", archetype: "Transformation Leader", message: "You built value and the operating system required to sustain it.", tone: "text-[#1a7f37]", strategicEffort };
  }
  if (score >= 62 && missionReady) {
    return { grade: "A", archetype: "Strategic Driver", message: "You combined strong value creation with a credible path to scale.", tone: "text-[#0969da]", strategicEffort };
  }
  if (score >= 50) {
    return { grade: "B+", archetype: "Capable Strategist", message: "You made meaningful investment and delivery choices. Your next run can turn this evidence into stronger realised value.", tone: "text-[#9a6700]", strategicEffort };
  }
  if (score >= 35) {
    return { grade: "B", archetype: "Foundation Builder", message: "You established a useful baseline. Keep one signal, change one decision, and use the next run to build momentum.", tone: "text-[#9a6700]", strategicEffort };
  }
  return { grade: "C", archetype: "Early Explorer", message: "This run created a starting point. Use the evidence to choose one focused experiment for the next campaign.", tone: "text-[#cf222e]", strategicEffort };
}
