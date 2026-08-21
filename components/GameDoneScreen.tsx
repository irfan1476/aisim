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
import { explainScore } from "../lib/game/scoring";

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
};
const n = (value: unknown, digits = 1) => Number(value || 0).toFixed(digits);

function verdict(
  score: number,
  adoption: number,
  risk: number,
  people: number,
) {
  if (score >= 88 && adoption >= 70 && risk <= 20 && people >= 20)
    return [
      "A+",
      "Transformation Leader",
      "You built value and the operating system required to sustain it.",
      "text-[#1a7f37]",
    ];
  if (score >= 80 && adoption >= 55 && risk <= 25)
    return [
      "A",
      "Strategic Driver",
      "You combined strong value creation with a credible path to scale.",
      "text-[#0969da]",
    ];
  if (score > 65)
    return [
      "B+",
      "Capable Executor",
      "You moved the portfolio forward; adoption and governance are your unlocks.",
      "text-[#9a6700]",
    ];
  return [
    "B",
    "Developing Practitioner",
    "The fundamentals are forming. Your next run is about disciplined capability building.",
    "text-[#cf222e]",
  ];
}

export default function GameDoneScreen({
  state,
  onPlayAgain,
}: GameDoneScreenProps) {
  const history = (state.history || []) as Snapshot[];
  const reflection = calculateReflection(state as any);
  const averageAllocation = (key: string) => {
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
  const [grade, archetype, verdictMessage, gradeTone] = verdict(
    state.score,
    state.adoption,
    state.risk,
    averagePeople,
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
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const availableInitiatives = scenario?.initiatives || initiatives;
  const liveScenarioMetrics = (
    state as GameViewState & { scenarioState?: { metrics?: Record<string, number> } }
  ).scenarioState?.metrics;
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
  const diagnosis = `Your strategic pattern: ${strategicArchetype}. ${archetypeMessage} ${evidence} ${verdictMessage}`;
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
  const scoreBreakdown = explainScore(state as any);
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
    <main className="min-h-screen bg-[#f6f8fa] px-4 py-6 text-[#1f2328] md:px-8 md:py-10">
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
            className="flex items-center gap-2 rounded-full border border-[#d0d7de] bg-white px-4 py-2 text-sm font-bold shadow-sm hover:border-[#0969da]"
          >
            <Download size={16} /> Export learning report
          </button>
        </div>
        <section className="overflow-hidden rounded-[2rem] bg-[#0d1b2e] p-7 text-white shadow-xl md:p-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.25em] text-[#d4a72c]">
                Campaign complete · strategy autopsy
              </p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-[-.06em] md:text-7xl">
                Your strategy has a story.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                {diagnosis}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 px-7 py-5 text-center">
              <p className="text-xs uppercase tracking-widest text-white/50">
                CEO verdict
              </p>
              <b className="mt-1 block text-6xl">{grade}</b>
              <p className="mt-1 text-sm text-[#79c0ff]">{archetype}</p>
            </div>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Final score", `${Math.min(100, state.score)}/100`],
              ["ROI", `${n(state.roi)}%`],
              ["Adoption", `${n(state.adoption, 0)}%`],
              ["Risk exposure", `${n(state.risk, 0)}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-5">
                <p className="text-xs text-white/45">{label}</p>
                <b className="mt-2 block text-3xl">{value}</b>
              </div>
            ))}
          </div>
        </section>
        {scenario && <section className="mt-6 rounded-3xl border border-[#54aeff]/35 bg-[#ddf4ff] p-6 shadow-sm md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#0969da]">Scenario performance</p><h2 className="mt-2 text-2xl font-bold">{scenario.name}</h2><p className="mt-2 text-sm text-[#57606a]">Budget framing: {formatBudget(state.quarterlyBudget, state.currencyMode)} per quarter · campaign spend: {formatCurrency(state.spent, state.currencyMode)}</p></div><div className="rounded-2xl bg-white px-5 py-3 text-center"><p className="text-xs text-[#57606a]">Scenario bonus</p><b className="text-3xl text-[#0969da]">+{state.scenarioBonus || 0}</b></div></div><p className="mt-5 rounded-2xl border border-[#54aeff]/25 bg-white p-4 text-sm leading-6 text-[#57606a]">{scenarioDiagnosis}</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{scenario.progress.map((item) => { const value = scenarioMetricValue(item); const score = scenarioMetricScore(item); return <div key={item.key} className="rounded-xl bg-white p-4"><div className="flex items-start justify-between gap-3 text-sm font-bold"><span>{item.label}</span><span className="text-right text-[#0969da]">{formatScenarioMetric(value, item.unit)}</span></div><div className="mt-3 h-2 rounded-full bg-[#d0d7de]"><div className="h-full rounded-full bg-[#0969da]" style={{ width: `${score}%` }} /></div><div className="mt-2 flex justify-between gap-2 text-xs text-[#656d76]"><span>{Math.round(score)}% toward target</span><span>Target {formatScenarioMetric(item.target, item.unit)}</span></div></div>; })}</div></section>}
        <section className="mt-6 rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">How the verdict was built</h2>
              <p className="text-[#656d76]">A transparent score, so the result is explainable rather than mysterious.</p>
            </div>
            <span className="rounded-full bg-[#f6f8fa] px-3 py-1 text-sm font-bold">{scoreBreakdown.finalScore}/100</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Outcome movement", scoreBreakdown.outcome, "Value, adoption, efficiency, and risk"],
              ["Sustained execution", scoreBreakdown.sustainedExecution, "Consistency across quarters"],
              ["Capability consistency", scoreBreakdown.capabilityConsistency, "Initiatives funded for four or more quarters"],
              ["Scenario bonus", scoreBreakdown.scenarioBonus, scenario ? "Progress against this scenario's targets" : "Not applicable in Standard mode"],
            ].map(([label, value, detail]) => (
              <div key={String(label)} className="rounded-2xl bg-[#f6f8fa] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#656d76]">{label}</p>
                <b className="mt-2 block text-2xl text-[#0969da]">{Number(value).toFixed(label === "Outcome movement" ? 1 : 0)}</b>
                <p className="mt-2 text-xs leading-5 text-[#656d76]">{detail}</p>
              </div>
            ))}
          </div>
          {scenario ? <p className="mt-4 rounded-2xl border border-[#54aeff]/25 bg-[#ddf4ff] p-4 text-sm leading-6 text-[#57606a]">Scenario progress is capped at a small bonus. It rewards movement toward the domain targets without overpowering the core operating results.</p> : null}
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3">
              <Compass className="text-[#0969da]" />
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
                    <b className="text-xl text-[#0969da]">{n(value, 0)}%</b>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-[#eaeef2]">
                    <div
                      className="h-3 rounded-full bg-[#0969da]"
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
                <b className="text-[#0969da]">
                  {campaignInference.confidence}%
                </b>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#d0d7de]">
                <div
                  className="h-2 rounded-full bg-[#0969da]"
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
              <Sparkles className="text-[#d4a72c]" />
              <h2 className="text-2xl font-bold">The one big lesson</h2>
            </div>
            <p className="mt-6 text-xl font-semibold leading-8">
              {adoptionGap > riskGap
                ? "Value does not scale without people. Make adoption a first-class investment."
                : "Governance is your multiplier. Reduce risk before scaling the biggest bets."}
            </p>
            <div className="mt-6 rounded-2xl bg-[#fff8c5] p-4 text-sm leading-6 text-[#6e5620]">
              A strong strategy balances the model, the operating system, and
              the humans who make it real.
            </div>
          </div>
        </section>
        <YouSaidYouDid reflection={reflection} />
        <SelfAwarenessScore reflection={reflection} />
        <section className="mt-6 rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">The story of your strategy</h2>
              <p className="text-[#656d76]">
                Quarter-by-quarter decisions and measurable movement.
              </p>
            </div>
            <span className="rounded-full bg-[#ddf4ff] px-3 py-1 text-sm font-bold text-[#0969da]">
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
                        {(item.chosen || []).join(" · ") || "No initiatives"}
                      </p>
                      <p
                        className={`mt-3 text-sm font-bold ${change >= 0 ? "text-[#1a7f37]" : "text-[#cf222e]"}`}
                      >
                        {change >= 0 ? "+" : ""}
                        {n(change)}% ROI
                      </p>
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
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ddf4ff] text-sm font-bold text-[#0969da]">
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
              className="mt-7 flex items-center gap-2 rounded-xl bg-[#0d1b2e] px-5 py-3 font-bold text-white hover:bg-[#0969da]"
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
