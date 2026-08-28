"use client";

import { ArrowRight, Check, Info, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { V3DecisionResolution } from "../lib/game/v3Runtime";
import type { V3ScenarioPack, V3WindowDefinition, V3WindowPriority } from "../lib/scenarios/types";
import type { GameViewState } from "./gameViewTypes";

type Phase = "orient" | "compare" | "commit" | "outcome" | "reflect" | "next";

type Props = {
  state: GameViewState;
  pack: V3ScenarioPack;
  onCommit: (input: { initiativeId: string; prediction: string; note: string; evidenceIds: string[] }) => V3DecisionResolution;
  onReflect: (entryId: string, reflection: string) => void;
  onPhaseChange: (phase: Phase) => void;
  onNextWindow: (nextQuarter: number) => void;
  onReset: () => void;
};

const phaseLabels: Record<Phase, string> = {
  orient: "Orient",
  compare: "Compare",
  commit: "Commit",
  outcome: "Outcome",
  reflect: "Reflect",
  next: "Next Window",
};

const fallbackWindow: V3WindowDefinition = {
  id: "PF-W1",
  quarterRange: [1, 3],
  boardQuestion: "Which evidence-building priority should receive capacity in Q1–Q3?",
  headlineSignals: [],
  monitoredContext: "Energy is monitored context, not a fourth Q1 choice.",
  laterPriorities: [],
  priorities: [],
};

const capacityLabels: Record<string, string> = {
  data_engineering: "Data Engineering",
  plant_integration: "Plant Integration",
  frontline_change: "Frontline Change",
  governance_assurance: "Governance Assurance",
};

function windowForQuarter(quarter: number): { number: number; range: [number, number] } {
  const number = Math.min(4, Math.max(1, Math.ceil(quarter / 3)));
  const start = (number - 1) * 3 + 1;
  return { number, range: [start, start + 2] };
}

function priorityTone(id: string): string {
  if (id === "maintenance") return "Reliability";
  if (id === "quality") return "Quality";
  return "Workforce";
}

export default function V3WindowShell({ state, pack, onCommit, onReflect, onPhaseChange, onNextWindow, onReset }: Props) {
  const definition = pack.windowOne || fallbackWindow;
  const persistedPhase = state.v3State?.cursor?.phase as Phase | undefined;
  const [phase, setPhase] = useState<Phase>(persistedPhase || "orient");
  const [selectedId, setSelectedId] = useState(definition.priorities[0]?.id || "maintenance");
  const [prediction, setPrediction] = useState("pilot-ready-with-conditions");
  const [note, setNote] = useState("");
  const [evidenceIds, setEvidenceIds] = useState<string[]>(definition.priorities[0]?.evidenceIds || []);
  const [resolution, setResolution] = useState<V3DecisionResolution | null>(null);
  const [reflection, setReflection] = useState("");

  const moveTo = (next: Phase) => {
    setPhase(next);
    onPhaseChange(next);
  };

  const currentWindow = windowForQuarter(state.q);
  const priority = useMemo<V3WindowPriority | undefined>(
    () => definition.priorities.find((item) => item.id === selectedId) || definition.priorities[0],
    [definition.priorities, selectedId],
  );

  useEffect(() => {
    const nextPhase = state.v3State?.cursor?.phase as Phase | undefined;
    setPhase(nextPhase || "orient");
    setResolution(null);
    setReflection("");
    setEvidenceIds(definition.priorities[0]?.evidenceIds || []);
  // Cursor phase is intentionally excluded: changing phase must not clear the
  // just-resolved outcome or reflection. Window/definition changes reset the
  // local interaction state; the cursor is read when the shell mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition.priorities, state.q]);

  const toggleEvidence = (id: string) => {
    setEvidenceIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const commit = () => {
    if (!priority) return;
    const result = onCommit({ initiativeId: priority.id, prediction, note, evidenceIds });
    setResolution(result);
    moveTo("outcome");
  };

  const phaseIndex = Object.keys(phaseLabels).indexOf(phase);
  const rangeText = `Q${currentWindow.range[0]}–Q${currentWindow.range[1]}`;
  const budgetRemaining = state.v3State?.budget.remaining ?? state.quarterlyBudget;
  const selectedEvidence = evidenceIds.length ? evidenceIds : priority?.evidenceIds || [];

  if (currentWindow.number > 1) {
    return (
      <main className="min-h-screen bg-mist" data-testid="v3-window-shell">
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div><p className="text-xs font-bold tracking-[.16em]">Project Factory V3</p><p className="text-xs text-ink/50">Window {currentWindow.number} · Q{currentWindow.range[0]}–Q{currentWindow.range[1]}</p></div>
            <button type="button" aria-label="Reset V3 campaign" onClick={onReset} className="rounded-lg p-2 text-ink/45 hover:bg-ink/5"><RotateCcw size={17} /></button>
          </div>
        </header>
        <div className="mx-auto max-w-3xl px-5 py-12">
          <section className="rounded-3xl border border-amber-300/40 bg-white p-7 shadow-sm" data-testid="v3-window-preview-boundary">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">Window 1 complete · Window 2 preview</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em]">The next board window is not authored yet.</h1>
            <p className="mt-4 text-sm leading-6 text-ink/65">Your Research decision is saved. This implementation slice stops here rather than showing Window 1 choices under a Window 2 label. The next authored step will use the Q2 signal and Q3 review to decide whether to Pilot, remediate, defer, or stop.</p>
            <div className="mt-5 rounded-2xl border border-ink/10 bg-mist p-4 text-sm text-ink/65"><b>Saved carry-forward:</b> {priority?.displayName || "Selected priority"} remains in Research; capital remaining is ₹{Number(budgetRemaining).toFixed(2)} Cr.</div>
            <button type="button" onClick={onReset} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white">Return to V3 setup <ArrowRight size={17} /></button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-mist" data-testid="v3-window-shell">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-sm font-bold text-gold">AI</div>
            <div>
              <p className="text-xs font-bold tracking-[.16em]">Project Factory V3</p>
              <p className="text-xs text-ink/50">Transformation Lead · provisional learning pack</p>
            </div>
          </div>
          <div className="hidden items-center gap-5 text-right sm:flex">
          <div><p className="text-[10px] uppercase tracking-wider text-ink/45">Window</p><p data-testid="campaign-quarter" className="text-sm font-bold">Window {currentWindow.number} · {rangeText}</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-ink/45">Capital remaining</p><p className="text-sm font-bold">₹{Number(budgetRemaining).toFixed(2)} Cr</p></div>
            <div><p className="text-[10px] uppercase tracking-wider text-ink/45">Active delivery</p><p className="text-sm font-bold">{Object.values(state.v3State?.initiatives || {}).filter((item) => item.lifecycle === "pilot" || item.lifecycle === "scale").length}/2</p></div>
          </div>
          <button type="button" aria-label="Reset V3 campaign" onClick={onReset} className="rounded-lg p-2 text-ink/45 hover:bg-ink/5"><RotateCcw size={17} /></button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-16 pt-5">
        <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Window 1 progress">
          {Object.entries(phaseLabels).map(([id, label], index) => (
            <div key={id} className={`flex items-center gap-2 text-xs font-bold ${index <= phaseIndex ? "text-ink" : "text-ink/35"}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${index < phaseIndex ? "border-emerald bg-emerald text-white" : index === phaseIndex ? "border-ink bg-ink text-white" : "border-ink/15 bg-white"}`} aria-current={index === phaseIndex ? "step" : undefined}>{index < phaseIndex ? <Check size={13} /> : index + 1}</span>
              <span>{label}</span>{index < 5 && <span className="mx-1 text-ink/20">→</span>}
            </div>
          ))}
        </div>

        <div className="mb-5 rounded-2xl border border-ink/10 bg-white px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">{phaseLabels[phase]} · Window {currentWindow.number}</p>
          <p className="mt-1 text-sm text-ink/60">{phase === "orient" ? "No previous decision — this is the opening position." : phase === "compare" ? "Choose one bounded evidence-building priority." : phase === "commit" ? "Record what you expect the research to establish." : phase === "outcome" ? "The resolver has recorded the decision; inspect what changed and what did not." : phase === "reflect" ? "One minute to connect your prediction to the evidence." : "Carry the decision forward into the next board window."}</p>
        </div>

        {phase === "orient" && <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm" aria-labelledby="v3-orient-title">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Window {currentWindow.number} brief</p>
          <h1 id="v3-orient-title" className="mt-3 text-3xl font-semibold tracking-[-.04em]">{definition.boardQuestion}</h1>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {definition.headlineSignals.map((signal) => <div key={signal.label} className="rounded-2xl border border-crimson/15 bg-crimson/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-crimson">{signal.label}</p><p className="mt-2 font-bold">{signal.value}</p><p className="mt-1 text-xs text-ink/55">{signal.target}</p></div>)}
          </div>
          <div className="mt-4 flex gap-2 rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-ink/70"><Info size={17} className="mt-0.5 shrink-0 text-amber-700" /><span><b>Also monitored:</b> {definition.monitoredContext}</span></div>
          <div className="mt-4 rounded-2xl border border-ink/10 bg-mist p-4 text-sm text-ink/65"><b>Capacity legend:</b> 1/4 means one quarterly unit used of four available units in that shared pool. It is not 25% of a named employee. Research uses capacity but does not use an active Pilot/Scale slot.</div>
          <button type="button" onClick={() => moveTo("compare")} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white">Review three priorities <ArrowRight size={17} /></button>
        </section>}

        {phase === "compare" && <section aria-labelledby="v3-compare-title">
          <h1 id="v3-compare-title" className="sr-only">Compare three priorities</h1>
          <div role="radiogroup" aria-label="Window 1 Research priorities" className="grid gap-4">
            {definition.priorities.map((item) => {
              const chosen = selectedId === item.id;
              return <button key={item.id} type="button" role="radio" aria-checked={chosen} onClick={() => { setSelectedId(item.id); setEvidenceIds(item.evidenceIds); }} className={`rounded-3xl border p-5 text-left transition ${chosen ? "border-ink bg-white shadow-lg" : "border-ink/10 bg-white hover:border-ink/25"}`}>
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-gold">{priorityTone(item.id)} · Research available now</p><h2 className="mt-2 text-xl font-bold">{item.displayName}</h2><p className="mt-2 text-sm text-ink/60">{item.problem}</p></div><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${chosen ? "border-ink bg-ink text-white" : "border-ink/20 text-transparent"}`} aria-hidden="true"><Check size={14} /></span></div>
                <div className="mt-4 grid gap-2 text-xs text-ink/65 sm:grid-cols-3"><span className="rounded-xl bg-mist p-3"><b className="block text-ink">₹{item.costInrCr.toFixed(2)} Cr</b>research capital</span><span className="rounded-xl bg-mist p-3"><b className="block text-ink">{Object.entries(item.capacity).map(([pool, amount]) => `${capacityLabels[pool] || pool} ${amount}/${pack.portfolioPolicy?.capacityPools?.[pool] ?? "?"}`).join(" · ")}</b>Q1 shared capacity</span><span className="rounded-xl bg-mist p-3"><b className="block text-ink">Q2 signal · Q3 review</b>next decision Window 2</span></div>
                <div className="mt-4 grid gap-3 md:grid-cols-2"><div><p className="text-xs font-bold text-ink/55">What Research will resolve</p><ul className="mt-2 space-y-1 text-sm text-ink/65">{item.researchQuestions.map((question) => <li key={question}>• {question}</li>)}</ul></div><div><p className="text-xs font-bold text-ink/55">If you defer now</p><p className="mt-2 text-sm text-ink/65">{item.deferral}</p><p className="mt-3 text-xs text-ink/50"><b>Boundary:</b> {item.boundary}</p></div></div>
                <p className="mt-4 text-xs text-ink/50">Evidence: {item.evidenceIds.join(" · ")} · Owner: {item.owner}</p>
              </button>;
            })}
          </div>
          <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-4 text-sm text-ink/60"><b>Later-window portfolio:</b> {definition.laterPriorities.join(" · ")}. Only Research is available in Window 1; Pilot requires research evidence and Scale requires pilot evidence plus its declared gate.</div>
          <button type="button" onClick={() => moveTo("commit")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white">Continue with {priority?.displayName || "selected priority"} <ArrowRight size={17} /></button>
        </section>}

        {phase === "commit" && priority && <section className="rounded-3xl border border-ink/10 bg-white p-6" aria-labelledby="v3-commit-title">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Authorise Research</p>
          <h1 id="v3-commit-title" className="mt-2 text-3xl font-semibold">{priority.displayName}</h1>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-mist p-4"><p className="text-xs text-ink/50">Commitment</p><b className="mt-1 block">₹{priority.costInrCr.toFixed(2)} Cr</b></div><div className="rounded-xl bg-mist p-4"><p className="text-xs text-ink/50">Timing</p><b className="mt-1 block">Q1 activity · Q2 signal</b></div><div className="rounded-xl bg-mist p-4"><p className="text-xs text-ink/50">Owner</p><b className="mt-1 block">{priority.owner}</b></div></div>
          <div className="mt-5 rounded-2xl border border-teal-300/30 bg-teal-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-teal-800">Evidence used</p><div className="mt-3 flex flex-wrap gap-2">{priority.evidenceIds.map((id) => <button key={id} type="button" aria-pressed={selectedEvidence.includes(id)} onClick={() => toggleEvidence(id)} className={`rounded-full border px-3 py-2 text-xs font-bold ${selectedEvidence.includes(id) ? "border-teal-700 bg-teal-700 text-white" : "border-teal-700/20 bg-white text-teal-900"}`}>{id} {selectedEvidence.includes(id) ? "· selected" : "· cite"}</button>)}</div></div>
          <div className="mt-5"><p className="text-sm font-bold">Your prediction</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{[["pilot-ready-with-conditions", "Evidence will support a constrained Pilot"], ["remediation-required", "Evidence will require remediation"], ["priority-not-supported", "Evidence will show this is not actionable"]].map(([value, label]) => <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${prediction === value ? "border-ink bg-ink/5" : "border-ink/10"}`}><input type="radio" name="v3-prediction" value={value} checked={prediction === value} onChange={() => setPrediction(value)} />{label}</label>)}</div></div>
          <label className="mt-5 block text-sm font-bold">Optional note<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm font-normal" placeholder="What must be true?" /></label>
          <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-ink/65"><b>This does not change yet:</b> {priority.boundary}</div>
          <button type="button" onClick={commit} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white">Confirm research <ArrowRight size={17} /></button>
        </section>}

        {phase === "outcome" && <section className="rounded-3xl border border-ink/10 bg-white p-6" aria-labelledby="v3-outcome-title">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald">Window 1 research review</p>
          {resolution?.accepted ? <><div className="mt-5 rounded-2xl border border-emerald/20 bg-emerald/5 p-5"><p className="font-bold text-emerald">What changed</p><ul className="mt-3 space-y-2 text-sm text-ink/65"><li>• {priority?.displayName} moved from Deferred to Research.</li><li>• ₹{priority?.costInrCr.toFixed(2)} Cr was committed; declared Q1 capacity is recorded and the Q2 signal was reviewed.</li><li>• Evidence, prediction, and the resolver-authored result are stored in the decision ledger.</li></ul></div><div className="mt-4 rounded-2xl border border-teal-300/30 bg-teal-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-teal-800">Window 1 Research finding</p><h2 className="mt-2 text-xl font-bold">{resolution.researchReview?.branch === "pilot-ready-with-conditions" ? "Pilot-ready with conditions" : resolution.researchReview?.branch === "remediation-required" ? "Remediation required" : resolution.researchReview?.branch === "priority-not-supported" ? "Priority not supported" : "Signal is still in progress"}</h2><p className="mt-2 text-sm leading-6 text-ink/65">{resolution.researchReview?.outcome?.decisionUse || "The authored Research signal has not produced a final finding yet."}</p>{resolution.researchReview?.outcome?.facts?.length ? <ul className="mt-3 space-y-1 text-sm text-ink/65">{resolution.researchReview.outcome.facts.map((fact) => <li key={fact}>• {fact}</li>)}</ul> : null}</div><div className="mt-4 rounded-2xl border border-ink/10 bg-mist p-5"><p className="font-bold">What did not change</p><p className="mt-2 text-sm text-ink/65">Operating metrics did not improve because Research evaluates evidence; it does not deploy an operating intervention. The signal is available in Q2 and the board review is at the end of Q3.</p></div><div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-50 p-5 text-sm text-ink/65"><b>Uncertainty:</b> {resolution.researchReview?.outcome?.unresolvedConditions?.join(" ") || priority?.boundary}</div></> : <div className="mt-5 rounded-2xl border border-crimson/20 bg-crimson/5 p-5 text-sm text-crimson">{resolution?.errors.map((error) => error.message).join(" ") || "The decision was not accepted."}</div>}
          <button type="button" onClick={() => moveTo("reflect")} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white">Reflect on outcome <ArrowRight size={17} /></button>
        </section>}

        {phase === "reflect" && <section className="rounded-3xl border border-ink/10 bg-white p-6" aria-labelledby="v3-reflect-title">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">One-minute reflection</p>
          <h1 id="v3-reflect-title" className="mt-2 text-3xl font-semibold">What condition matters before Pilot?</h1>
          <p className="mt-4 text-sm text-ink/60">You predicted: <b>{prediction.replace(/-/g, " ")}</b>. The resolver recorded the result independently of that prediction.</p>
          <textarea aria-label="Window 1 reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} rows={4} className="mt-5 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm" placeholder="Name the most important condition you would require before Pilot." />
          <p className="mt-3 text-xs text-ink/50">Reflection is for the debrief only. It does not change the scenario outcome.</p>
          <div className="mt-7 flex gap-3"><button type="button" onClick={() => { const entryId = resolution?.state?.ledger.at(-1)?.id; if (entryId) onReflect(entryId, ""); moveTo("next"); }} className="rounded-xl border border-ink/10 px-5 py-4 text-sm font-bold">Skip</button><button type="button" onClick={() => { const entryId = resolution?.state?.ledger.at(-1)?.id; if (entryId) onReflect(entryId, reflection); moveTo("next"); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold">Save and continue <ArrowRight size={17} /></button></div>
        </section>}

        {phase === "next" && <section className="rounded-3xl border border-ink/10 bg-white p-6" aria-labelledby="v3-next-title">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Enter Window {currentWindow.number + 1}</p>
          <h1 id="v3-next-title" className="mt-2 text-3xl font-semibold">Your Research decision is carried forward.</h1>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-mist p-4"><p className="text-xs text-ink/50">Lifecycle</p><b className="mt-1 block">Research</b></div><div className="rounded-xl bg-mist p-4"><p className="text-xs text-ink/50">Next evidence</p><b className="mt-1 block">Signal in Q2 · review Q3</b></div><div className="rounded-xl bg-mist p-4"><p className="text-xs text-ink/50">Capital remaining</p><b className="mt-1 block">₹{Number(budgetRemaining).toFixed(2)} Cr</b></div></div>
          <p className="mt-5 rounded-2xl border border-ink/10 bg-mist p-4 text-sm text-ink/65">Window 2 will ask whether to Pilot, remediate, defer, or stop based on the Research evidence. The active-play sidecar remains out of the decision path.</p>
          <button type="button" onClick={() => onNextWindow(currentWindow.range[1] + 1)} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white">Enter Window {currentWindow.number + 1} <ArrowRight size={17} /></button>
        </section>}
      </div>
    </main>
  );
}
