import type { ReflectionData } from '../lib/reflection';

interface Props { reflection: ReflectionData }

export default function YouSaidYouDid({ reflection }: Props) {
  const rows = [
    ['Q1 · People enablement', reflection.alignment.people],
    ['Q2 · Risk appetite', reflection.alignment.risk],
    ['Q3 · Governance first', reflection.alignment.governance],
    ['Q4 · Balanced portfolio', reflection.alignment.balance],
    ['Q5 · CFO confidence', reflection.alignment.payback],
  ] as const;
  return <section className="mt-6 rounded-3xl border border-[#d0d7de] bg-white p-6 shadow-sm md:p-8"><h2 className="text-2xl font-bold">You said vs. you did</h2><p className="mt-2 text-[#656d76]">Your opening beliefs beside the decisions and outcomes they shaped.</p><div className="mt-6 space-y-3">{rows.map(([label, item]) => <article key={label} className="rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b>{label}</b><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#656d76]">You said: {item.baseline}/5</span></div><p className="mt-3 text-sm font-semibold text-[#0969da]">You did: {item.observed}{label.includes('People') || label.includes('Governance') ? '%' : label.includes('Risk') ? '% risk exposure' : label.includes('Balanced') ? '% initiative diversity' : '% ROI'}</p><p className="mt-2 text-sm leading-6 text-[#1f2328]">{item.insight}</p><p className="mt-2 text-xs leading-5 text-[#656d76]">Evidence: {item.evidence}</p></article>)}</div></section>;
}
