import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Download,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { GameViewState } from "./gameViewTypes";
import { initiatives } from "../lib/game/initiatives";
import {
  archetypeReveal,
  inferArchetypeFromCampaignDetailed,
} from "../lib/game/generator";
import { calculateReflection } from "../lib/reflection";
import YouSaidYouDid from "./YouSaidYouDid";
import SelfAwarenessScore from "./SelfAwarenessScore";
import { formatBudget, formatCurrency } from "../lib/currency";
import { getScenario } from "../lib/scenarios/registry";
import type { ScenarioProgressDefinition } from "../lib/scenarios/types";
import { calculateScenarioMissionProgress } from "../lib/scenarios/progress";
import { explainScore } from "../lib/game/scoring";
import { buildReplayRun, deleteReplayRun, readReplayRuns, saveReplayRun, type ReplayRun } from "../lib/replay";
import RunComparison from "./RunComparison";
import { deriveOperatingModelAdvisory } from "../lib/game/operatingModelAdvisory";
import { readActiveCounterfactualTrace, type CounterfactualTrace } from "../lib/counterfactual";
import CounterfactualLab from "./CounterfactualLab";

interface GameDoneScreenProps {
  state: GameViewState;
  onPlayAgain: () => void;
}
type Snapshot = {
  q: number;
  chosen?: string[];
  selectedIds?: string[];
  allocation?: Record<string, number>;
  synergiesDiscovered?: string[];
  metrics?: Record<string, number>;
  portfolio?: { selectedCount?: number; portfolioPosture?: string };
  selectedCount?: number;
  portfolioPosture?: string;
  deployedAmount?: number;
  fixedInitiativeSpend?: number;
};
const n = (value: unknown, digits = 1) => Number(value || 0).toFixed(digits);

type MissionRole = "primary" | "supporting" | "guardrail";
type MissionOutcome = ScenarioProgressDefinition & { role: MissionRole };
type MissionOutcomeView = MissionOutcome & {
  current: number;
  progress: number;
  delta: number;
  status: "achieved" | "on-track" | "watch" | "exposed";
};
type MissionView = {
  outcomes: MissionOutcomeView[];
  summary: ReturnType<typeof calculateScenarioMissionProgress>;
};

function buildMissionView(scenario: any, metrics: Record<string, number> | undefined): MissionView {
  const summary = calculateScenarioMissionProgress(metrics, scenario);
  const primaryKeys = new Set(summary.roles.primary.outcomeKeys);
  const guardrailKeys = new Set(summary.roles.guardrail.outcomeKeys);
  const outcomes: MissionOutcomeView[] = (scenario?.progress || []).map((definition: ScenarioProgressDefinition) => {
    const role = (definition.role || (primaryKeys.has(definition.key) ? "primary" : guardrailKeys.has(definition.key) ? "guardrail" : "supporting")) as MissionRole;
    const current = summary.values[definition.key] ?? definition.start;
    const progress = summary.scores[definition.key] ?? 0;
    const delta = current - definition.start;
    const worsened = definition.direction === "higher-is-better" ? delta < 0 : delta > 0;
    const status = role === "guardrail"
      ? worsened ? "exposed" : progress >= 60 ? "achieved" : "on-track"
      : progress >= 80 ? "achieved" : progress >= 35 ? "on-track" : "watch";
    return { ...definition, role, current, progress, delta, status } as MissionOutcomeView;
  });
  return { outcomes, summary };
}

function averageMissionProgress(outcomes: MissionOutcomeView[], role: MissionRole) {
  const values = outcomes.filter((item) => item.role === role);
  return values.length ? values.reduce((sum, item) => sum + item.progress, 0) / values.length : 0;
}

function verdict(
  score: number,
  adoption: number,
  risk: number,
  people: number,
  missionReady = true,
  masteryReady = false,
  scenarioMode = false,
) {
  // The rating is a motivational summary of the full campaign score. The
  // score already includes value, operating health, execution, governance,
  // scenario progress, and validated learning; requiring every health metric
  // again here made strategic campaigns collapse into a discouraging B.
  if (score >= 82) {
    if (!scenarioMode || masteryReady) return [
      "A+",
      "Transformation Leader",
      "You built value and the operating system required to sustain it.",
      "text-[#1a7f37]",
    ];
  }
  if (score >= 66) {
    if (!scenarioMode || missionReady) return [
      "A",
      "Strategic Driver",
      "You combined strong value creation with a credible path to scale.",
      "text-[#0969da]",
    ];
  }
  if (score >= 52)
    return [
      "B+",
      "Capable Strategist",
      "You made meaningful investment and delivery choices. Your next run can turn this evidence into stronger realised value.",
      "text-[#9a6700]",
    ];
  if (score >= 35)
    return [
      "B",
      "Foundation Builder",
      "You established a useful baseline. Keep one signal, change one decision, and use the next run to build momentum.",
      "text-[#9a6700]",
    ];
  return [
    "C",
    "Early Explorer",
    "This run created a starting point. Use the evidence to choose one focused experiment for the next campaign.",
    "text-[#cf222e]",
  ];
}

export default function GameDoneScreen({
  state,
  onPlayAgain,
}: GameDoneScreenProps) {
  const [runName, setRunName] = useState("");
  const [savedRuns, setSavedRuns] = useState<ReplayRun[]>([]);
  const [saved, setSaved] = useState(false);
  const [counterfactualTrace, setCounterfactualTrace] = useState<CounterfactualTrace | null>(null);
  const [openedReplayTrace, setOpenedReplayTrace] = useState<CounterfactualTrace | null>(null);
  const draftRun = useMemo(() => buildReplayRun(state as any, runName, counterfactualTrace), [state, runName, counterfactualTrace]);
  useEffect(() => { setSavedRuns(readReplayRuns()); }, []);
  useEffect(() => {
    const trace = readActiveCounterfactualTrace();
    setCounterfactualTrace(trace?.runId === state.runMetadata?.runId ? trace : null);
  }, [state.runMetadata?.runId]);
  const saveCurrentRun = () => {
    setSavedRuns(saveReplayRun(draftRun));
    setSaved(true);
  };
  const history = (state.history || []) as Snapshot[];
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const liveScenarioMetrics = (
    state as GameViewState & { scenarioState?: { metrics?: Record<string, number> } }
  ).scenarioState?.metrics;
  const missionContract = scenario
    ? calculateScenarioMissionProgress(liveScenarioMetrics || state.scenarioStartingMetrics, scenario)
    : undefined;
  const reflection = calculateReflection(state as any);
  const averageAllocation = (key: keyof GameViewState['alloc']) => {
    const captured = history.filter((item) => item.allocation);
    return captured.length
      ? captured.reduce(
          (sum, item) => sum + Number(item.allocation?.[key] || 0),
          0,
        ) / captured.length
      : Number(state.alloc?.[key] || 0);
  };
  const averagePeople = averageAllocation("people");
  const averageData = averageAllocation("data");
  const averageGovernance = averageAllocation("compliance");
  const realisedValueScore = Number(state.financialLedger?.cumulativeNetBenefit ?? 0) > 0 ? 1 : 0;
  const [grade, archetype, verdictMessage, gradeTone] = verdict(
    state.score,
    state.adoption,
    state.risk,
    averagePeople,
    missionContract?.missionReady ?? true,
    missionContract?.masteryReady ?? false,
    Boolean(scenario),
  );
  const campaignInference = inferArchetypeFromCampaignDetailed(
    state.baseline as number[],
    history,
  );
  const [strategicArchetype, archetypeMessage] = archetypeReveal(
    campaignInference.archetype,
  );
  const [runnerUpArchetype] = archetypeReveal(campaignInference.runnerUp);
  const adoptionGap = Math.max(0, 60 - state.adoption);
  const riskGap = Math.max(0, state.risk - 25);
  const counts = history
    .flatMap((x) => (x.selectedIds?.length ? x.selectedIds : x.chosen || []))
    .reduce<Record<string, number>>((a, id) => {
      a[id] = (a[id] || 0) + 1;
      return a;
    }, {});
  const rankedBets = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const availableInitiatives = scenario?.initiatives || initiatives;
  const topBets = rankedBets
    .slice(0, 3)
    .map(([id]) => availableInitiatives.find((x) => x.id === id)?.name || id);
  const topBetEvidence = rankedBets[0]
    ? `${availableInitiatives.find((item) => item.id === rankedBets[0][0])?.name || rankedBets[0][0]} was funded in ${rankedBets[0][1]} quarters`
    : "No repeated initiative pattern was recorded";
  const discoveredSynergies = new Set([
    ...(state.discoveredSynergies || []),
    ...history.flatMap((item) => item.synergiesDiscovered || []),
  ]);
  const riskMovement = state.risk - 36;
  const evidence = `Across ${history.length} quarters, you averaged ${n(averagePeople, 0)}% in people, ${n(averageData, 0)}% in data, and ${n(averageGovernance, 0)}% in governance. ${topBetEvidence}; risk ${riskMovement <= 0 ? "fell" : "rose"} ${n(Math.abs(riskMovement))} points, and you discovered ${discoveredSynergies.size} capability ${discoveredSynergies.size === 1 ? "combination" : "combinations"}.`;
  const operatingModel = deriveOperatingModelAdvisory(state);
  const diagnosis = `Your strategic pattern: ${strategicArchetype}. ${archetypeMessage} ${evidence} ${operatingModel.finalInsight} ${verdictMessage}`;
  const learningHeadline = state.score >= 75
    ? "You have a repeatable base to build on."
    : state.risk > 60
      ? "Your biggest lesson is sequencing, not ambition."
      : state.adoption < 45
        ? "Your next advantage is bringing people along earlier."
        : "This run gives you a useful baseline to improve.";
  const learningBody = state.risk > 60
    ? "You pushed change faster than the operating system could safely absorb. Keep the strongest bet, then add an earlier evidence or governance step in the next campaign."
    : state.adoption < 45
      ? "The portfolio moved, but adoption lagged. In the next campaign, fund enablement and data readiness before asking the organisation to scale."
      : "There is no single perfect strategy. Treat this result as evidence: keep one thing that worked, change one meaningful choice, and compare the outcome.";
  const replayPrompt = state.risk > 60
    ? "Test a slower scale-up with one extra quarter of discovery or pilot."
    : state.adoption < 45
      ? "Test an earlier people investment while keeping your best-performing initiative."
      : "Test one timing change while keeping the rest of the portfolio stable.";
  const best = history.reduce<Snapshot | undefined>(
    (a, x) =>
      !a || Number(x.metrics?.roi || 0) > Number(a.metrics?.roi || 0) ? x : a,
    undefined,
  );
  const scenarioMetricValue = (item: ScenarioProgressDefinition) =>
    Number(
      liveScenarioMetrics?.[item.key] ??
        state.scenarioStartingMetrics?.[item.key] ??
        item.start,
    );
  const scenarioMetricScore = (item: ScenarioProgressDefinition) => {
    const value = scenarioMetricValue(item);
    const delta =
      item.direction === "higher-is-better"
        ? value - item.start
        : item.start - value;
    return Math.min(
      100,
      Math.max(0, (delta / Math.max(1, Math.abs(item.target - item.start))) * 100),
    );
  };
  const formatScenarioMetric = (value: number, unit: string) =>
    `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
  const missionView = scenario
    ? buildMissionView(scenario, liveScenarioMetrics || state.scenarioStartingMetrics)
    : undefined;
  const missionOutcomes = missionView?.outcomes || [];
  const missionRoles: MissionRole[] = ["primary", "supporting", "guardrail"];
  const primaryMissionProgress = missionContract?.primaryProgress ?? averageMissionProgress(missionOutcomes, "primary");
  const guardrailOutcomes = missionOutcomes.filter((item) => item.role === "guardrail");
  const exposedGuardrails = guardrailOutcomes.filter((item) => item.status === "exposed");
  const missionReady = missionContract?.missionReady ?? (primaryMissionProgress >= 75 && exposedGuardrails.length === 0);
  const missionStatus = exposedGuardrails.length
    ? "Guardrail exposed"
    : primaryMissionProgress >= 80
      ? "Mission achieved"
      : missionReady
        ? "Mission on track"
        : "Mission still forming";
  const missionBlocker = exposedGuardrails[0] || missionOutcomes
    .filter((item) => item.role === "primary")
    .sort((a, b) => a.progress - b.progress)[0];
  const nextMissionExperiment = missionBlocker
    ? missionBlocker.role === "guardrail"
      ? `Next experiment: protect ${missionBlocker.label} earlier, then repeat your strongest value move. Change one control or operating allocation and compare the guardrail result.`
      : `Next experiment: address ${missionBlocker.label} earlier. Keep your strongest value move, then change one timing or funding decision so the mission has more time to mature.`
    : "Next experiment: keep the mission stable and change one timing decision to test whether you can improve the result without weakening a guardrail.";
  const scenarioEvidence = scenario
    ? scenario.progress
        .map((item) => {
          const value = scenarioMetricValue(item);
          const score = scenarioMetricScore(item);
          const direction =
            item.direction === "higher-is-better"
              ? value >= item.start
                ? "improved"
                : "declined"
              : value <= item.start
                ? "improved"
                : "increased";
          return { item, value, score, direction };
        })
        .sort((a, b) => b.score - a.score)
    : [];
  const scenarioDiagnosis = scenario
    ? (() => {
        const strongest = scenarioEvidence[0];
        const weakest = scenarioEvidence[scenarioEvidence.length - 1];
        const funded = rankedBets
          .slice(0, 3)
          .map(([id]) => availableInitiatives.find((item) => item.id === id)?.name || id)
          .join(", ");
        return `In ${scenario.name}, your most effective movement was ${strongest.item.label}: ${formatScenarioMetric(strongest.value, strongest.item.unit)} (${Math.round(strongest.score)}% toward target). Your largest remaining gap is ${weakest.item.label}: ${formatScenarioMetric(weakest.value, weakest.item.unit)} against a target of ${formatScenarioMetric(weakest.item.target, weakest.item.unit)}. You concentrated funding on ${funded || "no repeated initiative"}, which shaped this outcome.`;
      })()
    : "";
  const neglectedPressure = scenarioEvidence.at(-1);
  const pairCounts = history
    .map((item) => (item.selectedIds?.length ? item.selectedIds : item.chosen || []).sort().join(" + "))
    .filter(Boolean)
    .reduce<Record<string, number>>((counts, key) => { counts[key] = (counts[key] || 0) + 1; return counts; }, {});
  const strongestCombination = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const nextExperiment = neglectedPressure
    ? `Replay from the next campaign and address ${neglectedPressure.item.label} earlier. Keep your strongest observed combination, then change only one quarter so you can test whether that pressure was the limiting factor.`
    : "Replay with one deliberate change: keep the same portfolio, but change the quarter in which you make your highest-impact investment.";
  const scoreBreakdown = state.scoreBreakdown || explainScore(state as any);
  const exportReport = () => {
    const text = [
      `AISim Strategy Autopsy`,
      `Rating: ${grade} — ${archetype}`,
      `Strategic pattern: ${strategicArchetype}`,
      evidence,
      `Score: ${state.score}/100`,
      `ROI: ${n(state.roi)}%`,
      `Adoption: ${n(state.adoption, 0)}%`,
      `Risk: ${n(state.risk, 0)}%`,
      "",
      ...history.map(
        (x) =>
          `Q${x.q}: ${(x.chosen || []).join(", ") || "No initiatives"} | ROI ${n(x.metrics?.roi)}% | Adoption ${n(x.metrics?.adoption, 0)}% | Risk ${n(x.metrics?.risk, 0)}%`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "aisim-strategy-autopsy.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="report-shell min-h-screen bg-[#eef3f1] px-4 py-6 text-[#0d1117] md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap justify-between gap-4">
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-2 text-sm font-bold text-[#656d76] hover:text-[#1f2328]"
          >
            <RotateCcw size={16} /> Play again
          </button>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 rounded-full border border-[#d0d7de] bg-white px-4 py-2 text-sm font-bold shadow-sm hover:border-[#1a7f37]"
          >
            <Download size={16} /> Export learning report
          </button>
        </div>
        <section className="report-hero overflow-hidden rounded-[2rem] border border-[#1a7f37]/25 bg-white p-7 text-[#0d1117] shadow-xl md:p-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.25em] text-[#1a7f37]">
                Campaign complete · strategy autopsy
              </p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-.06em] md:text-7xl">
                Your strategy has a story.
              </h1>
              <p className="report-muted mt-6 max-w-2xl text-lg leading-8 text-[#57606a]">
                {diagnosis}
              </p>
            </div>
            <div className="report-verdict rounded-3xl border border-[#1a7f37]/20 bg-[#eef7f0] px-7 py-5 text-center">
              <p className="text-xs uppercase tracking-widest text-[#57606a]">
                CEO verdict
              </p>
              <b className="mt-1 block text-6xl">{grade}</b>
              <p className="mt-1 text-sm text-[#1a7f37]">{archetype}</p>
            </div>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Final score", `${Math.min(100, state.score)}/100`],
              ["ROI", `${n(state.roi)}%`],
              ["Adoption", `${n(state.adoption, 0)}%`],
              ["Risk exposure", `${n(state.risk, 0)}%`],
            ].map(([label, value]) => (
              <div key={label} className="report-metric rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] p-5">
                <p className="text-xs text-[#656d76]">{label}</p>
                <b className="mt-2 block text-3xl">{value}</b>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-6 rounded-3xl border border-[#0969da]/25 bg-[#f6faff] p-6 shadow-sm md:p-8" aria-labelledby="learning-summary">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#0969da]">Your learning summary</p>
              <h2 id="learning-summary" className="mt-2 text-2xl font-bold">{learningHeadline}</h2>
              <p className="mt-3 text-sm leading-6 text-[#57606a]">{learningBody}</p>
            </div>
            <div className="rounded-2xl border border-[#0969da]/20 bg-white px-5 py-4 sm:min-w-64">
              <p className="text-xs font-bold uppercase tracking-wide text-[#57606a]">Next experiment</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#0d1117]">{replayPrompt}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#0969da]/15 pt-4 text-xs text-[#57606a]">
            <span><b className="text-[#0d1117]">Keep:</b> {topBets[0] || "your clearest hypothesis"}</span>
            <span><b className="text-[#0d1117]">Change:</b> one timing, funding, or sequencing choice</span>
            <a href="#save-campaign" className="inline-flex items-center gap-1 font-bold text-[#0969da] hover:text-[#0550ae]">Save and compare later <ArrowRight size={14} /></a>
          </div>
        </section>
        {scenario && <section className="mt-6 rounded-3xl border border-[#1a7f37]/25 bg-[#f1f8f3] p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1a7f37]">Campaign budget ledger</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-[#656d76]">Total purse</p><b className="text-xl">{formatBudget(state.campaignBudget || state.quarterlyBudget * 12, state.currencyMode)}</b></div><div><p className="text-xs text-[#656d76]">Spent</p><b className="text-xl">{formatCurrency(state.spent, state.currencyMode)}</b></div><div><p className="text-xs text-[#656d76]">Remaining</p><b className="text-xl text-[#1a7f37]">{formatCurrency(state.campaignBudgetRemaining ?? 0, state.currencyMode)}</b></div></div><p className="mt-3 text-xs text-[#656d76]">The purse is finite across all twelve quarters; unused capital is not automatically a failure.</p></section>}
        {scenario && <section className="mt-6 rounded-3xl border border-[#1a7f37]/25 bg-[#f1f8f3] p-6 shadow-sm md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#1a7f37]">Scenario performance</p><h2 className="mt-2 text-2xl font-bold">{scenario.name}</h2><p className="mt-2 text-sm text-[#57606a]">Budget framing: {formatBudget(state.quarterlyBudget, state.currencyMode)} per quarter · campaign spend: {formatCurrency(state.spent, state.currencyMode)}</p></div><div className="rounded-2xl bg-white px-5 py-3 text-center"><p className="text-xs text-[#57606a]">Scenario bonus</p><b className="text-3xl text-[#1a7f37]">+{state.scenarioBonus || 0}</b></div></div><p className="mt-5 rounded-2xl border border-[#1a7f37]/20 bg-white p-4 text-sm leading-6 text-[#57606a]">{scenarioDiagnosis}</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{scenario.progress.map((item) => { const value = scenarioMetricValue(item); const score = scenarioMetricScore(item); return <div key={item.key} className="rounded-xl bg-white p-4"><div className="flex items-start justify-between gap-3 text-sm font-bold"><span>{item.label}</span><span className="text-right text-[#1a7f37]">{formatScenarioMetric(value, item.unit)}</span></div><div className="mt-3 h-2 rounded-full bg-[#d0d7de]"><div className="h-full rounded-full bg-[#1a7f37]" style={{ width: `${score}%` }} /></div><div className="mt-2 flex justify-between gap-2 text-xs text-[#656d76]"><span>{Math.round(score)}% toward target</span><span>Target {formatScenarioMetric(item.target, item.unit)}</span></div></div>; })}</div></section>}
        {scenario && missionOutcomes.length > 0 && <section className="mt-6 rounded-3xl border border-[#0969da]/25 bg-[#f6faff] p-6 shadow-sm md:p-8" aria-labelledby="mission-scorecard">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#0969da]">Mission scorecard</p>
              <h2 id="mission-scorecard" className="mt-2 text-2xl font-bold">What counted as success in this campaign</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#57606a]">Primary outcomes define the mission. Supporting outcomes show the quality of the transformation. Guardrails protect the value you created from unacceptable exposure.</p>
            </div>
            <div className={`rounded-2xl border px-5 py-3 text-center ${exposedGuardrails.length ? "border-[#cf222e]/30 bg-[#fff1f0]" : missionReady ? "border-[#1a7f37]/25 bg-[#eef7f0]" : "border-[#d0d7de] bg-white"}`}>
              <p className="text-xs text-[#57606a]">Mission status</p>
              <b className={`mt-1 block text-lg ${exposedGuardrails.length ? "text-[#cf222e]" : missionReady ? "text-[#1a7f37]" : "text-[#9a6700]"}`}>{missionStatus}</b>
              <p className="mt-1 text-xs text-[#656d76]">Primary progress {Math.round(primaryMissionProgress)}%</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {missionRoles.map((role) => {
              const outcomes = missionOutcomes.filter((item) => item.role === role);
              if (!outcomes.length) return null;
              const average = averageMissionProgress(missionOutcomes, role);
              const roleLabel = role === "primary" ? "Primary mission" : role === "supporting" ? "Supporting outcomes" : "Guardrails";
              const roleDescription = role === "primary" ? "The outcomes this campaign was meant to move." : role === "supporting" ? "Useful breadth that strengthens a durable result." : "Conditions that must not deteriorate while value is created.";
              return <div key={role} className="rounded-2xl border border-[#d0d7de] bg-white p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#57606a]">{roleLabel}</p><p className="mt-1 text-xs leading-5 text-[#656d76]">{roleDescription}</p></div><b className="text-lg text-[#0969da]">{Math.round(average)}%</b></div>
                <div className="mt-3 h-2 rounded-full bg-[#eaeef2]"><div className={`h-full rounded-full ${role === "guardrail" && exposedGuardrails.length ? "bg-[#cf222e]" : "bg-[#0969da]"}`} style={{ width: `${Math.max(3, Math.min(100, average))}%` }} /></div>
                <div className="mt-4 space-y-3">{outcomes.map((item) => <div key={item.key}>
                  <div className="flex items-start justify-between gap-3 text-sm"><span className="font-bold">{item.label}</span><span className={`shrink-0 text-xs font-bold ${item.status === "exposed" ? "text-[#cf222e]" : item.status === "achieved" ? "text-[#1a7f37]" : "text-[#9a6700]"}`}>{item.status === "exposed" ? "Exposed" : item.status === "achieved" ? "Achieved" : item.status === "on-track" ? "On track" : "Watch"}</span></div>
                  <p className="mt-1 text-xs text-[#656d76]">Current {formatScenarioMetric(item.current, item.unit)} · target {formatScenarioMetric(item.target, item.unit)}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-[#eaeef2]"><div className={`h-full rounded-full ${item.status === "exposed" ? "bg-[#cf222e]" : item.status === "achieved" ? "bg-[#1a7f37]" : "bg-[#d29922]"}`} style={{ width: `${Math.max(3, Math.min(100, item.progress))}%` }} /></div>
                </div>)}</div>
              </div>;
            })}
          </div>
          <div className={`mt-5 rounded-2xl border p-4 ${missionBlocker?.status === "exposed" ? "border-[#cf222e]/25 bg-[#fff1f0]" : "border-[#0969da]/20 bg-white"}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-[#0969da]">Replay hypothesis</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#0d1117]">{nextMissionExperiment}</p>
            <p className="mt-2 text-xs leading-5 text-[#656d76]">A replay is a focused experiment, not a demand to repeat the whole campaign. Keep the strongest choice visible and change one meaningful lever.</p>
          </div>
        </section>}
        <section className="mt-6 rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">How the verdict was built</h2>
              <p className="text-[#656d76]">A transparent score, so the result is explainable rather than mysterious.</p>
            </div>
            <span className="rounded-full bg-[#f6f8fa] px-3 py-1 text-sm font-bold">{scoreBreakdown.score}/100</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Mission progress", scoreBreakdown.contributions.scenarioTargetProgress, scoreBreakdown.values.scenarioTargetProgress, scenario ? "Weighted progress across mission outcomes and guardrails" : "Not applicable in Standard mode"],
              ["Realised value", scoreBreakdown.contributions.realisedFinancialValue, scoreBreakdown.values.realisedFinancialValue, "Observed financial benefit—not forecast ROI"],
              ["Operating health", scoreBreakdown.contributions.operatingHealth, scoreBreakdown.values.operatingHealth, "Adoption, efficiency, data, and risk"],
              ["Execution discipline", scoreBreakdown.contributions.executionDiscipline, scoreBreakdown.values.executionDiscipline, "Sequencing, pacing, and delivery follow-through"],
              ["Responsible AI", scoreBreakdown.contributions.responsibleAI, scoreBreakdown.values.responsibleAI, "Governance and control maturity"],
              ["Validated learning", scoreBreakdown.contributions.validatedLearning, scoreBreakdown.values.validatedLearning, "Readiness and evidence from deliberately progressed initiatives"],
            ].map(([label, contribution, value, detail]) => (
              <div key={String(label)} className="rounded-2xl bg-[#f6f8fa] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#656d76]">{label}</p>
                <b className="mt-2 block text-2xl text-[#1a7f37]">{Number(contribution).toFixed(1)} pts</b>
                <p className="mt-2 text-xs leading-5 text-[#656d76]">{detail} · evidence score {Number(value).toFixed(0)}/100</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl border border-[#1a7f37]/20 bg-[#eef7f0] p-4 text-sm leading-6 text-[#57606a]">Validated learning gives early discovery and pilots credit for evidence, readiness, and controls. It never substitutes for realised value, and safety-critical work still needs its mandatory checks.</p>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3"><CheckCircle2 className="text-[#1a7f37]" /><h2 className="text-2xl font-bold">What the campaign taught you</h2></div>
            <div className="mt-6 space-y-4 text-sm leading-6 text-[#57606a]">
              <p><b className="text-[#1f2328]">What worked:</b> {topBetEvidence}. {best ? `Your strongest recorded ROI position was Q${best.q}.` : "No completed quarter was recorded."}</p>
              <p><b className="text-[#1f2328]">What was neglected:</b> {neglectedPressure ? `${neglectedPressure.item.label} finished furthest from its scenario target.` : "Review the quarters where you preserved budget or left initiatives unfunded."}</p>
              <p><b className="text-[#1f2328]">Missed opportunity:</b> {neglectedPressure ? `An earlier investment in ${neglectedPressure.item.label} may have given the capability more time to mature.` : "A saved reserve can be valuable, but leaving a binding pressure unattended for too long carries a learning cost."}</p>
              <p><b className="text-[#1f2328]">The trade-off:</b> {state.adoption >= 60 ? "You accepted some risk to build adoption and operating momentum." : realisedValueScore > 0 ? "The model showed value, but the operating system did not keep pace with the portfolio." : "The portfolio created a promising direction, but has not yet produced realised cash value."} {strongestCombination ? `Your most repeated combination was ${strongestCombination.replaceAll(" + ", " + ")}.` : ""}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-[#1a7f37]/25 bg-[#f1f8f3] p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3"><Sparkles className="text-[#1a7f37]" /><h2 className="text-2xl font-bold">Your next experiment</h2></div>
            <p className="mt-6 text-lg font-semibold leading-8 text-[#3d2e00]">{nextExperiment}</p>
            <p className="mt-4 text-sm leading-6 text-[#57606a]">Change one meaningful variable at a time. The aim is to learn which timing and portfolio shape works under these conditions—not to discover one permanent correct answer.</p>
            <p className="mt-4 text-xs leading-5 text-[#57606a]">Frozen evidence: {history.length} quarter snapshots · run {state.runMetadata?.runId || `seed-${state.initiativeGeneration?.seed || "unknown"}`} · rules {state.runMetadata?.rulesVersion || "2.0"}. Advisor wording never changes the measured result.</p>
          </div>
        </section>
        <section className="mt-6 rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="text-2xl font-bold">Save this campaign</h2><p className="mt-1 text-sm text-[#656d76]">Name the hypothesis you tested so a later run has something meaningful to compare.</p></div>
            <div className="flex flex-wrap gap-2"><input value={runName} onChange={(event) => setRunName(event.target.value)} placeholder="e.g. Governance first" className="rounded-xl border border-[#d0d7de] px-3 py-2 text-sm outline-none focus:border-[#1a7f37]" /><button type="button" onClick={saveCurrentRun} className="report-dark-action rounded-xl bg-[#0d1117] px-4 py-2 text-sm font-bold text-white hover:bg-[#1a7f37]">{saved ? "Saved" : "Save run"}</button></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#656d76]">Stored locally with the scenario, seed, rules version, and frozen quarter snapshots. No advisor wording is used to calculate this report.</p>
        </section>
        {counterfactualTrace && <CounterfactualLab trace={counterfactualTrace} originalState={state as any} />}
        {openedReplayTrace && openedReplayTrace.runId !== counterfactualTrace?.runId && (
          <CounterfactualLab trace={openedReplayTrace} />
        )}
        <RunComparison
          runs={savedRuns}
          currentRun={draftRun}
          onDelete={(id) => setSavedRuns(deleteReplayRun(id))}
          onOpenTrace={(run) => setOpenedReplayTrace(run.counterfactualTrace || null)}
        />
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3">
              <Compass className="text-[#1a7f37]" />
              <div>
                <h2 className="text-2xl font-bold">
                  Your transformation compass
                </h2>
                <p className="text-[#656d76]">
                  The three dimensions behind the verdict.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                ["Financial value", state.roi, 50],
                ["Operating adoption", state.adoption, 70],
                ["Governance control", 100 - state.risk, 75],
              ].map(([label, value, target]) => (
                <div key={label}>
                  <div className="flex items-end justify-between">
                    <p className="font-bold">{label}</p>
                    <b className="text-xl text-[#1a7f37]">{n(value, 0)}%</b>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-[#eaeef2]">
                    <div
                      className="h-3 rounded-full bg-[#1a7f37]"
                      style={{ width: `${Math.min(100, Number(value))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#656d76]">
                    Target {target}%
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold">Pattern confidence</p>
                <b className="text-[#1a7f37]">
                  {campaignInference.confidence}%
                </b>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#d0d7de]">
                <div
                  className="h-2 rounded-full bg-[#1a7f37]"
                  style={{ width: `${campaignInference.confidence}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#656d76]">
                Closest alternative: {runnerUpArchetype}. This diagnosis uses
                the full campaign, not just your opening answers.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3">
              <Sparkles className="text-[#1a7f37]" />
              <h2 className="text-2xl font-bold">The one big lesson</h2>
            </div>
            <p className="mt-6 text-xl font-semibold leading-8">
              {adoptionGap > riskGap
                ? "Value does not scale without people. Make adoption a first-class investment."
                : "Governance is your multiplier. Reduce risk before scaling the biggest bets."}
            </p>
            <div className="mt-6 rounded-2xl border border-[#1a7f37]/20 bg-[#eef7f0] p-4 text-sm leading-6 text-[#57606a]">
              A strong strategy balances the model, the operating system, and
              the humans who make it real.
            </div>
          </div>
        </section>
        <YouSaidYouDid reflection={reflection} />
        <SelfAwarenessScore reflection={reflection} />
        <section id="save-campaign" className="mt-6 rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">The story of your strategy</h2>
              <p className="text-[#656d76]">
                Quarter-by-quarter decisions and measurable movement.
              </p>
            </div>
            <span className="rounded-full bg-[#eef7f0] px-3 py-1 text-sm font-bold text-[#1a7f37]">
              {history.length} quarters captured
            </span>
          </div>
          <div className="mt-8 overflow-x-auto pb-2">
            <div className="flex min-w-[720px] items-start">
              {history.map((item, index) => {
                const current = item.metrics || {};
                const prior = index ? history[index - 1].metrics || {} : {};
                const change =
                  Number(current.roi || 0) - Number(prior.roi || 0);
                return (
                  <div key={`${item.q}-${index}`} className="relative flex-1">
                    <div className="flex items-center">
                      <div
                        className={`h-4 w-4 rounded-full border-4 border-white ring-2 ${change >= 0 ? "bg-[#1a7f37] ring-[#1a7f37]" : "bg-[#cf222e] ring-[#cf222e]"}`}
                      />
                      <div className="h-1 flex-1 bg-[#d0d7de]" />
                    </div>
                    <div className="pr-3 pt-3">
                      <p className="font-bold">Q{item.q}</p>
                      <p className="mt-2 line-clamp-2 min-h-10 text-xs text-[#656d76]">
                        {(item.chosen || item.selectedIds || []).join(" · ") || "No initiatives"}
                      </p>
                      <p className="mt-1 text-xs text-[#656d76]">
                        {item.portfolio?.selectedCount ?? item.selectedCount ?? (item.chosen || item.selectedIds || []).length} funded · recorded spend {n(item.metrics?.spent)}
                      </p>
                      <p
                        className={`mt-3 text-sm font-bold ${change >= 0 ? "text-[#1a7f37]" : "text-[#cf222e]"}`}
                      >
                        {change >= 0 ? "+" : ""}
                        {n(change)}% ROI
                      </p>
                      <p className="mt-1 text-xs text-[#656d76]">Spent {formatCurrency(item.deployedAmount ?? item.fixedInitiativeSpend ?? 0, state.currencyMode)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-[#1a7f37]" />
              <h2 className="text-2xl font-bold">What worked</h2>
            </div>
            <ul className="mt-6 space-y-4 text-[#656d76]">
              <li className="flex gap-3">
                <CheckCircle2 className="shrink-0 text-[#1a7f37]" />
                Best observed ROI position: Q{best?.q || "—"}.
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="shrink-0 text-[#1a7f37]" />
                Most-used bets:{" "}
                {topBets.join(", ") || "No initiatives recorded"}.
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="shrink-0 text-[#1a7f37]" />
                Total investment recorded: ${n(state.spent)}M across the
                campaign.
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3">
              <TriangleAlert className="text-[#9a6700]" />
              <h2 className="text-2xl font-bold">Your roadmap to A+</h2>
            </div>
            <div className="mt-6 space-y-4">
              {[
                [
                  "01",
                  `Raise adoption from ${n(state.adoption, 0)}% toward 70%`,
                  "People investment and enablement should precede aggressive scale.",
                ],
                [
                  "02",
                  `Bring risk from ${n(state.risk, 0)}% below 25%`,
                  "Use compliance as a growth enabler, not a late-stage repair.",
                ],
                [
                  "03",
                  "Keep the portfolio balanced",
                  "Pair high-upside bets with operational and governance foundations.",
                ],
              ].map(([num, title, body]) => (
                <div key={num} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef7f0] text-sm font-bold text-[#1a7f37]">
                    {num}
                  </span>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#656d76]">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
              <button
              onClick={onPlayAgain}
              className="report-dark-action mt-7 flex items-center gap-2 rounded-xl bg-[#0d1117] px-5 py-3 font-bold text-white hover:bg-[#1a7f37]"
            >
              Run the next campaign <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <p className={`pb-4 pt-8 text-center text-sm font-bold ${gradeTone}`}>
          Your choices are the curriculum. Review the pattern, then try again.
        </p>
      </div>
    </main>
  );
}
