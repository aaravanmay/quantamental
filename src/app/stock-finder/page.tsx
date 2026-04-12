"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";
import { ScrollReveal } from "@/components/ScrollReveal";

interface Signal {
  id: string;
  ticker: string;
  strategy: string;
  sharpe: number;
  win_rate: number;
  max_drawdown: number;
  direction: string;
  sector?: string;
  final_pct?: number;
  stop_loss?: number;
  take_profit?: number;
  sector_leader?: boolean;
  confluence?: boolean;
  params_json?: string | Record<string, unknown>;
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
  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "watch">("all");
  const router = useRouter();

  async function loadSignals() {
      try {
        // Try v2 daily-scan first (has sizing data)
        const v2 = await fetch("/api/v2/daily-scan");
        if (v2.ok) {
          const data = await v2.json();
          const proposals = data.proposals || [];
          if (proposals.length > 0) {
            const enriched = proposals.map((p: any, i: number) => ({
              id: p.ticker + "-" + i,
              ticker: p.ticker,
              strategy: p.strategy || "—",
              sharpe: p.sharpe || 0,
              win_rate: p.win_rate || 0,
              max_drawdown: 0,
              direction: p.direction || "LONG",
              sector: p.sector || "",
              final_pct: p.final_pct || 0,
              stop_loss: p.stop_loss || 0.08,
              take_profit: p.take_profit || 0.16,
              sector_leader: p.sector_leader || false,
              confluence: p.confluence || false,
            }));
            // Sort by Sharpe (highest quality first)
            enriched.sort((a: Signal, b: Signal) => b.sharpe - a.sharpe);
            setSignals(enriched);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // Fallback: Supabase trade_signals
      try {
        const res = await fetch("/api/signals?limit=200");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Parse params_json for stop/tp
            const enriched = data.map((s: any, i: number) => {
              let sl = 0.08, tp = 0.20;
              try {
                const p = typeof s.params_json === "string" ? JSON.parse(s.params_json) : s.params_json || {};
                sl = p.sl || 0.08;
                tp = p.tp || 0.20;
              } catch {}
              return {
                ...s,
                id: s.id || String(i),
                stop_loss: sl,
                take_profit: tp,
                // Use Sharpe to estimate a "size" since Supabase doesn't store Kelly
                final_pct: Math.min(0.20, Math.max(0.01, (s.sharpe || 0) / 20)),
              };
            });
            // Sort by Sharpe descending (not random Supabase order)
            enriched.sort((a: Signal, b: Signal) => b.sharpe - a.sharpe);
            setSignals(enriched);
          }
        }
      } catch {}
      setLoading(false);
  }

  // Load on mount + auto-refresh every 60 seconds
  useEffect(() => {
    loadSignals();
    const interval = setInterval(loadSignals, 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Conviction tiers based on SHARPE (works even without Kelly sizing)
  const highConviction = signals.filter((s) => s.sharpe >= 1.5);
  const watchList = signals.filter((s) => s.sharpe < 1.5);

  const displaySignals = activeFilter === "high" ? highConviction
    : activeFilter === "watch" ? watchList
    : signals;

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-[700px] h-[400px]"
        style={{
          background: "radial-gradient(ellipse, rgba(71,159,250,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[1220px] mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-6">
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
            </div>
            <p className="text-[14px] text-[var(--text-secondary)]">
              {signals.length} signals sorted by Sharpe ratio (highest conviction first)
            </p>
            <p className="mt-1 text-[11px] text-zinc-600">
              Updated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </ScrollReveal>

        {/* Conviction filter bar */}
        <ScrollReveal delay={50}>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setActiveFilter("all")}
              className={cn(
                "glass rounded-xl p-4 text-left transition-all",
                activeFilter === "all" ? "border-[rgba(71,159,250,0.4)]" : "hover:border-[rgba(71,159,250,0.2)]"
              )}
            >
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">All Signals</div>
              <div className="text-2xl font-bold text-white">{signals.length}</div>
            </button>
            <button
              onClick={() => setActiveFilter("high")}
              className={cn(
                "glass rounded-xl p-4 text-left transition-all",
                activeFilter === "high" ? "border-emerald-500/40" : "hover:border-emerald-500/20"
              )}
            >
              <div className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-1">High Conviction</div>
              <div className="text-2xl font-bold text-emerald-400">{highConviction.length}</div>
              <div className="text-[10px] text-zinc-500">Sharpe ≥ 1.5</div>
            </button>
            <button
              onClick={() => setActiveFilter("watch")}
              className={cn(
                "glass rounded-xl p-4 text-left transition-all",
                activeFilter === "watch" ? "border-amber-500/40" : "hover:border-amber-500/20"
              )}
            >
              <div className="text-[10px] uppercase tracking-wider text-amber-400/70 mb-1">Watch List</div>
              <div className="text-2xl font-bold text-amber-400">{watchList.length}</div>
              <div className="text-[10px] text-zinc-500">Sharpe &lt; 1.5</div>
            </button>
          </div>
        </ScrollReveal>

        {/* Signal cards */}
        <ScrollReveal delay={100}>
          {loading ? (
            <div className="glass rounded-xl p-16 text-center text-zinc-500">
              Loading signals...
            </div>
          ) : displaySignals.length === 0 ? (
            <div className="glass rounded-xl p-16 text-center">
              <Crosshair size={24} className="mx-auto mb-3 text-zinc-600" strokeWidth={1} />
              <p className="text-sm text-zinc-400">
                {activeFilter === "high"
                  ? "No high-conviction signals right now. Check \"All Signals\" for the full list."
                  : activeFilter === "watch"
                  ? "No watch-list signals."
                  : "No signals available. Run the grid search on your PC."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displaySignals.map((s) => {
                // Compute useful numbers for the card
                const sl = s.stop_loss ?? 0.08;
                const tp = s.take_profit ?? 0.16;
                const expectedGain = s.win_rate * (tp * 100) - (1 - s.win_rate) * (sl * 100);
                const holdDays = s.sharpe >= 2 ? "7–20 days" : s.sharpe >= 1.5 ? "14–30 days" : "20–45 days";

                return (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/stock/${s.ticker}`)}
                    className={cn(
                      "group glass rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01]",
                      "hover:border-[rgba(71,159,250,0.3)]",
                      s.sharpe >= 2.0 && "border-emerald-500/20",
                    )}
                    style={{
                      boxShadow: s.sharpe >= 2.5
                        ? "0 0 30px -10px rgba(16,185,129,0.1)"
                        : undefined,
                    }}
                  >
                    {/* Top row: ticker + direction */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{s.ticker}</span>
                        {s.sector_leader && (
                          <span className="text-amber-400 text-xs" title="Sector leader">★</span>
                        )}
                        {s.confluence && (
                          <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            MULTI-SIGNAL
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

                    {/* Strategy name */}
                    <div className="text-[12px] text-zinc-400 mb-3 truncate">{s.strategy}</div>

                    {/* Main stats — 4 columns with useful numbers */}
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-600">Sharpe</div>
                        <div className="text-[14px] font-mono font-semibold text-white">{s.sharpe.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-600">Win Rate</div>
                        <div className="text-[14px] font-mono font-semibold text-white">{(Math.min(100, s.win_rate * 100)).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-600">Exp. Gain</div>
                        <div className={cn(
                          "text-[14px] font-mono font-semibold",
                          expectedGain > 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {expectedGain > 0 ? "+" : ""}{expectedGain.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-zinc-600">Hold</div>
                        <div className="text-[14px] font-mono font-semibold text-zinc-300 text-[11px]">{holdDays}</div>
                      </div>
                    </div>

                    {/* Risk bar: stop loss → take profit */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 text-[10px] mb-1">
                        <span className="text-red-400 font-mono">SL −{(sl * 100).toFixed(0)}%</span>
                        <div className="flex-1 relative h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.min(100, s.win_rate * 100))}%`,
                              background: "linear-gradient(90deg, rgba(248,113,113,0.4) 0%, rgba(16,185,129,0.6) 100%)",
                            }}
                          />
                        </div>
                        <span className="text-emerald-400 font-mono">TP +{(tp * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Bottom: sector + arrow */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                      <span className="text-[10px] text-zinc-500">{s.sector || "—"}</span>
                      <ArrowRight size={14} className="text-zinc-700 group-hover:text-[var(--accent)] transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollReveal>

        {/* Footer */}
        <ScrollReveal delay={200}>
          <div className="mt-6 text-[11px] text-zinc-600">
            <p>Sorted by Sharpe ratio. Expected Gain = (win rate × take profit) − (loss rate × stop loss). Execute after 9:45 ET with limit orders.</p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
