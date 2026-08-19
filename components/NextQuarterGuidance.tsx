'use client';
import { ArrowRight, X } from 'lucide-react';
export default function NextQuarterGuidance({ guidance, onApply, onDismiss }: { guidance: { title: string; action: string } | null | undefined; onApply: () => void; onDismiss: () => void }) {
  if (!guidance) return null;
  return <div className="mx-auto max-w-[1500px] px-5 pt-5 lg:fixed lg:bottom-24 lg:right-5 lg:z-20 lg:w-[340px] lg:px-0"><div className="rounded-2xl border border-gold/40 bg-gold/10 px-4 py-4 text-sm shadow-lg"><div className="flex items-start justify-between gap-2"><span className="rounded-full bg-gold px-2 py-1 text-[10px] font-bold uppercase text-ink">Next-quarter guidance</span><button onClick={onDismiss} aria-label="Dismiss guidance" className="rounded-lg p-1 text-ink/50 hover:bg-ink/10"><X size={15}/></button></div><p className="mt-3 font-bold text-ink">{guidance.title}</p><p className="mt-1 text-xs leading-5 text-ink/60">{guidance.action}</p><button onClick={onApply} className="mt-3 flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white">Apply suggestion <ArrowRight size={13}/></button></div></div>;
}
