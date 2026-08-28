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
};

export type CampaignVerdict = {
  grade: "A+" | "A" | "A-" | "B+" | "B" | "C+" | "C";
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
  const strongOperating = adoption >= 55 && risk <= 45;
  const unsafe = risk >= 90 || adoption <= 10;

  if (score >= 85 && strongOperating && strategicEffort >= 55) {
    return { grade: "A+", archetype: "Transformation Leader", message: "You built value and the operating system required to sustain it.", tone: "text-[#1a7f37]", strategicEffort };
  }
  if ((score >= 76 && strongOperating) || (score >= 84 && strategicEffort >= 50 && risk <= 65)) {
    return { grade: "A", archetype: "Strategic Driver", message: "You combined strong value creation with a credible path to scale.", tone: "text-[#0969da]", strategicEffort };
  }
  if ((score >= 66 && strategicEffort >= 35 && risk <= 70) || (score >= 72 && adoption >= 40)) {
    return { grade: "A-", archetype: "Progressive Strategist", message: "You made a substantial strategic move and created a strong platform for the next campaign.", tone: "text-[#0969da]", strategicEffort };
  }
  // This is the important middle: meaningful delivery or evidence earns a
  // positive B+ with a precise improvement area, instead of being flattened
  // into the same B used for an uncommitted run.
  if ((score >= 50 && strategicEffort >= 30) || (score >= 62 && !unsafe)) {
    return { grade: "B+", archetype: "Committed Builder", message: unsafe
      ? "You showed real delivery ambition. The next step is to recover adoption and risk before scaling again."
      : "You made meaningful progress and have a credible base to refine in the next campaign.", tone: "text-[#9a6700]", strategicEffort };
  }
  if (score >= 40) {
    return { grade: "B", archetype: "Developing Practitioner", message: "You established a useful baseline. One focused sequencing change can materially improve the next run.", tone: "text-[#9a6700]", strategicEffort };
  }
  if (score >= 25) {
    return { grade: "C+", archetype: "Early Experimenter", message: "You started the experiment. Use the evidence to choose a smaller, clearer next bet.", tone: "text-[#cf222e]", strategicEffort };
  }
  return { grade: "C", archetype: "First Explorer", message: "The first run is a baseline, not a verdict. Pick one hypothesis and test it deliberately next time.", tone: "text-[#cf222e]", strategicEffort };
}
