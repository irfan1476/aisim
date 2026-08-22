import { BrainCircuit, ChevronDown, Compass, Eye, Lightbulb, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { GameInitiative, GameViewState } from "./gameViewTypes";
import { formatBudget } from "../lib/currency";
import { getScenario } from "../lib/scenarios/registry";

type Props = { state: GameViewState; initiatives: GameInitiative[] };

function posture(count: number) {
  if (count === 1) return { label: "Deep focus", tradeoff: "More depth, higher concentration exposure" };
  if (count === 2) return { label: "Focused balance", tradeoff: "Balanced coverage with manageable coordination" };
  if (count === 3) return { label: "Portfolio breadth", tradeoff: "Wider coverage, more coordination pressure" };
  return { label: "Pause / preserve", tradeoff: "Protects optionality, but leaves pressure unattended" };
}

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
  const selectedNames = state.selected.map((id) => initiatives.find((item) => item.id === id)?.name || id);
  const evidence = bottleneck
    ? `${bottleneck.item.label} is currently the least progressed pressure (${Math.round(bottleneck.progress)}% toward target). Your choice can deepen it, cover another pressure, or preserve budget.`
    : "Use the current operating metrics and budget position to decide what you want to learn this quarter.";

  return (
    <section className="mb-5 rounded-3xl border border-[#0969da]/25 bg-[#ddf4ff] p-5" data-testid="decision-coach">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#0969da]"><Compass size={15} /> Quarter coach</p>
          <h2 className="mt-1 text-xl font-bold text-[#1f2328]">Observe the constraint before choosing a bet.</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#57606a]">Guidance is evidence, not an answer. The engine records the decision you make and shows its consequences after confirmation.</p>
        </div>
        <div className="rounded-2xl border border-[#0969da]/15 bg-white/75 px-4 py-3 text-right text-xs text-[#57606a]">
          <span className="block font-bold text-[#1f2328]">Q{state.q} · {formatBudget(state.campaignBudgetRemaining ?? 0, state.currencyMode)} available</span>
          <span>Selected now: {selectedNames.length ? selectedNames.join(", ") : "none"}</span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <CoachCard icon={<Eye size={16} />} title="Evidence" text={evidence} />
        <CoachCard icon={<Lightbulb size={16} />} title="Last-quarter lesson" text={lastLesson} />
        <CoachCard icon={<ShieldAlert size={16} />} title="Decision question" text={selected === 1 ? "Is depth worth the concentration risk?" : selected === 2 ? "Does this pair cover the most important trade-off?" : selected === 3 ? "Can the organisation coordinate this breadth?" : "What pressure are you deliberately willing to leave exposed?"} />
      </div>
      <details className="group mt-4 rounded-2xl border border-[#0969da]/15 bg-white/65 p-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-[#1f2328]"><BrainCircuit size={16} className="text-[#0969da]" /> Show guidance levels <ChevronDown size={15} className="ml-auto transition group-open:rotate-180" /></summary>
        <div className="mt-3 grid gap-3 text-xs text-[#57606a] md:grid-cols-3">
          <CoachCard title="Show evidence" text={bottleneck ? `${bottleneck.item.label}: ${bottleneck.value.toFixed(1)} ${bottleneck.item.unit}; target ${bottleneck.item.target} ${bottleneck.item.unit}.` : "Compare the metric cards and completed history."} />
          <CoachCard title="Give me a hint" text={bottleneck ? `Consider whether your next investment should improve ${bottleneck.item.label}, or intentionally test another response.` : "Choose the smallest decision that would teach you something useful."} />
          <CoachCard title="Explain the direction" text="There is no universally correct portfolio. One bet builds depth, two balances coverage, and three broadens reach while increasing coordination." />
        </div>
      </details>
      <div className="mt-4 border-t border-[#0969da]/15 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#57606a]">Portfolio choices this quarter</p>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          {[0, 1, 2, 3].map((count) => {
            const item = posture(count);
            const active = selected === count;
            return <div key={count} className={`rounded-xl border p-3 ${active ? "border-[#0969da] bg-white" : "border-black/8 bg-white/50"}`} data-posture-count={count}>
              <div className="flex justify-between gap-2 text-xs font-bold text-[#1f2328]"><span>{count === 0 ? "No bet" : `${count} initiative${count > 1 ? "s" : ""}`}</span><span>{active ? "Current" : "Option"}</span></div>
              <p className="mt-1 text-xs font-semibold text-[#0969da]">{item.label}</p>
              <p className="mt-1 text-[11px] leading-4 text-[#57606a]">{item.tradeoff}</p>
            </div>;
          })}
        </div>
      </div>
    </section>
  );
}

function CoachCard({ icon, title, text }: { icon?: ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-black/8 bg-white/65 p-3"><p className="flex items-center gap-2 text-xs font-bold text-[#1f2328]">{icon}{title}</p><p className="mt-1 text-xs leading-5 text-[#57606a]">{text}</p></div>;
}
