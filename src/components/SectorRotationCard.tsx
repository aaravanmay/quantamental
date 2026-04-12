"use client";

import { useEffect, useState } from "react";

type SectorRow = {
  sector: string;
  composite: number;
  rs_1m: number;
  rs_3m: number;
};

type Rotation = {
  leaders?: SectorRow[];
  laggards?: SectorRow[];
  rotation_strength?: number;
};

export function SectorRotationCard() {
  const [rotation, setRotation] = useState<Rotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v2/sector-rotation")
      .then((r) => r.json())
      .then((data) => {
        setRotation(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse">
        <div className="h-3 w-24 bg-zinc-800 rounded mb-3" />
        <div className="h-4 w-full bg-zinc-800 rounded mb-2" />
        <div className="h-4 w-full bg-zinc-800 rounded mb-2" />
        <div className="h-4 w-full bg-zinc-800 rounded" />
      </div>
    );
  }

  if (!rotation || !rotation.leaders || rotation.leaders.length === 0) {
    return null;
  }

  const fmt = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-2">Sector Rotation</div>

      <div className="space-y-1.5 mb-3">
        <div className="text-[10px] text-emerald-400/70 font-semibold uppercase">Leaders</div>
        {rotation.leaders.map((s) => (
          <div key={s.sector} className="flex items-center justify-between text-xs">
            <span className="text-zinc-200">{s.sector}</span>
            <span className="text-emerald-400 font-mono">{fmt(s.composite)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] text-red-400/70 font-semibold uppercase">Laggards</div>
        {rotation.laggards?.map((s) => (
          <div key={s.sector} className="flex items-center justify-between text-xs">
            <span className="text-zinc-200">{s.sector}</span>
            <span className="text-red-400 font-mono">{fmt(s.composite)}</span>
          </div>
        ))}
      </div>

      {rotation.rotation_strength != null && (
        <div className="mt-3 pt-3 border-t border-zinc-800 text-[10px] text-zinc-500">
          Rotation strength: {fmt(rotation.rotation_strength)}
        </div>
      )}
    </div>
  );
}
