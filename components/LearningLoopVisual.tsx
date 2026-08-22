const steps = [
  { number: "01", label: "Context", detail: "See the operating reality" },
  { number: "02", label: "Choose", detail: "Set a strategic direction" },
  { number: "03", label: "Allocate", detail: "Commit capital and capability", focal: true },
  { number: "04", label: "Observe", detail: "Read the consequences" },
  { number: "05", label: "Reflect", detail: "Interrogate the evidence" },
  { number: "06", label: "Replay", detail: "Try a stronger thesis" },
];

const desktopPositions = [
  [402, 28],
  [658, 172],
  [658, 364],
  [402, 508],
  [146, 364],
  [146, 172],
];

const desktopSpokes = [
  [480, 96, 480, 236],
  [658, 204, 582, 260],
  [658, 396, 582, 340],
  [480, 508, 480, 372],
  [302, 396, 378, 340],
  [302, 204, 378, 260],
];

const desktopArcs = [
  "M 560 92 A 212 212 0 0 1 640 160",
  "M 736 236 A 212 212 0 0 1 736 332",
  "M 640 408 A 212 212 0 0 1 560 476",
  "M 400 476 A 212 212 0 0 1 320 408",
  "M 224 332 A 212 212 0 0 1 224 236",
  "M 320 160 A 212 212 0 0 1 400 92",
];

const mobilePositions = [
  [102, 22],
  [210, 106],
  [210, 258],
  [102, 342],
  [-6, 258],
  [-6, 106],
];

const mobileSpokes = [
  [180, 78, 180, 206],
  [210, 146, 236, 218],
  [210, 288, 236, 264],
  [180, 342, 180, 278],
  [150, 288, 124, 264],
  [150, 146, 124, 218],
];

const mobileArcs = [
  "M 214 76 A 154 154 0 0 1 242 102",
  "M 288 166 A 154 154 0 0 1 288 238",
  "M 242 302 A 154 154 0 0 1 214 328",
  "M 146 328 A 154 154 0 0 1 118 302",
  "M 72 238 A 154 154 0 0 1 72 166",
  "M 118 102 A 154 154 0 0 1 146 76",
];

type LoopSvgProps = {
  compact?: boolean;
};

function LoopSvg({ compact = false }: LoopSvgProps) {
  const positions = compact ? mobilePositions : desktopPositions;
  const spokes = compact ? mobileSpokes : desktopSpokes;
  const arcs = compact ? mobileArcs : desktopArcs;
  const width = compact ? 360 : 960;
  const height = compact ? 420 : 600;
  const stationWidth = compact ? 156 : 156;
  const stationHeight = compact ? 56 : 68;
  const hub = compact
    ? { x: 108, y: 206, w: 144, h: 72 }
    : { x: 370, y: 236, w: 220, h: 128 };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block w-full"
      role="img"
      aria-labelledby={compact ? "learning-loop-mobile-title" : "learning-loop-title"}
      preserveAspectRatio="xMidYMid meet"
    >
      <title id={compact ? "learning-loop-mobile-title" : "learning-loop-title"}>
        The AI Investment Challenge learning loop
      </title>
      <desc>
        A six-step loop from Context through Replay. Each step writes evidence
        back to Strategic judgment at the center before the learner starts again.
      </desc>
      <defs>
        <marker id={compact ? "loop-arrow-mobile" : "loop-arrow"} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#57606a" />
        </marker>
        <marker id={compact ? "spoke-arrow-mobile" : "spoke-arrow"} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M 0 0 L 7 3.5 L 0 7 z" fill="#8c959f" />
        </marker>
      </defs>

      <circle
        cx={compact ? 180 : 480}
        cy={compact ? 242 : 300}
        r={compact ? 154 : 212}
        fill="none"
        stroke="#d0d7de"
        strokeWidth="1.5"
        strokeDasharray="3 7"
      />

      {arcs.map((arc, index) => (
        <path
          key={arc}
          d={arc}
          fill="none"
          stroke="#57606a"
          strokeWidth={compact ? "1.5" : "1.7"}
          markerEnd={`url(#${compact ? "loop-arrow-mobile" : "loop-arrow"})`}
        />
      ))}

      {spokes.map(([x1, y1, x2, y2], index) => (
        <path
          key={`${x1}-${y1}`}
          d={`M ${x1} ${y1} L ${x2} ${y2}`}
          fill="none"
          stroke="#8c959f"
          strokeWidth="1.2"
          strokeDasharray="5 5"
          markerEnd={`url(#${compact ? "spoke-arrow-mobile" : "spoke-arrow"})`}
        />
      ))}

      {steps.map((step, index) => {
        const [x, y] = positions[index];
        const centerX = x + stationWidth / 2;
        const titleY = y + (compact ? 29 : 34);
        const detailY = y + (compact ? 45 : 52);
        const numberY = y + (compact ? 15 : 17);
        const fill = step.focal ? "#fff8c5" : "#ffffff";
        const stroke = step.focal ? "#9a6700" : "#d0d7de";

        return (
          <g key={step.label}>
            <rect x={x} y={y} width={stationWidth} height={stationHeight} rx="8" fill={fill} stroke={stroke} strokeWidth={step.focal ? "1.8" : "1.2"} />
            <text x={x + 12} y={numberY} fontSize={compact ? "8" : "9"} fontWeight="700" letterSpacing="1.4" fill={step.focal ? "#9a6700" : "#656d76"}>
              {step.number}
            </text>
            <text x={centerX} y={titleY} textAnchor="middle" fontSize={compact ? "14" : "17"} fontWeight="700" fill="#1f2328">
              {step.label}
            </text>
            <text x={centerX} y={detailY} textAnchor="middle" fontSize={compact ? "8.5" : "10"} fill="#656d76">
              {step.detail}
            </text>
          </g>
        );
      })}

      <rect x={hub.x} y={hub.y} width={hub.w} height={hub.h} rx="10" fill="#0d1117" stroke="#30363d" strokeWidth="1.5" />
      <text x={hub.x + hub.w / 2} y={hub.y + (compact ? 28 : 46)} textAnchor="middle" fontSize={compact ? "8" : "10"} fontWeight="700" letterSpacing={compact ? "1.1" : "1.8"} fill="#3fb950">
        SHARED HUB
      </text>
      <text x={hub.x + hub.w / 2} y={hub.y + (compact ? 48 : 76)} textAnchor="middle" fontSize={compact ? "18" : "25"} fontWeight="700" fill="#ffffff">
        Strategic
      </text>
      <text x={hub.x + hub.w / 2} y={hub.y + (compact ? 66 : 105)} textAnchor="middle" fontSize={compact ? "18" : "25"} fontWeight="700" fill="#ffffff">
        judgment
      </text>
    </svg>
  );
}

export default function LearningLoopVisual() {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#d0d7de] bg-[#f6f8fa] p-4 sm:p-6 lg:p-8"
      aria-labelledby="learning-loop-heading"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 border-b border-[#d0d7de] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.24em] text-[#08872b]">
              The learning loop
            </p>
            <h3 id="learning-loop-heading" className="mt-2 text-2xl font-bold tracking-[-.03em] text-[#1f2328] sm:text-3xl">
              Every campaign is a rehearsal for better judgment.
            </h3>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[#656d76]">
            Decisions move forward. Evidence moves inward. Your next choice starts from what the campaign taught you.
          </p>
        </div>

        <div className="mt-6 sm:hidden">
          <LoopSvg compact />
        </div>
        <div className="mt-7 hidden sm:block">
          <LoopSvg />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#656d76]">
          <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#57606a]" />Clockwise: act on the next decision</span>
          <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full border border-dashed border-[#8c959f]" />Dashed: record evidence for reflection</span>
          <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#9a6700]" />Focus point: allocation trade-off</span>
        </div>

        <ol className="sr-only">
          {steps.map((step) => (
            <li key={step.number}>{step.label}: {step.detail}.</li>
          ))}
          <li>All six steps strengthen Strategic judgment through replay.</li>
        </ol>
      </div>
    </section>
  );
}
