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
import V3EvidenceRoom from "./V3EvidenceRoom";
import V3InitiativePlan from "./V3InitiativePlan";
import V3AnalyticsSidecar from "./V3AnalyticsSidecar";

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
  const [v3CitedEvidence, setV3CitedEvidence] = useState<string[]>([]);
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
  const v3InitiativeId = s.selected[0] || Object.keys(s.v3State?.initiatives || {})[0];
  const confirmV3Plan = (action: string, record: { rationale: string; prediction: string; assumption: string }) => {
    if (!v3Scenario?.v3 || !v3InitiativeId) return;
    const target = action.split(/\s+to\s+|→/).pop()?.trim() as "deferred" | "research" | "pilot" | "scale" | "sustain" | "pause" | "stop" | undefined;
    if (!target) return;
    const profile = v3Scenario.v3.initiatives?.find((item) => item.id === v3InitiativeId);
    const capacity = profile?.capacityRequired?.[target] || profile?.capacityRequired?.research || {};
    const costs = profile?.costInrCr;
    const cost = target === 'research' ? costs?.researchCapital : target === 'pilot' ? costs?.pilotCapital : target === 'scale' ? costs?.scaleCapital : 0;
    const gateIds = s.v3State?.initiatives[v3InitiativeId]?.gateIds || [];
    store.confirmV3Decisions([{ initiativeId: v3InitiativeId, lifecycle: target, cost, capacity, gateIds }], {
      id: `window-${s.q}-${v3InitiativeId}`,
      quarter: s.q,
      initiativeIds: [v3InitiativeId],
      rationale: record.rationale,
      prediction: record.prediction,
      assumption: record.assumption,
      evidenceIds: v3CitedEvidence,
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
      {v3Scenario?.v3 && s.v3State && (
        <>
        <section aria-label="V3 operating evidence" className="mx-auto w-full max-w-[1500px] px-5 pb-5"><div className="rounded-3xl border border-gold/30 bg-gold/5 p-5"><p className="text-xs font-bold uppercase tracking-[.2em] text-gold">Operating evidence · quarter {s.v3State.currentQuarter}</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{(v3Scenario.v3.metrics || []).slice(0, 5).map((metric) => { const value = (s as any).scenarioState?.metrics?.[metric.key] ?? metric.start ?? 0; return <div key={metric.key} className="rounded-xl border border-ink/8 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-ink/45">{metric.label}</p><p className="mt-1 text-lg font-bold">{Number(value).toFixed(1)} <span className="text-xs font-normal text-ink/45">/ {metric.target ?? '—'} {metric.unit}</span></p><p className="mt-1 text-[11px] text-ink/55">Owner: {metric.ownerRole || 'unassigned'}</p></div>; })}</div></div></section>
        <section className="mx-auto grid w-full max-w-[1500px] gap-5 px-5 pb-28 lg:grid-cols-[1fr_1fr_360px]">
          <V3EvidenceRoom pack={v3Scenario.v3} selectedIds={v3CitedEvidence} onCite={(item) => setV3CitedEvidence((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />
          {v3InitiativeId && <V3InitiativePlan
            pack={v3Scenario.v3}
            initiativeId={v3InitiativeId}
            currentState={s.v3State.initiatives[v3InitiativeId]?.lifecycle}
            onConfirm={confirmV3Plan}
          />}
          <V3AnalyticsSidecar state={s as any} pack={v3Scenario.v3} />
        </section>
        </>
      )}
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
