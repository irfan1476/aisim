import { Check, Factory, Sparkles } from 'lucide-react';
import { scenarioList } from '../lib/scenarios/registry';
import type { CurrencyMode } from '../lib/scenarios/types';

interface Props {
  enabled: boolean;
  scenarioId: string;
  currency: CurrencyMode;
  campaignBudget?: number;
  onEnabledChange: (enabled: boolean) => void;
  onScenarioChange: (scenarioId: string) => void;
  onCurrencyChange: (currency: CurrencyMode) => void;
}

export default function ScenarioSelector({
  enabled,
  scenarioId,
  currency,
  campaignBudget = 60,
  onEnabledChange,
  onScenarioChange,
  onCurrencyChange,
}: Props) {
  const scenario = scenarioList.find((item) => item.id === scenarioId) || scenarioList[0];
  const budgetSummary = `Campaign purse: ${currency}${campaignBudget.toFixed(0)}${currency === '$' ? 'M' : ' Cr'} · recommended pace ${currency}${(campaignBudget / 12).toFixed(0)}${currency === '$' ? 'M' : ' Cr'} / quarter`;

  const currencyButtons = (
    <div className="flex gap-2" role="group" aria-label="Display currency">
      <button type="button" onClick={() => onCurrencyChange('$')} aria-pressed={currency === '$'} className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${currency === '$' ? 'border-emerald bg-emerald text-white' : 'border-ink/20 bg-white text-ink hover:border-emerald'}`}>$ USD</button>
      <button type="button" onClick={() => onCurrencyChange('₹')} aria-pressed={currency === '₹'} className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${currency === '₹' ? 'border-emerald bg-emerald text-white' : 'border-ink/20 bg-white text-ink hover:border-emerald'}`}>₹ INR</button>
    </div>
  );

  return (
    <section className="mt-0 min-w-0 rounded-2xl border border-ink/15 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Choose your operating world</p>
          <h2 className="mt-2 text-xl font-bold">How do you want to practice?</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-ink/60">Start with a domain challenge for the full living simulation, or use Standard Mode for open practice.</p>
        </div>
        <span className="hidden rounded-full bg-emerald/10 px-3 py-1 text-[11px] font-bold text-emerald sm:inline-flex">{enabled ? 'Scenario selected' : 'Standard selected'}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group" aria-label="Operating mode">
        <button type="button" aria-pressed={!enabled} onClick={() => onEnabledChange(false)} className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald/40 ${!enabled ? 'border-ink bg-ink text-white shadow-md' : 'border-ink/15 bg-mist/50 text-ink hover:border-ink/35'}`}>
          <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className={`break-words text-[10px] font-bold uppercase tracking-widest ${!enabled ? 'text-gold' : 'text-ink/45'}`}>Standard mode</p><h3 className="mt-2 break-words font-bold">Open practice</h3></div><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${!enabled ? 'border-gold bg-gold text-ink' : 'border-ink/25'}`}>{!enabled && <Check size={14} />}</span></div>
          <p className={`mt-2 text-xs leading-5 ${!enabled ? 'text-white/65' : 'text-ink/55'}`}>The original Project Factory experience. Explore the operating model without a domain-specific challenge.</p>
        </button>

        <button type="button" aria-pressed={enabled} onClick={() => onEnabledChange(true)} className={`rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald/40 ${enabled ? 'border-emerald bg-emerald/10 shadow-md ring-2 ring-emerald/20' : 'border-emerald/35 bg-emerald/[.03] text-ink hover:border-emerald'}`}>
          <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="break-words text-[10px] font-bold uppercase tracking-widest text-emerald">Scenario mode</p><span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-ink/70">Recommended first run</span></div><h3 className="mt-2 break-words font-bold">A live operating challenge</h3></div><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${enabled ? 'border-emerald bg-emerald text-white' : 'border-emerald/45'}`}>{enabled && <Check size={14} />}</span></div>
          <p className="mt-2 text-xs leading-5 text-ink/60">Face domain-specific pressures, scenario metrics, evolving risk, and a richer evidence trail to reflect on.</p>
        </button>
      </div>

      {enabled ? (
        <div className="scenario-active-panel mt-5 rounded-xl border p-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2"><Factory size={17} className="shrink-0 text-gold" /><label htmlFor="scenario-select" className="sr-only">Choose scenario</label><select id="scenario-select" value={scenario.id} onChange={(event) => onScenarioChange(event.target.value)} className="min-w-0 max-w-full flex-1 rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm font-bold text-ink outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20 sm:flex-none"><option value={scenario.id}>{scenario.name}</option>{scenarioList.filter((item) => item.id !== scenario.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><span className="shrink-0 rounded-full bg-gold/15 px-2 py-1 text-[10px] font-bold text-ink/70">{scenario.difficulty}</span></div>
          <p className="mt-2 text-sm leading-6 text-ink/65">{scenario.description}</p>
          <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">{scenario.challenges.map((challenge) => <div key={challenge.id} className="min-w-0 rounded-lg bg-white/75 p-3 text-xs text-ink"><b className="break-words">{challenge.label}</b><span className="ml-1 inline-block break-words text-gold">{challenge.severity}</span><p className="mt-1 break-words text-ink/60">{challenge.description}</p></div>)}</div>
          <div className="mt-4 flex min-w-0 flex-col items-start gap-3 border-t border-ink/10 pt-4 sm:flex-row sm:items-start sm:justify-between"><span className="min-w-0 max-w-full break-words text-xs font-bold leading-5 text-ink/65">{budgetSummary}</span><div className="flex shrink-0 flex-wrap gap-2">{currencyButtons}</div></div>
          <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-ink/55"><Sparkles size={14} className="mt-0.5 shrink-0 text-emerald" />The scenario is designed to be replayed: compare how different choices change the operating story.</p>
        </div>
      ) : (
        <div className="mt-4 flex min-w-0 flex-col items-start gap-3 border-t border-ink/10 pt-4 sm:flex-row sm:items-start sm:justify-between"><span className="min-w-0 break-words text-xs leading-5 text-ink/55">{budgetSummary}</span>{currencyButtons}</div>
      )}
    </section>
  );
}
