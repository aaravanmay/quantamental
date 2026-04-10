"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Crosshair, Loader2 } from "lucide-react";
import { triggerValidation } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { TradeSignal } from "@/lib/types";

const SAMPLE_SIGNALS: TradeSignal[] = [
  { id: "1", ticker: "NVDA", strategy: "EMA Cross + RSI", params_json: {}, sharpe: 2.14, win_rate: 0.72, max_drawdown: -0.11, direction: "LONG", signal_date: "2026-04-07", validation_status: "go", thesis_json: null },
  { id: "2", ticker: "AAPL", strategy: "Bollinger Squeeze", params_json: {}, sharpe: 1.87, win_rate: 0.65, max_drawdown: -0.09, direction: "LONG", signal_date: "2026-04-06", validation_status: "go", thesis_json: null },
  { id: "3", ticker: "XOM", strategy: "MACD Divergence", params_json: {}, sharpe: 1.62, win_rate: 0.61, max_drawdown: -0.14, direction: "LONG", signal_date: "2026-04-05", validation_status: "nogo", thesis_json: null },
  { id: "4", ticker: "JPM", strategy: "Mean Reversion", params_json: {}, sharpe: 1.54, win_rate: 0.58, max_drawdown: -0.12, direction: "LONG", signal_date: "2026-04-04", validation_status: "go", thesis_json: null },
  { id: "5", ticker: "TSLA", strategy: "Momentum Breakout", params_json: {}, sharpe: 1.91, win_rate: 0.55, max_drawdown: -0.22, direction: "LONG", signal_date: "2026-04-03", validation_status: "pending", thesis_json: null },
  { id: "6", ticker: "AMZN", strategy: "EMA Cross + RSI", params_json: {}, sharpe: 1.78, win_rate: 0.63, max_drawdown: -0.13, direction: "LONG", signal_date: "2026-04-02", validation_status: "go", thesis_json: null },
  { id: "7", ticker: "META", strategy: "Volume Profile", params_json: {}, sharpe: 1.69, win_rate: 0.60, max_drawdown: -0.15, direction: "LONG", signal_date: "2026-04-01", validation_status: "pending", thesis_json: null },
  { id: "8", ticker: "CVX", strategy: "MACD Divergence", params_json: {}, sharpe: 1.45, win_rate: 0.57, max_drawdown: -0.16, direction: "SHORT", signal_date: "2026-03-30", validation_status: "nogo", thesis_json: null },
];

const TIMEFRAME_LABELS: Record<string, string> = {
  day: "Day Trading",
  swing: "Swing Trading",
  longterm: "Long-Term",
};

const SECTORS = ["All Sectors", "Technology", "Energy", "Financials", "Healthcare", "Consumer"];
const DIRECTIONS = ["All Directions", "LONG", "SHORT"];
const STATUSES = ["All Status", "Pending", "GO", "NO-GO"];

export default function StockFinderPage() {
  const { timeframe } = useSettings();
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [activeSector, setActiveSector] = useState("All Sectors");
  const [activeDirection, setActiveDirection] = useState("All Directions");
  const [activeStatus, setActiveStatus] = useState("All Status");
  const router = useRouter();

  useEffect(() => {
    // TODO: Fetch from Supabase
    setSignals(SAMPLE_SIGNALS);
    setLoading(false);
  }, []);

  async function handleValidate(signal: TradeSignal) {
    setValidating(signal.ticker);
    try {
      const result = await triggerValidation(signal.ticker, {
        strategy: signal.strategy,
        sharpe: signal.sharpe,
        win_rate: signal.win_rate,
        max_drawdown: signal.max_drawdown,
        direction: signal.direction,
      });

      setSignals((prev) =>
        prev.map((s) =>
          s.id === signal.id
            ? {
                ...s,
                validation_status: result.recommendation === "GO" ? "go" : "nogo",
                thesis_json: result,
              }
            : s
        )
      );
    } catch (err) {
      console.error("Validation failed:", err);
    } finally {
      setValidating(null);
    }
  }

  const filteredSignals = signals.filter((s) => {
    if (activeSector !== "All Sectors" && s.params_json) {
      // Sector filtering placeholder
    }
    if (activeDirection !== "All Directions" && s.direction !== activeDirection) return false;
    if (activeStatus === "Pending" && s.validation_status !== "pending") return false;
    if (activeStatus === "GO" && s.validation_status !== "go") return false;
    if (activeStatus === "NO-GO" && s.validation_status !== "nogo") return false;
    return true;
  });

  return (
    <div className="relative overflow-hidden">
      {/* Blue radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-[600px] h-[400px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(71,159,250,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Atmospheric background image */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[900px] h-[500px] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80"
          alt="Data analysis"
          width={800}
          height={400}
          className="opacity-[0.15] object-cover"
          style={{
            maskImage:
              "radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%)",
          }}
        />
      </div>

      <div className="max-w-[1220px] mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-10 flex items-center justify-between">
            <div>
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
                Grid search results ranked by Sharpe ratio
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
            </div>
            <div className="relative inline-block">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: "0 0 30px 4px rgba(71,159,250,0.15)",
                }}
              />
              <button
                onClick={async () => {
                  const pending = signals.filter((s) => s.validation_status === "pending");
                  for (const s of pending) {
                    await handleValidate(s);
                  }
                }}
                disabled={!!validating || signals.filter((s) => s.validation_status === "pending").length === 0}
                className="relative inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-medium text-white transition-all hover:scale-[1.03] disabled:opacity-40"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "0.5px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {validating ? "Validating..." : "Validate All"}
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={100}>
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sector */}
            <div className="glass rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#555] mb-2">Sector</div>
              <div className="flex flex-wrap gap-1.5">
                {SECTORS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSector(s)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                      s === activeSector
                        ? "bg-[rgba(71,159,250,0.15)] text-white border border-[rgba(71,159,250,0.25)]"
                        : "text-[#868F97] hover:text-white bg-[rgba(255,255,255,0.03)] border border-transparent"
                    )}
                  >
                    {s.replace("All Sectors", "All")}
                  </button>
                ))}
              </div>
            </div>
            {/* Direction */}
            <div className="glass rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#555] mb-2">Direction</div>
              <div className="flex flex-wrap gap-1.5">
                {DIRECTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setActiveDirection(d)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                      d === activeDirection
                        ? d === "LONG" ? "bg-[rgba(78,190,150,0.15)] text-[#4EBE96] border border-[rgba(78,190,150,0.25)]"
                          : d === "SHORT" ? "bg-[rgba(248,113,113,0.15)] text-[#f87171] border border-[rgba(248,113,113,0.25)]"
                          : "bg-[rgba(71,159,250,0.15)] text-white border border-[rgba(71,159,250,0.25)]"
                        : "text-[#868F97] hover:text-white bg-[rgba(255,255,255,0.03)] border border-transparent"
                    )}
                  >
                    {d.replace("All Directions", "All")}
                  </button>
                ))}
              </div>
            </div>
            {/* Status */}
            <div className="glass rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#555] mb-2">Status</div>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((st) => (
                  <button
                    key={st}
                    onClick={() => setActiveStatus(st)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                      st === activeStatus
                        ? st === "GO" ? "bg-[rgba(78,190,150,0.15)] text-[#4EBE96] border border-[rgba(78,190,150,0.25)]"
                          : st === "NO-GO" ? "bg-[rgba(248,113,113,0.15)] text-[#f87171] border border-[rgba(248,113,113,0.25)]"
                          : "bg-[rgba(71,159,250,0.15)] text-white border border-[rgba(71,159,250,0.25)]"
                        : "text-[#868F97] hover:text-white bg-[rgba(255,255,255,0.03)] border border-transparent"
                    )}
                  >
                    {st.replace("All Status", "All")}
                  </button>
                ))}
              </div>
            </div>
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
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignals.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Crosshair
                        size={24}
                        className="mx-auto mb-3 text-[#555]"
                        strokeWidth={1}
                      />
                      <p className="text-sm text-[#868F97]">
                        No signals yet. Run the grid search on your PC to populate
                        this table.
                      </p>
                      <p className="mt-1 text-xs text-[#555]">
                        Signals export to Supabase automatically from the Research
                        Lab
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
                            s.direction === "LONG"
                              ? "badge-gain"
                              : "badge-loss"
                          )}
                        >
                          {s.direction}
                        </span>
                      </td>
                      <td className="text-center">
                        <StatusBadge status={s.validation_status} />
                      </td>
                      <td className="text-right">
                        {s.validation_status === "pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleValidate(s);
                            }}
                            disabled={validating === s.ticker}
                            className="rounded-md bg-[rgba(71,159,250,0.12)] px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-[rgba(71,159,250,0.2)] disabled:opacity-50"
                          >
                            {validating === s.ticker ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              "Validate"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
        {/* Product Mockup — Mini Thesis Card Preview */}
        <ScrollReveal delay={300}>
          <div className="mt-10 flex justify-center">
            <div
              className="relative w-full max-w-[480px] overflow-hidden rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                boxShadow:
                  "0 0 80px -20px rgba(71,159,250,0.06), 0 20px 60px -20px rgba(0,0,0,0.4)",
              }}
            >
              <div className="text-[10px] uppercase tracking-wider text-[#555] mb-3">
                AI Thesis Preview
              </div>
              <div className="space-y-2.5">
                {/* GO example */}
                <div
                  className="rounded-xl p-3.5"
                  style={{
                    background: "rgba(78,190,150,0.06)",
                    border: "0.5px solid rgba(78,190,150,0.12)",
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[12px] font-semibold text-[#4EBE96]">
                      GO — NVDA
                    </span>
                    <span className="text-[10px] text-[#868F97] font-mono tabular-nums">
                      Sharpe 2.14
                    </span>
                  </div>
                  <p className="text-[11px] text-[#868F97] leading-relaxed">
                    Strong EMA cross confirmed. No fundamental red flags from
                    earnings or macro. High conviction entry.
                  </p>
                </div>
                {/* NO-GO example */}
                <div
                  className="rounded-xl p-3.5"
                  style={{
                    background: "rgba(248,113,113,0.06)",
                    border: "0.5px solid rgba(248,113,113,0.12)",
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[12px] font-semibold text-[#f87171]">
                      NO-GO — XOM
                    </span>
                    <span className="text-[10px] text-[#868F97] font-mono tabular-nums">
                      Sharpe 1.62
                    </span>
                  </div>
                  <p className="text-[11px] text-[#868F97] leading-relaxed">
                    MACD divergence valid, but OPEC+ meeting risk flagged by AI.
                    Recommend waiting for catalyst resolution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-[rgba(255,255,255,0.06)] text-[#555]",
    go: "badge-gain",
    nogo: "badge-loss",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    go: "GO",
    nogo: "NO-GO",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium",
        styles[status] || styles.pending
      )}
    >
      {labels[status] || "Pending"}
    </span>
  );
}
