import { ArrowRight, BrainCircuit, Eye, Factory, Target, WalletCards } from 'lucide-react';
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

const FLOW_STEPS = [
  { title: 'Choose', description: 'Pick a capability and its next valid action.', icon: Target },
  { title: 'Fund', description: 'Release capital and use the default operating mix.', icon: WalletCards },
  { title: 'See results', description: 'Watch what changed, and what needs more evidence.', icon: Eye },
  { title: 'Learn', description: 'Use the result to refine your next move.', icon: BrainCircuit },
];

export default function GameSetupScreen({
  name,
  experimental,
  scenarioMode,
  scenarioId,
  currencyMode,
  campaignBudget,
  onNameChange,
  onExperimentalChange,
  onScenarioModeChange,
  onScenarioChange,
  onCurrencyChange,
  onCampaignBudgetChange,
  onContinue,
}: GameSetupScreenProps) {
  const campaignBudgetMin = 48;
  const campaignBudgetMax = 180;
  const budgetUnit = currencyMode === '$' ? 'M' : ' Cr';
  const formatPurse = (amount: number) => `${currencyMode}${amount.toFixed(0)}${budgetUnit}`;
  const suggestedQuarterlyPace = campaignBudget / 12;

  return (
    <main className="setup-shell min-h-screen grid-bg">
      <header className="setup-header mx-auto flex max-w-[1380px] items-center gap-3 px-5 py-5 sm:px-8">
        <div className="setup-brand-mark flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-emerald shadow-sm">AI</div>
        <b className="text-xs tracking-[.2em] text-ink sm:text-sm">THE AI INVESTMENT CHALLENGE</b>
      </header>

      <section className="mx-auto max-w-[1380px] px-5 pb-16 pt-8 sm:px-8 lg:pt-10">
        <div className="setup-hero flex flex-wrap items-end justify-between gap-6 border-b border-ink/15 pb-6 lg:gap-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.28em] text-emerald">Executive simulation · 01</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-.07em] text-ink sm:text-6xl lg:text-[4.5rem]">Set up your <span className="italic text-emerald">campaign.</span></h1>
          </div>
          <p className="max-w-lg text-sm leading-6 text-ink/65 lg:pb-1">Choose your operating world, add your name, then answer five baseline questions. Your decisions shape what happens next.</p>
        </div>

        <div className="setup-board mt-6 grid gap-4 xl:grid-cols-[1.05fr_.86fr_1.18fr] xl:items-start">
          <section className="setup-panel setup-rules-panel rounded-[24px] border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3 text-emerald"><Factory size={19} strokeWidth={1.8} /><span className="text-[11px] font-bold uppercase tracking-[.2em]">Campaign rules &amp; flow</span></div>
            <h2 className="mt-5 text-[1.35rem] font-semibold tracking-[-.03em] text-ink">One simple loop. Twelve quarters.</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink/60">Choose, fund, see results, learn. Each quarter makes the next decision clearer.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {FLOW_STEPS.map(({ title, description, icon: Icon }) => (
                <div key={title} className="setup-rule-tile rounded-2xl border border-ink/10 bg-mist/55 p-3.5">
                  <Icon size={18} className="text-emerald" strokeWidth={1.8} />
                  <h3 className="mt-3 text-sm font-bold text-ink">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-ink/58">{description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-ink/10 pt-5">
              {[['12', 'quarters'], ['0–3', 'bets / quarter'], ['1', 'board verdict']].map(([value, label]) => (
                <div key={label} className="min-w-0"><b className="text-xl tracking-[-.04em] text-ink">{value}</b><p className="mt-1 text-[10px] leading-4 text-ink/50">{label}</p></div>
              ))}
            </div>
          </section>

          <section className="setup-panel setup-profile-panel rounded-[24px] border border-ink/15 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[.2em] text-ink/50">Your profile &amp; budget</p>
            <label className="mt-5 block text-sm font-bold text-ink" htmlFor="player-name">Name <span className="font-normal text-ink/45">(optional)</span></label>
            <input id="player-name" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="e.g. Priya Sharma" className="setup-input mt-2 w-full rounded-xl border border-ink/15 bg-mist px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-ink/45 focus:border-emerald focus:ring-2 focus:ring-emerald/15" />
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-mist/70 p-3 text-sm text-ink"><input type="checkbox" checked={experimental} onChange={(event) => onExperimentalChange(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#1A7F37]" /><span><b>Experimental mode</b><small className="mt-0.5 block text-xs leading-5 text-ink/55">Practice hypotheses with softened consequences.</small></span></label>
            <div className="setup-purse-card mt-5 rounded-2xl border border-ink/15 bg-mist/45 p-4">
              <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-ink/50">Campaign purse</p><p className="mt-1 text-xs leading-5 text-ink/60">One finite budget across all 12 quarters.</p></div><b className="shrink-0 text-right text-lg leading-6 tracking-[-.03em] text-ink">{formatPurse(campaignBudget)}</b></div>
              <input aria-label="Total campaign budget" type="range" min={campaignBudgetMin} max={campaignBudgetMax} step="12" value={campaignBudget} onChange={(event) => onCampaignBudgetChange(Number(event.target.value))} className="mt-4 w-full accent-[#1A7F37]" />
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] leading-4 text-ink/55"><span><b className="block uppercase tracking-wide text-ink/45">Minimum purse</b>{formatPurse(campaignBudgetMin)}</span><span className="text-center"><b className="block uppercase tracking-wide text-ink/45">Suggested pace</b><strong className="block text-ink/75">{formatPurse(suggestedQuarterlyPace)} / qtr</strong></span><span className="text-right"><b className="block uppercase tracking-wide text-ink/45">Maximum purse</b>{formatPurse(campaignBudgetMax)}</span></div>
            </div>
            <div className="mt-5 rounded-2xl border border-ink/10 bg-mist/45 p-4 text-sm leading-6 text-ink/60"><b className="text-ink">What you will learn</b><p className="mt-1">How funding choices compound into operating outcomes, trade-offs, and board confidence.</p></div>
          </section>

          <ScenarioSelector className="setup-panel setup-scenario-panel" enabled={scenarioMode} scenarioId={scenarioId} currency={currencyMode} campaignBudget={campaignBudget} onEnabledChange={onScenarioModeChange} onScenarioChange={onScenarioChange} onCurrencyChange={onCurrencyChange} />

          <div className="setup-baseline-card flex flex-col gap-4 rounded-[20px] border border-ink/15 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5 xl:col-start-2 xl:col-span-2"><div className="max-w-2xl"><p className="text-sm font-semibold text-ink">Your starting conditions are a hypothesis.</p><p className="mt-1 text-xs leading-5 text-ink/60">The baseline assessment personalises the campaign before the first decision. No account is required.</p></div><button onClick={onContinue} className="setup-primary-action flex shrink-0 items-center justify-center gap-3 rounded-xl bg-ink px-5 py-3.5 text-sm font-bold text-white transition hover:bg-ink/90 focus:outline-none focus:ring-2 focus:ring-emerald/40 focus:ring-offset-2">Start baseline assessment<ArrowRight size={16} /></button></div>
        </div>
      </section>
    </main>
  );
}
