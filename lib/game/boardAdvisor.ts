import { getScenario } from '../scenarios/registry';

export type BoardPersona = 'CFO' | 'CTO' | 'CHRO' | 'RISK';

export type BoardAdvisorContext = {
  q: number;
  spent: number;
  risk: number;
  adoption: number;
  data: number;
  alloc: Record<string, number>;
  selected: string[];
  campaignBudgetRemaining: number;
  deploymentAmount: number;
  quarterlyBudget: number;
  scenarioMode: boolean;
  scenarioId?: string;
  scenarioMetrics?: Record<string, number>;
  scenarioProgress?: Record<string, number>;
};

export type BoardAdvisorEvidence = {
  label: string;
  value: string;
  explanation: string;
};

export type BoardAdvisorBrief = {
  scenarioLabel: string;
  posture: 'reserve' | 'deep focus' | 'focused balance' | 'portfolio breadth';
  bottleneck: string;
  headline: string;
  lens: string;
  evidence: BoardAdvisorEvidence[];
  tradeoffs: string[];
  suggestedQuestions: string[];
};

/**
 * The Board Advisor must remain useful when an optional LLM is unavailable.
 * This is deliberately a pure function: its answer is traceable to the exact
 * recorded campaign context and can therefore be safely shown as evidence.
 */
export function answerBoardAdvisorQuestion(
  context: BoardAdvisorContext,
  persona: BoardPersona,
  question: string,
): string {
  const scenario = context.scenarioMode ? getScenario(context.scenarioId) : undefined;
  const selectedCount = Math.min(3, Math.max(0, context.selected?.length || 0));
  const deployment = Math.max(0, Number(context.deploymentAmount || 0));
  const pace = Math.max(0, Number(context.quarterlyBudget || 0));
  const remaining = Math.max(0, Number(context.campaignBudgetRemaining || 0));
  const currency = scenario?.currency.defaultSymbol || '$';
  const bottleneck = bottleneckFor(context);
  const posture = postureFor(selectedCount, deployment);
  const normalized = question.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
  const selectedIds = new Set(context.selected || []);
  const selectedNames = scenario?.initiatives
    ?.filter((initiative) => selectedIds.has(initiative.id))
    .map((initiative) => initiative.name) || [];
  const activeSynergies = scenario?.synergies?.filter((synergy) =>
    synergy.initiativeIds.every((id) => selectedIds.has(id)),
  ) || [];

  const structured = (evidence: string, tradeoff: string, nextCheck: string) =>
    `Evidence\n${evidence}\n\nTrade-off\n${tradeoff}\n\nNext check\n${nextCheck}`;

  const has = (...terms: string[]) => terms.some((term) => normalized.includes(term));
  const scenarioProgress = scenario?.progress.find((definition) => definition.label === bottleneck);
  const bottleneckProgress = scenarioProgress
    ? Number(context.scenarioProgress?.[scenarioProgress.key] ?? 0)
    : undefined;

  if (has('reserve', 'budget', 'release', 'spend', 'capital', 'purse')) {
    return structured(
      `Planned deployment is ${money(deployment, currency)} against a reference quarterly pace of ${money(pace, currency)}. The recorded campaign reserve is ${money(remaining, currency)}.`,
      deployment < pace
        ? `Holding ${money(pace - deployment, currency)} below pace preserves optionality, but it leaves the current ${bottleneck} pressure without additional funding this quarter.`
        : deployment > pace
          ? `Deploying above pace advances this quarter's bets sooner, while reducing flexibility for later quarters and crisis choices.`
          : 'Deploying at pace preserves the campaign plan, but it does not by itself prove that the selected portfolio addresses the bottleneck.',
      'Name the observable trigger that would justify deploying more of the reserve next quarter; otherwise the reserve is simply an untested assumption.',
    );
  }

  if (has('synergy', 'combine', 'combination', 'reinforce', 'together', 'pair')) {
    if (activeSynergies.length > 0) {
      const labels = activeSynergies.map((synergy) => synergy.label).join('; ');
      return structured(
        `The selected portfolio activates ${activeSynergies.length} recorded relationship${activeSynergies.length === 1 ? '' : 's'}: ${labels}. ${selectedNames.length ? `Selected initiatives: ${selectedNames.join(', ')}.` : ''}`,
        'These relationships are authored scenario mechanics, not a guarantee of outcome; weak adoption, data readiness, or governance can still constrain the portfolio.',
        `Compare the relationship against the current bottleneck, ${bottleneck}, and keep only combinations that have a credible path to improving it.`,
      );
    }
    return structured(
      `No recorded scenario relationship is active in the current ${selectedCount}-initiative portfolio${selectedNames.length ? ` (${selectedNames.join(', ')})` : ''}.`,
      'Adding another initiative may create coverage or a relationship, but it can also spread the same deployment and operating capacity across more work.',
      'Choose the next initiative because it addresses the bottleneck or creates a visible relationship—not simply because it is available.',
    );
  }

  if (has('risk', 'privacy', 'trust', 'compliance', 'governance', 'control', 'safer')) {
    const compliance = Number(context.alloc?.compliance || 0);
    return structured(
      `Current risk exposure is ${pct(context.risk)} and the operating-system allocation to compliance is ${pct(compliance)}.${scenario ? ` The scenario bottleneck is ${bottleneck}.` : ''}`,
      context.risk >= 55
        ? 'Risk is currently high enough to be a binding constraint: pursuing more scope without a control path can undermine the value of the portfolio.'
        : 'Risk is not the highest recorded native constraint, but it still needs an explicit owner as the portfolio grows.',
      'Identify which selected initiative needs a governance checkpoint this quarter and what evidence would show that exposure is actually reducing.',
    );
  }

  if (has('adoption', 'people', 'training', 'workforce', 'team', 'change', 'enablement')) {
    const people = Number(context.alloc?.people || 0);
    return structured(
      `Adoption is ${pct(context.adoption)} and the operating-system allocation to people is ${pct(people)}. The portfolio is currently a ${posture} decision across ${selectedCount} initiative${selectedCount === 1 ? '' : 's'}.`,
      context.adoption < 45
        ? 'Adoption is below the recorded 45% reference point, so capability and workflow change are more likely to constrain results than another technical promise.'
        : 'The current adoption level supports progress, but broader portfolios still increase the change burden on the people expected to use them.',
      'Define the group that must change behaviour first and the adoption signal you will review before expanding the portfolio.',
    );
  }

  if (has('data', 'technology', 'tech', 'architecture', 'platform', 'readiness')) {
    const dataAllocation = Number(context.alloc?.data || 0);
    const infra = Number(context.alloc?.infra || 0);
    const mlops = Number(context.alloc?.mlops || 0);
    return structured(
      `Data readiness is ${pct(context.data)}. The current operating-system allocations are data ${pct(dataAllocation)}, infrastructure ${pct(infra)}, and MLOps ${pct(mlops)}.`,
      context.data < 50
        ? 'Data readiness is below the recorded 50% reference point, which makes scaling a portfolio more fragile even when individual initiatives look attractive.'
        : 'The data foundation is not the immediate native constraint, but it must keep pace with the scope and maturity of the selected initiatives.',
      'Before committing more scope, identify the specific data or operating dependency that must be ready for the chosen initiatives to produce usable outcomes.',
    );
  }

  if (has('portfolio', 'broad', 'breadth', 'focus', 'focused', 'cover', 'uncovered', 'one', 'two', 'three')) {
    return structured(
      `The current portfolio contains ${selectedCount} initiative${selectedCount === 1 ? '' : 's'} and is classified as ${posture}. Planned deployment is ${money(deployment, currency)}.${selectedNames.length ? ` Selected initiatives: ${selectedNames.join(', ')}.` : ''}`,
      selectedCount === 0
        ? `No pressure is receiving a funded response this quarter; the reserve remains ${money(remaining, currency)}.`
        : selectedCount === 1
          ? 'Deep focus can build one capability faster, but it leaves other pressures deliberately uncovered.'
          : selectedCount === 2
            ? 'Two initiatives balance depth and coverage, but can still compete for the same data, governance, and people capacity.'
            : 'Three initiatives widen coverage, but increase coordination and adoption demands.',
      `Test the portfolio against ${bottleneck}: name the pressure it addresses now and the pressure you are deliberately accepting for this quarter.`,
    );
  }

  if (has('evidence', 'constraint', 'bottleneck', 'pressure', 'why')) {
    const progressEvidence = scenarioProgress
      ? `${bottleneck} has recorded scenario progress of ${pct(bottleneckProgress ?? 0)}.`
      : `Current native metrics are risk ${pct(context.risk)}, adoption ${pct(context.adoption)}, and data readiness ${pct(context.data)}.`;
    return structured(
      `${progressEvidence} The advisor identifies ${bottleneck} as the current bottleneck from the recorded campaign state.`,
      `A bottleneck is a decision aid, not a forecast: it should direct attention without hiding the trade-offs in the ${posture} portfolio.`,
      `Check whether this quarter's ${selectedCount} selected initiative${selectedCount === 1 ? '' : 's'} and ${money(deployment, currency)} deployment have a direct, observable connection to ${bottleneck}.`,
    );
  }

  const personaFocus: Record<BoardPersona, string> = {
    CFO: `capital discipline: ${money(deployment, currency)} planned and ${money(remaining, currency)} still available in the campaign purse`,
    CTO: `operating capability: data readiness is ${pct(context.data)}`,
    CHRO: `adoption and change: adoption is ${pct(context.adoption)}`,
    RISK: `exposure and control: risk is ${pct(context.risk)}`,
  };
  return structured(
    `From the ${persona} lens, the recorded evidence is ${personaFocus[persona]}. The current bottleneck is ${bottleneck}.`,
    `The ${posture} portfolio can create progress, but it cannot resolve every pressure in the same quarter.`,
    'Ask for the one assumption behind the current decision that would most change the next-quarter allocation if it proved false.',
  );
}

function pct(value: number, decimals = 0): string {
  return `${Number(value || 0).toFixed(decimals)}%`;
}

function money(value: number, currency: string): string {
  return `${currency}${Number(value || 0).toFixed(1)}M`;
}

function postureFor(selectedCount: number, deployment: number): BoardAdvisorBrief['posture'] {
  if (deployment <= 0 || selectedCount === 0) return 'reserve';
  if (selectedCount === 1) return 'deep focus';
  if (selectedCount === 2) return 'focused balance';
  return 'portfolio breadth';
}

function bottleneckFor(context: BoardAdvisorContext): string {
  const scenario = context.scenarioMode ? getScenario(context.scenarioId) : undefined;
  if (scenario) {
    const weakest = scenario.progress
      .map((definition) => ({
        definition,
        progress: Number(context.scenarioProgress?.[definition.key] ?? 0),
      }))
      .sort((left, right) => left.progress - right.progress)[0];
    if (weakest) return weakest.definition.label;
  }
  if (context.risk >= 55) return 'risk exposure';
  if (context.adoption < 45) return 'adoption';
  if (context.data < 50) return 'data readiness';
  return 'operating maturity';
}

export function buildBoardAdvisorBrief(
  context: BoardAdvisorContext,
  persona: BoardPersona = 'CFO',
): BoardAdvisorBrief {
  const scenario = context.scenarioMode ? getScenario(context.scenarioId) : undefined;
  const selectedCount = Math.min(3, Math.max(0, context.selected?.length || 0));
  const deployment = Math.max(0, Number(context.deploymentAmount || 0));
  const posture = postureFor(selectedCount, deployment);
  const bottleneck = bottleneckFor(context);
  const currency = scenario?.currency.defaultSymbol || '$';
  const remaining = Number(context.campaignBudgetRemaining || 0);
  const pace = Number(context.quarterlyBudget || 0);
  const reserveRatio = remaining > 0 ? remaining / Math.max(remaining + context.spent, 1) : 0;

  const lens: Record<BoardPersona, string> = {
    CFO: deployment <= 0
      ? 'Protect optionality: a reserve is useful only if you have a reason and a timing trigger for using it.'
      : `Test whether the ${posture} creates enough value for the ${money(deployment, currency)} deployed this quarter.`,
    CTO: `Build the capability behind ${bottleneck}; a promising initiative will not scale if its data and operating foundations lag.`,
    CHRO: context.adoption < 45
      ? `Adoption is the constraint. Treat enablement and workflow change as part of the investment, not as a later activity.`
      : 'Keep the operating system able to absorb the portfolio; scale should not outrun the people who use it.',
    RISK: context.risk >= 55
      ? `Risk is the binding constraint. Ask whether this quarter reduces exposure or merely adds another dependency.`
      : `Keep governance proportional to the ${posture}; breadth and speed still need an accountable control path.`,
  };

  const tradeoffs = [
    selectedCount === 0
      ? 'Reserve preserves future optionality, but unresolved pressures may continue to decay.'
      : selectedCount === 1
        ? 'Deep focus can build maturity faster, but concentrates delivery risk in one bet.'
        : selectedCount === 2
          ? 'Two bets balance depth and coverage, but may dilute the strongest capability gain.'
          : 'Three bets cover more pressures, but coordination can slow adoption and execution.',
    deployment < pace
      ? `Spending below the suggested pace preserves ${money(pace - deployment, currency)} for a later trigger.`
      : deployment > pace
        ? `Spending above pace accelerates progress now and leaves less room for future crises.`
        : 'Spending at pace keeps momentum aligned with the campaign plan.',
  ];

  const suggestedQuestions = [
    `What evidence says ${bottleneck} is the next constraint?`,
    selectedCount === 1
      ? 'What would make this focused bet safer to scale?'
      : selectedCount === 2
        ? 'Do these two initiatives reinforce one another or compete for the same operating capacity?'
        : 'What will we deliberately leave uncovered with a broad portfolio?',
    reserveRatio > 0.6
      ? 'What future event would justify releasing the reserve?'
      : 'What signal would make us change course next quarter?',
  ];

  const evidence: BoardAdvisorEvidence[] = [
    { label: 'Current bottleneck', value: bottleneck, explanation: scenario ? 'Lowest recorded scenario progress.' : 'Derived from current native metrics.' },
    { label: 'Portfolio', value: `${selectedCount} initiative${selectedCount === 1 ? '' : 's'} · ${posture}`, explanation: 'Recorded current-quarter selection.' },
    { label: 'Deployment', value: money(deployment, currency), explanation: 'Current planned deployment, not a forecast.' },
    { label: 'Risk exposure', value: pct(context.risk), explanation: 'Current native risk metric.' },
    { label: 'Campaign reserve', value: money(remaining, currency), explanation: 'Available campaign purse after recorded spend.' },
  ];

  return {
    scenarioLabel: scenario?.name || 'Standard Mode · Project Factory 2030',
    posture,
    bottleneck,
    headline: deployment <= 0
      ? 'The room is waiting for a deliberate investment thesis.'
      : `The operating system is responding to a ${posture} decision.`,
    lens: lens[persona],
    evidence,
    tradeoffs,
    suggestedQuestions,
  };
}
