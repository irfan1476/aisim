import { ArrowRight, Brain, CheckCircle2 } from "lucide-react";

const questions = [
  "People enablement is as important as model quality.",
  "I would accept higher risk for faster AI value.",
  "Governance should be funded before scaling AI.",
  "A balanced portfolio beats a single high-ROI bet.",
  "I am confident explaining AI payback to a CFO.",
];

interface GameAssessmentScreenProps {
  assessment: number[];
  onAssessmentChange: (index: number, value: number) => void;
  onComplete: () => void;
  canContinue: boolean;
  analytics: React.ReactNode;
}

export default function GameAssessmentScreen({ assessment, onAssessmentChange, onComplete, canContinue, analytics }: GameAssessmentScreenProps) {
  const answered = assessment.filter((value) => value >= 1 && value <= 5).length;
  const alignment = answered ? Math.round((assessment.reduce((sum, value) => sum + value, 0) / (answered * 5)) * 100) : 0;
  const progress = Math.round((answered / questions.length) * 100);

  return <main className="min-h-screen grid-bg px-4 pb-16 pt-8 sm:px-8 sm:pt-10">
    <section className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.25em] text-[#1a7f37]">Baseline assessment · 02</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-.06em] sm:text-6xl">What is your instinct?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">Rate each statement from 1 (strongly disagree) to 5 (strongly agree). There are no wrong answers—this is the starting hypothesis the campaign will test.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#8c959f] bg-white p-3 shadow-sm">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full p-1" style={{ background: `conic-gradient(#1a7f37 ${alignment}%, #eaeef2 0)` }}>
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white"><b className="text-sm">{alignment}%</b><span className="text-[8px] uppercase tracking-wider text-ink/45">alignment</span></div>
          </div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#1a7f37]">Instinct alignment</p><p className="mt-1 text-sm font-bold text-ink">{answered ? `${answered} of ${questions.length} answered` : "Start your assessment"}</p><p className="mt-1 text-[10px] text-ink/45">Your answers shape the opening conditions.</p></div>
        </div>
      </header>

      <section className="mt-8 overflow-hidden rounded-3xl border border-[#8c959f] bg-white shadow-[0_14px_36px_rgba(31,35,40,.10)]">
        <div className="hidden grid-cols-[minmax(260px,1fr)_repeat(5,minmax(72px,1fr))] items-end gap-3 border-b border-[#d0d7de] bg-[#f6f8fa] px-6 py-4 text-center text-xs font-bold text-ink/70 md:grid"><span className="text-left text-[10px] uppercase tracking-[.16em]">Strategic statement</span><span>1<br/><small className="font-normal">Disagree</small></span><span>2<br/><small className="font-normal">Somewhat disagree</small></span><span>3<br/><small className="font-normal">Neutral</small></span><span>4<br/><small className="font-normal">Somewhat agree</small></span><span>5<br/><small className="font-normal">Agree</small></span></div>
        <div className="divide-y divide-[#d0d7de]">
          {questions.map((question, index) => {
            const selected = assessment[index];
            return <div key={question} data-testid={`baseline-question-${index}`} className="grid gap-4 px-5 py-5 sm:px-7 md:grid-cols-[minmax(260px,1fr)_repeat(5,minmax(72px,1fr))] md:items-center md:gap-3">
              <div className="flex min-w-0 items-start gap-3"><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-[#dafbe1] text-[#1a7f37]" : "bg-[#f6f8fa] text-ink/40"}`}><Brain size={15}/></span><p className="break-words text-sm font-bold leading-5 text-ink">{index + 1}. {question}</p></div>
              <div className="grid grid-cols-5 gap-2 md:contents">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" data-testid={`baseline-${index}-${value}`} aria-label={`${question}: ${value}`} aria-pressed={selected === value} onClick={() => onAssessmentChange(index, value)} className={`min-h-10 rounded-lg border px-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a7f37] focus-visible:ring-offset-2 ${selected === value ? "border-[#1a7f37] bg-[#1a7f37] text-white shadow-[0_5px_12px_rgba(26,127,55,.25)]" : "border-[#8c959f] bg-white text-ink hover:border-[#1a7f37] hover:bg-[#dafbe1]/45"}`}>{value}</button>)}</div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#1a7f37] md:hidden">{selected ? <><CheckCircle2 size={13}/> Recorded: {selected}/5</> : "Choose one response"}</div>
            </div>;
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#d0d7de] bg-[#f6f8fa] px-5 py-4 sm:px-7"><div className="min-w-[220px] flex-1"><div className="flex justify-between text-[10px] font-bold uppercase tracking-[.14em] text-ink/50"><span>Assessment progress</span><span>{answered}/{questions.length}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eaeef2]"><div className="h-full rounded-full bg-[#1a7f37] transition-all" style={{ width: `${progress}%` }}/></div></div><button disabled={!canContinue} onClick={onComplete} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1a7f37] px-6 text-sm font-bold text-white transition hover:bg-[#2da44e] disabled:cursor-not-allowed disabled:opacity-35">Enter the boardroom <ArrowRight size={16}/></button></div>
      </section>
      <p className="mt-4 text-center text-[11px] text-ink/45">Your responses are a hypothesis, not a permanent label. The campaign will show where your decisions confirm or challenge it.</p>
    </section>
    <div className="hidden">{analytics}</div>
  </main>;
}
