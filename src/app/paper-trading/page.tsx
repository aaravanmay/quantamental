"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LineChart, ToggleLeft, ToggleRight, Plus, X } from "lucide-react";
import { cn, formatCurrency, formatPct, pnlColor } from "@/lib/utils";
import { useSettings, useUpdateSettings } from "@/lib/settings-context";
import { ScrollReveal } from "@/components/ScrollReveal";
import { EquityCurve } from "@/components/EquityCurve";
import type { PaperTrade, PerformanceStats } from "@/lib/types";

const TIMEFRAME_LABELS: Record<string, string> = {
  day: "Day Trading",
  swing: "Swing Trading (4-5 months)",
  longterm: "Long-Term (1 year)",
};

export default function PaperTradingPage() {
  const settings = useSettings();
  const { autoMode, startingBalance, timeframe } = settings;
  const updateSettings = useUpdateSettings();
  const mode = autoMode ? "auto" : "manual";

  // Equity curve shows flat starting balance when no trades exist — real data comes from Supabase
  const EMPTY_EQUITY = [startingBalance];

  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadTrades() {
      try {
        const res = await fetch("/api/paper-trade");
        if (res.ok) {
          const data = await res.json();
          setTrades(data.trades || []);
        }
      } catch {}
    }
    loadTrades();
  }, []);

  async function handleCloseTrade(tradeId: string, currentPrice: number) {
    try {
      const res = await fetch("/api/paper-trade", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tradeId, exit_price: currentPrice }),
      });
      if (res.ok) {
        // Refresh trades
        const refreshRes = await fetch("/api/paper-trade");
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setTrades(data.trades || []);
        }
      }
    } catch {}
  }

  // New trade form
  const [showNewTrade, setShowNewTrade] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newDirection, setNewDirection] = useState<"LONG" | "SHORT">("LONG");
  const [placing, setPlacing] = useState(false);

  async function handlePlaceTrade() {
    if (!newTicker || !newShares) return;
    setPlacing(true);
    try {
      // Fetch current price
      const quoteRes = await fetch(`/api/stock/${newTicker.toUpperCase()}/quote`);
      let price = 0;
      if (quoteRes.ok) {
        const q = await quoteRes.json();
        price = q.price;
      }
      if (!price) {
        alert("Could not fetch price for " + newTicker.toUpperCase());
        setPlacing(false);
        return;
      }

      const res = await fetch("/api/paper-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: newTicker.toUpperCase(),
          direction: newDirection,
          shares: Number(newShares),
          price,
          mode: "manual",
        }),
      });

      if (res.ok) {
        // Refresh trades
        const refreshRes = await fetch("/api/paper-trade");
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setTrades(data.trades || []);
        }
        setNewTicker("");
        setNewShares("");
        setShowNewTrade(false);
      }
    } catch {}
    setPlacing(false);
  }

  const openTrades = trades.filter((t) => t.status === "open");
  const closedTrades = trades.filter((t) => t.status === "closed");

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

      {/* Atmospheric background image behind stats */}
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 w-[900px] h-[500px] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"
          alt="Trading screens"
          width={800}
          height={400}
          className="opacity-[0.15] object-cover"
          style={{
            maskImage:
              "radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%)",
          }}
        />
      </div>

      {/* Green glow when auto mode is active */}
      {mode === "auto" && (
        <div
          className="pointer-events-none absolute left-1/2 top-32 -translate-x-1/2 w-[500px] h-[350px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(78,190,150,0.07) 0%, transparent 70%)",
            transition: "opacity 0.5s ease",
          }}
        />
      )}

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
                Trades
              </h1>
              <p className="mt-2 text-[15px] text-[#868F97]">
                {TIMEFRAME_LABELS[timeframe] ?? "Swing Trading (4-5 months)"} &middot; Paper trading positions and performance tracking
              </p>
            </div>

            {/* Mode Toggle */}
            <button
              onClick={() => updateSettings({ autoMode: !autoMode })}
              className={cn(
                "flex items-center gap-2.5 rounded-full px-5 py-2.5 text-[14px] font-medium transition-all hover:scale-[1.03]",
                mode === "auto"
                  ? "text-gain"
                  : "text-[#868F97]"
              )}
              style={{
                background:
                  mode === "auto"
                    ? "rgba(78,190,150,0.1)"
                    : "rgba(255,255,255,0.06)",
                border:
                  mode === "auto"
                    ? "0.5px solid rgba(78,190,150,0.2)"
                    : "0.5px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                boxShadow:
                  mode === "auto"
                    ? "0 0 24px 2px rgba(78,190,150,0.12)"
                    : "none",
              }}
            >
              {mode === "auto" ? (
                <ToggleRight size={20} />
              ) : (
                <ToggleLeft size={20} />
              )}
              {mode === "auto" ? "Auto Mode" : "Manual Mode"}
            </button>
          </div>
        </ScrollReveal>

        {/* Auto Mode Banner */}
        {mode === "auto" && (
          <ScrollReveal>
            <div className="relative mb-10 overflow-hidden">
              {/* Green glow behind banner */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px]"
                style={{
                  background:
                    "radial-gradient(ellipse, rgba(78,190,150,0.1) 0%, transparent 70%)",
                }}
              />
              <div
                className="relative rounded-2xl p-5"
                style={{
                  background: "rgba(78,190,150,0.05)",
                  border: "0.5px solid rgba(78,190,150,0.15)",
                  boxShadow: "0 0 40px -10px rgba(78,190,150,0.1)",
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#4EBE96] animate-pulse" />
                  <h3 className="text-[14px] font-semibold text-gain">
                    Auto Mode Active
                  </h3>
                </div>
                <p className="text-[13px] text-[#868F97] leading-relaxed">
                  GO signals from the Stock Finder will be automatically paper-traded
                  at next market open. Exit rules: stop-loss at -{settings.stopLossPct}%, take-profit at
                  +{settings.takeProfitPct}%, max position {settings.maxPositionPct}% of portfolio.
                </p>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* New Trade Form (Manual Mode) */}
        {mode === "manual" && (
          <ScrollReveal delay={75}>
            <div className="mb-10">
              {!showNewTrade ? (
                <button
                  onClick={() => setShowNewTrade(true)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium text-white transition-all hover:scale-[1.02]"
                  style={{
                    background: "rgba(71,159,250,0.12)",
                    border: "1px solid rgba(71,159,250,0.2)",
                  }}
                >
                  <Plus size={14} />
                  New Trade
                </button>
              ) : (
                <div
                  className="glass rounded-2xl p-5"
                  style={{ boxShadow: "0 0 60px -20px rgba(71,159,250,0.08), 0 20px 40px -20px rgba(0,0,0,0.3)" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-white">Place a Paper Trade</h3>
                    <button onClick={() => setShowNewTrade(false)} className="text-[#555] hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#555] mb-1 block">Ticker</label>
                      <input
                        value={newTicker}
                        onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                        placeholder="AAPL"
                        className="glass-input w-full px-3 py-2 text-sm font-mono text-white placeholder:text-[#555]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#555] mb-1 block">Shares</label>
                      <input
                        value={newShares}
                        onChange={(e) => setNewShares(e.target.value)}
                        placeholder="10"
                        type="number"
                        className="glass-input w-full px-3 py-2 text-sm font-mono text-white placeholder:text-[#555]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-[#555] mb-1 block">Direction</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewDirection("LONG")}
                          className="flex-1 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors"
                          style={{
                            background: newDirection === "LONG" ? "rgba(78,190,150,0.15)" : "rgba(255,255,255,0.04)",
                            border: newDirection === "LONG" ? "1px solid rgba(78,190,150,0.3)" : "1px solid rgba(255,255,255,0.08)",
                            color: newDirection === "LONG" ? "#4EBE96" : "#868F97",
                          }}
                        >
                          Long
                        </button>
                        <button
                          onClick={() => setNewDirection("SHORT")}
                          className="flex-1 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors"
                          style={{
                            background: newDirection === "SHORT" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.04)",
                            border: newDirection === "SHORT" ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(255,255,255,0.08)",
                            color: newDirection === "SHORT" ? "#f87171" : "#868F97",
                          }}
                        >
                          Short
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handlePlaceTrade}
                        disabled={placing || !newTicker || !newShares}
                        className="w-full rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: "rgba(71,159,250,0.15)",
                          border: "1px solid rgba(71,159,250,0.25)",
                        }}
                      >
                        {placing ? "Placing..." : "Buy at Market Price"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-[#555]">
                    Price is fetched live from FMP at the moment you click Buy.
                  </p>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Performance Stats */}
        <ScrollReveal delay={100}>
          <div className="mb-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <StatCard
              label="Total Return"
              value={stats ? formatPct(stats.total_return_pct) : "\u2014"}
              color={stats ? pnlColor(stats.total_return_pct) : ""}
              tint="blue"
            />
            <StatCard
              label="Sharpe Ratio"
              value={stats ? stats.sharpe_ratio.toFixed(2) : "\u2014"}
              tint="blue"
            />
            <StatCard
              label="Win Rate"
              value={stats ? `${(stats.win_rate * 100).toFixed(0)}%` : "\u2014"}
              tint="green"
            />
            <StatCard
              label="Avg Hold"
              value={stats ? `${stats.avg_hold_days}d` : "\u2014"}
              tint="orange"
            />
            <StatCard
              label="Total Trades"
              value={stats ? String(stats.total_trades) : "0"}
            />
            <StatCard
              label="Open Positions"
              value={String(openTrades.length)}
              tint="green"
            />
          </div>
        </ScrollReveal>

        {/* Equity Curve */}
        <ScrollReveal delay={150}>
          <div className="mb-12">
            <div className="text-[11px] uppercase tracking-wider text-[#555] mb-3">
              ${startingBalance.toLocaleString()} starting capital
            </div>
            <EquityCurve
              data={(() => {
                if (closedTrades.length === 0) return EMPTY_EQUITY;
                // Build equity curve from closed trade P&L
                let balance = startingBalance;
                const curve = [balance];
                closedTrades
                  .slice()
                  .sort((a, b) => (a.exit_date || "").localeCompare(b.exit_date || ""))
                  .forEach((t) => {
                    const pnl = t.direction === "LONG"
                      ? ((t.exit_price || 0) - t.entry_price) * t.shares
                      : (t.entry_price - (t.exit_price || 0)) * t.shares;
                    balance += pnl;
                    curve.push(balance);
                  });
                return curve;
              })()}
              height={200}
              color="#479FFA"
              label={closedTrades.length > 0
                ? `Paper Trading Performance — ${closedTrades.length} closed trades`
                : `No closed trades yet — starting at $${startingBalance.toLocaleString()}`}
            />
          </div>
        </ScrollReveal>

        {/* Open Positions */}
        <ScrollReveal delay={200}>
          <div className="mb-12">
            <h2
              className="mb-4 text-[20px] font-semibold"
              style={{
                background:
                  "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Open Positions
            </h2>
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
                    <th>Ticker</th>
                    <th>Direction</th>
                    <th className="text-right">Entry Price</th>
                    <th className="text-right">Current</th>
                    <th className="text-right">P&L %</th>
                    <th className="text-right">Entry Date</th>
                    <th>Mode</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {openTrades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <LineChart
                          size={24}
                          className="mx-auto mb-3 text-[#555]"
                          strokeWidth={1}
                        />
                        <p className="text-[13px] text-[#868F97]">
                          No open positions.{" "}
                          {mode === "manual"
                            ? "Click \"New Trade\" above to place your first paper trade."
                            : "Waiting for GO signals from Stock Finder."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    openTrades.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => router.push(`/stock/${t.ticker}`)}
                      >
                        <td className="font-medium text-white">
                          {t.ticker}
                        </td>
                        <td>
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-[11px] font-medium",
                              t.direction === "LONG"
                                ? "badge-gain"
                                : "badge-loss"
                            )}
                          >
                            {t.direction}
                          </span>
                        </td>
                        <td className="text-right font-mono tabular-nums">
                          {formatCurrency(t.entry_price)}
                        </td>
                        <td className="text-right font-mono tabular-nums">{"\u2014"}</td>
                        <td
                          className={cn(
                            "text-right font-mono tabular-nums",
                            pnlColor(t.pnl_pct || 0)
                          )}
                        >
                          {t.pnl_pct != null ? formatPct(t.pnl_pct) : "\u2014"}
                        </td>
                        <td className="text-right font-mono tabular-nums text-[#868F97]">
                          {t.entry_date}
                        </td>
                        <td>
                          <span className="text-[11px] text-[#555]">
                            {t.mode}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const price = t.entry_price; // Use entry price as fallback
                              handleCloseTrade(t.id, price);
                            }}
                            className="rounded bg-[rgba(248,113,113,0.12)] px-2.5 py-1 text-[11px] font-medium text-loss hover:bg-[rgba(248,113,113,0.2)] transition-colors"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>

        {/* Trade History */}
        <ScrollReveal delay={300}>
          <div className="mb-10">
            <h2
              className="mb-4 text-[20px] font-semibold"
              style={{
                background:
                  "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Trade History
            </h2>
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
                    <th>Ticker</th>
                    <th className="text-right">Entry</th>
                    <th className="text-right">Exit</th>
                    <th className="text-right">P&L %</th>
                    <th>Duration</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTrades.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-[13px] text-[#868F97]"
                      >
                        No completed trades yet
                      </td>
                    </tr>
                  ) : (
                    closedTrades.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => router.push(`/stock/${t.ticker}`)}
                      >
                        <td className="font-medium text-white">
                          {t.ticker}
                        </td>
                        <td className="text-right font-mono tabular-nums">
                          {formatCurrency(t.entry_price)}
                        </td>
                        <td className="text-right font-mono tabular-nums">
                          {t.exit_price ? formatCurrency(t.exit_price) : "\u2014"}
                        </td>
                        <td
                          className={cn(
                            "text-right font-mono tabular-nums",
                            pnlColor(t.pnl_pct || 0)
                          )}
                        >
                          {t.pnl_pct != null ? formatPct(t.pnl_pct) : "\u2014"}
                        </td>
                        <td className="font-mono tabular-nums text-[#868F97]">
                          {t.entry_date} {"\u2192"} {t.exit_date || "\u2014"}
                        </td>
                        <td className="text-[11px] text-[#555]">{t.mode}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  tint,
}: {
  label: string;
  value: string;
  color?: string;
  tint?: "blue" | "green" | "orange";
}) {
  const tintBg: Record<string, string> = {
    blue: "linear-gradient(135deg, rgba(71,159,250,0.04) 0%, transparent 60%)",
    green: "linear-gradient(135deg, rgba(78,190,150,0.04) 0%, transparent 60%)",
    orange: "linear-gradient(135deg, rgba(255,161,108,0.04) 0%, transparent 60%)",
  };

  return (
    <div
      className="glass relative overflow-hidden px-4 py-3"
      style={{
        background: tint
          ? undefined
          : "rgba(255,255,255,0.03)",
      }}
    >
      {tint && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: tintBg[tint] }}
        />
      )}
      <div className="relative">
        <div className="text-[10px] uppercase tracking-wider text-[#555]">
          {label}
        </div>
        <div
          className={cn(
            "mt-1 text-[20px] font-mono tabular-nums font-semibold text-white",
            color
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
