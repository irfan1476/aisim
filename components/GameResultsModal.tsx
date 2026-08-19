import { ArrowRight } from 'lucide-react';
import type { GameViewState } from './gameViewTypes';

interface GameResultsModalProps {
  state: GameViewState;
  onRespond: (impact: Record<string, number>) => void;
  onAdvance: () => void;
}

export default function GameResultsModal({ state, onRespond, onAdvance }: GameResultsModalProps) {
  if (state.stage !== 'results') return null;

  return <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/45 p-4 sm:items-center"><div className="w-full max-w-2xl rounded-3xl bg-white p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-gold">Quarter {state.q} results</p><h2 className="mt-2 text-3xl font-semibold">The operating system responded.</h2></div>{state.crisis&&<span className="rounded-full bg-crimson/10 px-3 py-1 text-xs font-bold text-crimson">Crisis event</span>}</div><p className="mt-4 leading-7 text-ink/60">{state.feedback}</p>{state.crisis?<div className="mt-6 rounded-2xl border border-crimson/15 bg-crimson/5 p-5"><p className="text-xs font-bold uppercase tracking-widest text-crimson">{state.crisis.type}</p><p className="mt-2 text-lg font-bold">{state.crisis.title}</p><p className="mt-2 text-sm leading-6 text-ink/60">{state.crisis.text}</p><div className="mt-4 grid gap-2">{state.crisis.options.map(option=><button key={option[0]} onClick={()=>onRespond(option[2])} className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-3 text-left text-sm hover:border-gold"><span><b>{option[0]}</b><span className="ml-2 text-ink/50">{option[1]}</span></span><ArrowRight size={15}/></button>)}</div></div>:<div className="mt-6 grid grid-cols-3 gap-3">{[['ROI',state.roi.toFixed(1)+'%'],['Adoption',state.adoption.toFixed(0)+'%'],['Risk',state.risk.toFixed(0)+'%']].map(metric=><div key={metric[0]} className="rounded-xl bg-mist p-4"><p className="text-xs text-ink/40">{metric[0]}</p><b className="mt-1 block text-xl">{metric[1]}</b></div>)}</div>}{!state.crisis&&<button onClick={onAdvance} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white">{state.q>=12?'View final verdict':'Continue to next quarter'} <ArrowRight size={16}/></button>}</div></div>;
}
