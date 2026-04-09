"use client";

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = "16px",
  rounded = "6px",
  className = "",
}: SkeletonProps) {
  return (
    <>
      <div
        className={className}
        style={{
          width,
          height,
          borderRadius: rounded,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            animation: "shimmer 1.8s ease-in-out infinite",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 60%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </>
  );
}

export function CardGridSkeleton({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid gap-2.5`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-lg px-3 py-2.5">
          <Skeleton width="60px" height="10px" className="mb-2" />
          <Skeleton width="80px" height="16px" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 380 }: { height?: number }) {
  return (
    <div className="glass rounded-lg flex items-center justify-center" style={{ height }}>
      <div className="flex flex-col items-center gap-2">
        <Skeleton width="24px" height="24px" rounded="50%" />
        <Skeleton width="100px" height="12px" />
      </div>
    </div>
  );
}

export function NewsCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-4">
          <Skeleton width="100%" height="14px" className="mb-2" />
          <Skeleton width="70%" height="14px" className="mb-3" />
          <Skeleton width="120px" height="10px" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  const rows = Array.from({ length: 5 });

  return (
    <div className="flex flex-col gap-px" style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-3" style={{ background: "rgba(255,255,255,0.02)" }}>
        <Skeleton width="120px" height="12px" />
        <Skeleton width="80px" height="12px" />
        <Skeleton width="60px" height="12px" />
        <Skeleton width="70px" height="12px" />
        <Skeleton width="90px" height="12px" />
        <Skeleton width="60px" height="12px" />
      </div>

      {/* Data rows */}
      {rows.map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <Skeleton width="120px" height="14px" />
          <Skeleton width="80px" height="14px" />
          <Skeleton width="60px" height="14px" />
          <Skeleton width="70px" height="14px" />
          <Skeleton width="90px" height="14px" />
          <Skeleton width="60px" height="14px" rounded="12px" />
        </div>
      ))}
    </div>
  );
}
