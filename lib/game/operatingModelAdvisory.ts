/**
 * A deliberately soft operating-model interpretation.
 *
 * It does not alter outcomes, scoring, recommendations, or persistence.  It
 * simply helps the learner read the existing record through four connected
 * lenses: value realisation, architectural flexibility, learning velocity,
 * and exploration.  Every sentence is grounded in values already held by the
 * game state so the advisory layer never invents evidence.
 */
export type OperatingModelLens =
  | "value-realisation"
  | "architectural-flexibility"
  | "learning-velocity"
  | "exploration";

export type OperatingModelAdvisory = {
  lens: OperatingModelLens;
  label: string;
  evidence: string;
  decisionPrompt: string;
  resultInsight: string;
  finalInsight: string;
};

type AdvisoryState = {
  roi?: number;
  adoption?: number;
  data?: number;
  risk?: number;
  spent?: number;
  campaignBudgetRemaining?: number;
  campaignBudget?: number;
  deploymentAmount?: number;
  selected?: string[];
  alloc?: Partial<Record<"infra" | "data" | "people" | "mlops" | "compliance" | "innovation", number>>;
  initiativeStates?: Record<string, {
    quartersFunded?: number;
    quartersSinceLastFund?: number;
    maturityLevel?: string;
  }>;
  history?: unknown[];
};

const number = (value: unknown) => Math.max(0, Number(value) || 0);
const percent = (value: unknown, decimals = 0) => `${number(value).toFixed(decimals)}%`;

function reserveRatio(state: AdvisoryState) {
  const remaining = number(state.campaignBudgetRemaining);
  const total = number(state.campaignBudget) || remaining + number(state.spent);
  return total > 0 ? remaining / total : 0;
}

function initiativeEvidence(state: AdvisoryState) {
  const initiatives = Object.values(state.initiativeStates || {});
  const sustained = initiatives.filter((initiative) => number(initiative.quartersFunded) >= 2).length;
  const neglected = initiatives.filter((initiative) => number(initiative.quartersSinceLastFund) >= 2).length;
  return { sustained, neglected, total: initiatives.length };
}

/**
 * Returns a concise interpretation rather than a score. The ordering favours
 * the condition most likely to constrain learning from the next decision.
 */
export function deriveOperatingModelAdvisory(state: AdvisoryState): OperatingModelAdvisory {
  const allocation = state.alloc || {};
  const architectureAllocation = number(allocation.infra) + number(allocation.data) + number(allocation.mlops);
  const enablementAllocation = number(allocation.people) + number(allocation.compliance);
  const innovationAllocation = number(allocation.innovation);
  const selectedCount = state.selected?.length || 0;
  const initiatives = initiativeEvidence(state);
  const reserve = reserveRatio(state);

  if (number(state.data) < 50 || architectureAllocation < 40) {
    return {
      lens: "architectural-flexibility",
      label: "Architectural flexibility",
      evidence: `Data readiness is ${percent(state.data)} and data, infrastructure, and Ops & Maintenance receive ${percent(architectureAllocation)} of the operating mix.`,
      decisionPrompt: "Before adding scope, name the dependency that must become reliable for this portfolio to remain adaptable.",
      resultInsight: "This quarter should be read as a test of whether technical foundations can keep pace with the chosen scope—not as proof that more scope is automatically better.",
      finalInsight: "Your record shows that architecture was treated as a condition for value, not a background detail. Compare the moments when that foundation kept pace with portfolio scope.",
    };
  }

  if (number(state.adoption) < 45 || enablementAllocation < 25) {
    return {
      lens: "learning-velocity",
      label: "Learning velocity",
      evidence: `Adoption is ${percent(state.adoption)} and people plus governance receive ${percent(enablementAllocation)} of the operating mix.`,
      decisionPrompt: "What behaviour must change first for this investment to become usable value rather than a technical promise?",
      resultInsight: "The result also tests whether the organisation can absorb the change. Watch adoption and operating readiness alongside the headline metric.",
      finalInsight: "Your campaign makes the people-and-governance trade-off visible. Revisit the quarters where operating enablement either accelerated or constrained realised value.",
    };
  }

  if (selectedCount <= 1 || initiatives.sustained > 0 || initiatives.neglected > 0) {
    const continuity = initiatives.sustained
      ? `${initiatives.sustained} initiative${initiatives.sustained === 1 ? " has" : "s have"} received sustained funding`
      : selectedCount === 1
        ? "the portfolio is intentionally concentrated"
        : "the portfolio is still establishing continuity";
    const neglect = initiatives.neglected ? `; ${initiatives.neglected} initiative${initiatives.neglected === 1 ? " has" : "s have"} been left without funding for two or more quarters` : "";
    return {
      lens: "value-realisation",
      label: "Value realisation",
      evidence: `${continuity}${neglect}. The current portfolio contains ${selectedCount} initiative${selectedCount === 1 ? "" : "s"}.`,
      decisionPrompt: "Which capability deserves continued investment because it is becoming usable, and which pressure are you intentionally leaving uncovered?",
      resultInsight: "Read this outcome as part of a capability-building sequence. Sustained investment and deliberate trade-offs matter as much as the quarter's headline return.",
      finalInsight: "Your result reflects whether you converted repeated investment into operating capability, while making the cost of neglected work visible.",
    };
  }

  const reserveMessage = reserve >= 0.45
    ? `Campaign reserve remains ${percent(reserve * 100)} of the original purse`
    : `Campaign reserve is ${percent(reserve * 100)} of the original purse`;
  return {
    lens: "exploration",
    label: "Exploration and optionality",
    evidence: `${reserveMessage}; innovation receives ${percent(innovationAllocation)} of the operating mix.`,
    decisionPrompt: "What evidence would justify releasing more reserve, and what small experiment would make that decision less uncertain?",
    resultInsight: "The quarter preserves optionality. Its learning value depends on whether the reserve has a defined trigger rather than simply remaining uncommitted.",
    finalInsight: "Your record shows how you balanced exploration against near-term delivery. The strongest replay changes one assumption and tests whether that reserve decision still holds.",
  };
}
