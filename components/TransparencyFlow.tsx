import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
} from "lucide-react";

const flow = [
  [
    "01 · Context",
    "A unique campaign begins",
    "Five baseline answers shape organisation, data, and team maturity. A reproducible campaign fingerprint varies initiative cost, ROI, readiness, and risk without asking you to choose a strategy label.",
  ],
  [
    "02 · Decision",
    "You make the trade-off",
    "Choose up to three initiatives and divide the quarterly budget across infrastructure, data, people, MLOps, governance, and innovation.",
  ],
  [
    "03 · Evolution",
    "The portfolio responds",
    "Funded initiatives learn, mature, become safer, and can cost less. Unfunded initiatives accumulate risk; sustained neglect erodes data, ROI, and maturity.",
  ],
  [
    "04 · Memory",
    "Evidence carries forward",
    "The campaign stores allocations, initiative states, spend, risk, and discovered combinations. All 12 quarters contribute to your final strategic pattern and CEO verdict.",
  ],
];

const mechanics = [
  [
    "Fund consistently",
    "ROI, data, human capability, and maturity can improve.",
  ],
  [
    "Neglect deliberately",
    "Risk rises first; prolonged neglect also weakens capability and value.",
  ],
  [
    "Govern continuously",
    "Compliance investment reduces initiative and portfolio risk every quarter.",
  ],
  [
    "Discover combinations",
    "Compatible initiatives can improve ROI, adoption, risk, and delivery cost together.",
  ],
];

export default function TransparencyFlow() {
  return (
    <div className="mt-16 rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-[#08872b]">
        Inside the living simulation
      </p>
      <h3 className="mt-3 text-3xl font-bold tracking-[-.03em]">
        The same portfolio evolves from quarter to quarter.
      </h3>
      <p className="mt-4 max-w-3xl leading-7 text-[#656d76]">
        This is not a sequence of disconnected scorecards. Each decision updates
        persistent initiative states, and the next quarter begins with the
        capability, risk, cost, and momentum created by your earlier choices.
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        {flow.map(([eyebrow, title, copy], index) => (
          <div
            key={title}
            className="relative rounded-xl border border-[#d0d7de] bg-white p-5"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[#08872b]">
              {eyebrow}
            </p>
            <h4 className="mt-2 font-bold">{title}</h4>
            <p className="mt-2 text-sm leading-6 text-[#656d76]">{copy}</p>
            {index < flow.length - 1 && (
              <>
                <ArrowRight
                  size={16}
                  className="absolute -right-3 top-1/2 hidden text-[#08872b] lg:block"
                />
                <ArrowDown
                  size={16}
                  className="mx-auto mt-4 text-[#08872b] lg:hidden"
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-[#0969da]/20 bg-[#ddf4ff] p-5">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-[#0969da]" size={20} />
          <div>
            <p className="font-bold text-[#0550ae]">Fair and reproducible</p>
            <p className="mt-1 text-sm leading-6 text-[#424a53]">
              Quarter results use the exact initiative values shown before you
              confirm. The campaign fingerprint and full evolution state are
              saved, so refreshing does not quietly replace the scenario.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {mechanics.map(([title, copy]) => (
          <div
            key={title}
            className="rounded-xl border border-[#d0d7de] bg-white p-4"
          >
            <CheckCircle2 size={16} className="text-[#08872b]" />
            <b className="mt-2 block text-sm">{title}</b>
            <p className="mt-1 text-xs leading-5 text-[#656d76]">{copy}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-[#0d1117] p-5 text-white">
        <div className="flex gap-3">
          <GitBranch className="mt-1 shrink-0 text-[#3fb950]" size={20} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#3fb950]">
              Worked example
            </p>
            <p className="mt-2 text-sm leading-7 text-white/70">
              Fund Predictive Maintenance and AI Visual Quality together, while
              maintaining people and governance investment. Both initiatives
              build maturity, governance continuously lowers their delivery
              risk, and the combination can reinforce ROI, adoption, risk
              reduction, and cost efficiency. Stop funding them for several
              quarters and risk begins to rise before value and readiness start
              to decay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
