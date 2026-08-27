"use client";

import { useEffect, useMemo, useState } from "react";
import AnalyticsHub from "./AnalyticsHub";
import GameAssessmentScreen from "./GameAssessmentScreen";
import GameDecisionView from "./GameDecisionView";
import GameDoneScreen from "./GameDoneScreen";
import GameResultsModal from "./GameResultsModal";
import GameSetupScreen from "./GameSetupScreen";
import GameHypothesisScreen from "./GameHypothesisScreen";
import type { GameViewState, Metric } from "./gameViewTypes";
import { useLLMStore } from "../stores/llmStore";
import { useGameStore } from "../stores/gameStore";
import NextQuarterGuidance from "./NextQuarterGuidance";
import FirstQuarterQuickStart from "./FirstQuarterQuickStart";
import { createInferredGeneration } from "../lib/game/generator";
import { firstQuarterPlan, hasCompletedBaseline, type CapitalPace } from "../lib/game/firstQuarter";
import { initialGameState } from "../lib/game/state";
import { getScenario } from "../lib/scenarios/registry";
import type { CurrencyMode } from "../lib/scenarios/types";
import {
  hasCampaignProgress,
  readPersistedGameState,
} from "../lib/game/persistence";
import { answerBoardAdvisorQuestion, type BoardPersona } from "../lib/game/boardAdvisor";
import { buildAdvisorSystemPrompt } from "../lib/llm/advisorPrompt";

function compactNumber(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

function deterministicAdvisorAnswer(state: GameViewState, persona: string, question: string): string {
  const boardPersona: BoardPersona = ["CFO", "CTO", "CHRO", "RISK"].includes(persona)
    ? (persona as BoardPersona)
    : "CFO";
  return answerBoardAdvisorQuestion(state, boardPersona, question);
}

export default function Game({ resume = false }: { resume?: boolean }) {
  const store = useGameStore();
  const s = store as unknown as GameViewState;
  const [name, setName] = useState("");
  const [screen, setScreen] = useState<
    "setup" | "assessment" | "hypothesis" | "game" | "done"
  >("setup");
  const [persona, setPersona] = useState("CFO");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [assessment, setAssessment] = useState<number[]>([]);
  const [experimental, setExperimental] = useState(false);
  // Make the richer, domain-specific experience discoverable on a fresh run.
  // Standard mode remains available as an explicit choice in the setup screen.
  const [scenarioMode, setScenarioMode] = useState(true);
  const [scenarioId, setScenarioId] = useState("projectFactory");
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("$");
  const [campaignBudget, setCampaignBudget] = useState(60);
  const [debug, setDebug] = useState(false);
  const [q1GuidanceDismissed, setQ1GuidanceDismissed] = useState(false);
  useEffect(() => {
    setDebug(
      process.env.NODE_ENV !== "production" &&
        new URLSearchParams(window.location.search).get("debug") === "true",
    );
  }, []);
  useEffect(() => {
    if (!resume) return;
    const persisted = readPersistedGameState();
    if (!persisted || !hasCampaignProgress(persisted)) return;
    store.loadGame(persisted);
    setAssessment(persisted.baseline || []);
    setExperimental(Boolean(persisted.experimental));
    setScenarioMode(Boolean(persisted.scenarioMode));
    setScenarioId(persisted.scenarioId || "projectFactory");
    setCurrencyMode(persisted.currencyMode || "$");
    setCampaignBudget(Number(persisted.campaignBudget || persisted.quarterlyBudget * 12 || 120));
    setScreen(persisted.stage === "done" ? "done" : "game");
    // Saved state is loaded only after the player explicitly chooses resume.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume]);
  const total = useMemo(
    () => Object.values(s.alloc).reduce((a, b) => a + b, 0),
    [s.alloc],
  );
  const availableInitiatives = useMemo(
    () => Object.values(s.initiativeStates || {}),
    [s.initiativeStates],
  );
  const liveInitiatives = useMemo(
    () =>
      availableInitiatives.map((initiative) => ({
        ...initiative,
        roi: compactNumber(initiative.currentRoi ?? initiative.roi),
        data: compactNumber(initiative.currentData ?? initiative.data),
        cost: compactNumber(initiative.currentCost ?? initiative.cost),
        risk: initiative.currentRisk ?? initiative.risk,
      })),
    [availableInitiatives],
  );
  const q1Plan = useMemo(() => firstQuarterPlan(s), [s]);

  const metrics: Metric[] = [
    ["ROI", "roi", "%", "gold"],
    ["Revenue uplift", "revenue", "%", "emerald"],
    ["Efficiency", "efficiency", "%", "blue"],
    ["Adoption", "adoption", "%", "purple"],
    ["Risk exposure", "risk", "%", "red"],
    ["Data readiness", "data", "%", "cyan"],
  ].map(([label, key, unit, color]) => ({
    label,
    value: s[key as keyof GameViewState] as number,
    unit,
    color: color as Metric["color"],
  }));
  const toggle = (id: string) =>
    store.selectInitiatives(
      s.selected.includes(id)
        ? s.selected.filter((i) => i !== id)
        : s.selected.length < 3
          ? [...s.selected, id]
          : s.selected,
    );
  const updateAlloc = (key: string, value: number) =>
    store.updateAllocation(
      key as
        | "infra"
        | "data"
        | "people"
        | "mlops"
        | "compliance"
        | "innovation",
      value,
    );
  const updateDeployment = (amount: number) => store.setDeploymentAmount(amount);
  const updateInitiativeAllocation = (initiativeId: string, key: string, value: number) =>
    store.updateInitiativeAllocation(
      initiativeId,
      key as "infra" | "data" | "people" | "mlops" | "compliance" | "innovation",
      value,
    );
  const llm = useLLMStore();
  const ask = async (questionOverride?: string) => {
    const userQuestion = (questionOverride ?? question).trim();
    if (!userQuestion || isAsking) return;
    setQuestion("");
    const evidenceAnswer = deterministicAdvisorAnswer(s, persona, userQuestion);
    setAnswer(evidenceAnswer);
    setIsAsking(true);
    try {
      const response = await fetch("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...llm,
          messages: [
            {
              role: "system",
              content: buildAdvisorSystemPrompt({
                persona,
                scenarioMode: Boolean(s.scenarioMode),
                scenarioPrompt: getScenario(s.scenarioId)?.frameworkContext.advisorPrompt,
                quarterlyBudget: s.quarterlyBudget,
                campaignBudget: s.campaignBudget,
                campaignBudgetRemaining: s.campaignBudgetRemaining,
                spent: s.spent,
                state: {
                  ...s,
                  advisorContext: {
                    maturity: s.initiativeGeneration?.context,
                    dynamicInitiatives: availableInitiatives.map((item) => ({
                      id: item.id,
                      roi: item.currentRoi,
                      cost: item.currentCost,
                      risk: item.currentRisk,
                      riskScore: item.riskScore,
                      data: item.currentData,
                      human: item.currentHuman,
                      maturity: item.maturityLevel,
                      quartersFunded: item.quartersFunded,
                    })),
                    recentHistory: s.history?.slice(-3) || [],
                    selected: s.selected || [],
                    allocation: s.alloc || {},
                    causalChain: s.causalChain || [],
                    recommendations: s.proactiveRecommendations || [],
                    scenarioProgress: s.scenarioProgress || {},
                  },
                },
              }),
            },
            { role: "user", content: userQuestion },
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const aiPerspective = typeof data.content === "string" ? data.content.trim() : "";
      if (aiPerspective) {
        setAnswer(`${evidenceAnswer}\n\nAI perspective\n${aiPerspective}`);
      }
    } catch {
      // The deterministic answer is already visible and remains the safe fallback.
    } finally {
      setIsAsking(false);
    }
  };
  const confirm = () => store.confirmDecisions();
  const respond = (impact: Record<string, number>, cost?: number) =>
    store.respondToCrisis(impact, cost);
  const advance = () => {
    if (s.q >= 12) {
      store.advanceQuarter();
      setScreen("done");
      return;
    }
    store.advanceQuarter();
  };
  const reset = () => {
    store.resetCampaign();
    setQ1GuidanceDismissed(false);
    setScreen("setup");
  };

  const applyFirstQuarterPlan = (pace: CapitalPace) => {
    if (!q1Plan) return;
    // Use the same store controls as a manual turn. The guidance is therefore
    // visible and editable rather than a hidden alternate game rule.
    store.selectInitiatives([q1Plan.initiativeId]);
    store.setInitiativeAction(q1Plan.initiativeId, q1Plan.action);
    Object.entries(q1Plan.allocation).forEach(([key, value]) => {
      store.updateAllocation(key as keyof typeof q1Plan.allocation, value);
    });
    store.setDeploymentAmount(q1Plan.deploymentByPace[pace]);
    setQ1GuidanceDismissed(true);
  };

  if (screen === "setup")
    return (
      <GameSetupScreen
        name={name}
        experimental={experimental}
        scenarioMode={scenarioMode}
        scenarioId={scenarioId}
        currencyMode={currencyMode}
        campaignBudget={campaignBudget}
        onNameChange={setName}
        onExperimentalChange={setExperimental}
        onScenarioModeChange={(enabled) => {
          setScenarioMode(enabled);
          if ((campaignBudget === 120 && enabled) || (campaignBudget === 60 && !enabled)) setCampaignBudget(enabled ? 60 : 120);
        }}
        onScenarioChange={setScenarioId}
        onCurrencyChange={setCurrencyMode}
        onCampaignBudgetChange={setCampaignBudget}
        onContinue={() => setScreen("assessment")}
      />
    );
  if (screen === "assessment")
    return (
      <GameAssessmentScreen
        assessment={assessment}
        onAssessmentChange={(index, value) =>
          setAssessment((current) => {
            const next = [...current];
            next[index] = value;
            return next;
          })
        }
        onComplete={() => {
          if (!hasCompletedBaseline(assessment)) return;
          const generation = createInferredGeneration(assessment);
          const scenario = scenarioMode ? getScenario(scenarioId) : undefined;
          store.resetCampaign();
          store.loadGame({
            ...initialGameState(generation, { currencyMode, campaignBudget, quarterlyBudget: campaignBudget / 12 }),
            baseline: assessment,
            experimental,
          });
          if (scenario) store.initializeScenario(scenario.id, campaignBudget);
          setQ1GuidanceDismissed(false);
          setScreen("hypothesis");
        }}
        canContinue={hasCompletedBaseline(assessment)}
        analytics={
          <AnalyticsHub state={s} initiatives={availableInitiatives} />
      }
    />
  );
  if (screen === "hypothesis")
    return (
      <GameHypothesisScreen
        answers={assessment}
        onBegin={() => setScreen("game")}
      />
    );
  if (screen === "done")
    return <GameDoneScreen state={s} onPlayAgain={reset} />;
  return (
    <main className="game-shell min-h-screen grid-bg">
      <NextQuarterGuidance
        guidance={s.nextQuarterGuidance}
        onApply={store.applyRecommendation}
        onDismiss={store.dismissRecommendation}
      />
      {s.q === 1 && s.stage === "decide" && s.history.length === 0 && q1Plan && !q1GuidanceDismissed && (
        <FirstQuarterQuickStart
          plan={q1Plan}
          currencyMode={s.currencyMode}
          onApply={applyFirstQuarterPlan}
          onDismiss={() => setQ1GuidanceDismissed(true)}
        />
      )}
      <div className="game-roadmap order-2 w-full px-5 pt-3">
        {debug && (
          <section className="mt-3 rounded-xl border border-dashed border-purple-400 bg-purple-50 p-4 text-xs text-purple-950">
            <b className="uppercase tracking-widest">Simulation debug</b>
            <div className="mt-2 grid gap-2 sm:grid-cols-5">
              <span>Profile: {s.initiativeGeneration?.archetype}</span>
              <span>Seed: {s.initiativeGeneration?.seed}</span>
              <span>
                Organisation:{" "}
                {Number(
                  s.initiativeGeneration?.context.organization || 0,
                ).toFixed(2)}
              </span>
              <span>
                Data:{" "}
                {Number(s.initiativeGeneration?.context.data || 0).toFixed(2)}
              </span>
              <span>
                Team:{" "}
                {Number(s.initiativeGeneration?.context.team || 0).toFixed(2)}
              </span>
            </div>
          </section>
        )}
      </div>
      <GameDecisionView
        state={s}
        initiatives={liveInitiatives}
        metrics={metrics}
        total={total}
        persona={persona}
        answer={answer}
        question={question}
        isAsking={isAsking}
        onPersonaChange={setPersona}
        onQuestionChange={setQuestion}
        onAsk={ask}
        onToggleInitiative={toggle}
        onAllocationChange={updateAlloc}
        onInitiativeAllocationModeChange={store.setInitiativeAllocationMode}
        onInitiativeAllocationChange={updateInitiativeAllocation}
        onDeploymentChange={updateDeployment}
        onConfirm={confirm}
        onReset={reset}
      />
      <GameResultsModal
        state={s}
        onRespond={respond}
        onAdvance={advance}
        onApproveRecommendation={store.approveRecommendation}
        onSaveReflection={store.saveReflection}
        onLifecycleEvaluation={store.submitLifecycleEvaluation}
        onLifecycleDeployment={store.submitLifecycleDeployment}
        onLifecycleAdaptation={store.submitLifecycleAdaptation}
      />
    </main>
  );
}
