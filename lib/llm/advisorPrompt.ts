export type AdvisorPromptContext = {
  persona: string;
  scenarioMode: boolean;
  scenarioPrompt?: string;
  quarterlyBudget: number;
  campaignBudget?: number;
  campaignBudgetRemaining?: number;
  spent?: number;
  state: Record<string, unknown>;
};

const INTERNAL_ADVISOR_KEYS = new Set(['seed', 'runId', 'rulesVersion']);

/**
 * Keep advisor context useful while preventing reproducibility metadata and
 * implementation identifiers from being sent to an optional model provider.
 * This is deliberately structural so nested history and initiative metadata
 * receive the same boundary treatment without mutating game state.
 */
function sanitizeAdvisorValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAdvisorValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !INTERNAL_ADVISOR_KEYS.has(key))
      .map(([key, item]) => [key, sanitizeAdvisorValue(item)]),
  );
}

export function buildAdvisorSystemPrompt({
  persona,
  scenarioMode,
  scenarioPrompt,
  quarterlyBudget,
  campaignBudget,
  campaignBudgetRemaining,
  spent,
  state,
}: AdvisorPromptContext): string {
  const context = scenarioMode
    ? `Scenario context: ${scenarioPrompt || "Domain-specific scenario pressures are active."} Total campaign purse: ${campaignBudget ?? quarterlyBudget * 12}; remaining: ${campaignBudgetRemaining ?? campaignBudget ?? quarterlyBudget * 12}; Quarterly budget: ${quarterlyBudget}; suggested pace: ${quarterlyBudget}; spent so far: ${spent ?? 0}.`
    : "Standard mode is active; preserve the current campaign logic.";

  return `You are the ${persona} board advisor in an executive AI investment simulation. Reply in plain text only, under 120 words, using exactly these labels: Recommendation:, Why:, Next step:. Do not use Markdown, headings, or repeat the question. Be concise and actionable. Do not reveal internal archetype labels or seed values. Reference current initiative stats, maturity, funding history, governance, and any discovered combinations when relevant. ${context} Current state: ${JSON.stringify(sanitizeAdvisorValue(state))}`;
}
