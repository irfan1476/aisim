import { RotateCcw } from 'lucide-react';
import type { GameViewState } from './gameViewTypes';

interface GameDoneScreenProps { state: GameViewState; onPlayAgain: () => void; }

export default function GameDoneScreen({ state, onPlayAgain }: GameDoneScreenProps) {
  return <main className="min-h-screen grid-bg p-6"><div className="mx-auto max-w-5xl pt-12"><button onClick={onPlayAgain} className="flex items-center gap-2 text-sm font-bold text-ink/50"><RotateCcw size={16}/> Play again</button><div className="mt-10 rounded-[2rem] bg-ink p-10 text-white"><p className="text-xs font-bold uppercase tracking-widest text-gold">Campaign complete</p><h1 className="mt-4 text-6xl font-semibold tracking-[-.06em]">Your board has a verdict.</h1><div className="mt-10 grid gap-4 md:grid-cols-4">{[['Final score',`${Math.min(100,state.score)}/100`],['CEO rating',state.score>80?'A−':state.score>65?'B+':'C+'],['ROI',`${state.roi.toFixed(1)}%`],['Adoption',`${state.adoption.toFixed(0)}%`]].map(x=><div key={x[0]} className="rounded-2xl bg-white/8 p-5"><p className="text-xs text-white/45">{x[0]}</p><b className="mt-2 block text-3xl">{x[1]}</b></div>)}</div><p className="mt-10 max-w-2xl text-lg leading-8 text-white/65">{state.score>75?'You balanced ambition with the operating system required to make AI valuable.':'You moved the portfolio forward, but your next campaign should make adoption and governance more deliberate.'}</p></div></div></main>;
}
