'use client';
import { ArrowRight, X } from 'lucide-react';
export default function NextQuarterGuidance({ guidance, onApply, onDismiss }: { guidance: { title: string; action: string } | null | undefined; onApply: () => void; onDismiss: () => void }) {
  if (!guidance) return null;
  return <div className="mx-auto max-w-[1500px] px-5 pt-5"><div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm"><span className="rounded-full bg-gold px-2 py-1 text-[10px] font-bold uppercase text-ink">Next-quarter guidance</span><span className="font-bold text-ink">{guidance.title}</span><span className="text-ink/60">{guidance.action}</span><button onClick={onApply} className="ml-auto flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white">Apply suggestion <ArrowRight size={13}/></button><button onClick={onDismiss} aria-label="Dismiss guidance" className="rounded-lg p-2 text-ink/50 hover:bg-ink/10"><X size={15}/></button></div></div>;
}
