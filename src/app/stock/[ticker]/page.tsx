"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, RefreshCw, BarChart3, Newspaper, Brain, Star, Bell } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PriceChart } from "@/components/PriceChart";
import { ThesisCard } from "@/components/ThesisCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getQuote, getNews, getFundamentals, triggerValidation } from "@/lib/api";
import { formatCurrency, formatPct, pnlColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { StockQuote } from "@/lib/types";

type Tab = "chart" | "fundamentals" | "thesis" | "news";

export default function StockDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();

  const [tab, setTab] = useState<Tab>("chart");
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [fundamentals, setFundamentals] = useState<any>(null);
  const [thesis, setThesis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [showAlertForm, setShowAlertForm] = useState(false);

  // Dismiss alert popover on click outside
  useEffect(() => {
    if (!showAlertForm) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-alert-popover]")) {
        setShowAlertForm(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showAlertForm]);

  // Check if in watchlist
  useEffect(() => {
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.items || []).some((i: any) => i.ticker === upperTicker);
        setInWatchlist(found);
      })
      .catch(() => {});
  }, [upperTicker]);

  async function toggleWatchlist() {
    if (inWatchlist) {
      await fetch("/api/watchlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: upperTicker }) });
      setInWatchlist(false);
    } else {
      await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: upperTicker }) });
      setInWatchlist(true);
    }
  }

  async function createAlert() {
    if (!alertPrice) return;
    const currentPrice = quote?.price || 0;
    const target = Number(alertPrice);
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: upperTicker, target_price: target, direction: target > currentPrice ? "above" : "below" }),
    });
    setAlertPrice("");
    setShowAlertForm(false);
  }

  useEffect(() => {
    async function load() {
      try {
        const [q, n, f] = await Promise.allSettled([
          getQuote(upperTicker),
          getNews(upperTicker),
          getFundamentals(upperTicker),
        ]);
        if (q.status === "fulfilled") setQuote(q.value);
        if (n.status === "fulfilled") setNews(n.value);
        if (f.status === "fulfilled") setFundamentals(f.value);
      } catch {
        // Graceful degradation
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [upperTicker]);

  async function handleGenerateThesis() {
    setValidating(true);
    try {
      const result = await triggerValidation(upperTicker);
      setThesis(result);
      setTab("thesis");
    } catch (err) {
      console.error("Validation failed:", err);
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* Radial glow behind header */}
      <div
        className="absolute left-1/2 -top-20 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(71,159,250,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Atmospheric background image */}
      <div className="pointer-events-none absolute left-1/2 -top-10 -translate-x-1/2 w-[900px] h-[500px] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80"
          alt="Financial charts"
          width={800}
          height={400}
          className="opacity-[0.2] object-cover"
          style={{
            maskImage:
              "radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%)",
          }}
        />
      </div>

      <div className="max-w-[1220px] mx-auto px-6 py-6 relative z-10">
        {/* ── Header ── */}
        <ScrollReveal delay={0}>
          <div className="mb-8">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1.5 text-[#868F97] hover:text-white transition-colors text-[13px]"
            >
              <ArrowLeft size={14} />
              Back
            </Link>

            <div className="flex items-start justify-between">
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
                  {upperTicker}
                  {quote?.name && (
                    <span className="ml-2.5 text-[18px] font-normal text-[#868F97]"
                      style={{ WebkitTextFillColor: "#868F97" }}>
                      {quote.name}
                    </span>
                  )}
                </h1>

                <div className="mt-2 flex items-baseline gap-3">
                  {quote ? (
                    <>
                      <span
                        className="text-[36px] font-mono tabular-nums font-semibold"
                        style={{
                          background:
                            "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.45) 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {formatCurrency(quote.price)}
                      </span>
                      <span
                        className={cn(
                          "text-[16px] font-medium font-mono tabular-nums flex items-center gap-1",
                          pnlColor(quote.change)
                        )}
                      >
                        <span className="text-[11px] leading-none">
                          {quote.change >= 0 ? "\u25B2" : "\u25BC"}
                        </span>
                        {formatPct(quote.change_pct)}
                      </span>
                    </>
                  ) : (
                    <div>
                      <span
                        className="text-[36px] font-mono tabular-nums font-semibold text-[#555]"
                      >
                        $—
                      </span>
                      <p className="mt-1 text-[12px] text-[#555]">
                        Connect FMP API in Settings to see live prices
                      </p>
                    </div>
                  )}
                </div>

                {quote?.sector && (
                  <span className="sector-badge mt-2 inline-block">
                    {quote.sector}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Watchlist Star */}
                <button
                  onClick={toggleWatchlist}
                  className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:scale-[1.05]"
                  style={{
                    background: inWatchlist ? "rgba(255,191,0,0.12)" : "rgba(255,255,255,0.06)",
                    border: inWatchlist ? "1px solid rgba(255,191,0,0.25)" : "1px solid rgba(255,255,255,0.1)",
                  }}
                  title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                >
                  <Star size={16} className={inWatchlist ? "text-[#ffbf00] fill-[#ffbf00]" : "text-[#868F97]"} />
                </button>

                {/* Price Alert Bell */}
                <div className="relative" data-alert-popover>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowAlertForm(!showAlertForm); }}
                    className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:scale-[1.05]"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    title="Set price alert"
                  >
                    <Bell size={16} className="text-[#868F97]" />
                  </button>
                  {showAlertForm && (
                    <div className="absolute right-0 top-11 z-50 glass rounded-xl p-3 w-56 border border-[rgba(255,255,255,0.1)]" style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
                      <div className="text-[11px] text-[#868F97] mb-2">Alert when price reaches:</div>
                      <div className="flex gap-2">
                        <input
                          value={alertPrice}
                          onChange={(e) => setAlertPrice(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && createAlert()}
                          placeholder="$250.00"
                          type="number"
                          className="glass-input flex-1 px-2 py-1.5 text-sm font-mono text-white placeholder:text-[#555]"
                        />
                        <button
                          onClick={createAlert}
                          disabled={!alertPrice}
                          className="rounded-md px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-40"
                          style={{ background: "rgba(71,159,250,0.15)", border: "1px solid rgba(71,159,250,0.25)" }}
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Thesis */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ boxShadow: "0 0 30px 6px rgba(71,159,250,0.12)" }} />
                  <button
                    onClick={handleGenerateThesis}
                    disabled={validating}
                    className="relative flex items-center gap-2 bg-[rgba(71,159,250,0.12)] text-accent border border-[rgba(71,159,250,0.2)] rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-all hover:bg-[rgba(71,159,250,0.2)] hover:scale-[1.02]"
                  >
                    <RefreshCw size={14} className={validating ? "animate-spin" : ""} />
                    {validating ? "Analyzing..." : "Generate Thesis"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Quick Stats ── */}
        <ScrollReveal delay={100}>
          <div className="mb-8 grid grid-cols-2 gap-2.5 md:grid-cols-6">
            {[
              { label: "Open", value: quote?.open ? formatCurrency(quote.open) : "\u2014" },
              { label: "52w High", value: quote?.high ? formatCurrency(quote.high) : "\u2014" },
              { label: "52w Low", value: quote?.low ? formatCurrency(quote.low) : "\u2014" },
              { label: "Volume", value: quote?.volume ? quote.volume.toLocaleString() : "\u2014" },
              {
                label: "Mkt Cap",
                value: quote?.market_cap
                  ? formatCurrency(quote.market_cap, true)
                  : "\u2014",
              },
              { label: "Change", value: quote ? formatCurrency(quote.change) : "\u2014" },
            ].map((s) => (
              <div
                key={s.label}
                className="glass rounded-lg px-3 py-2.5"
                style={{
                  boxShadow:
                    "0 0 40px -15px rgba(71,159,250,0.04), 0 8px 20px -8px rgba(0,0,0,0.25)",
                }}
              >
                <div className="text-[10px] uppercase tracking-wider text-[#868F97]">
                  {s.label}
                </div>
                <div className="mt-0.5 text-[14px] font-mono tabular-nums text-white">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* ── Tabs ── */}
        <ScrollReveal delay={200}>
          <div className="mb-8">
            <div className="glass-sm inline-flex gap-1 rounded-xl p-1.5">
              {(
                [
                  ["chart", "Chart"],
                  ["fundamentals", "Fundamentals"],
                  ["thesis", "AI Thesis"],
                  ["news", "News"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "pill-tab",
                    tab === key && "pill-tab-active"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ── Tab Content ── */}
        <ScrollReveal delay={300}>
          <div
            className="glass rounded-2xl p-6"
            style={{
              boxShadow:
                "0 0 60px -20px rgba(71,159,250,0.06), 0 20px 40px -20px rgba(0,0,0,0.3)",
            }}
          >
            {tab === "chart" && <PriceChart ticker={upperTicker} />}

            {tab === "fundamentals" && (
              <div>
                {fundamentals && (fundamentals.ratios?.length > 0 || fundamentals.metrics?.length > 0 || fundamentals.profile?.length > 0) ? (
                  <div className="space-y-8">
                    {/* Company Profile */}
                    {fundamentals.profile?.[0] && (
                      <div>
                        <h3 className="mb-3 text-[10px] uppercase tracking-wider font-medium text-[#868F97]">
                          Company Overview
                        </h3>
                        <p className="text-[13px] text-[#a0a7ae] leading-relaxed mb-4">
                          {fundamentals.profile[0].description?.slice(0, 300)}
                          {fundamentals.profile[0].description?.length > 300 ? "..." : ""}
                        </p>
                        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                          {[
                            { label: "Sector", value: fundamentals.profile[0].sector },
                            { label: "Industry", value: fundamentals.profile[0].industry },
                            { label: "CEO", value: fundamentals.profile[0].ceo },
                            { label: "Employees", value: fundamentals.profile[0].fullTimeEmployees?.toLocaleString() },
                            { label: "Exchange", value: fundamentals.profile[0].exchangeFullName },
                            { label: "IPO Date", value: fundamentals.profile[0].ipoDate },
                            { label: "Beta", value: fundamentals.profile[0].beta?.toFixed(2) },
                            { label: "52W Range", value: fundamentals.profile[0].range },
                          ].filter(s => s.value).map((s) => (
                            <div key={s.label} className="glass rounded-lg px-3 py-2.5" style={{ boxShadow: "0 0 40px -15px rgba(71,159,250,0.04), 0 8px 20px -8px rgba(0,0,0,0.25)" }}>
                              <div className="text-[10px] uppercase tracking-wider text-[#868F97]">{s.label}</div>
                              <div className="mt-0.5 text-[13px] text-white truncate">{s.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Metrics */}
                    {fundamentals.metrics?.[0] && (
                      <div>
                        <h3 className="mb-3 text-[10px] uppercase tracking-wider font-medium text-[#868F97]">
                          Valuation & Metrics
                        </h3>
                        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                          {[
                            { label: "Market Cap", value: fundamentals.metrics[0].marketCap, fmt: "currency" },
                            { label: "Enterprise Value", value: fundamentals.metrics[0].enterpriseValue, fmt: "currency" },
                            { label: "EV/EBITDA", value: fundamentals.metrics[0].evToEBITDA, fmt: "ratio" },
                            { label: "EV/Sales", value: fundamentals.metrics[0].evToSales, fmt: "ratio" },
                            { label: "Current Ratio", value: fundamentals.metrics[0].currentRatio, fmt: "ratio" },
                            { label: "Debt/Equity", value: fundamentals.metrics[0].netDebtToEBITDA, fmt: "ratio" },
                            { label: "EV/FCF", value: fundamentals.metrics[0].evToFreeCashFlow, fmt: "ratio" },
                            { label: "Revenue/Share", value: fundamentals.metrics[0].revenuePerShare, fmt: "currency" },
                          ].filter(s => s.value != null).map((s) => (
                            <div key={s.label} className="glass rounded-lg px-3 py-2.5" style={{ boxShadow: "0 0 40px -15px rgba(71,159,250,0.04), 0 8px 20px -8px rgba(0,0,0,0.25)" }}>
                              <div className="text-[10px] uppercase tracking-wider text-[#868F97]">{s.label}</div>
                              <div className="mt-0.5 text-[14px] font-mono tabular-nums text-white">
                                {s.fmt === "currency" ? formatCurrency(s.value as number, true) : (s.value as number).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Profitability Ratios */}
                    {fundamentals.ratios?.[0] && (
                      <div>
                        <h3 className="mb-3 text-[10px] uppercase tracking-wider font-medium text-[#868F97]">
                          Profitability & Margins
                        </h3>
                        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                          {[
                            { label: "Gross Margin", value: fundamentals.ratios[0].grossProfitMargin, fmt: "pct" },
                            { label: "Operating Margin", value: fundamentals.ratios[0].operatingProfitMargin, fmt: "pct" },
                            { label: "Net Margin", value: fundamentals.ratios[0].netProfitMargin, fmt: "pct" },
                            { label: "ROE", value: fundamentals.ratios[0].returnOnEquity, fmt: "pct" },
                            { label: "ROA", value: fundamentals.ratios[0].returnOnAssets, fmt: "pct" },
                            { label: "ROIC", value: fundamentals.ratios[0].returnOnCapitalEmployed, fmt: "pct" },
                            { label: "Dividend Yield", value: fundamentals.ratios[0].dividendYield, fmt: "pct" },
                            { label: "Payout Ratio", value: fundamentals.ratios[0].payoutRatio, fmt: "pct" },
                          ].filter(s => s.value != null).map((s) => (
                            <div key={s.label} className="glass rounded-lg px-3 py-2.5" style={{ boxShadow: "0 0 40px -15px rgba(71,159,250,0.04), 0 8px 20px -8px rgba(0,0,0,0.25)" }}>
                              <div className="text-[10px] uppercase tracking-wider text-[#868F97]">{s.label}</div>
                              <div className="mt-0.5 text-[14px] font-mono tabular-nums text-white">
                                {s.fmt === "pct" ? `${((s.value as number) * 100).toFixed(1)}%` : (s.value as number).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Revenue Trend */}
                    {fundamentals.income?.length > 1 && (
                      <div>
                        <h3 className="mb-3 text-[10px] uppercase tracking-wider font-medium text-[#868F97]">
                          Revenue Trend (Annual)
                        </h3>
                        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                          {fundamentals.income.slice(0, 4).reverse().map((yr: any) => (
                            <div key={yr.date} className="glass rounded-lg px-3 py-2.5" style={{ boxShadow: "0 0 40px -15px rgba(71,159,250,0.04), 0 8px 20px -8px rgba(0,0,0,0.25)" }}>
                              <div className="text-[10px] uppercase tracking-wider text-[#868F97]">
                                FY {yr.fiscalYear || yr.date?.slice(0,4)}
                              </div>
                              <div className="mt-0.5 text-[14px] font-mono tabular-nums text-white">
                                {formatCurrency(yr.revenue, true)}
                              </div>
                              <div className="text-[11px] font-mono tabular-nums text-[#868F97]">
                                Net: {formatCurrency(yr.netIncome, true)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-14 text-center">
                    <BarChart3 size={24} className="mx-auto mb-3 text-[#555]" strokeWidth={1} />
                    <p className="text-[13px] text-[#868F97]">
                      {loading
                        ? "Loading fundamentals..."
                        : "No fundamental data available."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === "thesis" && (
              <div>
                {thesis ? (
                  <ThesisCard thesis={thesis} />
                ) : (
                  <div className="py-14 text-center">
                    <Brain size={24} className="mx-auto mb-3 text-[#555]" strokeWidth={1} />
                    <p className="text-[13px] text-[#868F97]">
                      No thesis generated yet.
                    </p>
                    <p className="mt-1 text-[11px] text-[#555]">
                      Click &quot;Generate Thesis&quot; to run the AI validation pipeline against {upperTicker}.
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === "news" && (
              <div className="space-y-0.5">
                {news.length > 0 ? (
                  news.slice(0, 20).map((article: any, i: number) => (
                    <a
                      key={i}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl px-4 py-3.5 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-[14px] font-medium leading-snug text-white">
                            {article.headline || article.title}
                          </h4>
                          <p className="mt-1 text-[12px] text-[#868F97]">
                            {article.source} &middot;{" "}
                            {new Date(
                              (article.datetime || 0) * 1000
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="py-14 text-center">
                    <Newspaper size={24} className="mx-auto mb-3 text-[#555]" strokeWidth={1} />
                    <p className="text-[13px] text-[#868F97]">
                      {loading
                        ? "Loading news..."
                        : "No news available."}
                    </p>
                    {!loading && (
                      <p className="mt-1 text-[11px] text-[#555]">
                        Configure your Finnhub API key in Settings to see latest news for {upperTicker}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
