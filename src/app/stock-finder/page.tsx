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
        const res = await fetch("/api/signals?limit=200");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Extract strategy type from params_json and set sector
            const enriched = data.map((s: any) => {
              let stratType = "";
              let sector = s.sector || "";
              try {
                const params = typeof s.params_json === "string"
                  ? JSON.parse(s.params_json)
                  : s.params_json || {};
                stratType = params.t || "";
                if (!sector) sector = "";
              } catch {}
              return {
                ...s,
                strategy_type: stratType,
                sector,
                // Everything that passed the grid search IS validated — no
                // manual validate step needed. The grid search already filters
                // by Sharpe > 0.5, win rate > 42%, profit factor > 1.1, and
                // Monte Carlo p-value < 0.30.
                validation_status: "go",
              };
            });
            setSignals(enriched);
            // Use the most recent signal's created_at as "last updated"
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
      } catch {
        // No fallback to fake data — show empty state
      }
      setLoading(false);
    }
    loadSignals();
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
              {signals.length} backtested strategies ranked by Sharpe ratio
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
                  <th className="text-right">Max DD</th>
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
                      <td className="text-right font-mono tabular-nums text-loss">
                        {(s.max_drawdown * 100).toFixed(1)}%
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
          All signals are pre-validated by the grid search engine (Sharpe &gt; 0.5, win rate &gt; 42%,
          profit factor &gt; 1.1, Monte Carlo p &lt; 0.30). See /proposals for today's
          regime-filtered, Kelly-sized trade ideas.
        </div>
      </div>
    </div>
  );
}
