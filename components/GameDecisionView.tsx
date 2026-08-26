import {
  ArrowRight,
  Activity,
  BrainCircuit,
  Check,
  BookOpenCheck,
  Clock3,
  Compass,
  Info,
  X,
} from "lucide-react";
import { useState } from "react";
import AnalyticsHub, { type AnalyticsTab } from "./AnalyticsHub";
import DecisionCoach from "./DecisionCoach";
import BoardAdvisor from "./BoardAdvisor";
import type { GameInitiative, GameViewState, Metric } from "./gameViewTypes";
import { formatBudget, formatCurrency } from "../lib/currency";
import { getScenario } from "../lib/scenarios/registry";
import ScenarioProgress from "./ScenarioProgress";
import DecisionDashboardVisuals from "./DecisionDashboardVisuals";
import GameCommandHUD from "./GameCommandHUD";
import StrategySimulator from "./StrategySimulator";
import OperatingSystemControls from "./OperatingSystemControls";
import DecisionCommandRail from "./DecisionCommandRail";
import InitiativeEvolution from "./InitiativeEvolution";
import LearningRetrospective from "./LearningRetrospective";
import LLMSettings from "./LLMSettings";
import StrategyDNA from "./StrategyDNA";
import { deploymentCapacity, type Allocation } from "../lib/game/state";
import { calculateActionCapitalPlan, calculateCapitalRunway } from "../lib/game/capital";
import { validatePortfolioCapacity } from "../lib/game/capacity";
import type { InitiativeActionSet } from "../lib/game/businessModel";
import { downloadExport } from "../lib/exportGameplay";
import { useGameStore } from "../stores/gameStore";
import QuarterRoadmap from "./QuarterRoadmap";

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
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [insightDrawer, setInsightDrawer] = useState<"dna" | "evolution" | "learn" | "roadmap" | null>(null);
  const [analyticsRequest, setAnalyticsRequest] = useState<{ tab: AnalyticsTab; nonce: number } | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [accelerateConfirmOpen, setAccelerateConfirmOpen] = useState(false);
  const saveCampaign = useGameStore((store) => store.saveCampaign);
  const setInitiativeAction = useGameStore((store) => store.setInitiativeAction);
  const restoreLatestViableCheckpoint = useGameStore((store) => store.restoreLatestViableCheckpoint);
  const capacity = deploymentCapacity(
    state.campaignBudget,
    state.campaignBudgetRemaining,
    state.quarterlyBudget,
    state.q,
    state.spent,
  );
  const selectedInitiatives = initiatives.filter((initiative) => state.selected.includes(initiative.id));
  const selectedIds = selectedInitiatives.map((initiative) => initiative.id);
  const deployment = Math.min(Number(state.deploymentAmount || 0), capacity.maximumDeployment);
  const initiativeActions: InitiativeActionSet = Object.keys(state.initiativeActions || {}).length
    ? state.initiativeActions
    : Object.fromEntries(selectedIds.map((id) => [id, "scale" as const]));
  const capitalPlan = calculateActionCapitalPlan(state, initiativeActions, deployment);
  const capacityValidation = validatePortfolioCapacity(initiativeActions, state.initiativeStates, state.alloc as Allocation, scenario);
  const runway = calculateCapitalRunway(state, deployment);
  const requiresMoreDeployment = capitalPlan.requiredCapital > deployment + 1e-9;
  const portfolioFitsThisQuarter = capitalPlan.requiredCapital <= capacity.maximumDeployment + 1e-9;
  const isAccelerating = selectedInitiatives.length > 0 && deployment > capacity.recommendedAuthority + 0.05;
  const reserveExhausted = capacity.maximumDeployment <= 0.01;
  const handleConfirm = () => {
    if (isAccelerating) {
      setAccelerateConfirmOpen(true);
      return;
    }
    onConfirm();
  };
  const saveCheckpoint = () => {
    saveCampaign();
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0d1117] px-5 py-4 text-white shadow-[0_1px_0_rgba(255,255,255,.06)]">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a7f37] text-sm font-bold text-white">
              AI
            </div>
            <div>
              <p className="text-xs font-bold tracking-[.16em]">
                {scenario?.name || "PROJECT FACTORY 2030"}
              </p>
              <p className="text-xs text-white/55">Chief AI Officer cockpit</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-white/55">Campaign progress</p>
              <p className="text-sm font-bold">
                <span data-testid="campaign-quarter">Quarter {state.q}</span>{" "}
                <span className="font-normal text-white/50">of 12</span>
              </p>
            </div>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full bg-[#2da44e]"
                style={{ width: `${(state.q / 12) * 100}%` }}
              />
            </div>
            <button
              onClick={onReset}
              className="rounded-lg p-2 text-white/55 hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="grid w-full lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="order-2 min-w-0 p-5 pb-28 sm:pb-5 lg:order-2">
        <section className="flex flex-col">
          <div className="order-1 mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-[#1a7f37]">
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
          <div className="order-2">
            <GameCommandHUD state={state} metrics={metrics} />
          </div>
          <div className="order-3">
            <AnalyticsHub state={state} initiatives={initiatives} hideTrigger externalOpen={analyticsRequest} />
          </div>
          <div className={`order-5 mt-5 grid items-stretch gap-5 ${state.scenarioMode ? "2xl:grid-cols-2" : ""} lg:order-4`}>
            {state.scenarioMode && <ScenarioProgress state={state} />}
            <DecisionDashboardVisuals state={state} />
          </div>
          <div className="decision-workbench order-4 rounded-3xl border border-ink/8 bg-white p-5 lg:order-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Choose initiatives</h2>
                <p className="mt-1 text-sm text-ink/50">
                  Choose up to three bets. Discovery, piloting, and scaling are
                  all investments; choose the action for each selected bet.
                </p>
                <p className="mt-2 text-xs font-medium text-[#57606a]">Select up to three initiatives, then choose Discover, Pilot, Scale, or another lifecycle action. Discovery counts as a selected investment.</p>
              </div>
              <span className="rounded-full bg-[#dafbe1] px-3 py-1 text-xs font-bold text-[#1a7f37]">
                {state.selected.length} / 3 selected
              </span>
            </div>
            <div className="mt-4 grid gap-2 rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] p-3 text-xs sm:grid-cols-4">
              <span><b className="block text-[#57606a]">Delivery & discovery</b><strong className="mt-1 block text-base text-[#24292f]">{formatCurrency(capitalPlan.initiativeMinimum, state.currencyMode)}</strong></span>
              <span><b className="block text-[#57606a]">Run / exit commitments</b><strong className="mt-1 block text-base text-[#24292f]">{formatCurrency(capitalPlan.maintenanceSpend + Object.values(capitalPlan.byInitiative).reduce((sum, item) => sum + Number(item.retirement || 0), 0), state.currencyMode)}</strong></span>
              <span><b className="block text-[#57606a]">Campaign capital to release this quarter</b><strong className="mt-1 block text-base text-[#24292f]">{formatBudget(deployment, state.currencyMode)}</strong></span>
              <span><b className="block text-[#57606a]">Reserve available</b><strong className="mt-1 block text-base text-[#0969da]">{formatBudget(capacity.maximumDeployment, state.currencyMode)}</strong></span>
            </div>
            <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {initiatives.map((initiative) => {
                const live =
                  state.initiativeStates?.[initiative.id] || initiative;
                const selected = state.selected.includes(initiative.id);
                const maturity = (live as any).maturityLevel || "nascent";
                const funded = Number((live as any).quartersFunded || 0);
                const maturityCredits = Number((live as any).maturityCredits ?? funded);
                const evolution = Math.min(100, (maturityCredits / 6) * 100);
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
                  <article
                    key={initiative.id}
                    data-testid={`initiative-${initiative.id}`}
                    data-base-roi={Number((live as any).roi ?? initiative.roi)}
                    data-base-cost={Number(
                      (live as any).cost ?? initiative.cost,
                    )}
                    data-risk-score={riskScore}
                    data-selected={selected ? "true" : "false"}
                    className={`group relative rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] focus-visible:ring-offset-2 ${selected ? "border-[#1a7f37] bg-[#dafbe1] shadow-lg shadow-[#1a7f37]/10 ring-1 ring-[#1a7f37]/35" : "border-ink/8 bg-mist hover:-translate-y-0.5 hover:border-[#1a7f37]/55 hover:bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{initiative.name}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-ink/55">
                          {initiative.desc}
                        </p>
                      </div>
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#1a7f37] bg-[#1a7f37] text-white" : "border-ink/15 text-transparent"}`}
                      >
                        <Check size={14} />
                      </div>
                    </div>
                    <button type="button" aria-pressed={selected} aria-label={`${selected ? "Deselect" : "Select"} ${initiative.name}`} onClick={() => onToggleInitiative(initiative.id)} className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition ${selected ? "bg-[#1a7f37] text-white" : "bg-ink/5 text-ink/45 hover:bg-[#dafbe1] hover:text-[#1a7f37]"}`}>
                      <Check size={11} className={selected ? "opacity-100" : "opacity-0"} />{selected ? "Selected" : "Click to select"}
                    </button>
                    <label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-ink/45" onClick={(event) => event.stopPropagation()}>
                      This-quarter action
                      <select aria-label={`Action for ${initiative.name}`} value={state.initiativeActions?.[initiative.id] || (selectedIds.includes(initiative.id) ? "scale" : funded ? "maintain" : "discover")} onChange={(event) => setInitiativeAction(initiative.id, event.target.value as any)} className="mt-1 block w-full rounded-md border border-ink/15 bg-white px-2 py-1.5 text-xs font-bold normal-case tracking-normal text-ink">
                        <option value="discover">Discover</option><option value="pilot">Pilot</option><option value="scale">Scale</option><option value="maintain">Run / maintain</option><option value="pause">Pause</option><option value="retire">Retire</option>
                      </select>
                    </label>
                    <div
                      title={baselineTitle}
                      className="mt-4 grid grid-cols-2 gap-2 border-t border-ink/8 pt-3 text-[11px] sm:grid-cols-5"
                    >
                      <span>
                        <b className="block text-ink">
                          {formatCurrency(Number(live.currentCost ?? initiative.cost), state.currencyMode)}
                        </b>
                        <small className="text-ink/40">minimum quarterly funding</small>
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
                      <span>
                        <b className="block text-ink">{funded}</b>
                        <small className="text-ink/40">quarters invested</small>
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
                        className="h-full rounded-full bg-[#1a7f37] transition-all"
                        style={{ width: `${evolution}%` }}
                      />
                    </div>
                  </article>
                );
                })}
              </div>
              <aside className="order-last xl:sticky xl:top-24 xl:order-none" aria-label="Quarter decision configuration">
                <OperatingSystemControls state={state} onAllocationChange={onAllocationChange} onDeploymentChange={onDeploymentChange} compact />
              </aside>
              <section className="xl:col-span-2 rounded-2xl border border-[#8c959f] bg-[#eef1f3] p-4" aria-label="Decision outcome preview">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#1a7f37]">Before you commit</p>
                    <h3 className="mt-1 text-base font-bold text-[#24292f]">What this decision will do</h3>
                  </div>
                  <span className="rounded-full border border-[#8c959f] bg-white px-2 py-1 text-[10px] font-bold text-[#57606a]">{selectedInitiatives.length || 0} active · {formatBudget(capitalPlan.requiredCapital, state.currencyMode)} required</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-[#d0d7de] bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#57606a]">Selected actions</p><p className="mt-1 text-sm font-bold text-[#24292f]">{selectedInitiatives.length ? selectedInitiatives.map((item) => `${item.name}: ${state.initiativeActions?.[item.id] || 'scale'}`).join(' · ') : 'Observation quarter'}</p></div>
                  <div className="rounded-xl border border-[#d0d7de] bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#57606a]">Delivery / discovery</p><p className="mt-1 text-sm font-bold text-[#24292f]">{formatBudget(capitalPlan.initiativeMinimum, state.currencyMode)}</p><p className="mt-1 text-[10px] text-[#57606a]">Discovery uses 10% of an initiative&apos;s current cost.</p></div>
                  <div className="rounded-xl border border-[#d0d7de] bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#57606a]">Capital runway</p><p className="mt-1 text-sm font-bold text-[#24292f]">{formatBudget(Math.max(0, state.campaignBudgetRemaining - deployment), state.currencyMode)} after release</p><p className="mt-1 text-[10px] text-[#57606a]">Unused reserve carries forward.</p></div>
                  <div className="rounded-xl border border-[#d0d7de] bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#57606a]">Trade-off</p><p className="mt-1 text-sm font-bold text-[#24292f]">{selectedInitiatives.length === 3 ? 'Broader portfolio' : selectedInitiatives.length === 2 ? 'Focused balance' : selectedInitiatives.length === 1 ? 'Deep focus' : 'Preserve capacity'}</p><p className="mt-1 text-[10px] text-[#57606a]">More bets increase breadth; fewer bets concentrate capability.</p></div>
                </div>
              </section>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-ink/45">
              <Info size={13} /> Values shown are current operating conditions.
              Funding changes the initiative over time. Hover a metric row to
              compare against its campaign baseline.
            </p>
            {capacityValidation.issues.length > 0 && <p role="status" className="mt-3 rounded-xl bg-[#ffebe9] px-3 py-2 text-xs font-bold text-[#cf222e]">{capacityValidation.issues[0]?.message || "This action plan exceeds available operating capacity."}</p>}
            {!capacityValidation.issues.length && Object.values(capacityValidation.gates).some((gate) => gate.status !== "ready") && <p className="mt-3 rounded-xl bg-[#fff8c5] px-3 py-2 text-xs font-medium text-[#57606a]">Experiment mode: this portfolio has readiness gaps. You can proceed, but results will be slower and riskier—then capture what you learned in the quarter log.</p>}
          </div>
          <div className="order-6 mt-5 flex flex-col items-end gap-3">
            {requiresMoreDeployment && (
              <div className="w-full rounded-2xl border border-[#bf8700]/35 bg-[#fff8c5] p-3 text-left sm:max-w-2xl">
                <p className="text-sm font-bold text-[#24292f]">Your selected plan needs {formatBudget(capitalPlan.requiredCapital, state.currencyMode)} this quarter.</p>
                <p className="mt-1 text-xs leading-5 text-[#57606a]">This includes {formatBudget(capitalPlan.initiativeMinimum, state.currencyMode)} for the selected initiatives and {formatBudget(capitalPlan.maintenanceSpend, state.currencyMode)} to continue earlier work. You have released {formatBudget(deployment, state.currencyMode)}. {portfolioFitsThisQuarter ? 'Increase the release to fund this plan, or edit the portfolio.' : `The plan exceeds the remaining campaign reserve of ${formatBudget(capacity.maximumDeployment, state.currencyMode)}; choose fewer initiatives or restore a checkpoint.`}</p>
                {portfolioFitsThisQuarter && <button type="button" onClick={() => onDeploymentChange(Number(capitalPlan.requiredCapital.toFixed(1)))} className="mt-3 rounded-lg bg-[#24292f] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#0969da]">Fund this plan</button>}
              </div>
            )}
            {(state.feedback.startsWith("This portfolio needs") || state.feedback.startsWith("This lifecycle plan")) && <p role="status" className="w-full rounded-xl bg-[#ffebe9] px-3 py-2 text-right text-xs font-bold text-[#cf222e]">{state.feedback}</p>}
            {reserveExhausted && (
              <div className="w-full rounded-2xl border border-[#bf8700]/35 bg-[#fff8c5] p-4 text-left sm:max-w-2xl">
                <p className="text-sm font-bold text-[#24292f]">Campaign reserve exhausted.</p>
                <p className="mt-1 text-xs leading-5 text-[#57606a]">You can still run an observation quarter with no new funding. It will show how previously funded work holds up under neglect. Or return to a saved decision point and revise your capital pace.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => restoreLatestViableCheckpoint()} className="rounded-lg border border-[#bf8700]/50 bg-white px-3 py-2 text-xs font-bold text-[#24292f]">Restore checkpoint</button>
                  <button type="button" onClick={() => { if (window.confirm("Restart this campaign? Your current campaign record will be cleared.")) onReset(); }} className="rounded-lg border border-[#cf222e]/30 bg-white px-3 py-2 text-xs font-bold text-[#cf222e]">Restart campaign</button>
                </div>
              </div>
            )}
            {!reserveExhausted && (
              <p className={`w-full rounded-xl border px-3 py-2 text-xs leading-5 sm:max-w-2xl ${runway.depletionQuarter ? "border-[#bf8700]/35 bg-[#fff8c5] text-[#57606a]" : "border-[#b8d8c0] bg-[#f2f8f3] text-[#176b36]"}`}>
                <b className="text-[#24292f]">Capital runway:</b> {runway.message}
              </p>
            )}
            <button
              disabled={total !== 100 || requiresMoreDeployment}
              onClick={handleConfirm}
              className="flex items-center gap-3 rounded-xl bg-[#1a7f37] px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0969da] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {state.selected.length === 0 ? "Continue without funding" : "Confirm decisions"} <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </div>
      <DecisionCommandRail quarter={state.q} onAdvisor={() => setAdvisorOpen(true)} onCoach={() => setCoachOpen(true)} onSimulator={() => setSimulatorOpen(true)} onDNA={() => setInsightDrawer("dna")} onEvolution={() => setInsightDrawer("evolution")} onLearn={() => setInsightDrawer("learn")} onAnalytics={() => setAnalyticsRequest({ tab: "dashboard", nonce: Date.now() })} onRoadmap={() => setInsightDrawer("roadmap")} onSave={saveCheckpoint} onExportSummary={() => downloadExport(state, "txt")} onExportFull={() => downloadExport(state, "md")} onExportMetrics={() => downloadExport(state, "csv")} onReset={() => { if (window.confirm("Reset this campaign and return to setup?")) onReset(); }} />
      </div>
      {savedNotice && <div role="status" className="fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-[#2da44e] bg-[#dafbe1] px-4 py-2 text-xs font-bold text-[#1a7f37] shadow-lg">Campaign checkpoint saved</div>}
      {accelerateConfirmOpen && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#0d1117]/60 p-4 backdrop-blur-sm" role="presentation" onClick={() => setAccelerateConfirmOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="accelerate-capital-title" className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#161b22] p-6 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}><p className="text-xs font-bold uppercase tracking-[.18em] text-[#7ee787]">Capital pace check</p><h2 id="accelerate-capital-title" className="mt-2 text-2xl font-bold">Release future capital now?</h2><p className="mt-3 text-sm leading-6 text-white/70">You are releasing {formatBudget(deployment, state.currencyMode)}, above the recommended pace of {formatBudget(capacity.recommendedAuthority, state.currencyMode)}. This is allowed. It creates earlier delivery intensity but shortens the capital runway.</p><div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><div className="flex justify-between"><span className="text-white/60">Acceleration / scale-up</span><b>{formatBudget(capitalPlan.accelerationSpend, state.currencyMode)}</b></div><p className="mt-2 text-xs leading-5 text-white/55">{runway.message}</p></div><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setAccelerateConfirmOpen(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold text-white/80">Edit plan</button><button type="button" onClick={() => { setAccelerateConfirmOpen(false); onConfirm(); }} className="rounded-lg bg-[#2da44e] px-4 py-2 text-sm font-bold text-white">Accelerate deliberately</button></div></section></div>}
      {coachOpen && <div className="command-overlay fixed inset-0 z-40" onClick={() => setCoachOpen(false)}><aside role="dialog" aria-label="Quarter coach" onClick={(event) => event.stopPropagation()} className="command-sidecar command-sidecar-scroll absolute bottom-0 left-0 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl p-4 lg:bottom-auto lg:left-64 lg:top-0 lg:h-full lg:max-h-none lg:w-[560px] lg:max-w-[560px] lg:rounded-none lg:rounded-r-3xl"><div className="command-sidecar-header mb-3 flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Compass size={15} /> Quarter coach</p><button type="button" onClick={() => setCoachOpen(false)} aria-label="Close quarter coach" className="command-icon-button rounded-lg p-2"><X size={16}/></button></div><DecisionCoach state={state} initiatives={initiatives} /></aside></div>}
      {advisorOpen && <div className="command-overlay fixed inset-0 z-40" onClick={() => setAdvisorOpen(false)}><aside role="dialog" aria-label="Board advisor" onClick={(event) => event.stopPropagation()} className="command-sidecar command-sidecar-scroll absolute bottom-0 left-0 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl p-4 lg:bottom-auto lg:left-64 lg:top-0 lg:h-full lg:max-h-none lg:w-[430px] lg:max-w-[430px] lg:rounded-none lg:rounded-r-3xl"><div className="command-sidecar-header mb-3 flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><BrainCircuit size={15} /> Board advisor</p><button type="button" onClick={() => setAdvisorOpen(false)} aria-label="Close board advisor" className="command-icon-button rounded-lg p-2"><X size={16}/></button></div><BoardAdvisor context={state} persona={persona as "CFO" | "CTO" | "CHRO" | "RISK"} answer={answer} question={question} isAsking={isAsking} onPersonaChange={onPersonaChange as (persona: "CFO" | "CTO" | "CHRO" | "RISK") => void} onQuestionChange={onQuestionChange} onAsk={onAsk} /></aside></div>}
      {insightDrawer && <div className="command-overlay fixed inset-0 z-50" onClick={() => setInsightDrawer(null)}><aside role="dialog" aria-label={insightDrawer === "dna" ? "Strategy DNA" : insightDrawer === "evolution" ? "Initiative evolution" : insightDrawer === "roadmap" ? "Campaign roadmap" : "Learning loop"} onClick={(event) => event.stopPropagation()} className="command-sidecar absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col"><header className="command-sidecar-header flex items-center justify-between border-b p-4 sm:p-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em]">Evidence tools</p><h2 className="mt-1 text-xl font-bold">{insightDrawer === "dna" ? "Strategy DNA" : insightDrawer === "evolution" ? "Initiative evolution" : insightDrawer === "roadmap" ? "Campaign roadmap" : "Learning loop"}</h2></div><button type="button" onClick={() => setInsightDrawer(null)} aria-label="Close insight drawer" className="command-icon-button rounded-lg p-2"><X size={18}/></button></header><div className="flex-1 overflow-y-auto p-4 sm:p-5">{insightDrawer === "dna" && <StrategyDNA state={state}/>} {insightDrawer === "evolution" && <InitiativeEvolution state={state} initiatives={initiatives}/>} {insightDrawer === "roadmap" && <QuarterRoadmap state={state}/>} {insightDrawer === "learn" && <div className="space-y-5"><div className="command-panel rounded-xl p-5"><BookOpenCheck className="text-[#7ee787]"/><h3 className="mt-3 text-xl font-bold">Reflect, replay, improve</h3><p className="mt-2 text-sm leading-6 text-white/60">Compare the decision you made with the evidence it created, then use that lesson to make the next quarter more deliberate.</p><p className="mt-4 text-3xl font-bold">Q{state.q}<span className="text-sm font-normal text-white/45"> / 12</span></p></div><LearningRetrospective state={state}/><details className="command-panel rounded-xl p-4"><summary className="cursor-pointer text-sm font-bold">Advisor settings</summary><p className="mt-2 text-[10px] text-white/45">Optional advisor configuration. It never changes the measured simulation outcomes.</p><div className="mt-3"><LLMSettings/></div></details></div>}</div></aside></div>}
      {simulatorOpen && <StrategySimulator state={state} initiatives={initiatives} onClose={() => setSimulatorOpen(false)} />}
    </>
  );
}
