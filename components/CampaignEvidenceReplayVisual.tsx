type CampaignEvidenceReplayVisualProps = {
  title?: string;
  description?: string;
  className?: string;
};

const stages = [
  {
    eyebrow: '12 QUARTERS',
    title: 'Campaign record',
    detail: 'Choices · capital pace · outcomes',
    fill: '#ffffff',
    stroke: '#d0d7de',
    ink: '#1f2328',
  },
  {
    eyebrow: 'AFTER Q12',
    title: 'Final strategy report',
    detail: 'Pattern · trade-offs · evidence',
    fill: '#fff8c5',
    stroke: '#9a6700',
    ink: '#1f2328',
  },
  {
    eyebrow: 'NEXT RUN',
    title: 'Replay and compare',
    detail: 'Keep context · change one move',
    fill: '#ddf4ff',
    stroke: '#0969da',
    ink: '#1f2328',
  },
];

function DesktopDiagram() {
  return (
    <svg
      viewBox="0 0 960 286"
      className="hidden w-full md:block"
      role="img"
      aria-labelledby="campaign-evidence-title"
    >
      <title id="campaign-evidence-title">A campaign becomes a final strategy report and a focused replay</title>
      <desc>
        A three-stage process: a twelve-quarter campaign record becomes a final strategy report, then a replay compares one changed decision against the evidence.
      </desc>
      <defs>
        <marker id="campaign-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#57606a" />
        </marker>
        <marker id="campaign-return-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#0969da" />
        </marker>
      </defs>
      <path d="M 276 143 H 363" fill="none" stroke="#57606a" strokeWidth="1.6" markerEnd="url(#campaign-arrow)" />
      <path d="M 597 143 H 684" fill="none" stroke="#57606a" strokeWidth="1.6" markerEnd="url(#campaign-arrow)" />
      <path
        d="M 808 215 V 252 H 152 V 215"
        fill="none"
        stroke="#0969da"
        strokeWidth="1.4"
        strokeDasharray="5 5"
        markerEnd="url(#campaign-return-arrow)"
      />
      <rect x="390" y="232" width="180" height="24" rx="6" fill="#ffffff" />
      <text x="480" y="248" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1.1" fill="#0969da">
        ONE CHANGED THESIS
      </text>
      {stages.map((stage, index) => {
        const x = [40, 374, 708][index];
        const y = index === 1 ? 54 : 86;
        const width = index === 1 ? 212 : 212;
        const height = index === 1 ? 174 : 114;
        const titleY = index === 1 ? y + 79 : y + 58;
        const detailY = index === 1 ? y + 107 : y + 83;
        return (
          <g key={stage.title}>
            <rect x={x} y={y} width={width} height={height} rx="10" fill={stage.fill} stroke={stage.stroke} strokeWidth={index === 1 ? 1.8 : 1.3} />
            <text x={x + 18} y={y + 23} fontSize="9" fontWeight="700" letterSpacing="1.4" fill={stage.stroke}>
              {stage.eyebrow}
            </text>
            <text x={x + 18} y={titleY} fontSize={index === 1 ? 21 : 18} fontWeight="700" fill={stage.ink}>
              {stage.title}
            </text>
            <text x={x + 18} y={detailY} fontSize="11" fill="#656d76">
              {stage.detail}
            </text>
            {index === 1 && (
              <>
                <line x1={x + 18} x2={x + width - 18} y1={y + 123} y2={y + 123} stroke="#d0d7de" />
                <text x={x + 18} y={y + 149} fontSize="9.5" fontWeight="700" fill="#57606a">
                  What worked · what constrained value
                </text>
                <text x={x + 18} y={y + 165} fontSize="9.5" fontWeight="700" fill="#57606a">
                  What to test on your next run
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function MobileDiagram() {
  return (
    <div className="grid gap-3 md:hidden">
      {stages.map((stage, index) => (
        <div key={stage.title} className="relative rounded-lg border p-4" style={{ background: stage.fill, borderColor: stage.stroke }}>
          <p className="text-[10px] font-bold tracking-[.16em]" style={{ color: stage.stroke }}>{stage.eyebrow}</p>
          <p className="mt-2 font-bold text-[#1f2328]">{stage.title}</p>
          <p className="mt-1 text-xs text-[#656d76]">{stage.detail}</p>
          {index === 1 && (
            <div className="mt-3 border-t border-[#d0d7de] pt-3 text-xs font-semibold leading-5 text-[#57606a]">
              <p>What worked · what constrained value</p>
              <p>What to test on your next run</p>
            </div>
          )}
          {index < stages.length - 1 && <div className="absolute -bottom-5 left-1/2 z-10 h-5 border-l border-dashed border-[#0969da]" />}
        </div>
      ))}
      <p className="mt-2 text-center text-[10px] font-bold tracking-[.14em] text-[#0969da]">REPLAY ONE CHANGED THESIS</p>
    </div>
  );
}

export default function CampaignEvidenceReplayVisual({
  title = 'Finish with evidence. Start again with intent.',
  description = 'Your campaign is saved locally as a decision record. The final report turns it into a diagnosis; a replay lets you test one stronger thesis against the same kind of challenge.',
  className = '',
}: CampaignEvidenceReplayVisualProps) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] p-5 sm:p-7 ${className}`} aria-labelledby="campaign-evidence-heading">
      <div className="flex flex-col gap-3 border-b border-[#d0d7de] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.24em] text-[#0969da]">The outcome loop</p>
          <h3 id="campaign-evidence-heading" className="mt-2 text-2xl font-bold tracking-[-.03em] text-[#1f2328] sm:text-3xl">{title}</h3>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#656d76]">{description}</p>
      </div>
      <div className="mt-6">
        <DesktopDiagram />
        <MobileDiagram />
      </div>
    </section>
  );
}
