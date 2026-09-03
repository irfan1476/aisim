import { AlertTriangle, ArrowUpRight, CheckCircle2, Link2, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import type { GameInitiative, GameViewState } from "./gameViewTypes";
import { formatBudget } from "../lib/currency";
import { getScenario } from "../lib/scenarios/registry";
import { deploymentCapacity } from "../lib/game/state";
import { calculateActionCapitalPlan } from "../lib/game/capital";
import { suggestedLifecycleAction } from "../lib/game/lifecycleResolver";
import type { InitiativeActionSet } from "../lib/game/businessModel";

type Props = {
  state: GameViewState;
  initiatives: GameInitiative[];
};

const postureFor = (count: number) => {
  if (count === 1) {
    return {
      label: "Deep focus",
      description: "Concentrate capital to build one capability faster.",
      tradeoff: "Higher concentration and neglect exposure",
      tone: "border-[#bf8700]/35 bg-[#fff8c5]",
    };
  }
  if (count === 2) {
    return {
      label: "Focused balance",
      description: "Pair two bets for coverage without spreading attention too thin.",
      tradeoff: "Moderate spend with selective coverage",
      tone: "border-[#1a7f37]/30 bg-[#dafbe1]",
    };
  }
  if (count === 3) {
    return {
      label: "Portfolio breadth",
      description: "Cover more challenges while accepting coordination load.",
      tradeoff: "Broader coverage with slower depth per bet",
      tone: "border-[#54aeff]/35 bg-[#ddf4ff]",
    };
  }
  return {
    label: "No commitment yet",
    description: "Select one, two, or three initiatives to preview the trade-offs.",
    tradeoff: "No initiative impact will be realised this quarter",
    tone: "border-[#d0d7de] bg-[#f6f8fa]",
  };
};

export default function DecisionPreview({ state, initiatives }: Props) {
  const selected = state.selected
    .map((id) => initiatives.find((initiative) => initiative.id === id))
    .filter((initiative): initiative is GameInitiative => Boolean(initiative));
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const liveFor = (initiative: GameInitiative) => state.initiativeStates?.[initiative.id] || initiative;
  const selectedIds = selected.map((initiative) => initiative.id);
  const currentCost = (initiative: GameInitiative) =>
    Number((liveFor(initiative) as { currentCost?: number }).currentCost ?? initiative.cost);
  const selectedCost = selected.reduce((sum, initiative) => sum + currentCost(initiative), 0);
  const synergyOpportunities = (scenario?.synergies || []).filter((synergy) =>
    synergy.initiativeIds.every((id) => selectedIds.includes(id)),
  );
  const costReduction = synergyOpportunities.reduce((sum, synergy) => sum + synergy.costReduction, 0);
  const campaignRemaining = Number(
    state.campaignBudgetRemaining ?? state.campaignBudget ?? state.quarterlyBudget * 12,
  );
  const capacity = deploymentCapacity(state.campaignBudget, campaignRemaining, state.quarterlyBudget, state.q, state.spent);
  const plannedDeployment = Math.min(Number(state.deploymentAmount || 0), capacity.maximumDeployment);
  const initiativeActions: InitiativeActionSet = { ...(state.initiativeActions || {}) };
  selectedIds.forEach((id) => {
    if (initiativeActions[id]) return;
    const live = state.initiativeStates?.[id];
    initiativeActions[id] = state.scenarioMode && live
      ? suggestedLifecycleAction(live, state.q)
      : 'scale';
  });
  Object.entries(state.initiativeStates || {}).forEach(([id, initiative]) => {
    if (initiativeActions[id] || selectedIds.includes(id)) return;
    if (Number(initiative.quartersFunded || 0) > 0) initiativeActions[id] = 'maintain';
  });
  const actionPlan = calculateActionCapitalPlan(
    state,
    initiativeActions,
    plannedDeployment,
    state.quarterlyCrisisCost,
    state.accelerationAllocationMode === 'focused' ? state.accelerationAllocations : undefined,
  );
  const expectedSpend = actionPlan.requiredCapital;
  const budgetAfter = Math.max(0, campaignRemaining - actionPlan.totalReleased);
  const unfunded = initiatives.filter((initiative) => !selectedIds.includes(initiative.id));
  const posture = postureFor(selected.length);
  const affectedChallenges = scenario
    ? scenario.challenges.filter((challenge) =>
        selected.some((initiative) => {
          const live = liveFor(initiative) as { scenarioMetadata?: { primaryMetric?: string } };
          return (live.scenarioMetadata?.primaryMetric || initiative.impact) === challenge.metric ||
            (live.scenarioMetadata?.primaryMetric || "") === challenge.metric;
        }),
      )
    : [];
  const affectedProgress = scenario
    ? scenario.progress.filter((metric) =>
        selected.some((initiative) => {
          const live = liveFor(initiative) as { scenarioMetadata?: { primaryMetric?: string } };
          return live.scenarioMetadata?.primaryMetric === metric.key;
        }),
      )
    : [];
  const concentration = selected.length === 1 ? "High" : selected.length === 2 ? "Moderate" : selected.length === 3 ? "Lower" : "None";
  const challengeNames = affectedChallenges.map((challenge) => challenge.label);
  const kpiNames = affectedProgress.map((metric) => metric.label);

  return (
    <details open className={`group h-full rounded-3xl border ${posture.tone}`} data-testid="decision-preview">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
        <span>
          <span className="text-[11px] font-bold uppercase tracking-[.2em] text-[#57606a]">Decision preview</span>
          <span className="mt-1 flex items-center gap-2 text-xl font-bold text-[#1f2328]">
            {posture.label}
            <span className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-xs">{selected.length} / 3</span>
          </span>
          <span className="mt-1 block text-sm text-[#57606a]">{posture.description}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-right">
          <span><span className="flex items-center justify-end gap-1 text-[11px] font-bold uppercase tracking-wider text-[#57606a]"><Wallet size={13} /> Selected portfolio</span><b className="mt-1 block text-lg text-[#1f2328]">{formatBudget(expectedSpend, state.currencyMode)}</b><small className="mt-0.5 block text-[10px] text-[#57606a]">Plan {formatBudget(plannedDeployment, state.currencyMode)} · max {formatBudget(capacity.maximumDeployment, state.currencyMode)}</small></span>
          <span className="rounded-full bg-white/70 p-2"><ArrowUpRight size={15} className="transition group-open:rotate-90" /></span>
        </span>
      </summary>
      <section
        aria-labelledby="decision-preview-title"
        className="border-t border-black/10 p-5 pt-4"
        data-selected-count={selected.length}
        data-portfolio-posture={posture.label.toLowerCase().replaceAll(" ", "-")}
        data-breadth={selected.length / 3}
        data-concentration-risk={concentration.toLowerCase()}
      >

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PreviewStat label="Budget after decision" value={formatBudget(budgetAfter, state.currencyMode)} />
        <PreviewStat label="Concentration risk" value={concentration} tone={selected.length === 1 ? "text-[#cf222e]" : "text-[#1a7f37]"} />
        <PreviewStat label="Unfunded this quarter" value={`${unfunded.length} initiative${unfunded.length === 1 ? "" : "s"}`} />
        <PreviewStat label="Trade-off" value={posture.tradeoff} compact />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <PreviewList icon={<ArrowUpRight size={15} />} title="Challenges / KPIs affected" items={[...challengeNames, ...kpiNames]} empty={scenario ? "No direct scenario mapping for this selection yet." : "Standard mode uses general operating metrics."} />
        <PreviewList icon={<AlertTriangle size={15} />} title="Neglected initiatives" items={unfunded.map((initiative) => initiative.name)} empty="All available initiatives are covered." danger />
        <PreviewList icon={<Link2 size={15} />} title="Synergy opportunities" items={synergyOpportunities.map((synergy) => synergy.label)} empty={selected.length < 2 ? "Select a second initiative to reveal pair effects." : "No declared pair synergy for this selection."} />
      </div>

      <div className="mt-4 flex items-start gap-2 border-t border-black/10 pt-3 text-xs text-[#57606a]">
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#1a7f37]" />
        <p><strong>Preview model:</strong> the quarter engine calculates the actual result after confirmation. Selecting fewer initiatives increases depth, but leaves more capabilities exposed to neglect. Scenario challenge links and synergies are <strong>scenario-defined mappings</strong>, not measured outcomes.</p>
      </div>
      </section>
    </details>
  );
}

function PreviewStat({ label, value, tone = "text-[#1f2328]", compact = false }: { label: string; value: string; tone?: string; compact?: boolean }) {
  return <div className="rounded-2xl border border-black/10 bg-white/70 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#57606a]">{label}</p><p className={`mt-1 font-bold ${compact ? "text-xs leading-4" : `text-base ${tone}`}`}>{value}</p></div>;
}

function PreviewList({ icon, title, items, empty, danger = false }: { icon: ReactNode; title: string; items: string[]; empty: string; danger?: boolean }) {
  return <div className="rounded-2xl border border-black/10 bg-white/70 p-3"><p className="flex items-center gap-2 text-xs font-bold text-[#1f2328]">{icon}{title}</p>{items.length ? <ul className="mt-2 space-y-1 text-xs text-[#57606a]">{items.slice(0, 4).map((item) => <li key={item} className="flex gap-2"><span className={danger ? "text-[#cf222e]" : "text-[#1a7f37]"}>•</span><span>{item}</span></li>)}{items.length > 4 && <li className="text-[#57606a]">+{items.length - 4} more</li>}</ul> : <p className="mt-2 text-xs leading-4 text-[#57606a]">{empty}</p>}</div>;
}
