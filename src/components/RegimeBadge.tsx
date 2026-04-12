"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Regime = {
  name: "STRONG_BULL" | "WEAK_BULL" | "SIDEWAYS" | "WEAK_BEAR" | "CRASH";
  description?: string;
  confidence?: number;
  spy_price?: number;
  vix?: number;
  risk_multiplier?: number;
  favored_strategies?: string[];
};

const REGIME_STYLE: Record<string, { bg: string; border: string; text: string; label: string; emoji: string }> = {
  STRONG_BULL: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-300", label: "Strong Bull", emoji: "▲▲" },
  WEAK_BULL:   { bg: "bg-lime-500/15",    border: "border-lime-500/40",    text: "text-lime-300",    label: "Weak Bull",   emoji: "▲"   },
  SIDEWAYS:    { bg: "bg-amber-500/15",   border: "border-amber-500/40",   text: "text-amber-300",   label: "Sideways",    emoji: "↔"   },
  WEAK_BEAR:   { bg: "bg-orange-500/15",  border: "border-orange-500/40",  text: "text-orange-300",  label: "Weak Bear",   emoji: "▼"   },
  CRASH:       { bg: "bg-red-500/15",     border: "border-red-500/40",    text: "text-red-300",     label: "CRASH",       emoji: "▼▼"  },
};

export function RegimeBadge() {
  const [regime, setRegime] = useState<Regime | null>(null);

  useEffect(() => {
    fetch("/api/v2/regime")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.name) setRegime(data);
      })
      .catch(() => {});
  }, []);

  if (!regime) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 animate-pulse">
        <div className="h-3 w-24 bg-zinc-800 rounded mb-2" />
        <div className="h-5 w-32 bg-zinc-800 rounded" />
      </div>
    );
  }

  const style = REGIME_STYLE[regime.name] || REGIME_STYLE.SIDEWAYS;

  return (
    <Link
      href="/portfolio"
      className={`block rounded-xl border ${style.border} ${style.bg} px-4 py-3 hover:opacity-90 transition-opacity`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Market Regime</div>
          <div className={`text-base font-bold ${style.text} flex items-center gap-2`}>
            <span>{style.emoji}</span>
            <span>{style.label}</span>
          </div>
          {regime.description && (
            <div className="text-xs text-zinc-500 mt-1 max-w-xs">{regime.description}</div>
          )}
        </div>
        <div className="text-right text-[11px] text-zinc-400 leading-tight">
          {regime.spy_price != null && <div>SPY ${regime.spy_price.toFixed(2)}</div>}
          {regime.vix != null && <div>VIX {regime.vix.toFixed(1)}</div>}
          {regime.risk_multiplier != null && (
            <div className={style.text}>{(regime.risk_multiplier * 100).toFixed(0)}% size</div>
          )}
        </div>
      </div>
    </Link>
  );
}
