import { ArrowRight } from 'lucide-react';

const questions = ['People enablement is as important as model quality.','I would accept higher risk for faster AI value.','Governance should be funded before scaling AI.','A balanced portfolio beats a single high-ROI bet.','I am confident explaining AI payback to a CFO.'];

interface GameAssessmentScreenProps {
  assessment: number[];
  onAssessmentChange: (index: number, value: number) => void;
  onComplete: () => void;
  canContinue: boolean;
  analytics: React.ReactNode;
}

export default function GameAssessmentScreen({ assessment, onAssessmentChange, onComplete, canContinue, analytics }: GameAssessmentScreenProps) {
  return <main className="min-h-screen grid-bg p-6"><section className="mx-auto max-w-3xl pt-12"><p className="text-xs font-bold uppercase tracking-[.25em] text-gold">Baseline assessment · 02</p><h1 className="mt-4 text-5xl font-semibold tracking-[-.05em]">What is your instinct?</h1><p className="mt-4 text-ink/55">Rate each statement from 1 (strongly disagree) to 5 (strongly agree). There are no wrong answers.</p><div className="mt-8 space-y-4">{questions.map((question,index)=><div key={question} className="rounded-2xl border border-ink/10 bg-white p-5"><p className="font-semibold">{index+1}. {question}</p><div className="mt-4 grid grid-cols-5 gap-2">{[1,2,3,4,5].map(value=><button key={value} onClick={()=>onAssessmentChange(index,value)} className={`rounded-lg border py-2 text-sm font-bold ${assessment[index]===value?'border-gold bg-gold text-ink':'border-ink/10 bg-mist text-ink/60'}`}>{value}</button>)}</div></div>)}</div><button disabled={!canContinue} onClick={onComplete} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white disabled:opacity-35">Enter the boardroom <ArrowRight size={16}/></button></section>{analytics}</main>;
}
