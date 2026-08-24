import {
  ArrowRight,
  Check,
  Clock3,
  Info,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import AnalyticsHub from "./AnalyticsHub";
import DecisionPreview from "./DecisionPreview";
import DecisionCoach from "./DecisionCoach";
import BoardAdvisor from "./BoardAdvisor";
import type { GameInitiative, GameViewState, Metric } from "./gameViewTypes";
import { formatBudget, formatCurrency } from "../lib/currency";
import { getScenario } from "../lib/scenarios/registry";
import ScenarioProgress from "./ScenarioProgress";

interface Props {
  state: GameViewState;
  initiatives: GameInitiative[];
  metrics: Metric[];
  total: number;
  persona: string;
  answer: string;
  question: string;
  isAsking: boolean;
  onPersonaChange: (persona: string) => void;
  onQuestionChange: (question: string) => void;
  onAsk: (questionOverride?: string) => void;
  onToggleInitiative: (id: string) => void;
  onAllocationChange: (key: string, value: number) => void;
  onDeploymentChange: (amount: number) => void;
  onConfirm: () => void;
  onReset: () => void;
}

export default function GameDecisionView({
  state,
  initiatives,
  metrics,
  total,
  persona,
  answer,
  question,
  isAsking,
  onPersonaChange,
  onQuestionChange,
  onAsk,
  onToggleInitiative,
  onAllocationChange,
  onDeploymentChange,
  onConfirm,
  onReset,
}: Props) {
  const scenario = state.scenarioMode ? getScenario(state.scenarioId) : undefined;
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-ink/8 bg-white/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-sm font-bold text-gold">
              AI
            </div>
            <div>
              <p className="text-xs font-bold tracking-[.16em]">
                {scenario?.name || "PROJECT FACTORY 2030"}
              </p>
              <p className="text-xs text-ink/45">Chief AI Officer cockpit</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-ink/45">Campaign progress</p>
              <p className="text-sm font-bold">
                <span data-testid="campaign-quarter">Quarter {state.q}</span>{" "}
                <span className="font-normal text-ink/40">of 12</span>
              </p>
            </div>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full bg-gold"
                style={{ width: `${(state.q / 12) * 100}%` }}
              />
            </div>
            <button
              onClick={onReset}
              className="rounded-lg p-2 text-ink/40 hover:bg-ink/5"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1500px] gap-5 p-5 pb-28 sm:pb-5 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-gold">
                Decision window
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">
                Allocate the next quarter.
              </h1>
              <p className="mt-2 text-sm text-ink/50">
                Choose the bets that fit the organisation you are building.
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-ink/8 bg-white px-4 py-3 text-xs text-ink/50 sm:flex">
              <Clock3 size={15} /> Self-paced mode
            </div>
          </div>
          <DecisionCoach state={state} initiatives={initiatives} />
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-ink/8 bg-white p-4"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {metric.value.toFixed(metric.label === "ROI" ? 1 : 0)}
                  {metric.unit}
                </p>
                <div
                  className={`mt-3 h-1.5 rounded-full bg-${metric.color}/15`}
                >
                  <div
                    className={`h-full rounded-full bg-${metric.color}`}
                    style={{ width: `${Math.min(100, metric.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <DecisionPreview state={state} initiatives={initiatives} />
          {state.scenarioMode && <ScenarioProgress state={state} />}
          <div className="rounded-3xl border border-ink/8 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Choose initiatives</h2>
                <p className="mt-1 text-sm text-ink/50">
                  Fund up to three bets. Their capability and risk will evolve
                  as you invest.
                </p>
              </div>
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-ink">
                {state.selected.length} / 3 selected
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {initiatives.map((initiative) => {
                const live =
                  state.initiativeStates?.[initiative.id] || initiative;
                const selected = state.selected.includes(initiative.id);
                const maturity = (live as any).maturityLevel || "nascent";
                const funded = Number((live as any).quartersFunded || 0);
                const evolution = Math.min(100, (funded / 6) * 100);
                const riskScore = Number(
                  (live as any).riskScore ??
                    ((live as any).currentRisk === "LOW"
                      ? 24
                      : (live as any).currentRisk === "HIGH"
                        ? 72
                        : 48),
                );
                const baseRiskScore = Number(
                  (live as any).baseRiskScore ?? riskScore,
                );
                const riskDelta = riskScore - baseRiskScore;
                const discoveredLink = (state.discoveredSynergies || []).some(
                  (key) => key.split(":").includes(initiative.id),
                );
                const baselineTitle = `Campaign baseline: $${Number((live as any).baseCost ?? initiative.cost).toFixed(2)}M · ROI ${Number((live as any).baseRoi ?? initiative.roi).toFixed(0)}% · Data ${Number((live as any).baseData ?? initiative.data).toFixed(1)}/5 · Risk ${baseRiskScore.toFixed(0)}/100`;
                const currentRoi = Number((live as any).currentRoi ?? (live as any).roi ?? initiative.roi);
                const currentData = Number((live as any).currentData ?? (live as any).data ?? initiative.data);
                const baseRoi = Number((live as any).baseRoi ?? initiative.roi);
                const baseData = Number((live as any).baseData ?? initiative.data);
                return (
                  <button
                    key={initiative.id}
                    data-testid={`initiative-${initiative.id}`}
                    data-base-roi={Number((live as any).roi ?? initiative.roi)}
                    data-base-cost={Number(
                      (live as any).cost ?? initiative.cost,
                    )}
                    data-risk-score={riskScore}
                    data-selected={selected ? "true" : "false"}
                    onClick={() => onToggleInitiative(initiative.id)}
                    className={`group rounded-2xl border p-4 text-left transition ${selected ? "border-gold bg-gold/8 shadow-lg shadow-gold/10" : "border-ink/8 bg-mist hover:border-ink/20"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{initiative.name}</p>
                        <p className="mt-2 text-xs leading-5 text-ink/55">
                          {initiative.desc}
                        </p>
                      </div>
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-gold bg-gold text-ink" : "border-ink/15 text-transparent"}`}
                      >
                        <Check size={14} />
                      </div>
                    </div>
                    <div
                      title={baselineTitle}
                      className="mt-5 grid grid-cols-2 gap-2 border-t border-ink/8 pt-3 text-xs sm:grid-cols-4"
                    >
                      <span>
                        <b className="block text-ink">
                          {formatCurrency(Number(live.currentCost ?? initiative.cost), state.currencyMode)}
                        </b>
                        <small className="text-ink/40">investment</small>
                      </span>
                      <span>
                        <b className="block text-emerald">
                          {currentRoi.toFixed(0)}%
                          {currentRoi === baseRoi ? "" : ` ${currentRoi > baseRoi ? "↑" : "↓"}${Math.abs(currentRoi - baseRoi).toFixed(0)}`}
                        </b>
                        <small className="text-ink/40">current ROI</small>
                      </span>
                      <span>
                        <b className="block text-ink">
                          {currentData.toFixed(1)}/5
                          {currentData === baseData ? "" : ` ${currentData > baseData ? "↑" : "↓"}${Math.abs(currentData - baseData).toFixed(1)}`}
                        </b>
                        <small className="text-ink/40">data ready</small>
                      </span>
                      <span>
                        <b
                          className={`block ${riskDelta <= 0 ? "text-emerald" : "text-crimson"}`}
                        >
                          {(live as any).currentRisk ?? initiative.risk} ·{" "}
                          {riskScore.toFixed(0)}
                          {riskDelta === 0
                            ? ""
                            : riskDelta > 0
                              ? ` ↑${riskDelta.toFixed(0)}`
                              : ` ↓${Math.abs(riskDelta).toFixed(0)}`}
                        </b>
                        <small className="text-ink/40">delivery risk</small>
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink/45">
                      <span>
                        {maturity}
                        {discoveredLink ? " · connected capability" : ""}
                      </span>
                      <span>
                        {funded
                          ? `${funded} quarter${funded === 1 ? "" : "s"} funded`
                          : "New capability"}
                      </span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full rounded-full bg-gold transition-all"
                        style={{ width: `${evolution}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-ink/45">
              <Info size={13} /> Values shown are current operating conditions.
              Funding changes the initiative over time. Hover a metric row to
              compare against its campaign baseline.
            </p>
          </div>
          <div className="mt-5 rounded-3xl border border-ink/8 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Balance the operating system
                </h2>
                <p className="mt-1 text-sm text-ink/50">
                  Campaign purse: {formatBudget(state.campaignBudget || (state.quarterlyBudget || 10) * 12, state.currencyMode)}
                  <span className="ml-2 text-emerald">· {formatBudget(state.campaignBudgetRemaining ?? state.quarterlyBudget * 12, state.currencyMode)} remaining</span>
                  <span className="ml-2 text-ink/40">· pace {formatBudget(state.quarterlyBudget || 10, state.currencyMode)} / quarter</span>
                </p>
              </div>
              <span
                className={`text-sm font-bold ${total === 100 ? "text-emerald" : "text-crimson"}`}
              >
                {total}% allocated
              </span>
            </div>
            <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
              {Object.entries(state.alloc).map(([key, value]) => (
                <label key={key} className="block">
                  <div className="mb-2 flex justify-between text-xs font-bold">
                    <span className="capitalize">
                      {key === "mlops" ? "Ops & Maintenance" : key}
                    </span>
                    <span className="text-ink/45">
                      {value}% · {formatCurrency((value / 100) * (state.deploymentAmount || 0), state.currencyMode)}
                    </span>
                  </div>
                  <input
                    data-testid={`allocation-${key}`}
                    type="range"
                    min="5"
                    max="50"
                    value={value}
                    onChange={(event) =>
                      onAllocationChange(key, Number(event.target.value))
                    }
                    className="w-full accent-[#D4AF37]"
                  />
                </label>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink/55">Deploy this quarter</p>
                  <p className="mt-1 text-xs leading-5 text-ink/55">The quarterly pace is a guide, not a target. A 60% starting pace preserves room to learn before committing the full reserve.</p>
                </div>
                <b className="text-sm text-ink">{formatBudget(state.deploymentAmount || 0, state.currencyMode)}</b>
              </div>
              <input data-testid="deployment-amount" aria-label="Deploy this quarter" type="range" min="0" max={Math.max(0, state.quarterlyDeploymentCap || state.quarterlyBudget || 0)} step="0.1" value={Math.min(state.deploymentAmount || 0, state.quarterlyDeploymentCap || state.quarterlyBudget || 0)} onChange={(event) => onDeploymentChange(Number(event.target.value))} className="mt-4 w-full accent-[#D4AF37]" />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink/45"><span>Reserve all</span><span>Suggested starting pace (60%): {formatBudget((state.quarterlyBudget || 0) * 0.6, state.currencyMode)}</span><span>Cap: {formatBudget(state.quarterlyDeploymentCap || 0, state.currencyMode)}</span></div>
              <button type="button" onClick={() => onDeploymentChange(Number(((state.quarterlyBudget || 0) * 0.6).toFixed(1)))} className="mt-3 rounded-lg border border-gold/40 bg-white/70 px-3 py-2 text-[11px] font-bold text-ink hover:bg-white">Use 60% suggestion</button>
              <p className="mt-2 text-[11px] text-ink/45">Unused campaign capital carries forward. Selected initiatives still need to fit within this deployment amount.</p>
            </div>
            {total !== 100 && (
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-crimson/8 px-3 py-2 text-xs font-bold text-crimson">
                <Info size={14} /> Rebalance allocations to exactly 100% before
                confirming.
              </p>
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <button
              disabled={state.selected.length === 0 || total !== 100}
              onClick={onConfirm}
              className="flex items-center gap-3 rounded-xl bg-ink px-6 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              Confirm decisions <ArrowRight size={17} />
            </button>
          </div>
        </section>
        <aside className="space-y-5">
          <BoardAdvisor
            context={state}
            persona={persona as "CFO" | "CTO" | "CHRO" | "RISK"}
            answer={answer}
            question={question}
            isAsking={isAsking}
            onPersonaChange={onPersonaChange as (persona: "CFO" | "CTO" | "CHRO" | "RISK") => void}
            onQuestionChange={onQuestionChange}
            onAsk={onAsk}
          />
          <div className="rounded-3xl border border-ink/8 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={17} className="text-gold" />
              <h2 className="font-bold">Board signals</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex gap-2 text-ink/60">
                <TrendingUp size={15} className="mt-1 shrink-0 text-emerald" />
                People allocation is {state.alloc.people}%.{" "}
                {state.alloc.people < 15
                  ? "Adoption risk is rising."
                  : "This is protecting value realization."}
              </p>
              <p className="flex gap-2 text-ink/60">
                <Wallet size={15} className="mt-1 shrink-0 text-gold" />
                Campaign spend is {formatCurrency(state.spent, state.currencyMode)}. Keep the
                portfolio intentional.
              </p>
              <p className="flex gap-2 text-ink/60">
                <Users size={15} className="mt-1 shrink-0 text-purple-500" />
                Employee satisfaction is {state.satisfaction.toFixed(0)}%.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-ink/8 bg-white p-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={17} className="text-gold" />
              <h2 className="font-bold">Campaign notes</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/55">
              Capabilities compound when funded consistently. Watch the maturity
              signals and adjust before a weak foundation becomes a crisis.
            </p>
          </div>
        </aside>
      </div>
      <AnalyticsHub state={state} initiatives={initiatives} />
    </>
  );
}
