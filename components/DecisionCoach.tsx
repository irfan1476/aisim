import { BrainCircuit, ChevronDown, Compass, Eye, Lightbulb, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { GameInitiative, GameViewState } from "./gameViewTypes";
import { formatBudget } from "../lib/currency";
import { getScenario } from "../lib/scenarios/registry";
import { deriveOperatingModelAdvisory } from "../lib/game/operatingModelAdvisory";

type Props = { state: GameViewState; initiatives: GameInitiative[] };

export default function DecisionCoach({ state, initiatives }: Props) {
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  const history = state.history || [];
  const last = history[history.length - 1] as {
    q?: number;
    selectedCount?: number;
    portfolioPosture?: string;
    metrics?: Record<string, number>;
    scenarioState?: { metrics?: Record<string, number> };
  } | undefined;
  const currentMetrics = scenario ? (state as GameViewState & { scenarioState?: { metrics?: Record<string, number> } }).scenarioState?.metrics : undefined;
  const bottleneck = scenario?.progress
    .map((item) => {
      const value = Number(currentMetrics?.[item.key] ?? state.scenarioStartingMetrics?.[item.key] ?? item.start);
      const moved = item.direction === "higher-is-better" ? value - item.start : item.start - value;
      const targetSpan = Math.max(1, Math.abs(item.target - item.start));
      return { item, value, progress: Math.max(0, Math.min(100, (moved / targetSpan) * 100)) };
    })
    .sort((a, b) => a.progress - b.progress)[0];
  const lastLesson = last
    ? `Q${last.q || Math.max(1, state.q - 1)} used ${last.selectedCount ?? last.portfolioPosture ? `${last.selectedCount ?? "a"} initiative(s)` : "a recorded portfolio"}; compare the resulting movement before changing course.`
    : "There is no completed quarter yet. Treat this as a hypothesis-setting decision.";
  const selected = state.selected.length;
  const operatingModel = deriveOperatingModelAdvisory(state);
  const selectedNames = state.selected.map((id) => initiatives.find((item) => item.id === id)?.name || id);
  const evidence = bottleneck
    ? `${bottleneck.item.label} is currently the least progressed pressure (${Math.round(bottleneck.progress)}% toward target). Your choice can deepen it, cover another pressure, or preserve budget.`
    : "Use the current operating metrics and budget position to decide what you want to learn this quarter.";

  const selectedInitiatives = initiatives.filter((initiative) =>
    state.selected.includes(initiative.id),
  );
  const selectedSpend = selectedInitiatives.reduce((sum, initiative) => {
    const live = state.initiativeStates?.[initiative.id] as
      | { currentCost?: number }
      | undefined;
    return sum + Number(live?.currentCost ?? initiative.cost ?? 0);
  }, 0);
  const available = Number(
    state.campaignBudgetRemaining ?? state.campaignBudget ?? 0,
  );
  const suggestedDeployment = Number(state.quarterlyBudget || 0) * 0.6;
  const reserveAfterDecision = Math.max(
    0,
    available - Number(state.deploymentAmount || 0),
  );
  const selectedLabels = selectedInitiatives.map((initiative) => initiative.name);
  const impactEvidence = `${bottleneck
    ? `${selectedLabels.length ? selectedLabels.join(", ") : "No initiative yet"} ${selected === 1 ? "builds depth" : selected === 2 ? "balances two pressures" : selected === 3 ? "broadens coverage" : "preserves optionality"}; ${bottleneck.item.label} remains the current evidence gap.`
    : "Your next decision will establish the first evidence point for this campaign."} ${operatingModel.resultInsight}`;
  const choiceQuestion = selected === 1
    ? "Is depth worth the concentration risk?"
    : selected === 2
      ? "Does this pair cover the most important trade-off?"
      : selected === 3
        ? "Can the organisation coordinate this breadth?"
        : "What pressure are you deliberately willing to leave exposed?";

  return (
    <details className="command-content-card group mb-5 rounded-3xl" data-testid="decision-coach">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
        <span>
          <span className="command-accent flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em]"><Compass size={15} /> Quarter coach</span>
          <span className="command-text mt-1 block text-xl font-bold">Observe the constraint before choosing a bet.</span>
          <span className="command-text-muted mt-1 block text-sm">Evidence-led guidance for Q{state.q}; your choice remains yours.</span>
        </span>
        <span className="command-text-muted flex shrink-0 items-center gap-2 text-right text-xs">
          <span><b className="command-text block">{selectedNames.length ? selectedNames.join(", ") : "No initiative selected"}</b>{formatBudget(available, state.currencyMode)} available</span>
          <ChevronDown size={18} className="transition group-open:rotate-180" />
        </span>
      </summary>
      <section className="command-divider border-t p-5 pt-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <CoachCard icon={<Eye size={16} />} title="Current evidence" text={evidence} />
          <CoachCard icon={<Lightbulb size={16} />} title="Last-quarter lesson" text={lastLesson} />
          <CoachCard icon={<ShieldAlert size={16} />} title={`${operatingModel.label} question`} text={`${choiceQuestion} ${operatingModel.decisionPrompt}`} />
        </div>
        <div className="command-content-soft mt-4 rounded-2xl p-4">
          <div className="command-text flex items-center gap-2 text-sm font-bold"><BrainCircuit size={16} className="command-accent" /> Live decision impact</div>
          <p className="command-text-muted mt-2 text-xs leading-5">{impactEvidence}</p>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
            <CoachStat label="Selected depth" value={`${selected} initiative${selected === 1 ? "" : "s"}`} />
            <CoachStat label="Initiative spend" value={formatBudget(selectedSpend, state.currencyMode)} />
            <CoachStat label="Reserve after deploy" value={formatBudget(reserveAfterDecision, state.currencyMode)} />
          </div>
        </div>
        <details className="command-content-soft group mt-4 rounded-2xl p-4">
          <summary className="command-text flex cursor-pointer list-none items-center gap-2 text-sm font-bold"><Compass size={16} className="command-accent" /> Why this now? <ChevronDown size={15} className="ml-auto transition group-open:rotate-180" /></summary>
          <div className="command-text-muted mt-3 grid gap-3 text-xs md:grid-cols-3">
            <CoachCard title="Pressure" text={bottleneck ? `${bottleneck.item.label}: ${bottleneck.value.toFixed(1)} ${bottleneck.item.unit}; target ${bottleneck.item.target} ${bottleneck.item.unit}.` : "Compare the metric cards and completed history."} />
            <CoachCard title="Possible experiment" text={bottleneck ? `Invest toward ${bottleneck.item.label}, or deliberately test another response and record why.` : "Choose the smallest decision that would teach you something useful."} />
            <CoachCard title="Capital signal" text={`A 60% deployment is suggested as a starting pace: ${formatBudget(suggestedDeployment, state.currencyMode)}. You may deploy less or more.`} />
          </div>
        </details>
      </section>
    </details>
  );
}

function CoachStat({ label, value }: { label: string; value: string }) {
  return <div className="command-content-subtle rounded-xl p-3"><span className="command-text-faint block text-[10px] font-bold uppercase tracking-wider">{label}</span><b className="command-text mt-1 block text-sm">{value}</b></div>;
}

function CoachCard({ icon, title, text }: { icon?: ReactNode; title: string; text: string }) {
  return <div className="command-content-subtle rounded-2xl p-3"><p className="command-text flex items-center gap-2 text-xs font-bold">{icon}{title}</p><p className="command-text-muted mt-1 text-xs leading-5">{text}</p></div>;
}
