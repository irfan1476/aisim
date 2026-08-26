type PanelVariant = "scenario" | "capital" | "experiment" | "replay";

type HomepageVisualPanelsProps = {
  variant: PanelVariant;
  className?: string;
};

const panelCopy: Record<PanelVariant, { eyebrow: string; title: string; note: string }> = {
  scenario: {
    eyebrow: "SCENARIO CONTEXT",
    title: "Start with the pressure, not the answer.",
    note: "The same decision system behaves differently when the operating reality changes.",
  },
  capital: {
    eyebrow: "CAPITAL + LIFECYCLE",
    title: "Every dollar has a job.",
    note: "Release, run, scale, pause, and retire initiatives with the full commitment in view.",
  },
  experiment: {
    eyebrow: "EXPERIMENT + REFLECTION",
    title: "A miss becomes a better next move.",
    note: "Score the learning, name the evidence, and turn uncertainty into a testable hypothesis.",
  },
  replay: {
    eyebrow: "EVIDENCE + REPLAY",
    title: "Keep the context. Change the thesis.",
    note: "Compare the campaign you ran with the one you would run now.",
  },
};

function Meter({ label, value, progress }: { label: string; value: string; progress: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="font-semibold uppercase tracking-[.14em] text-white/50">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/10">
        <div className="h-1 rounded-full bg-[#3fb950]" style={{ width: progress }} />
      </div>
    </div>
  );
}

function ScenarioPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-[1.08fr_.92fr]">
      <div className="rounded-xl border border-white/10 bg-[#161b22] p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7ee787]">ACTIVE WORLD</span>
          <span className="rounded bg-[#3fb950]/15 px-2 py-1 text-[10px] font-bold text-[#7ee787]">01 / 04</span>
        </div>
        <p className="mt-4 text-xl font-bold text-white">Responsible AI in the enterprise</p>
        <p className="mt-2 text-xs leading-5 text-white/55">Governance, trust, and adoption move together.</p>
        <div className="mt-5 space-y-3">
          <Meter label="Capability" value="Building" progress="58%" />
          <Meter label="Data readiness" value="Watch" progress="41%" />
          <Meter label="Governance" value="Required" progress="67%" />
        </div>
      </div>
      <div className="space-y-3">
        {[
          ["Public sector", "Trust under scrutiny"],
          ["Financial services", "Control the downside"],
          ["Retail growth", "Move before the market"],
        ].map(([name, detail], index) => (
          <div key={name} className={`rounded-xl border p-3 ${index === 0 ? "border-[#3fb950]/60 bg-[#3fb950]/10" : "border-white/10 bg-[#161b22]"}`}>
            <p className="text-xs font-bold text-white">{name}</p>
            <p className="mt-1 text-[11px] text-white/50">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CapitalPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-[.85fr_1.15fr]">
      <div className="rounded-xl border border-white/10 bg-[#161b22] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7ee787]">CAMPAIGN PURSE</p>
        <p className="mt-3 text-3xl font-bold text-white">$60M</p>
        <p className="mt-1 text-xs text-white/50">12-quarter release envelope</p>
        <div className="mt-5 space-y-3">
          <Meter label="Committed" value="$28.4M" progress="47%" />
          <Meter label="Available" value="$31.6M" progress="53%" />
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-[#161b22] p-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-[.18em] text-white/50">PORTFOLIO LEDGER</span>
          <span className="text-[10px] font-bold text-[#7ee787]">Q4 / 12</span>
        </div>
        <div className="mt-3 space-y-2 text-xs">
          {[
            ["Pilot · Knowledge copilot", "$2.8M", "PILOT"],
            ["Scale · Service automation", "$11.6M", "SCALE"],
            ["Run · Forecasting", "$4.2M", "RUN"],
          ].map(([name, amount, state]) => (
            <div key={name} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-3">
              <span className="min-w-0 truncate text-white/75">{name}</span>
              <span className="shrink-0 font-bold text-white">{amount}</span>
              <span className="hidden shrink-0 rounded bg-[#3fb950]/15 px-2 py-1 text-[9px] font-bold text-[#7ee787] sm:inline">{state}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
          <span className="text-white/50">Next commitment</span>
          <span className="font-bold text-[#7ee787]">$6.1M · fully priced</span>
        </div>
      </div>
    </div>
  );
}

function ExperimentPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-[1.12fr_.88fr]">
      <div className="rounded-xl border border-white/10 bg-[#161b22] p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[.18em] text-white/50">Q4 READOUT</span>
          <span className="rounded bg-[#3fb950]/15 px-2 py-1 text-[10px] font-bold text-[#7ee787]">EVIDENCE LOGGED</span>
        </div>
        <p className="mt-4 text-lg font-bold text-white">Adoption lagged the thesis.</p>
        <p className="mt-2 text-xs leading-5 text-white/55">The pilot improved cycle time, but trust gates slowed usage.</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[["Learning", "4 / 5"], ["Confidence", "+12%"], ["Next test", "Trust"]].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-[9px] font-bold uppercase tracking-[.12em] text-white/45">{label}</p>
              <p className="mt-2 text-sm font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-[#3fb950]/50 bg-[#3fb950]/10 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7ee787]">REFLECTION PROMPT</p>
        <p className="mt-3 text-base font-bold leading-6 text-white">What would you change before scaling?</p>
        <div className="mt-4 space-y-2 text-xs text-white/70">
          {["Keep the signal", "Stop the assumption", "Test one constraint"].map((item, index) => (
            <div key={item} className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1117]/40 p-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3fb950] text-[10px] font-bold text-[#0d1117]">{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReplayPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div className="rounded-xl border border-white/10 bg-[#161b22] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">RUN A · ACTUAL</p>
        <p className="mt-3 text-sm font-bold text-white">Scale early</p>
        <div className="mt-4 space-y-2 text-xs text-white/60">
          <div className="flex justify-between"><span>Realised ROI</span><b className="text-white">+8.4%</b></div>
          <div className="flex justify-between"><span>Adoption</span><b className="text-white">67%</b></div>
          <div className="flex justify-between"><span>Risk</span><b className="text-white">24%</b></div>
        </div>
      </div>
      <div className="flex h-10 w-10 items-center justify-center self-center rounded-full border border-[#3fb950]/60 text-xl text-[#7ee787]">↔</div>
      <div className="rounded-xl border border-[#3fb950]/60 bg-[#3fb950]/10 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7ee787]">RUN B · REPLAY</p>
        <p className="mt-3 text-sm font-bold text-white">Pilot one quarter longer</p>
        <div className="mt-4 space-y-2 text-xs text-white/70">
          <div className="flex justify-between"><span>Projected ROI</span><b className="text-white">+11.2%</b></div>
          <div className="flex justify-between"><span>Adoption</span><b className="text-white">74%</b></div>
          <div className="flex justify-between"><span>Risk</span><b className="text-white">18%</b></div>
        </div>
      </div>
    </div>
  );
}

export default function HomepageVisualPanels({ variant, className = "" }: HomepageVisualPanelsProps) {
  const copy = panelCopy[variant];
  const content = variant === "scenario" ? <ScenarioPanel /> : variant === "capital" ? <CapitalPanel /> : variant === "experiment" ? <ExperimentPanel /> : <ReplayPanel />;
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[#30363d] bg-[#0d1117] p-4 text-white shadow-2xl sm:p-6 ${className}`} aria-label={`${copy.eyebrow.toLowerCase()} product visual`}>
      <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#3fb950]/10 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#3fb950]">{copy.eyebrow}</p>
            <h3 className="mt-2 max-w-xl text-lg font-bold tracking-[-.02em] sm:text-xl">{copy.title}</h3>
          </div>
          <span className="hidden shrink-0 rounded-md bg-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white/65 sm:inline">Live model</span>
        </div>
        <div className="mt-5">{content}</div>
        <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/45">{copy.note}</p>
      </div>
    </div>
  );
}

