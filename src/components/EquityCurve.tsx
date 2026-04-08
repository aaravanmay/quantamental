"use client";

// Flat line at $100K when no real data exists — no fake growth
const FLAT_LINE = [100000, 100000, 100000, 100000, 100000];

interface EquityCurveProps {
  data?: number[];
  height?: number;
  color?: string;
  label?: string;
}

export function EquityCurve({
  data,
  height = 200,
  color = "#479FFA",
  label,
}: EquityCurveProps) {
  const values = data && data.length > 1 ? data : FLAT_LINE;
  const isPlaceholder = !data || data.length <= 1;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const current = values[values.length - 1];
  const start = values[0];
  const returnPct = ((current - start) / start) * 100;

  // SVG dimensions
  const svgW = 600;
  const svgH = height;
  const padTop = 8;
  const padBottom = 8;
  const padLeft = 0;
  const padRight = 0;
  const chartH = svgH - padTop - padBottom;
  const chartW = svgW - padLeft - padRight;

  // Build polyline points
  const points = values.map((v, i) => {
    const x = padLeft + (i / (values.length - 1)) * chartW;
    const y = padTop + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  });

  const polylineStr = points.join(" ");

  // Build polygon for gradient fill (close path at bottom)
  const firstX = padLeft;
  const lastX = padLeft + chartW;
  const polygonStr = `${polylineStr} ${lastX},${svgH} ${firstX},${svgH}`;

  // Unique IDs for gradients (avoid collisions if multiple on page)
  const gradId = `eq-fill-${color.replace("#", "")}`;
  const glowId = `eq-glow-${color.replace("#", "")}`;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 0 80px -20px rgba(71,159,250,0.08), 0 20px 60px -20px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          {label && (
            <div className="text-[11px] uppercase tracking-wider text-[#555] mb-0.5">
              {label}
            </div>
          )}
          <div className="flex items-baseline gap-3">
            <span className="text-[24px] font-mono tabular-nums font-semibold text-white">
              ${current.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span
              className="text-[14px] font-mono tabular-nums font-medium"
              style={{ color: returnPct >= 0 ? "#4EBE96" : "#f87171" }}
            >
              {returnPct >= 0 ? "+" : ""}
              {returnPct.toFixed(2)}%
            </span>
          </div>
          {isPlaceholder && (
            <span className="text-[10px] text-[#555] mt-0.5 inline-block">
              Sample data — connect to populate
            </span>
          )}
        </div>

        {/* Min / Max */}
        <div className="text-right">
          <div className="text-[10px] text-[#555]">
            High{" "}
            <span className="font-mono tabular-nums text-[#868F97]">
              ${max.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="text-[10px] text-[#555]">
            Low{" "}
            <span className="font-mono tabular-nums text-[#868F97]">
              ${min.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height }}
      >
        <defs>
          {/* Fill gradient */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          {/* Glow filter */}
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Gradient fill area */}
        <polygon fill={`url(#${gradId})`} points={polygonStr} />

        {/* Glow line (wider, blurred) */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylineStr}
          opacity="0.3"
          filter={`url(#${glowId})`}
        />

        {/* Main line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylineStr}
        />

        {/* Endpoint dot */}
        {(() => {
          const lastPt = points[points.length - 1].split(",");
          const cx = parseFloat(lastPt[0]);
          const cy = parseFloat(lastPt[1]);
          return (
            <>
              <circle cx={cx} cy={cy} r="4" fill={color} opacity="0.3" />
              <circle cx={cx} cy={cy} r="2" fill={color} />
            </>
          );
        })()}
      </svg>
    </div>
  );
}
