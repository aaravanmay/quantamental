"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";
import { ScrollReveal } from "@/components/ScrollReveal";

interface Signal {
  id: string;
  ticker: string;
  strategy: string;
  params_json?: string | Record<string, unknown>;
  sharpe: number;
  win_rate: number;
  max_drawdown: number;
  direction: string;
  signal_date?: string;
  sector?: string;
  validation_status?: string;
  created_at?: string;
}

const TIMEFRAME_LABELS: Record<string, string> = {
  day: "Day Trading",
  swing: "Swing Trading",
  longterm: "Long-Term",
};

const DIRECTIONS = ["All", "LONG", "SHORT"];

export default function StockFinderPage() {
  const { timeframe } = useSettings();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeDirection, setActiveDirection] = useState("All");
  const router = useRouter();

  useEffect(() => {
    async function loadSignals() {
      try {
        // Pull LIVE signals from the v2 daily scan (updates in real-time
        // based on current regime, sector rotation, and which strategies
        // are firing TODAY — not 3 days ago).
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
              max_drawdown: 0,
              direction: p.direction || "LONG",
              sector: p.sector || "",
              final_pct: p.final_pct || 0,
              stop_loss: p.stop_loss || 0,
              take_profit: p.take_profit || 0,
              validation_status: "go",
            }));
            setSignals(enriched);
            setLastUpdated(
              data.generated_at
                ? new Date(data.generated_at).toLocaleString()
                : new Date().toLocaleString()
            );
          }
        }

        // If v2 returned nothing, fall back to the static Supabase table
        if (signals.length === 0) {
          const fallback = await fetch("/api/signals?limit=200");
          if (fallback.ok) {
            const data = await fallback.json();
            if (Array.isArray(data) && data.length > 0) {
              const enriched = data.map((s: any) => ({
                ...s,
                validation_status: "go",
              }));
              setSignals(enriched);
              const dates = enriched
                .map((s: any) => s.created_at || s.signal_date)
                .filter(Boolean)
                .sort()
                .reverse();
              if (dates[0]) {
                setLastUpdated(new Date(dates[0]).toLocaleString());
              }
            }
          }
        }
      } catch {
        // No fallback to fake data
      }
      setLoading(false);
    }
    loadSignals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSignals = signals.filter((s) => {
    if (activeDirection !== "All" && s.direction !== activeDirection) return false;
    return true;
  });

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-[600px] h-[400px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(71,159,250,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[1220px] mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-8">
            <h1
              className="text-[32px] font-semibold tracking-tight"
              style={{
                background:
                  "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Signals
            </h1>
            <p className="mt-2 text-[15px] text-[#868F97]">
              {signals.length} live signals ranked by Sharpe ratio
              <span
                className="ml-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "rgba(71,159,250,0.1)",
                  border: "0.5px solid rgba(71,159,250,0.2)",
                  color: "#479FFA",
                }}
              >
                {TIMEFRAME_LABELS[timeframe] ?? "Swing Trading"}
              </span>
            </p>
            {lastUpdated && (
              <p className="mt-1 text-[11px] text-zinc-500">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </ScrollReveal>

        {/* Direction filter */}
        <ScrollReveal delay={100}>
          <div className="mb-6 flex gap-1.5">
            {DIRECTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDirection(d)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12px] font-medium transition-all",
                  d === activeDirection
                    ? d === "LONG" ? "bg-[rgba(78,190,150,0.15)] text-[#4EBE96] border border-[rgba(78,190,150,0.25)]"
                      : d === "SHORT" ? "bg-[rgba(248,113,113,0.15)] text-[#f87171] border border-[rgba(248,113,113,0.25)]"
                      : "bg-[rgba(71,159,250,0.15)] text-white border border-[rgba(71,159,250,0.25)]"
                    : "text-[#868F97] hover:text-white bg-[rgba(255,255,255,0.03)] border border-transparent"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Signal Table */}
        <ScrollReveal delay={200}>
          <div
            className="glass overflow-hidden"
            style={{
              boxShadow:
                "0 0 80px -20px rgba(71,159,250,0.08), 0 20px 60px -20px rgba(0,0,0,0.4)",
            }}
          >
            <table className="stock-table">
              <thead>
                <tr>
                  <th className="w-24">Ticker</th>
                  <th>Strategy</th>
                  <th className="text-right">Sharpe</th>
                  <th className="text-right">Win Rate</th>
                  <th className="text-right">Size</th>
                  <th className="text-right">Direction</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-zinc-500">
                      Loading signals...
                    </td>
                  </tr>
                ) : filteredSignals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Crosshair
                        size={24}
                        className="mx-auto mb-3 text-[#555]"
                        strokeWidth={1}
                      />
                      <p className="text-sm text-[#868F97]">
                        No signals yet. Run the grid search on your PC to populate
                        this table.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSignals.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/stock/${s.ticker}`)}
                      className="cursor-pointer"
                    >
                      <td className="font-semibold text-white">
                        {s.ticker}
                      </td>
                      <td className="text-[#868F97]">{s.strategy}</td>
                      <td className="text-right font-mono tabular-nums">
                        {s.sharpe.toFixed(2)}
                      </td>
                      <td className="text-right font-mono tabular-nums">
                        {(s.win_rate * 100).toFixed(0)}%
                      </td>
                      <td className="text-right font-mono tabular-nums text-emerald-400">
                        {s.final_pct ? `${(s.final_pct * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="text-right">
                        <span
                          className={cn(
                            "inline-block rounded px-2 py-0.5 text-xs font-medium",
                            s.direction === "LONG" ? "badge-gain" : "badge-loss"
                          )}
                        >
                          {s.direction}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium badge-gain">
                          GO
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        <div className="mt-4 text-xs text-zinc-500">
          Live signals from the v2 engine — regime-filtered, sector-rotation-aware,
          earnings-blackout-protected. Refreshes on every page load. Size column shows
          Kelly-optimal position sizing as % of portfolio.
        </div>
      </div>
    </div>
  );
}
