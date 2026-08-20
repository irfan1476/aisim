import { inferArchetypeFromDecisions, type ScenarioArchetype } from './game/generator';
import type { GameState } from './game/state';

type ReflectionSnapshot = {
  q: number;
  chosen?: string[];
  selectedIds?: string[];
  allocation?: Record<string, number>;
  metrics?: Record<string, number>;
};

type AlignmentItem = {
  baseline: number;
  observed: number;
  insight: string;
  evidence: string;
};

export type ReflectionData = {
  hypothesis: string;
  observations: string[];
  alignment: {
    people: AlignmentItem;
    risk: AlignmentItem;
    governance: AlignmentItem;
    balance: AlignmentItem;
    payback: AlignmentItem;
  };
  selfAwareness: {
    score: number;
    alignmentScore: number;
    adaptationScore: number;
    tensionScore: number;
    breakdown: string[];
  };
  tensions: Array<{
    type: 'governance' | 'balance' | 'people' | 'risk' | 'payback';
    description: string;
    evidence: string;
    suggestion: string;
  }>;
  evidence: string[];
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const rounded = (value: number, digits = 0) => Number(value.toFixed(digits));
const pct = (value: number, digits = 0) => `${rounded(value, digits)}%`;

const hypothesisCopy: Record<ScenarioArchetype, string> = {
  balanced: 'seeking equilibrium across value, capability, and control',
  'data-driven': 'building decisions around evidence and measurable readiness',
  'people-first': 'building capability before scaling',
  'tech-first': 'using technology as the primary transformation lever',
  'risk-tolerant': 'making bold moves for faster returns',
  'risk-averse': 'favouring steady, governed progress',
};

const questionLabels = [
  'people enablement',
  'risk appetite',
  'governance readiness',
  'portfolio balance',
  'commercial confidence',
];

function average(history: ReflectionSnapshot[], key: string, fallback: number) {
  const values = history
    .map((item) => Number(item.allocation?.[key]))
    .filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : fallback;
}

function metric(history: ReflectionSnapshot[], key: string, fallback: number) {
  const values = history
    .map((item) => Number(item.metrics?.[key]))
    .filter((value) => Number.isFinite(value));
  return values.length ? values[values.length - 1] : fallback;
}

function distanceScore(actual: number, expected: number, tolerance: number) {
  return clamp(100 - (Math.abs(actual - expected) / tolerance) * 100);
}

function buildObservations(answers: number[]) {
  const observations: string[] = [];
  const prompts = [
    answers[0] >= 4 ? 'You rated people enablement as a strong prerequisite for value.' : 'You placed relatively less emphasis on people enablement at the outset.',
    answers[1] >= 4 ? 'You indicated comfort with uncertainty when the upside is compelling.' : answers[1] <= 2 ? 'You indicated a preference for controlling risk before moving faster.' : 'You expressed a measured appetite for risk.',
    answers[2] >= 4 ? 'You see governance as something that should precede ambitious scaling.' : 'You are open to building governance alongside delivery.',
    answers[3] >= 4 ? 'You favour balance over concentrating everything in one big bet.' : 'You are willing to concentrate the portfolio when the opportunity is strong.',
    answers[4] >= 4 ? 'You began with confidence in explaining AI value to financial stakeholders.' : 'You began with a more cautious view of explaining AI payback.',
  ];
  prompts.forEach((item) => { if (observations.length < 3) observations.push(item); });
  return observations;
}

export function calculateReflection(state: GameState): ReflectionData {
  const answers = Array.from({ length: 5 }, (_, index) => Number(state.baseline?.[index] || 3));
  const history = (state.history || []) as ReflectionSnapshot[];
  const allocations = history.filter((item) => item.allocation);
  const people = average(history, 'people', Number(state.alloc?.people || 15));
  const compliance = average(history, 'compliance', Number(state.alloc?.compliance || 10));
  const risk = metric(history, 'risk', Number(state.risk || 36));
  const startRisk = Number(history[0]?.metrics?.risk ?? 36);
  const roi = metric(history, 'roi', Number(state.roi || 0));
  const adoption = metric(history, 'adoption', Number(state.adoption || 38));
  const uniqueInitiatives = new Set(
    history.flatMap((item) => item.selectedIds?.length ? item.selectedIds : item.chosen || []),
  ).size;
  const diversity = (uniqueInitiatives / 6) * 100;
  const concentration = history.reduce<Record<string, number>>((counts, item) => {
    const selected = item.selectedIds?.length ? item.selectedIds : item.chosen || [];
    selected.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    return counts;
  }, {});
  const totalSelections = Object.values(concentration).reduce((sum, count) => sum + count, 0);
  const topShare = totalSelections ? Math.max(...Object.values(concentration), 0) / totalSelections * 100 : 0;

  const peopleAlignment = distanceScore(people, 8 + answers[0] * 4, 18);
  const governanceAlignment = distanceScore(compliance, 5 + answers[2] * 3, 15);
  const balanceAlignment = distanceScore(diversity, answers[3] * 20, 60);
  const paybackAlignment = distanceScore(roi, answers[4] * 14, 70);
  const riskBehaviour = clamp(50 + (answers[1] - 3) * 12 + (startRisk - risk) * 0.7);
  const riskAlignment = distanceScore(riskBehaviour, answers[1] * 20, 45);

  const tensions: ReflectionData['tensions'] = [];
  if (answers[0] >= 4 && people < 15) tensions.push({ type: 'people', description: 'Your belief in people enablement was stronger than your average capability investment.', evidence: `People averaged ${pct(people)} of quarterly allocation.`, suggestion: 'Consider funding adoption and workforce capability before adding more scale.' });
  if (answers[2] >= 4 && compliance < 12) tensions.push({ type: 'governance', description: 'Governance mattered in your baseline, but compliance funding remained comparatively light.', evidence: `Compliance averaged ${pct(compliance)} of quarterly allocation.`, suggestion: 'Use governance as an operating enabler rather than a late-stage repair.' });
  if (answers[3] >= 4 && (topShare > 55 || uniqueInitiatives < 3)) tensions.push({ type: 'balance', description: 'Your opening preference for balance met a concentrated campaign pattern.', evidence: `${uniqueInitiatives} initiatives were funded; the most-used bet represented ${pct(topShare)} of selections.`, suggestion: 'Pair the strongest value bet with data, people, or governance foundations.' });
  if (answers[1] >= 4 && risk < startRisk - 4) tensions.push({ type: 'risk', description: 'You began comfortable with risk, then deliberately reduced exposure as the campaign developed.', evidence: `Risk moved from ${pct(startRisk)} to ${pct(risk)}.`, suggestion: 'Treat the pivot as a strategic adaptation and identify what evidence triggered it.' });
  if (answers[4] >= 4 && roi < 35) tensions.push({ type: 'payback', description: 'Commercial confidence was not yet matched by realised value in this campaign.', evidence: `Final ROI reached ${pct(roi, 1)} with adoption at ${pct(adoption)}.`, suggestion: 'Sequence the operating foundations that turn promising economics into realised value.' });

  const alignmentScore = rounded((peopleAlignment + riskAlignment + governanceAlignment + balanceAlignment + paybackAlignment) / 5);
  const adaptationEvidence = (risk !== startRisk ? 25 : 0) + (adoption > 55 ? 25 : 0) + (history.length >= 6 ? 20 : 0) + (state.userReflections?.q6?.trim() ? 30 : 0);
  const adaptationScore = clamp(adaptationEvidence);
  const tensionScore = clamp(100 - tensions.length * 18);
  const score = rounded(alignmentScore * 0.55 + adaptationScore * 0.3 + tensionScore * 0.15);
  const inference = inferArchetypeFromDecisions(answers);
  const evidence = [
    `${allocations.length || history.length} quarter${(allocations.length || history.length) === 1 ? '' : 's'} of allocation history informed the comparison.`,
    `People averaged ${pct(people)}; compliance averaged ${pct(compliance)}; ${uniqueInitiatives} initiative${uniqueInitiatives === 1 ? '' : 's'} were funded.`,
    `Risk moved ${risk <= startRisk ? 'down' : 'up'} from ${pct(startRisk)} to ${pct(risk)} while adoption reached ${pct(adoption)}.`,
  ];

  return {
    hypothesis: hypothesisCopy[inference],
    observations: buildObservations(answers),
    alignment: {
      people: { baseline: answers[0], observed: rounded(people, 1), insight: peopleAlignment >= 65 ? 'Your actions broadly supported your opening view of capability-building.' : 'Your allocation created a useful tension with your opening view of capability-building.', evidence: `People averaged ${pct(people)} of quarterly allocation.` },
      risk: { baseline: answers[1], observed: rounded(risk, 1), insight: riskAlignment >= 65 ? 'Your risk posture broadly reflected your opening appetite.' : 'Your risk trajectory challenged your opening appetite and is worth examining.', evidence: `Risk moved from ${pct(startRisk)} to ${pct(risk)}.` },
      governance: { baseline: answers[2], observed: rounded(compliance, 1), insight: governanceAlignment >= 65 ? 'Governance funding broadly matched your stated priority.' : 'Governance funding did not fully match your stated priority.', evidence: `Compliance averaged ${pct(compliance)} of quarterly allocation.` },
      balance: { baseline: answers[3], observed: rounded(diversity, 1), insight: balanceAlignment >= 65 ? 'Your initiative spread broadly reflected your preference for balance.' : 'Your portfolio concentration challenged your opening preference for balance.', evidence: `${uniqueInitiatives} of 6 initiatives were funded; top selection share was ${pct(topShare)}.` },
      payback: { baseline: answers[4], observed: rounded(roi, 1), insight: paybackAlignment >= 65 ? 'Your campaign produced value broadly consistent with your commercial confidence.' : 'Your realised value gives you a useful counterpoint to your commercial confidence.', evidence: `Final ROI was ${pct(roi, 1)} with adoption at ${pct(adoption)}.` },
    },
    selfAwareness: { score, alignmentScore, adaptationScore, tensionScore, breakdown: [
      `${alignmentScore}/100 belief/action alignment`,
      `${adaptationScore}/100 evidence of adaptation`,
      `${tensions.length} strategic tension${tensions.length === 1 ? '' : 's'} identified`,
    ] },
    tensions,
    evidence,
  };
}
