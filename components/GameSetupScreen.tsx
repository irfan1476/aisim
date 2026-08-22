import { ArrowRight, Factory } from 'lucide-react';
import ScenarioSelector from './ScenarioSelector';
import type { CurrencyMode } from '../lib/scenarios/types';

interface GameSetupScreenProps {
  name: string;
  experimental: boolean;
  scenarioMode: boolean;
  scenarioId: string;
  currencyMode: CurrencyMode;
  campaignBudget: number;
  onNameChange: (name: string) => void;
  onExperimentalChange: (experimental: boolean) => void;
  onScenarioModeChange: (enabled: boolean) => void;
  onScenarioChange: (scenarioId: string) => void;
  onCurrencyChange: (currency: CurrencyMode) => void;
  onCampaignBudgetChange: (budget: number) => void;
  onContinue: () => void;
}

export default function GameSetupScreen({
  name, experimental, scenarioMode, scenarioId, currencyMode, campaignBudget,
  onNameChange, onExperimentalChange, onScenarioModeChange, onScenarioChange, onCurrencyChange, onCampaignBudgetChange, onContinue,
}: GameSetupScreenProps) {
  return (
    <main className="min-h-screen grid-bg">
      <header className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink font-bold text-gold">AI</div>
        <b className="text-sm tracking-[.18em]">THE AI INVESTMENT CHALLENGE</b>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-7">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-ink/10 pb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-gold">Executive simulation · 01</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-.06em] sm:text-6xl">Set up your <span className="serif italic text-gold">campaign.</span></h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-ink/55">Choose your operating world, add your name, then answer five baseline questions. Your decisions shape what happens next.</p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(250px,.72fr)_minmax(0,1.28fr)] lg:items-start">
          <aside className="rounded-3xl bg-ink p-7 text-white lg:sticky lg:top-6">
            <div className="flex items-center gap-3 text-gold"><Factory size={20} /><span className="text-xs font-bold uppercase tracking-widest">How the campaign works</span></div>
            <p className="mt-5 text-xl leading-8">Allocate. Observe. Reflect. Adapt.</p>
            <p className="mt-3 text-sm leading-6 text-white/60">Across twelve quarters, fund up to three bets, respond to pressure, and learn how capability, risk, and adoption move together.</p>
            <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">{[['12', 'quarters'], ['3', 'bets / quarter'], ['1', 'board verdict']].map(([value, label]) => <div key={label}><b className="text-lg">{value}</b><p className="mt-1 text-[11px] leading-4 text-white/45">{label}</p></div>)}</div>
          </aside>

          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-7 xl:grid-cols-[.72fr_1.28fr] xl:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/45">Your profile</p>
                <label className="mt-6 block text-sm font-bold" htmlFor="player-name">Name <span className="font-normal text-ink/40">(optional)</span></label>
                <input id="player-name" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="e.g. Priya Sharma" className="mt-2 w-full rounded-xl border border-ink/10 bg-mist px-4 py-3 outline-none focus:border-gold" />
                <label className="mt-5 flex items-center gap-3 rounded-xl bg-mist p-3 text-sm"><input type="checkbox" checked={experimental} onChange={(event) => onExperimentalChange(event.target.checked)} className="accent-[#D4AF37]" /><span><b>Experimental mode</b><small className="block text-ink/50">Practice hypotheses with softened consequences.</small></span></label>
                <div className="mt-6 rounded-xl border border-ink/8 bg-mist/60 p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-ink/45">Campaign purse</p><p className="mt-1 text-sm text-ink/60">One finite budget across all 12 quarters.</p></div><b className="text-lg text-ink">{currencyMode}{campaignBudget.toFixed(0)}{currencyMode === '$' ? 'M' : ' Cr'}</b></div>
                  <input aria-label="Total campaign budget" type="range" min="48" max="180" step="12" value={campaignBudget} onChange={(event) => onCampaignBudgetChange(Number(event.target.value))} className="mt-4 w-full accent-[#D4AF37]" />
                  <div className="mt-2 flex justify-between text-[11px] text-ink/45"><span>{currencyMode}48{currencyMode === '$' ? 'M' : ' Cr'}</span><span>Suggested pace: {currencyMode}{(campaignBudget / 12).toFixed(0)}{currencyMode === '$' ? 'M' : ' Cr'} / quarter</span><span>{currencyMode}180{currencyMode === '$' ? 'M' : ' Cr'}</span></div>
                </div>
                <div className="mt-6 rounded-xl border border-ink/8 bg-mist/60 p-4 text-sm leading-6 text-ink/60"><b className="text-ink">What you will learn</b><p className="mt-1">How funding choices compound into operating outcomes, trade-offs, and board confidence.</p></div>
              </div>

              <ScenarioSelector enabled={scenarioMode} scenarioId={scenarioId} currency={currencyMode} campaignBudget={campaignBudget} onEnabledChange={onScenarioModeChange} onScenarioChange={onScenarioChange} onCurrencyChange={onCurrencyChange} />
            </div>

            <div className="mt-7 flex flex-col gap-4 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-sm leading-6 text-ink/55">The baseline assessment personalises your starting conditions. No account is required, and you can review the consequences after every quarter.</p><button onClick={onContinue} className="flex shrink-0 items-center justify-center gap-3 rounded-xl bg-ink px-5 py-4 text-sm font-bold text-white transition hover:bg-ink/90">Take the baseline assessment <ArrowRight size={16} /></button></div>
          </div>
        </div>
      </section>
    </main>
  );
}
