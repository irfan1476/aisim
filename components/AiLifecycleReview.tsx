"use client";

import { useMemo, useState } from "react";
import { Activity, Check, CircleAlert, Gauge, GitBranch, RotateCcw, ShieldCheck, Users } from "lucide-react";
import type {
  AiAdaptationAction,
  AiDeploymentMode,
  AiLifecycleSignals,
  AiLifecycleStage,
  GameViewState,
  LifecycleAdaptationPayload,
  LifecycleDeploymentPayload,
  LifecycleEvaluationPayload,
} from "./gameViewTypes";

type InitiativeLike = AiLifecycleSignals & { id: string; name?: string };

export type LifecycleReviewKind = "evaluation" | "deployment" | "adaptation";

function signalsFor(value: unknown): AiLifecycleSignals {
  return value && typeof value === "object" ? value as AiLifecycleSignals : {};
}

function stageFor(value: unknown): string {
  const stage = signalsFor(value).aiLifecycle?.stage;
  return typeof stage === "string" ? stage : "";
}

function evaluationPending(item: unknown): boolean {
  const signals = signalsFor(item);
  const stage = stageFor(item);
  // Evaluation is a decision point produced by the engine after a pilot. An
  // initialized `pending` evaluation object alone is not enough; discovery
  // and early pilot quarters must remain playable.
  return Boolean(signals.evaluation && stage === "evaluate" && signals.evaluation.goNoGoDecision !== "go" && signals.evaluation.goNoGoDecision !== "no_go" && signals.evaluation.goNoGoDecision !== "pause");
}

function deploymentPending(item: unknown): boolean {
  const signals = signalsFor(item);
  return Boolean(signals.deploymentMode === "not_set" && stageFor(item) === "deploy" && signals.aiLifecycle?.stageStatus !== "completed");
}

function adaptationPending(item: unknown, quarter?: number): boolean {
  const signals = signalsFor(item);
  const monitoring = signals.monitoring;
  const latestAdaptation = Array.isArray((item as any)?.adaptationHistory) ? (item as any).adaptationHistory.at(-1) : undefined;
  if ((item as any)?.lifecycle === "retired" || signals.aiLifecycle?.stageStatus === "completed") return false;
  if (Number.isFinite(quarter) && latestAdaptation && Number(latestAdaptation.quarter) >= Number(quarter)) return false;
  return Boolean(
    monitoring &&
      (monitoring.isDegraded || monitoring.actionAvailable || (monitoring.availableActions && monitoring.availableActions.length > 0)),
  );
}

export function lifecycleReviewStatus(item: unknown, quarter?: number): LifecycleReviewKind[] {
  return [
    evaluationPending(item) ? "evaluation" : null,
    deploymentPending(item) ? "deployment" : null,
    adaptationPending(item, quarter) ? "adaptation" : null,
  ].filter((value): value is LifecycleReviewKind => Boolean(value));
}

export function pendingLifecycleReviewCount(state: Pick<GameViewState, "initiativeStates" | "selected"> & { q?: number }): number {
  return state.selected.reduce((count, id) => count + lifecycleReviewStatus(state.initiativeStates?.[id], state.q).length, 0);
}

function labelStage(stage: string): string {
  return stage.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) || "Operating";
}

function riskValues(item: InitiativeLike) {
  return item.riskProfile || item.risks || {};
}

interface Props {
  state: GameViewState;
  onEvaluation: (payload: LifecycleEvaluationPayload) => void;
  onDeployment: (payload: LifecycleDeploymentPayload) => void;
  onAdaptation: (payload: LifecycleAdaptationPayload) => void;
}

export default function AiLifecycleReview({ state, onEvaluation, onDeployment, onAdaptation }: Props) {
  const selected = useMemo(
    () => state.selected.map((id) => state.initiativeStates?.[id] as InitiativeLike | undefined).filter((item): item is InitiativeLike => Boolean(item)),
    [state.initiativeStates, state.selected],
  );
  const reviews = selected.flatMap((item) => lifecycleReviewStatus(item, state.q).map((kind) => ({ item, kind })));
  const [drafts, setDrafts] = useState<Record<string, { rationale: string; owner: string; mode: Exclude<AiDeploymentMode, "not_set">; action: AiAdaptationAction }>>({});

  if (!selected.some((item) => Boolean(item.aiLifecycle || item.evaluation || item.monitoring || item.deploymentMode))) return null;

  const draftFor = (id: string) => drafts[id] || { rationale: "", owner: "", mode: "augmentation" as const, action: "retrain" as const };
  const updateDraft = (id: string, values: Partial<ReturnType<typeof draftFor>>) => setDrafts((current) => ({ ...current, [id]: { ...draftFor(id), ...values } }));
  const displayStage = (item: InitiativeLike) => labelStage(stageFor(item) || (item as any).lifecycle || "operating");

  return (
    <section className="border-b border-[#30363d] px-5 py-5 sm:px-8" aria-labelledby="ai-lifecycle-review-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#7ee787]"><GitBranch size={14} /> AI lifecycle evidence</p>
          <h3 id="ai-lifecycle-review-title" className="mt-2 text-xl font-bold">Review the next operating decision</h3>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-white/55">Pilot evidence becomes a decision record. Deployment and adaptation choices remain explicit and replayable.</p>
        </div>
        {reviews.length > 0 && <span className="rounded-full border border-[#f0a736]/40 bg-[#f0a736]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#f0c36a]">{reviews.length} review{reviews.length === 1 ? "" : "s"} pending</span>}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {selected.map((item) => {
          const signals = item;
          const monitoring = signals.monitoring || {};
          const risks = riskValues(item);
          const statuses = lifecycleReviewStatus(item, state.q);
          return (
            <article key={item.id} className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="break-words text-sm font-bold">{item.name || item.id}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-white/45">{displayStage(item)}{signals.deploymentMode && signals.deploymentMode !== "not_set" ? ` · ${signals.deploymentMode}` : ""}</p></div>
                {statuses.length === 0 ? <span className="flex items-center gap-1 rounded-full bg-[#1a7f37]/20 px-2 py-1 text-[10px] font-bold text-[#7ee787]"><Check size={12} /> Reviewed</span> : <span className="flex items-center gap-1 rounded-full bg-[#f0a736]/15 px-2 py-1 text-[10px] font-bold text-[#f0c36a]"><CircleAlert size={12} /> Action needed</span>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-[10px] sm:grid-cols-4">
                <span><b className="flex items-center gap-1 text-white/45"><Gauge size={11} /> Data</b><strong className="mt-1 block text-white/80">{Number(signals.dataReadiness ?? ((item as any).currentData ? (item as any).currentData * 20 : 0)).toFixed(0)}/100</strong></span>
                <span><b className="flex items-center gap-1 text-white/45"><Activity size={11} /> Performance</b><strong className="mt-1 block text-white/80">{monitoring.performance === undefined ? "—" : `${Number(monitoring.performance).toFixed(0)}/100`}</strong></span>
                <span><b className="text-white/45">Drift</b><strong className="mt-1 block text-white/80">{monitoring.drift === undefined ? "—" : `${Number(monitoring.drift).toFixed(0)}%`}</strong></span>
                <span><b className="flex items-center gap-1 text-white/45"><ShieldCheck size={11} /> Risk</b><strong className="mt-1 block text-white/80">{[risks.modelRisk, risks.operationalRisk, risks.legalRisk].some((value) => value !== undefined) ? `${Number(risks.modelRisk || 0).toFixed(0)} / ${Number(risks.operationalRisk || 0).toFixed(0)} / ${Number(risks.legalRisk || 0).toFixed(0)}` : "—"}</strong></span>
                <span><b className="flex items-center gap-1 text-white/45"><Users size={11} /> Oversight</b><strong className={`mt-1 block ${Number(signals.humanOversightAllocated ?? signals.oversight?.allocated ?? 0) < Number(signals.humanOversightRequired ?? signals.oversight?.required ?? 0) ? "text-[#ffaaa5]" : "text-white/80"}`}>{Number(signals.humanOversightAllocated ?? signals.oversight?.allocated ?? 0).toFixed(1)} / {Number(signals.humanOversightRequired ?? signals.oversight?.required ?? 0).toFixed(1)}</strong></span>
                <span><b className="flex items-center gap-1 text-white/45"><Users size={11} /> Oversight</b><strong className={`mt-1 block ${Number(signals.humanOversightAllocated ?? signals.oversight?.allocated ?? 0) < Number(signals.humanOversightRequired ?? signals.oversight?.required ?? 0) ? "text-[#ffaaa5]" : "text-white/80"}`}>{Number(signals.humanOversightAllocated ?? signals.oversight?.allocated ?? 0).toFixed(1)} / {Number(signals.humanOversightRequired ?? signals.oversight?.required ?? 0).toFixed(1)}</strong></span>
              </div>
              <div className="mt-3 flex gap-1" aria-label={`${item.name || item.id} lifecycle progress`}>
                {(["data_readiness", "experiment", "pilot", "evaluate", "deploy", "monitor", "adapt"] as AiLifecycleStage[]).map((stage) => <span key={stage} title={labelStage(stage)} className={`h-1.5 flex-1 rounded-full ${stageFor(item) === stage ? "bg-[#7ee787]" : ["data_readiness", "experiment", "pilot", "evaluate", "deploy", "monitor", "adapt"].indexOf(stage) < ["data_readiness", "experiment", "pilot", "evaluate", "deploy", "monitor", "adapt"].indexOf(stageFor(item)) ? "bg-[#1a7f37]" : "bg-white/15"}`} />)}
              </div>
              {statuses.length === 0 && <p className="mt-3 text-[11px] leading-4 text-white/45">No learner action is required for this initiative this quarter.</p>}
              {statuses.map((kind) => {
                const draft = draftFor(item.id);
                if (kind === "evaluation") {
                  const criteria = signals.evaluation?.successCriteria || [];
                  return <form key={kind} className="mt-4 rounded-xl border border-[#f0a736]/30 bg-[#f0a736]/[.06] p-3" onSubmit={(event) => { event.preventDefault(); onEvaluation({ initiativeId: item.id, decision: (draft as any).decision || "go", rationale: draft.rationale.trim(), owner: draft.owner.trim() }); }}>
                    <p className="text-xs font-bold">Evaluation · Go / No-Go / Pause</p>
                    <p className="mt-2 text-[10px] leading-4 text-white/55">This pilot is judged on directional evidence and readiness—not full production ROI. A required safety or control check must pass before the evidence signal can recommend Go.</p>
                    {criteria.length > 0 && <div className="mt-2 space-y-1">{criteria.map((criterion) => <p key={criterion.id || criterion.metric} className="text-[10px] text-white/60">{criterion.met ? "✓" : "○"} {criterion.label || criterion.metric}: {criterion.actual === undefined ? "pending" : Number(criterion.actual).toFixed(1)} / target {Number(criterion.threshold).toFixed(1)} <span className="text-white/40">· {criterion.kind || "evidence"}{criterion.required ? " · required" : ""}</span></p>)}</div>}
                    {signals.evaluation?.recommendedDecision && <p className="mt-2 text-[10px] font-bold text-[#f0c36a]">Evidence signal: {signals.evaluation.recommendedDecision.replaceAll("_", " ")}{signals.evaluation.confidence ? ` · ${signals.evaluation.confidence} confidence` : ""}. You make the decision.</p>}
                    <div className="mt-3 grid grid-cols-3 gap-1" role="group" aria-label="Evaluation decision">{(["go", "no_go", "pause"] as const).map((decision) => <button key={decision} type="button" onClick={() => updateDraft(item.id, { decision } as any)} className={`rounded-lg border px-2 py-2 text-[10px] font-bold uppercase ${((draft as any).decision || "go") === decision ? "border-[#7ee787] bg-[#1a7f37]/30 text-[#7ee787]" : "border-white/15 text-white/55"}`}>{decision.replace("_", " ")}</button>)}</div>
                    <p className="mt-3 text-[10px] leading-4 text-white/55">Optional on this first pass: add a note or decision contact if it helps your debrief. Empty fields are recorded as <b>No Entry</b> and will not hold up progress.</p>
                    <label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-white/50">Rationale <span className="normal-case tracking-normal">(optional)</span><textarea value={draft.rationale} onChange={(event) => updateDraft(item.id, { rationale: event.target.value })} className="mt-1 min-h-16 w-full rounded-lg border border-white/15 bg-[#0d1117] p-2 text-xs font-normal normal-case tracking-normal text-white outline-none focus:border-[#7ee787]" placeholder="What did the evidence change?" /></label>
                    <label className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-white/50"><span className="flex items-center gap-1"><Users size={11} /> Decision contact <span className="normal-case tracking-normal">(optional)</span></span><input value={draft.owner} onChange={(event) => updateDraft(item.id, { owner: event.target.value })} className="mt-1 w-full rounded-lg border border-white/15 bg-[#0d1117] px-2 py-2 text-xs font-normal normal-case tracking-normal text-white outline-none focus:border-[#7ee787]" placeholder="Name, team, or leave blank" /></label>
                    <button type="submit" className="mt-3 w-full rounded-lg bg-[#2da44e] px-3 py-2 text-xs font-bold text-white">Record evaluation decision</button>
                  </form>;
                }
                if (kind === "deployment") return <form key={kind} className="mt-4 rounded-xl border border-[#7ee787]/30 bg-[#1a7f37]/[.06] p-3" onSubmit={(event) => { event.preventDefault(); onDeployment({ initiativeId: item.id, mode: draft.mode, rationale: draft.rationale.trim() }); }}><p className="text-xs font-bold">Deployment mode</p><div className="mt-3 grid grid-cols-2 gap-2">{(["augmentation", "automation"] as const).map((mode) => <button key={mode} type="button" onClick={() => updateDraft(item.id, { mode })} className={`rounded-lg border p-2 text-left text-[10px] ${draft.mode === mode ? "border-[#7ee787] bg-[#1a7f37]/25 text-[#7ee787]" : "border-white/15 text-white/55"}`}><b className="block uppercase">{mode}</b><span className="mt-1 block leading-4">{mode === "augmentation" ? "AI assists human judgement." : "AI executes within defined boundaries."}</span></button>)}</div><label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-white/50">Rationale <span className="normal-case tracking-normal">(optional)</span><textarea value={draft.rationale} onChange={(event) => updateDraft(item.id, { rationale: event.target.value })} className="mt-1 min-h-14 w-full rounded-lg border border-white/15 bg-[#0d1117] p-2 text-xs font-normal normal-case tracking-normal text-white outline-none focus:border-[#7ee787]" placeholder="Optional: why is this mode appropriate?" /></label><p className="mt-2 text-[10px] text-white/45">Leave blank to record <b>No Entry</b> and continue.</p><button type="submit" className="mt-3 w-full rounded-lg bg-[#2da44e] px-3 py-2 text-xs font-bold text-white">Record deployment mode</button></form>;
                const available = (monitoring.availableActions?.length ? monitoring.availableActions : ["retrain", "tune", "rollback", "deprecate"]) as AiAdaptationAction[];
                return <form key={kind} className="mt-4 rounded-xl border border-[#ff7b72]/30 bg-[#cf222e]/[.06] p-3" onSubmit={(event) => { event.preventDefault(); onAdaptation({ initiativeId: item.id, action: draft.action, reason: draft.rationale.trim() }); }}><p className="flex items-center gap-2 text-xs font-bold"><RotateCcw size={13} /> Monitoring action {monitoring.isDegraded ? "· degraded" : ""}</p><div className="mt-3 grid grid-cols-2 gap-1">{available.map((action) => <button key={action} type="button" onClick={() => updateDraft(item.id, { action })} className={`rounded-lg border px-2 py-2 text-[10px] font-bold uppercase ${draft.action === action ? "border-[#ff7b72] bg-[#cf222e]/25 text-[#ffaaa5]" : "border-white/15 text-white/55"}`}>{action}</button>)}</div><label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-white/50">Reason <span className="normal-case tracking-normal">(optional)</span><textarea value={draft.rationale} onChange={(event) => updateDraft(item.id, { rationale: event.target.value })} className="mt-1 min-h-14 w-full rounded-lg border border-white/15 bg-[#0d1117] p-2 text-xs font-normal normal-case tracking-normal text-white outline-none focus:border-[#ff7b72]" placeholder="Optional: what signal warrants this intervention?" /></label><p className="mt-2 text-[10px] text-white/45">Leave blank to record <b>No Entry</b> and continue.</p><button type="submit" className="mt-3 w-full rounded-lg bg-[#cf222e] px-3 py-2 text-xs font-bold text-white">Record monitoring action</button></form>;
              })}
            </article>
          );
        })}
      </div>
    </section>
  );
}
