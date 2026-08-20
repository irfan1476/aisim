"use client";
import { ArrowRight, CheckCircle2, GitBranch, Lightbulb } from "lucide-react";
import type { GameViewState } from "./gameViewTypes";
import ReflectionCard from "./ReflectionCard";
import { calculateReflection } from "../lib/reflection";
import type { UserReflections } from "../lib/game/state";
interface Props {
  state: GameViewState;
  onRespond: (impact: Record<string, number>, cost?: number) => void;
  onAdvance: () => void;
  onApproveRecommendation: (title: string) => void;
  onSaveReflection: (value: Partial<UserReflections>) => void;
}
export default function GameResultsModal({
  state,
  onRespond,
  onAdvance,
  onApproveRecommendation,
  onSaveReflection,
}: Props) {
  if (state.stage !== "results") return null;
  const recommendations = state.proactiveRecommendations as any[];
  const approved = new Set(state.approvedRecommendations || []);
  const reflection = calculateReflection(state as any);
  return (
    <div
      data-testid="quarter-results"
      className="fixed inset-0 z-20 flex items-end justify-center bg-ink/45 p-4 sm:items-center"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-gold">
          Quarter {state.q} results
        </p>
        <h2 className="mt-2 text-3xl font-semibold">
          The operating system responded.
        </h2>
        <p className="mt-4 leading-7 text-ink/60">{state.feedback}</p>
        {state.crisis ? (
          <div className="mt-6 rounded-2xl border border-crimson/15 bg-crimson/5 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-crimson">
              {state.crisis.type}
            </p>
            <p className="mt-2 text-lg font-bold">{state.crisis.title}</p>
            <p className="mt-2 text-sm text-ink/60">{state.crisis.text}</p>
            <div className="mt-4 grid gap-2">
              {state.crisis.options.map((option) => (
                <button
                  key={option[0]}
                  onClick={() => onRespond(option[2], option[3])}
                  className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-3 text-left text-sm"
                >
                  <span>
                    <b>{option[0]}</b>
                    <span className="ml-2 text-ink/50">{option[1]}</span>
                    {option[3] ? <span className="ml-2 text-xs font-bold text-crimson">Cost {option[3]}</span> : null}
                  </span>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ["ROI", `${state.roi.toFixed(1)}%`],
                ["Adoption", `${state.adoption.toFixed(0)}%`],
                ["Risk", `${state.risk.toFixed(0)}%`],
              ].map((metric) => (
                <div key={metric[0]} className="rounded-xl bg-mist p-4">
                  <p className="text-xs text-ink/40">{metric[0]}</p>
                  <b className="mt-1 block text-xl">{metric[1]}</b>
                </div>
              ))}
            </div>
            <section className="mt-6 rounded-2xl border border-emerald/20 bg-emerald/5 p-5">
              <div className="flex items-center gap-2">
                <GitBranch size={17} className="text-emerald" />
                <b>What caused this result?</b>
              </div>
              {state.causalChain.length ? (
                <div className="mt-3 space-y-2">
                  {state.causalChain.slice(0, 4).map((item: any) => (
                    <div
                      key={item.name}
                      className="rounded-xl bg-white p-3 text-sm"
                    >
                      <b>{item.name}</b>
                      <span className="ml-2 text-ink/55">
                        {item.effects
                          ?.map(
                            (effect: any) =>
                              `${effect.metric} ${effect.delta > 0 ? "+" : ""}${Number(effect.delta).toFixed(1)}%`,
                          )
                          .join(" · ")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink/55">
                  The causal chain will appear after the next decision.
                </p>
              )}
            </section>
            <section className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-5">
              <div className="flex items-center gap-2">
                <Lightbulb size={17} className="text-gold" />
                <b>Top recommendations</b>
              </div>
              {recommendations.length ? (
                <div className="mt-3 space-y-2">
                  {recommendations.slice(0, 3).map((rec: any) => (
                    <div key={rec.title} className="rounded-xl bg-white p-3">
                      <b className="text-sm">{rec.title}</b>
                      <p className="mt-1 text-xs leading-5 text-ink/55">
                        {rec.message}
                      </p>
                      <p className="mt-2 text-xs font-bold text-ink/60">
                        Next: {rec.action} · {rec.metric}
                      </p>
                      <button
                        onClick={() => onApproveRecommendation(rec.title)}
                        className={`mt-3 rounded-lg px-3 py-2 text-xs font-bold ${approved.has(rec.title) ? "bg-emerald/15 text-emerald" : "bg-ink text-white"}`}
                      >
                        {approved.has(rec.title)
                          ? "✓ Approved for next decision"
                          : "Approve recommendation"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink/55">
                  No immediate recommendation overrides the current plan.
                </p>
              )}
            </section>
            {(state.q === 1 || state.q === 6) && (
              <ReflectionCard
                quarter={state.q as 1 | 6}
                reflection={reflection}
                userReflections={state.userReflections || {}}
                onSave={onSaveReflection}
              />
            )}
            <button
              onClick={onAdvance}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white"
            >
              <CheckCircle2 size={16} />
              {state.q >= 12
                ? "View final verdict"
                : "Continue to next quarter"}{" "}
              <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
