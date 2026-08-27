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
import { deploymentCapacity, type Allocation, type InitiativeAllocationMode } from "../lib/game/state";
import { calculateActionCapitalPlan, calculateCapitalRunway } from "../lib/game/capital";
import { validatePortfolioCapacity } from "../lib/game/capacity";
import type { InitiativeAction, InitiativeActionSet } from "../lib/game/businessModel";
import { lifecycleActionError, suggestedLifecycleAction } from "../lib/game/lifecycleResolver";
import { allocationForInitiative, allocationTotal, derivePortfolioAllocation, OPERATING_ALLOCATION_KEYS } from "../lib/game/initiativeAllocation";
import { fundingIntensityFor } from "../lib/game/effectResolver";
import { downloadExport } from "../lib/exportGameplay";
import { useGameStore } from "../stores/gameStore";
import QuarterRoadmap from "./QuarterRoadmap";

const investmentActions = new Set(["discover", "pilot", "scale", "maintain", "retire"]);
function completedInvestmentQuarters(state: any, initiativeId: string): number {
  const persisted = Number(state.initiativeStates?.[initiativeId]?.quartersInvested);
  if (Number.isFinite(persisted)) return Math.max(0, persisted);
  const history = Array.isArray(state.history) ? state.history : [];
  return history.filter((snapshot: any, index: number) => {
    const action = snapshot.initiativeActions?.[initiativeId];
    if (investmentActions.has(action)) return true;
    const current = Number(snapshot.initiativeStates?.[initiativeId]?.totalInvestment || 0);
    const previous = Number(history[index - 1]?.initiativeStates?.[initiativeId]?.totalInvestment || 0);
    return current > previous;
  }).length;
}

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
  onInitiativeAllocationModeChange: (mode: InitiativeAllocationMode) => void;
  onInitiativeAllocationChange: (initiativeId: string, key: string, value: number) => void;
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
  onInitiativeAllocationModeChange,
  onInitiativeAllocationChange,
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
  const [advancedAllocationOpen, setAdvancedAllocationOpen] = useState(false);
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
  const suggestedAction = (id: string, funded = 0): InitiativeAction => {
    const initiative = state.initiativeStates?.[id];
    if (state.scenarioMode && initiative) return suggestedLifecycleAction(initiative, state.q);
    return funded ? "maintain" : "scale";
  };
  const actionFor = (id: string, funded = 0): InitiativeAction => state.initiativeActions?.[id]
    || (selectedIds.includes(id) ? suggestedAction(id, funded) : funded ? "maintain" : "discover");
  const actionLabel = (action: InitiativeAction) => ({
    discover: "Discover",
    pilot: "Pilot",
    scale: "Scale",
    maintain: "Run / maintain",
    pause: "Pause",
    retire: "Retire",
  }[action]);
  const actionNarrative = (action: InitiativeAction) => ({
    discover: "Build evidence and data readiness now. This does not create operating ROI yet.",
    pilot: "Run a bounded test now. Use the evidence to decide whether to scale next.",
    scale: "Put a validated capability into wider operational use this quarter.",
    maintain: "Protect the value already in operation while monitoring performance and risk.",
    pause: "No new investment this quarter. Revisit, revise, or retire next quarter.",
    retire: "Close this capability and stop further operating investment.",
  }[action]);
  const actionNextStep = (action: InitiativeAction) => ({
    discover: "pilot once the evidence period is complete",
    pilot: "review the pilot evidence before scaling",
    scale: "run and monitor the capability",
    maintain: "monitor performance and risk before changing course",
    pause: "revisit, revise, or retire the approach next quarter",
    retire: "review the closed capability in the campaign report",
  }[action]);
  const availableActionsFor = (live: any, currentAction: InitiativeAction) => {
    const actions: InitiativeAction[] = ["discover", "pilot", "scale", "maintain", "pause", "retire"];
    return actions.map((action) => ({
      action,
      label: actionLabel(action),
      reason: state.scenarioMode && live ? lifecycleActionError(live, action, state.q) : undefined,
      current: action === currentAction,
    }));
  };
  const initiativeActions: InitiativeActionSet = Object.keys(state.initiativeActions || {}).length
    ? state.initiativeActions
    : Object.fromEntries(selectedIds.map((id) => [id, actionFor(id)]));
  const lifecycleIssues = state.scenarioMode ? selectedInitiatives.flatMap((initiative) => {
    const live = state.initiativeStates?.[initiative.id];
    if (!live) return [];
    const action = actionFor(initiative.id, Number(live.quartersFunded || 0));
    const reason = lifecycleActionError(live, action, state.q);
    if (!reason) return [];
    const suggested = suggestedAction(initiative.id, Number(live.quartersFunded || 0));
    const reviewMustBeCompleted = live.aiLifecycle?.stage === "evaluate" || live.aiLifecycle?.stage === "deploy";
    return [{ id: initiative.id, name: initiative.name, action, reason, suggestedAction: !reviewMustBeCompleted && suggested !== action ? suggested : undefined }];
  }) : [];
  const lifecycleBriefs = selectedInitiatives.flatMap((initiative) => {
    const live = state.initiativeStates?.[initiative.id];
    if (!live) return [];
    const action = actionFor(initiative.id, Number(live.quartersFunded || 0));
    const stage = String(live.aiLifecycle?.stage || live.lifecycle || "data_readiness").replaceAll("_", " ");
    const issue = lifecycleIssues.find((item) => item.id === initiative.id);
    const effectByAction: Record<InitiativeAction, string> = {
      discover: "Build readiness and evidence; no operating value is claimed yet.",
      pilot: "Run a bounded trial and collect evidence for the next decision.",
      scale: "Expand a validated capability into operations.",
      maintain: "Keep the capability running while monitoring performance and risk.",
      pause: "Pause active change and preserve the option to revise the approach.",
      retire: "Close the capability and stop further operating investment.",
    };
    return [{ id: initiative.id, name: initiative.name, action, stage, issue, effect: effectByAction[action] }];
  });
  const capitalPlan = calculateActionCapitalPlan(state, initiativeActions, deployment);
  const effectiveAllocation = derivePortfolioAllocation(state.alloc, state.initiativeAllocationMode, state.initiativeAllocations, capitalPlan.byInitiative);
  const unbalancedInitiatives = state.initiativeAllocationMode === 'custom'
    ? selectedInitiatives.filter((initiative) => allocationTotal(allocationForInitiative(initiative.id, 'custom', state.initiativeAllocations, state.alloc)) !== 100)
    : [];
  const operatingMixTotal = state.initiativeAllocationMode === 'custom'
    ? Math.round(Object.values(effectiveAllocation).reduce((sum, value) => sum + Number(value || 0), 0))
    : total;
  const capacityValidation = validatePortfolioCapacity(initiativeActions, state.initiativeStates, effectiveAllocation as Allocation, scenario);
  const capacityIssue = capacityValidation.issues[0];
  const capacityGuidance = capacityIssue
    ? capacityIssue.code === 'DATA_CAPACITY'
        ? 'Increase the Data allocation or reduce the number of initiatives doing discovery, pilot, or scale work this quarter.'
        : capacityIssue.code === 'GOVERNANCE_CAPACITY'
          ? 'Increase the Compliance allocation or reduce concurrent initiatives requiring governance review.'
          : capacityIssue.code === 'CHANGE_CAPACITY'
            ? 'Increase the People allocation or reduce concurrent change commitments.'
            : 'Increase People capacity or reduce the number of initiatives delivering work this quarter.'
    : '';
  const shiftAllocation = (allocation: Allocation, target: 'people' | 'compliance' | 'data', points: number): Allocation => {
    const next = { ...allocation };
    let remaining = Math.max(0, Math.round(points));
    const sources: (keyof Allocation)[] = target === 'people' ? ['infra', 'innovation', 'data', 'mlops', 'compliance'] : target === 'data' ? ['infra', 'innovation', 'mlops', 'people', 'compliance'] : ['infra', 'innovation', 'data', 'mlops', 'people'];
    sources.forEach((source) => {
      if (!remaining) return;
      const room = Math.max(0, Math.round(Number(next[source] || 0) - 5));
      const moved = Math.min(remaining, room, Math.max(0, 50 - Math.round(Number(next[target] || 0))));
      next[source] = Number(next[source] || 0) - moved;
      next[target] = Number(next[target] || 0) + moved;
      remaining -= moved;
    });
    return next;
  };
  const makePlanExecutable = () => {
    if (!capacityIssue) return;
    const gap = Math.max(0, capacityIssue.demand - capacityIssue.available);
    const target: keyof Allocation = capacityIssue.code === 'DATA_CAPACITY'
      ? 'data'
      : capacityIssue.code === 'GOVERNANCE_CAPACITY'
        ? 'compliance'
        : 'people';
    const points = Math.ceil(gap * (target === 'compliance' ? 8 : 10));
    if (state.initiativeAllocationMode === 'custom') {
      const briefsToAdjust = initiativeFundingBriefs;
      briefsToAdjust.forEach((brief) => {
        const current = allocationForInitiative(brief.initiative.id, 'custom', state.initiativeAllocations, state.alloc);
        const next = shiftAllocation(current, target, points);
        const moved = Math.max(0, Number(next[target]) - Number(current[target]));
        if (!moved) return;
        OPERATING_ALLOCATION_KEYS.forEach((key) => {
          if (next[key] !== current[key]) onInitiativeAllocationChange(brief.initiative.id, key, next[key]);
        });
      });
    } else {
      const next = shiftAllocation(state.alloc, target, points);
      OPERATING_ALLOCATION_KEYS.forEach((key) => { if (next[key] !== state.alloc[key]) onAllocationChange(key, next[key]); });
    }
  };
  const deliveryBase = selectedInitiatives.reduce((sum, initiative) => {
    const action = actionFor(initiative.id, Number(state.initiativeStates?.[initiative.id]?.quartersFunded || 0));
    return sum + (action === 'pilot' || action === 'scale' ? Number(state.initiativeStates?.[initiative.id]?.currentCost || initiative.cost || 0) : 0);
  }, 0);
  const planIntensity = fundingIntensityFor(capitalPlan.deliveryCapital, deliveryBase);
  const allocationLabel: Record<keyof Allocation, string> = { infra: 'Infrastructure', data: 'Data', people: 'People', mlops: 'Ops & maintenance', compliance: 'Compliance', innovation: 'Innovation' };
  const initiativeFundingBriefs = selectedInitiatives.map((initiative) => {
    const live = state.initiativeStates?.[initiative.id];
    const action = actionFor(initiative.id, Number(live?.quartersFunded || 0));
    const funding = capitalPlan.byInitiative?.[initiative.id] || { discovery: 0, delivery: 0, scaleUp: 0, run: 0, retirement: 0, total: 0 };
    const allocation = allocationForInitiative(initiative.id, state.initiativeAllocationMode, state.initiativeAllocations, state.alloc);
    const directEffects = action === 'discover'
      ? [`Data asset +${((.04 + allocation.data / 110) * planIntensity).toFixed(2)}/5. Discovery builds evidence; it does not claim operating value yet.`]
      : action === 'pilot' || action === 'scale'
        ? [
            `Data asset +${((.05 + allocation.data / 100) * planIntensity).toFixed(2)}/5`,
            `Change readiness +${(allocation.people / 500 * planIntensity).toFixed(2)}`,
            `Control maturity +${(allocation.compliance / 1000 * planIntensity).toFixed(2)}`,
            `Technical debt −${(allocation.mlops / 20).toFixed(2)}`,
          ]
        : action === 'maintain'
          ? [`Run funding preserves realised benefit. The tailored mix supports people, controls, and monitoring: ${allocation.people}% people, ${allocation.compliance}% compliance, ${allocation.mlops}% ops.`]
          : action === 'pause'
            ? ['No positive delivery effect this quarter. Pausing preserves the option to adapt, while readiness and benefit can decay.']
            : ['No further operating investment. Retirement closes the capability and stops ongoing delivery work.'];
    return { initiative, action, funding, allocation, directEffects };
  });
  const runway = calculateCapitalRunway(state, deployment);
  const requiresMoreDeployment = capitalPlan.requiredCapital > deployment + 1e-9;
  const portfolioFitsThisQuarter = capitalPlan.requiredCapital <= capacity.maximumDeployment + 1e-9;
  const isAccelerating = selectedInitiatives.length > 0 && deployment > capacity.recommendedAuthority + 0.05;
  const reserveExhausted = capacity.maximumDeployment <= 0.01;
  const importantFeedback = state.feedback.startsWith("This portfolio needs")
    || state.feedback.startsWith("This lifecycle plan")
    || /required discovery and experiment|Evaluation is required before deploying|Choose augmentation or automation|must be deployed before/i.test(state.feedback);
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
          <div className={`order-5 mt-5 grid items-start gap-5 ${state.scenarioMode ? "2xl:grid-cols-2" : ""} lg:order-4`}>
            {state.scenarioMode && <ScenarioProgress state={state} />}
            <DecisionDashboardVisuals state={state} />
          </div>
          <div className="decision-workbench order-4 rounded-3xl border border-ink/8 bg-white p-5 lg:order-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Choose initiatives</h2>
                <p className="mt-1 text-sm text-ink/50">
                  Pick up to three initiatives. We will guide each one to the
                  next useful action.
                </p>
                <p className="mt-2 text-xs font-medium text-[#57606a]">Start with discovery when evidence is thin. It is an investment in readiness, not an immediate return.</p>
              </div>
              <span className="rounded-full bg-[#dafbe1] px-3 py-1 text-xs font-bold text-[#1a7f37]">
                {state.selected.length} / 3 selected
              </span>
            </div>
            <div className="mt-4 grid gap-2 rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] p-3 text-xs sm:grid-cols-4">
              <span><b className="block text-[#57606a]">Minimum for chosen work</b><strong className="mt-1 block text-base text-[#24292f]">{formatCurrency(capitalPlan.initiativeMinimum, state.currencyMode)}</strong></span>
              <span><b className="block text-[#57606a]">Keep-running / exit cost</b><strong className="mt-1 block text-base text-[#24292f]">{formatCurrency(capitalPlan.maintenanceSpend + Object.values(capitalPlan.byInitiative).reduce((sum, item) => sum + Number(item.retirement || 0), 0), state.currencyMode)}</strong></span>
              <span><b className="block text-[#57606a]">Money to invest this quarter</b><strong className="mt-1 block text-base text-[#24292f]">{formatBudget(deployment, state.currencyMode)}</strong></span>
              <span><b className="block text-[#57606a]">Money left in reserve</b><strong className="mt-1 block text-base text-[#0969da]">{formatBudget(capacity.maximumDeployment, state.currencyMode)}</strong></span>
            </div>
            <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
              <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {initiatives.map((initiative) => {
                const live =
                  state.initiativeStates?.[initiative.id] || initiative;
                const selected = state.selected.includes(initiative.id);
                const maturity = (live as any).maturityLevel || "nascent";
                const funded = Number((live as any).quartersFunded || 0);
                const invested = completedInvestmentQuarters(state, initiative.id);
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
                const currentAction = actionFor(initiative.id, funded);
                const actionOptions = availableActionsFor(live, currentAction);
                const currentActionIssue = actionOptions.find((option) => option.current)?.reason;
                // A persisted pause is the default state for untouched initiatives after
                // a quarter resolves. It should not make every card look actively managed.
                // Explicit non-pause actions, however, remain visible as managed work when
                // the player comes back to review the portfolio.
                const persistedAction = state.initiativeActions?.[initiative.id];
                const isManaged = Boolean(persistedAction && persistedAction !== "pause");
                const nextAction = state.scenarioMode && live
                  ? suggestedLifecycleAction(live, state.q)
                  : funded > 0 ? "maintain" as InitiativeAction : "discover" as InitiativeAction;
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
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-label={`${selected ? "Deselect" : "Select"} ${initiative.name}`}
                    onClick={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest("button, select, input, label, a")) return;
                      onToggleInitiative(initiative.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onToggleInitiative(initiative.id);
                      }
                    }}
                    className={`group relative cursor-pointer rounded-xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] focus-visible:ring-offset-2 ${selected ? "border-[#1a7f37] bg-[#dafbe1] shadow-lg shadow-[#1a7f37]/10 ring-1 ring-[#1a7f37]/35" : "border-ink/8 bg-mist hover:-translate-y-0.5 hover:border-[#1a7f37]/55 hover:bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{initiative.name}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-ink/55">
                          {initiative.desc}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2" aria-hidden="true">
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${selected ? "text-[#176b36]" : "text-[#57606a]"}`}>{selected ? "Selected" : "Add to quarter"}</span>
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${selected ? "border-[#1a7f37] bg-[#1a7f37] text-white" : "border-ink/25 bg-white text-transparent group-hover:border-[#1a7f37]"}`}>
                          <Check size={14} />
                        </span>
                      </div>
                    </div>
                    {(selected || isManaged) ? <label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-ink/45" onClick={(event) => event.stopPropagation()}>
                      This-quarter action
                      <select aria-label={`Action for ${initiative.name}`} value={currentAction} onChange={(event) => setInitiativeAction(initiative.id, event.target.value as InitiativeAction)} className="mt-1 block w-full rounded-md border border-ink/15 bg-white px-2 py-1.5 text-xs font-bold normal-case tracking-normal text-ink">
                        {actionOptions.map((option) => <option key={option.action} value={option.action} disabled={Boolean(option.reason) && !option.current}>{option.label}{option.reason ? " — not ready" : ""}</option>)}
                      </select>
                      {currentActionIssue
                        ? <p className="mt-2 rounded-lg border border-[#bf8700]/35 bg-[#fff8c5] px-2 py-1.5 text-[10px] normal-case leading-4 text-[#6b4f00]">Not ready: {currentActionIssue} Choose {actionLabel(nextAction)} instead.</p>
                        : <div className="mt-2 rounded-lg border border-[#b8d8c0] bg-[#f2f8f3] px-2 py-1.5 text-[10px] normal-case leading-4 text-[#176b36]"><b>{actionNarrative(currentAction)}</b><span className="block pt-1 text-[#57606a]">Next: {actionNextStep(currentAction)}.</span></div>}
                    </label> : persistedAction === "pause" ? <p className="mt-3 rounded-lg border border-dashed border-ink/15 bg-white/65 px-2 py-2 text-[10px] leading-4 text-ink/55">Paused this quarter · no new investment. Select to choose its next action.</p> : <p className="mt-3 rounded-lg border border-dashed border-ink/15 bg-white/65 px-2 py-2 text-[10px] leading-4 text-ink/55">Select this initiative to choose its next action. You can change the action later.</p>}
                    <div
                      title={baselineTitle}
                      className="mt-4 grid grid-cols-2 gap-2 border-t border-ink/8 pt-3 text-[11px] sm:grid-cols-6"
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
                        <small className="text-ink/40">delivery quarters</small>
                      </span>
                      <span>
                        <b className="block text-ink">{invested}</b>
                        <small className="text-ink/40">investment quarters</small>
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink/45">
                      <span>
                        {maturity}
                        {discoveredLink ? " · connected capability" : ""}
                      </span>
                      <span>
                        {invested
                          ? `${invested} quarter${invested === 1 ? "" : "s"} invested`
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
              {lifecycleBriefs.length > 0 && <section className={`rounded-2xl border p-4 ${lifecycleIssues.length ? "border-[#bf8700]/45 bg-[#fff8c5]" : "border-[#b8d8c0] bg-[#f2f8f3]"}`} aria-labelledby="lifecycle-next-step-title">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#176b36]">Decision path</p>
                    <h3 id="lifecycle-next-step-title" className="mt-1 text-base font-bold text-[#24292f]">What each selected initiative will do next</h3>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${lifecycleIssues.length ? "bg-[#bf8700]/15 text-[#8a5a00]" : "bg-[#1a7f37]/15 text-[#176b36]"}`}>{lifecycleIssues.length ? `${lifecycleIssues.length} blocker${lifecycleIssues.length === 1 ? "" : "s"}` : "Ready to resolve"}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#57606a]">Capital and allocation are shown above. This panel separates the delivery path from any lifecycle or evidence condition.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-3">
                  {lifecycleBriefs.map((brief) => <article key={brief.id} className="rounded-xl border border-black/10 bg-white/75 p-3 text-xs">
                    <p className="font-bold text-[#24292f]">{brief.name}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#57606a]">Now: {brief.stage} · This quarter: {brief.action}</p>
                    <p className="mt-2 leading-5 text-[#57606a]">{brief.issue ? brief.issue.reason : brief.effect}</p>
                    {brief.issue?.suggestedAction
                      ? <button type="button" onClick={() => setInitiativeAction(brief.id, brief.issue!.suggestedAction!)} className="mt-2 rounded-lg bg-[#24292f] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#0969da]">Use {brief.issue.suggestedAction.replace("maintain", "run / maintain")} now</button>
                      : brief.issue
                        ? <p className="mt-2 font-medium text-[#8a5a00]">Next: complete the relevant lifecycle review, then return here.</p>
                        : <p className="mt-2 font-medium text-[#176b36]">Next: this action can resolve this quarter.</p>}
                  </article>)}
                </div>
              </section>}
              {initiativeFundingBriefs.length > 0 && <section className="rounded-2xl border border-[#0969da]/25 bg-[#ddf4ff]/45 p-4" aria-labelledby="initiative-investment-plan-title">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#0969da]">Funding & operating plan</p>
                    <h3 id="initiative-investment-plan-title" className="mt-1 text-base font-bold text-[#24292f]">Where this quarter&apos;s capital and capability effort go</h3>
                  </div>
                  <button type="button" onClick={() => setAdvancedAllocationOpen((open) => !open)} className="rounded-lg border border-[#0969da]/25 bg-white px-3 py-2 text-[10px] font-bold text-[#0969da] transition hover:bg-[#f6f8fa]" aria-expanded={advancedAllocationOpen || state.initiativeAllocationMode === 'custom'}>Advanced: tailor each initiative</button>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#57606a]">The recommended shared mix is active by default. It gives every selected initiative the same balanced operating support.{capitalPlan.accelerationSpend > 0 ? ` ${formatBudget(capitalPlan.accelerationSpend, state.currencyMode)} of extra investment will accelerate the selected delivery work.` : ''}</p>
                {(advancedAllocationOpen || state.initiativeAllocationMode === 'custom') && <div className="mt-3 rounded-xl border border-[#0969da]/20 bg-white/75 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold text-[#24292f]">Tailor the operating mix</p><p className="mt-1 text-[10px] leading-4 text-[#57606a]">Use this only when different initiatives need genuinely different support.</p></div><div className="flex rounded-lg border border-[#0969da]/25 bg-white p-1 text-[10px] font-bold"><button type="button" onClick={() => onInitiativeAllocationModeChange('shared')} className={`rounded-md px-2.5 py-1.5 transition ${state.initiativeAllocationMode === 'shared' ? 'bg-[#0969da] text-white' : 'text-[#57606a] hover:bg-[#f6f8fa]'}`}>Use shared mix</button><button type="button" onClick={() => onInitiativeAllocationModeChange('custom')} className={`rounded-md px-2.5 py-1.5 transition ${state.initiativeAllocationMode === 'custom' ? 'bg-[#0969da] text-white' : 'text-[#57606a] hover:bg-[#f6f8fa]'}`}>Customize</button></div></div>
                  {state.initiativeAllocationMode === 'custom' && <p className={`mt-3 rounded-lg border px-3 py-2 text-[11px] leading-5 ${unbalancedInitiatives.length ? 'border-[#bf8700]/35 bg-[#fff8c5] text-[#6b4f00]' : 'border-[#0969da]/20 bg-white/75 text-[#57606a]'}`}>{unbalancedInitiatives.length ? `Your custom mixes: ${unbalancedInitiatives.length} initiative${unbalancedInitiatives.length === 1 ? '' : 's'} still need${unbalancedInitiatives.length === 1 ? 's' : ''} to total 100%.` : 'Your custom mixes are balanced. Local choices also change the combined capacity mix.'}</p>}
                </div>}
                <div className="mt-3 grid gap-3 xl:grid-cols-1 2xl:grid-cols-2">
                  {initiativeFundingBriefs.map((brief) => <article key={brief.initiative.id} className="rounded-xl border border-[#0969da]/20 bg-white/80 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><p className="text-sm font-bold text-[#24292f]">{brief.initiative.name}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#57606a]">{brief.action} · {formatBudget(brief.funding.total, state.currencyMode)} assigned</p></div>
                      {brief.funding.scaleUp > 0 && <span className="rounded-full bg-[#dafbe1] px-2 py-1 text-[10px] font-bold text-[#176b36]">+{formatBudget(brief.funding.scaleUp, state.currencyMode)} extra delivery</span>}
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-[#57606a]">Action commitment: {formatBudget(brief.funding.discovery + brief.funding.delivery + brief.funding.run + brief.funding.retirement, state.currencyMode)}{brief.funding.scaleUp > 0 ? ` · accelerated by ${formatBudget(brief.funding.scaleUp, state.currencyMode)}` : ''}.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {OPERATING_ALLOCATION_KEYS.map((key) => <label key={key} className="rounded-lg border border-[#d0d7de] bg-white p-2 text-[10px] text-[#57606a]">
                        <span className="flex justify-between gap-1"><span className="font-bold text-[#24292f]">{allocationLabel[key]}</span><span>{brief.allocation[key]}%</span></span>
                        <span className="mt-1 block text-[#0969da]">{formatBudget(brief.funding.total * brief.allocation[key] / 100, state.currencyMode)}</span>
                        {state.initiativeAllocationMode === 'custom' && <input aria-label={`${brief.initiative.name} ${allocationLabel[key]} allocation`} type="range" min="5" max="50" value={brief.allocation[key]} onChange={(event) => onInitiativeAllocationChange(brief.initiative.id, key, Number(event.target.value))} className="mt-2 w-full cursor-ew-resize accent-[#0969da]" />}
                      </label>)}
                    </div>
                    {state.initiativeAllocationMode === 'custom' && <p className={`mt-2 text-[10px] font-bold ${allocationTotal(brief.allocation) === 100 ? 'text-[#1a7f37]' : 'text-[#9a6700]'}`}>{allocationTotal(brief.allocation)}% allocated for this initiative {allocationTotal(brief.allocation) === 100 ? '· ready to confirm' : '· must equal 100% to confirm'}</p>}
                    <div className="mt-3 rounded-lg bg-[#f6f8fa] p-2.5 text-[11px] leading-5 text-[#57606a]"><p className="font-bold uppercase tracking-wide text-[#0969da]">Direct effect this quarter</p>{brief.directEffects.map((effect) => <p key={effect} className="mt-1">{effect}</p>)}</div>
                  </article>)}
                </div>
              </section>}
              </div>
              <aside className="order-last xl:sticky xl:top-24 xl:order-none" aria-label="Quarter decision configuration">
                <OperatingSystemControls state={state} effectiveAllocation={effectiveAllocation} onAllocationChange={onAllocationChange} onDeploymentChange={onDeploymentChange} capacityIssue={capacityIssue} onCapacityFix={makePlanExecutable} compact />
              </aside>
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-ink/45">
              <Info size={13} /> Values shown are current operating conditions.
              Funding changes the initiative over time. Hover a metric row to
              compare against its campaign baseline.
            </p>
            {capacityIssue && <div role="status" className="mt-3 rounded-xl border border-[#cf222e]/25 bg-[#ffebe9] px-3 py-3 text-xs text-[#cf222e]"><p className="font-bold">Why this plan cannot proceed</p><p className="mt-1 font-semibold">{capacityIssue.message}</p><p className="mt-2 leading-5"><b>What to change:</b> {capacityGuidance}</p><p className="mt-2 text-[10px] font-medium text-[#8a3038]">The rule is protecting a real operating limit, not rejecting your strategy. Edit the allocation or the selected action, then confirm again.</p><button type="button" onClick={makePlanExecutable} className="mt-3 rounded-lg bg-[#24292f] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#0969da]">Apply quick fix and recalculate</button></div>}
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
            {importantFeedback && <p role="status" className="w-full rounded-xl bg-[#ffebe9] px-3 py-2 text-right text-xs font-bold text-[#cf222e]">{state.feedback}</p>}
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
              disabled={operatingMixTotal !== 100 || unbalancedInitiatives.length > 0 || requiresMoreDeployment || lifecycleIssues.length > 0}
              onClick={handleConfirm}
              className="flex items-center gap-3 rounded-xl bg-[#1a7f37] px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0969da] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {lifecycleIssues.length > 0 ? "Resolve lifecycle choice to continue" : unbalancedInitiatives.length > 0 ? "Balance initiative mix to continue" : state.selected.length === 0 ? "Continue without funding" : "Confirm decisions"} <ArrowRight size={17} />
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
