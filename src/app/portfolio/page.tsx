"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Briefcase, Loader2, Plus, ScanSearch, X } from "lucide-react";
import { cn, formatCurrency, formatPct, pnlColor } from "@/lib/utils";
import { ScanResultCard } from "@/components/ScanResultCard";
import { FidelityConnect } from "@/components/FidelityConnect";
import { ScrollReveal } from "@/components/ScrollReveal";
import { EquityCurve } from "@/components/EquityCurve";
import { triggerPortfolioScan } from "@/lib/api";
import type { Holding, ScanResult } from "@/lib/types";

// Real equity data from Supabase — flat line when no holdings
const PORTFOLIO_EQUITY_DATA: number[] = [];

/* ── Gradient text style reused on headings ── */
const gradientText = {
  background: "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
} as const;

const sectionHeadingGradient = {
  background: "linear-gradient(180deg, #fff 40%, rgba(255,255,255,0.5) 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
} as const;

const dramaticShadow = {
  boxShadow:
    "0 0 80px -20px rgba(71,159,250,0.08), 0 20px 60px -20px rgba(0,0,0,0.4)",
} as const;

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  // Add holding form state
  const [newTicker, setNewTicker] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newSector, setNewSector] = useState("");

  useEffect(() => {
    async function loadHoldings() {
      try {
        const { getSupabase } = await import("@/lib/supabase");
        const supabase = getSupabase();
        const { data } = await supabase
          .from("portfolio_holdings")
          .select("*")
          .eq("user_id", "default")
          .order("created_at", { ascending: false });
        if (data) setHoldings(data);
      } catch {
        // Supabase not configured — use empty array
      }
    }
    loadHoldings();
  }, []);

  const totalValue = holdings.reduce(
    (sum, h) => sum + (h.current_price || h.avg_cost) * h.shares,
    0
  );
  const totalCost = holdings.reduce(
    (sum, h) => sum + h.avg_cost * h.shares,
    0
  );
  const totalPnl =
    totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  function addHolding() {
    if (!newTicker || !newShares || !newCost) return;

    const holding: Holding = {
      id: crypto.randomUUID(),
      user_id: "",
      ticker: newTicker.toUpperCase(),
      shares: parseFloat(newShares),
      avg_cost: parseFloat(newCost),
      sector: newSector,
      added_date: new Date().toISOString().split("T")[0],
    };

    setHoldings((prev) => [...prev, holding]);
    setNewTicker("");
    setNewShares("");
    setNewCost("");
    setNewSector("");
    setShowAddForm(false);

    // Persist to Supabase
    try {
      import("@/lib/supabase").then(({ getSupabase }) => {
        const supabase = getSupabase();
        supabase.from("portfolio_holdings").insert({
          user_id: "default",
          ticker: holding.ticker,
          shares: holding.shares,
          avg_cost: holding.avg_cost,
          sector: holding.sector,
        }).then(() => {});
      });
    } catch {}
  }

  async function handleScan() {
    if (holdings.length === 0) return;
    setScanning(true);
    setScanResults([]);

    try {
      const results = await triggerPortfolioScan(
        holdings.map((h) => ({
          ticker: h.ticker,
          shares: h.shares,
          avg_cost: h.avg_cost,
          current_price: h.current_price || h.avg_cost,
          pnl_pct: h.pnl_pct || 0,
          sector: h.sector,
          added_date: h.added_date,
        }))
      );
      setScanResults(results);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* ── Blue glow behind header ── */}
      <div
        className="glow-blue"
        style={{ top: -120, left: "50%", transform: "translateX(-50%)" }}
      />

      {/* Atmospheric background image */}
      <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 w-[900px] h-[500px] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80"
          alt="Financial data"
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
        {/* ══════════════════════════════════════════════════════
            SECTION 1 — Title + Actions + FidelityConnect
        ══════════════════════════════════════════════════════ */}
        <ScrollReveal>
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h1
                className="text-[32px] font-semibold tracking-tight"
                style={gradientText}
              >
                Portfolio
              </h1>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#868F97] bg-[rgba(255,255,255,0.04)] transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {showAddForm ? <X size={14} /> : <Plus size={14} />}
                  {showAddForm ? "Cancel" : "Add Holding"}
                </button>
                <button
                  onClick={handleScan}
                  disabled={scanning || holdings.length === 0}
                  className="flex items-center gap-1.5 rounded-lg bg-[rgba(71,159,250,0.12)] px-3.5 py-2 text-[13px] font-medium text-accent hover:bg-[rgba(71,159,250,0.2)] disabled:opacity-50 transition-colors"
                  style={{ border: "1px solid rgba(71,159,250,0.2)" }}
                >
                  {scanning ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ScanSearch size={14} />
                  )}
                  {scanning ? "Scanning..." : "Scan Portfolio"}
                </button>
              </div>
            </div>

            {/* Add Holding Form — glass card */}
            {showAddForm && (
              <div className="glass mb-6 p-5" style={dramaticShadow}>
                <h3 className="mb-4 text-sm font-medium text-white">
                  Add New Holding
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#555]">
                      Ticker
                    </label>
                    <input
                      value={newTicker}
                      onChange={(e) => setNewTicker(e.target.value)}
                      placeholder="AAPL"
                      className="glass-input w-full px-3 py-2 text-sm text-white placeholder:text-[#555]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#555]">
                      Shares
                    </label>
                    <input
                      value={newShares}
                      onChange={(e) => setNewShares(e.target.value)}
                      placeholder="100"
                      type="number"
                      className="glass-input w-full px-3 py-2 text-sm text-white placeholder:text-[#555]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#555]">
                      Avg Cost
                    </label>
                    <input
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      placeholder="150.00"
                      type="number"
                      step="0.01"
                      className="glass-input w-full px-3 py-2 text-sm text-white placeholder:text-[#555]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#555]">
                      Sector
                    </label>
                    <input
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value)}
                      placeholder="Technology"
                      className="glass-input w-full px-3 py-2 text-sm text-white placeholder:text-[#555]"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={addHolding}
                    className="rounded-lg bg-[rgba(71,159,250,0.12)] px-5 py-2 text-[13px] font-medium text-accent hover:bg-[rgba(71,159,250,0.2)] transition-colors"
                    style={{ border: "1px solid rgba(71,159,250,0.2)" }}
                  >
                    Add to Portfolio
                  </button>
                </div>
              </div>
            )}

            {/* Fidelity Connect — with subtle glow */}
            <div className="relative overflow-hidden rounded-2xl">
              <div
                className="glow-blue"
                style={{ top: -160, right: -100, opacity: 0.5 }}
              />
              <FidelityConnect />
            </div>
          </div>
        </ScrollReveal>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — Portfolio Summary Cards
        ══════════════════════════════════════════════════════ */}
        <ScrollReveal delay={80}>
          <div className="relative overflow-hidden mb-10">
            {/* Green glow behind when positive P&L */}
            {totalPnl > 0 && (
              <div
                className="glow-green"
                style={{ top: -80, left: "30%", transform: "translateX(-50%)" }}
              />
            )}

            <h2
              className="text-[20px] font-semibold mb-4"
              style={sectionHeadingGradient}
            >
              Summary
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Portfolio Value */}
              <div className="glass px-5 py-4" style={dramaticShadow}>
                <div className="text-[11px] uppercase tracking-wider text-[#555] mb-1">
                  Portfolio Value
                </div>
                <div className="text-[28px] font-mono tabular-nums font-semibold text-white leading-tight">
                  {formatCurrency(totalValue)}
                </div>
              </div>

              {/* Total P&L */}
              <div className="glass px-5 py-4" style={dramaticShadow}>
                <div className="text-[11px] uppercase tracking-wider text-[#555] mb-1">
                  Total P&L
                </div>
                <div
                  className={cn(
                    "text-[28px] font-mono tabular-nums font-semibold leading-tight",
                    pnlColor(totalPnl)
                  )}
                >
                  {formatPct(totalPnl)}
                </div>
              </div>

              {/* Holdings Count */}
              <div className="glass px-5 py-4" style={dramaticShadow}>
                <div className="text-[11px] uppercase tracking-wider text-[#555] mb-1">
                  Holdings
                </div>
                <div className="text-[28px] font-mono tabular-nums font-semibold text-white leading-tight">
                  {holdings.length}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ══════════════════════════════════════════════════════
            SECTION 2.5 — Portfolio Equity Curve
        ══════════════════════════════════════════════════════ */}
        <ScrollReveal delay={120}>
          <div className="mb-10">
            <EquityCurve
              data={PORTFOLIO_EQUITY_DATA}
              height={200}
              color="#4EBE96"
              label="Portfolio Performance"
            />
          </div>
        </ScrollReveal>

        {/* ══════════════════════════════════════════════════════
            SECTION 3 — Holdings Table
        ══════════════════════════════════════════════════════ */}
        <ScrollReveal delay={160}>
          <div className="relative overflow-hidden mb-10">
            <h2
              className="text-[20px] font-semibold mb-4"
              style={sectionHeadingGradient}
            >
              Holdings
            </h2>

            <div className="glass overflow-hidden" style={dramaticShadow}>
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Sector</th>
                    <th className="text-right">Shares</th>
                    <th className="text-right">Avg Cost</th>
                    <th className="text-right">Current</th>
                    <th className="text-right">P&L %</th>
                    <th className="text-right">Weight</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-14 text-center">
                        <Briefcase
                          size={24}
                          className="mx-auto mb-3 text-[#555]"
                          strokeWidth={1}
                        />
                        <p className="text-[13px] text-[#868F97]">
                          No holdings yet. Click &quot;Add Holding&quot; or
                          connect Fidelity to get started.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    holdings.map((h) => {
                      const current = h.current_price || h.avg_cost;
                      const pnl =
                        ((current - h.avg_cost) / h.avg_cost) * 100;
                      const weight =
                        totalValue > 0
                          ? ((current * h.shares) / totalValue) * 100
                          : 0;
                      return (
                        <tr
                          key={h.id}
                          onClick={() => router.push(`/stock/${h.ticker}`)}
                        >
                          <td className="font-medium text-white">
                            {h.ticker}
                          </td>
                          <td>
                            {h.sector ? (
                              <span className="sector-badge">{h.sector}</span>
                            ) : (
                              <span className="text-[#555]">{"\u2014"}</span>
                            )}
                          </td>
                          <td className="text-right font-mono tabular-nums">
                            {h.shares}
                          </td>
                          <td className="text-right font-mono tabular-nums">
                            {formatCurrency(h.avg_cost)}
                          </td>
                          <td className="text-right font-mono tabular-nums">
                            {formatCurrency(current)}
                          </td>
                          <td
                            className={cn(
                              "text-right font-mono tabular-nums",
                              pnlColor(pnl)
                            )}
                          >
                            {formatPct(pnl)}
                          </td>
                          <td className="text-right font-mono tabular-nums text-[#868F97]">
                            {weight.toFixed(1)}%
                          </td>
                          <td className="text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setHoldings((prev) =>
                                  prev.filter((x) => x.id !== h.id)
                                );
                              }}
                              className="text-[11px] text-[#555] hover:text-loss transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>

        {/* ══════════════════════════════════════════════════════
            SECTION 4 — Scan Results
        ══════════════════════════════════════════════════════ */}
        {scanResults.length > 0 && (
          <ScrollReveal delay={240}>
            <div className="relative overflow-hidden">
              {/* Orange glow behind scan results */}
              <div
                className="glow-orange"
                style={{ top: -100, right: -60 }}
              />

              <h2
                className="text-[20px] font-semibold mb-4"
                style={sectionHeadingGradient}
              >
                AI Scan Results
              </h2>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {scanResults.map((r) => (
                  <ScanResultCard key={r.ticker} result={r} />
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
