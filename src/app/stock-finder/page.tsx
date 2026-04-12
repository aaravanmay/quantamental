"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, TrendingUp, ArrowRight } from "lucide-react";
import { cn, formatPct } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";
import { ScrollReveal } from "@/components/ScrollReveal";

interface Signal {
  id: string;
  ticker: string;
  strategy: string;
  sharpe: number;
  win_rate: number;
  direction: string;
  sector?: string;
  final_pct?: number;
  stop_loss?: number;
  take_profit?: number;
  sector_leader?: boolean;
  confluence?: boolean;
  reasoning?: string;
}

const TIMEFRAME_LABELS: Record<string, string> = {
  day: "Day Trading",
  swing: "Swing Trading",
  longterm: "Long-Term",
};

export default function StockFinderPage() {
  const { timeframe } = useSettings();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "medium">("all");
  const router = useRouter();

  useEffect(() => {
    async function loadSignals() {
      try {
        const res = await fetch("/api/v2/daily-scan");
        if (res.ok) {
          const data = await res.json();
          const proposals = data.proposals || [];
          if (proposals.length > 0) {
            const enriched = proposals.map((p: any, i: number) => ({
              id: p.ticker + "-" + i,
              ticker: p.ticker,
              strategy: p.strategy || p.strategy_type || "—",
              sharpe: p.sharpe || 0,
              win_rate: p.win_rate || 0,
              direction: p.direction || "LONG",
              sector: p.sector || "",
              final_pct: p.final_pct || 0,
              stop_loss: p.stop_loss || 0,
              take_profit: p.take_profit || 0,
              sector_leader: p.sector_leader || false,
              confluence: p.confluence || false,
              reasoning: p.reasoning || "",
            }));
            setSignals(enriched);
            setLastUpdated(
              data.generated_at
                ? new Date(data.generated_at).toLocaleString()
                : new Date().toLocaleString()
            );
          }
        }
        // Fallback to static Supabase data
        if (signals.length === 0) {
          const fallback = await fetch("/api/signals?limit=100");
          if (fallback.ok) {
            const data = await fallback.json();
            if (Array.isArray(data) && data.length > 0) {
              setSignals(data.map((s: any, i: number) => ({
                ...s, id: s.id || String(i), final_pct: 0, validation_status: "go",
              })));
              const dates = data.map((s: any) => s.created_at).filter(Boolean).sort().reverse();
              if (dates[0]) setLastUpdated(new Date(dates[0]).toLocaleString());
            }
          }
        }
      } catch {}
      setLoading(false);
    }
    loadSignals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Split into tiers based on Kelly sizing
  const highConviction = signals.filter((s) => (s.final_pct || 0) >= 0.05);
  const mediumConviction = signals.filter((s) => (s.final_pct || 0) > 0 && (s.final_pct || 0) < 0.05);
  const displaySignals = activeFilter === "high" ? highConviction
    : activeFilter === "medium" ? mediumConviction
    : signals;

  return (
    <div className="relative overflow-hidden">
      {/* Atmospheric glow */}
      <div
        className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-[700px] h-[400px]"
        style={{
          background: "radial-gradient(ellipse, rgba(71,159,250,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[1220px] mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="page-heading text-[32px]">Signals</h1>
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "rgba(71,159,250,0.1)",
                  border: "0.5px solid rgba(71,159,250,0.2)",
                  color: "#479FFA",
                }}
              >
                {TIMEFRAME_LABELS[timeframe] ?? "Swing Trading"}
              </span>
              <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium badge-gain">
                LIVE
              </span>
            </div>
            <p className="text-[14px] text-[var(--text-secondary)]">
              {signals.length} regime-filtered signals — refreshes on every load
            </p>
            {lastUpdated && (
              <p className="mt-1 text-[11px] text-zinc-600">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </ScrollReveal>

        {/* Quick stats bar */}
        <ScrollReveal delay={50}>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setActiveFilter("all")}
              className={cn(
                "glass rounded-xl p-4 text-left transition-all hover:border-[rgba(71,159,250,0.3)]",
                activeFilter === "all" && "border-[rgba(71,159,250,0.4)]"
              )}
            >
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">All Signals</div>
              <div className="text-2xl font-bold text-white">{signals.length}</div>
            </button>
            <button
              onClick={() => setActiveFilter("high")}
              className={cn(
                "glass rounded-xl p-4 text-left transition-all hover:border-emerald-500/30",
                activeFilter === "high" && "border-emerald-500/40"
              )}
            >
              <div className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-1">High Conviction</div>
              <div className="text-2xl font-bold text-emerald-400">{highConviction.length}</div>
              <div className="text-[10px] text-zinc-500">Size ≥ 5%</div>
            </button>
            <button
              onClick={() => setActiveFilter("medium")}
              className={cn(
                "glass rounded-xl p-4 text-left transition-all hover:border-amber-500/30",
                activeFilter === "medium" && "border-amber-500/40"
              )}
            >
              <div className="text-[10px] uppercase tracking-wider text-amber-400/70 mb-1">Watch List</div>
              <div className="text-2xl font-bold text-amber-400">{mediumConviction.length}</div>
              <div className="text-[10px] text-zinc-500">Size &lt; 5%</div>
            </button>
          </div>
        </ScrollReveal>

        {/* Signal cards */}
        <ScrollReveal delay={100}>
          {loading ? (
            <div className="glass rounded-xl p-16 text-center text-zinc-500">
              Loading live signals...
            </div>
          ) : displaySignals.length === 0 ? (
            <div className="glass rounded-xl p-16 text-center">
              <Crosshair size={24} className="mx-auto mb-3 text-zinc-600" strokeWidth={1} />
              <p className="text-sm text-zinc-400">No signals in this category right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displaySignals.map((s) => (
                <div
                  key={s.id}
                  onClick={() => router.push(`/stock/${s.ticker}`)}
                  className={cn(
                    "group glass rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01]",
                    "hover:border-[rgba(71,159,250,0.3)]",
                    s.confluence && "border-emerald-500/20",
                  )}
                  style={{
                    boxShadow: s.confluence
                      ? "0 0 30px -10px rgba(16,185,129,0.1)"
                      : undefined,
                  }}
                >
                  {/* Top row: ticker + direction */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{s.ticker}</span>
                      {s.sector_leader && (
                        <span className="text-amber-400 text-xs" title="Sector leader">★</span>
                      )}
                      {s.confluence && (
                        <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          CONFLUENCE
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-semibold",
                      s.direction === "LONG" ? "badge-gain" : "badge-loss"
                    )}>
                      {s.direction}
                    </span>
                  </div>

                  {/* Strategy */}
                  <div className="text-[12px] text-zinc-400 mb-3 truncate">
                    {s.strategy}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">Sharpe</div>
                      <div className="text-sm font-mono font-semibold text-white">{s.sharpe.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">Win Rate</div>
                      <div className="text-sm font-mono font-semibold text-white">{(s.win_rate * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">Size</div>
                      <div className="text-sm font-mono font-semibold text-emerald-400">
                        {s.final_pct ? `${(s.final_pct * 100).toFixed(1)}%` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Risk bar */}
                  {s.stop_loss && s.take_profit ? (
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span className="text-red-400">SL {(s.stop_loss * 100).toFixed(0)}%</span>
                      <div className="flex-1 h-px bg-zinc-800" />
                      <span className="text-emerald-400">TP {(s.take_profit * 100).toFixed(0)}%</span>
                    </div>
                  ) : null}

                  {/* Sector + arrow */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50">
                    <span className="text-[10px] text-zinc-500">{s.sector || "—"}</span>
                    <ArrowRight size={14} className="text-zinc-600 group-hover:text-[var(--accent)] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollReveal>

        {/* Footer */}
        <ScrollReveal delay={200}>
          <div className="mt-6 space-y-2 text-[11px] text-zinc-600">
            <p>
              Live from v2 engine — regime-filtered, sector-rotation-aware, earnings-blackout-protected.
              Size shows Kelly-optimal position as % of portfolio.
            </p>
            <p className="text-amber-500/80">
              ⏰ Execute after 9:45 ET. Use limit orders, not market orders at the open.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
