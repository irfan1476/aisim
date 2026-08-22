import { ArrowRight, BrainCircuit, HelpCircle, ShieldAlert, Wallet } from 'lucide-react';
import { buildBoardAdvisorBrief, type BoardPersona, type BoardAdvisorContext } from '../lib/game/boardAdvisor';

type Props = {
  context: BoardAdvisorContext;
  persona: BoardPersona;
  answer: string;
  question: string;
  isAsking: boolean;
  onPersonaChange: (persona: BoardPersona) => void;
  onQuestionChange: (question: string) => void;
  onAsk: (questionOverride?: string) => void;
};

export default function BoardAdvisor({ context, persona, answer, question, isAsking, onPersonaChange, onQuestionChange, onAsk }: Props) {
  const brief = buildBoardAdvisorBrief(context, persona);
  return (
    <div className="rounded-3xl bg-ink p-5 text-white" data-testid="board-advisor">
      <div className="flex items-center gap-3">
        <BrainCircuit className="text-gold" size={21} />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Board advisor</p>
          <p className="text-sm font-semibold">Ask the room · {brief.scenarioLabel}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {(['CFO', 'CTO', 'CHRO', 'RISK'] as BoardPersona[]).map((item) => (
          <button key={item} onClick={() => onPersonaChange(item)} className={`rounded-lg px-2 py-1.5 text-[10px] font-bold ${persona === item ? 'bg-gold text-ink' : 'bg-white/10 text-white/55'}`}>{item}</button>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-white/10 p-4">
        <p className="text-sm font-semibold leading-6">{brief.headline}</p>
        <p className="mt-2 text-xs leading-5 text-white/65">{brief.lens}</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {brief.evidence.slice(0, 4).map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-3" title={item.explanation}>
            <p className="text-[10px] uppercase tracking-wider text-white/40">{item.label}</p>
            <p className="mt-1 text-xs font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-gold/25 bg-gold/10 p-3">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gold"><ShieldAlert size={13} /> Decision trade-offs</p>
        {brief.tradeoffs.map((item) => <p key={item} className="mt-2 text-xs leading-5 text-white/70">{item}</p>)}
      </div>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/50"><HelpCircle size={13} /> Questions to consider</p>
        <div className="mt-2 space-y-1">
          {brief.suggestedQuestions.map((item) => (
            <button
              key={item}
              type="button"
              disabled={isAsking}
              onClick={() => {
                onQuestionChange(item);
                onAsk(item);
              }}
              className="block text-left text-xs leading-5 text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <input value={question} onChange={(event) => onQuestionChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAsk(); } }} placeholder="Ask a question..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-white outline-none placeholder:text-white/40" />
        <button type="button" aria-label="Ask advisor" disabled={isAsking} onClick={() => onAsk()} className="rounded-xl bg-gold px-3 text-ink"><ArrowRight size={16} /></button>
      </div>
      {(answer || isAsking) && <div data-testid="board-advisor-answer" className="mt-3 whitespace-pre-line rounded-xl border border-emerald/25 bg-emerald/10 p-3 text-xs leading-5 text-white/80">{answer}{isAsking && <p className="mt-2 text-[10px] text-emerald-100/70">Checking whether an optional AI perspective adds anything useful…</p>}</div>}
      <p className="mt-3 flex items-center gap-2 text-[10px] text-white/40"><Wallet size={12} /> Evidence is deterministic; the optional AI only explains it.</p>
    </div>
  );
}
