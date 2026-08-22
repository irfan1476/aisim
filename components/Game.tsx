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
import QuarterRoadmap from "./QuarterRoadmap";
import { createInferredGeneration } from "../lib/game/generator";
import { initialGameState } from "../lib/game/state";
import { getScenario } from "../lib/scenarios/registry";
import type { CurrencyMode } from "../lib/scenarios/types";
import {
  hasCampaignProgress,
  readPersistedGameState,
} from "../lib/game/persistence";
import { buildAdvisorSystemPrompt } from "../lib/llm/advisorPrompt";
import V3WindowShell from "./V3WindowShell";

function compactNumber(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

export default function Game() {
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
  const [scenarioMode, setScenarioMode] = useState(false);
  const [scenarioId, setScenarioId] = useState("projectFactory");
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("$");
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    setDebug(
      process.env.NODE_ENV !== "production" &&
        new URLSearchParams(window.location.search).get("debug") === "true",
    );
  }, []);
  useEffect(() => {
    const persisted = readPersistedGameState();
    if (!persisted || !hasCampaignProgress(persisted)) return;
    store.loadGame(persisted);
    setAssessment(persisted.baseline || []);
    setExperimental(Boolean(persisted.experimental));
    setScenarioMode(Boolean(persisted.scenarioMode));
    setScenarioId(persisted.scenarioId || "projectFactory");
    setCurrencyMode(persisted.currencyMode || "$");
    setScreen(persisted.stage === "done" ? "done" : "game");
    // The persisted campaign is read once when the game shell mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
  const llm = useLLMStore();
  const ask = async () => {
    if (!question.trim() || isAsking) return;
    const userQuestion = question;
    setQuestion("");
    setAnswer("");
    setIsAsking(true);
    const replies: Record<string, string> = {
      CFO: `At ${s.roi.toFixed(1)}% ROI and $${s.spent.toFixed(1)}M spent, your next question is payback. Keep people above 15% to protect value realization.`,
      CTO: `Data readiness is ${s.data}%. Some initiatives will become easier to scale as data foundations compound.`,
      CHRO: `Adoption is ${s.adoption}%. Your people allocation is ${s.alloc.people}%; invest in enablement if you want the transformation to stick.`,
      RISK: `Risk exposure is ${s.risk}%, while compliance is ${s.compliance}%. Governance investment can make individual initiatives safer over time.`,
    };
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
      setAnswer(data.content || replies[persona]);
      setIsAsking(false);
    } catch {
      setAnswer(replies[persona]);
      setIsAsking(false);
    }
  };
  const confirm = () => { if (v3Scenario?.v3) return; store.confirmDecisions(); };
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
    setScreen("setup");
  };
  const v3Scenario = s.scenarioMode ? getScenario(s.scenarioId) : undefined;
  const commitV3Window = ({ initiativeId, prediction, note, evidenceIds }: { initiativeId: string; prediction: string; note: string; evidenceIds: string[] }) => {
    if (!v3Scenario?.v3) return { accepted: false, errors: [{ code: "v3-pack-required", message: "The V3 pack is unavailable." }], metrics: {}, value: [] };
    const profile = v3Scenario.v3.initiatives?.find((item) => item.id === initiativeId);
    const capacity = profile?.capacityRequired?.research || {};
    const cost = profile?.costInrCr?.researchCapital || 0;
    const gateIds = s.v3State?.initiatives[initiativeId]?.gateIds || [];
    return store.confirmV3Decisions([{ initiativeId, lifecycle: "research", cost, capacity, gateIds }], {
      id: `window-${s.q}-${initiativeId}`,
      quarter: s.q,
      initiativeIds: [initiativeId],
      rationale: note || `Commission research to test the ${initiativeId} operating question.`,
      prediction,
      assumption: note || "The declared research findings will be available before the next Pilot decision.",
      evidenceIds,
      gateIds,
    });
  };

  if (screen === "setup")
    return (
      <GameSetupScreen
        name={name}
        experimental={experimental}
        scenarioMode={scenarioMode}
        scenarioId={scenarioId}
        currencyMode={currencyMode}
        onNameChange={setName}
        onExperimentalChange={setExperimental}
        onScenarioModeChange={setScenarioMode}
        onScenarioChange={setScenarioId}
        onCurrencyChange={setCurrencyMode}
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
          const generation = createInferredGeneration(assessment);
          const scenario = scenarioMode ? getScenario(scenarioId) : undefined;
          store.resetCampaign();
          store.loadGame({
            ...initialGameState(generation, { currencyMode }),
            baseline: assessment,
            experimental,
          });
          if (scenario) store.initializeScenario(scenario.id);
          setScreen("hypothesis");
        }}
        canContinue={assessment.length === 5}
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
  if (v3Scenario?.v3 && s.v3State)
    return <V3WindowShell
      state={s}
      pack={v3Scenario.v3}
      onCommit={commitV3Window}
      onNextWindow={(nextQuarter) => store.advanceV3Window(nextQuarter)}
      onReset={reset}
    />;
  return (
    <main className="game-shell min-h-screen bg-mist">
      <NextQuarterGuidance
        guidance={s.nextQuarterGuidance}
        onApply={store.applyRecommendation}
        onDismiss={store.dismissRecommendation}
      />
      <div className="game-roadmap order-2 mx-auto w-full max-w-[1500px] px-5 pt-5">
        <QuarterRoadmap state={s} />
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
        onConfirm={confirm}
        onReset={reset}
      />
      <GameResultsModal
        state={s}
        onRespond={respond}
        onAdvance={advance}
        onApproveRecommendation={store.approveRecommendation}
        onSaveReflection={store.saveReflection}
      />
    </main>
  );
}
