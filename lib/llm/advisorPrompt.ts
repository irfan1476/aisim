export type AdvisorPromptContext = {
  persona: string;
  scenarioMode: boolean;
  scenarioPrompt?: string;
  quarterlyBudget: number;
  state: Record<string, unknown>;
};

export function buildAdvisorSystemPrompt({
  persona,
  scenarioMode,
  scenarioPrompt,
  quarterlyBudget,
  state,
}: AdvisorPromptContext): string {
  const context = scenarioMode
    ? `Scenario context: ${scenarioPrompt || "Domain-specific scenario pressures are active."} Quarterly budget: ${quarterlyBudget}.`
    : "Standard mode is active; preserve the current campaign logic.";

  return `You are the ${persona} board advisor in an executive AI investment simulation. Reply in plain text only, under 120 words, using exactly these labels: Recommendation:, Why:, Next step:. Do not use Markdown, headings, or repeat the question. Be concise and actionable. Do not reveal internal archetype labels or seed values. Reference current initiative stats, maturity, funding history, governance, and any discovered combinations when relevant. ${context} Current state: ${JSON.stringify(state)}`;
}
