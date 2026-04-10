"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Loader2, TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency, formatPct, pnlColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ScrollReveal";

interface EarningsEvent {
  symbol: string;
  date: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  hour: string; // "bmo" (before market open), "amc" (after market close)
  quarter: number;
  year: number;
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [pastEarnings, setPastEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPast, setLoadingPast] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/earnings");
        if (res.ok) {
          const data = await res.json();
          setEarnings(data);
        }
      } catch {}
      setLoading(false);
    }
    async function loadPast() {
      try {
        const res = await fetch("/api/earnings/past");
        if (res.ok) {
          const data = await res.json();
          setPastEarnings(data);
        }
      } catch {}
      setLoadingPast(false);
    }
    load();
    loadPast();
  }, []);

  // Group by date
  const grouped = earnings.reduce<Record<string, EarningsEvent[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-[600px] h-[400px]"
        style={{ background: "radial-gradient(ellipse, rgba(71,159,250,0.05) 0%, transparent 70%)" }} />

    <div className="max-w-[1220px] mx-auto px-6 py-8">
      <ScrollReveal>
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="page-heading">Earnings Calendar</h1>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Upcoming earnings reports for the next 2 weeks.
            </p>
          </div>
          <button
            onClick={() => document.getElementById("previous-earnings")?.scrollIntoView({ behavior: "smooth" })}
            className="shrink-0 flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-white transition-all"
            style={{ background: "var(--glass)", border: "1px solid var(--border)" }}
          >
            Previous Earnings &darr;
          </button>
        </div>
      </ScrollReveal>

      {/* Stats */}
      {!loading && earnings.length > 0 && (
        <ScrollReveal delay={50}>
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass rounded-xl p-4 card-shadow">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Total Reports</div>
              <div className="text-[24px] font-mono font-semibold text-white">{earnings.length}</div>
            </div>
            <div className="glass rounded-xl p-4 card-shadow">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Reporting Days</div>
              <div className="text-[24px] font-mono font-semibold text-white">{sortedDates.length}</div>
            </div>
            <div className="glass rounded-xl p-4 card-shadow">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Pre-Market</div>
              <div className="text-[24px] font-mono font-semibold text-[#ffbf00]">
                {earnings.filter((e: any) => e.hour === "bmo").length}
              </div>
            </div>
            <div className="glass rounded-xl p-4 card-shadow">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">After Hours</div>
              <div className="text-[24px] font-mono font-semibold text-[#9382ff]">
                {earnings.filter((e: any) => e.hour === "amc").length}
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 size={24} className="mx-auto animate-spin text-[#555]" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="py-20 text-center">
          <Calendar size={24} className="mx-auto mb-3 text-[#555]" strokeWidth={1} />
          <p className="text-[13px] text-[#868F97]">No upcoming earnings found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date, idx) => {
            const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            });
            const isToday = date === new Date().toISOString().split("T")[0];
            return (
              <ScrollReveal key={date} delay={idx * 50}>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-[14px] font-semibold text-white">{dayName}</h2>
                    {isToday && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[rgba(71,159,250,0.15)] text-accent border border-[rgba(71,159,250,0.25)]">
                        Today
                      </span>
                    )}
                    <span className="text-[11px] text-[#555]">
                      {grouped[date].length} report{grouped[date].length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="glass overflow-hidden" style={{ boxShadow: "0 0 60px -20px rgba(71,159,250,0.06), 0 20px 40px -20px rgba(0,0,0,0.3)" }}>
                    <table className="stock-table">
                      <thead>
                        <tr>
                          <th>Ticker</th>
                          <th>Time</th>
                          <th className="text-right">EPS Est.</th>
                          <th className="text-right">EPS Actual</th>
                          <th className="text-right">Rev. Est.</th>
                          <th className="text-right">Quarter</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grouped[date]
                          .sort((a, b) => (b.revenueEstimate || 0) - (a.revenueEstimate || 0))
                          .map((e) => (
                          <tr key={e.symbol + e.date}>
                            <td>
                              <Link href={`/stock/${e.symbol}`} className="font-semibold text-white hover:text-accent transition-colors">
                                {e.symbol}
                              </Link>
                            </td>
                            <td>
                              <span className={cn(
                                "text-[11px] font-medium rounded px-1.5 py-0.5",
                                e.hour === "bmo" ? "bg-[rgba(255,191,0,0.1)] text-[#ffbf00]" : "bg-[rgba(147,130,255,0.1)] text-[#9382ff]"
                              )}>
                                {e.hour === "bmo" ? "Pre-Market" : e.hour === "amc" ? "After Hours" : e.hour || "—"}
                              </span>
                            </td>
                            <td className="text-right font-mono tabular-nums text-[#868F97]">
                              {e.epsEstimate != null ? `$${e.epsEstimate.toFixed(2)}` : "—"}
                            </td>
                            <td className={cn(
                              "text-right font-mono tabular-nums",
                              e.epsActual != null && e.epsEstimate != null
                                ? e.epsActual >= e.epsEstimate ? "text-gain" : "text-loss"
                                : "text-[#555]"
                            )}>
                              {e.epsActual != null ? `$${e.epsActual.toFixed(2)}` : "—"}
                            </td>
                            <td className="text-right font-mono tabular-nums text-[#868F97]">
                              {e.revenueEstimate ? formatCurrency(e.revenueEstimate, true) : "—"}
                            </td>
                            <td className="text-right text-[12px] text-[#868F97]">
                              Q{e.quarter} {e.year}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    {/* ═══ PREVIOUS EARNINGS ═══ */}
    <div className="mt-16" id="previous-earnings">
      <ScrollReveal>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={16} className="text-[var(--orange)]" />
          <h2 className="section-heading">Previous Earnings</h2>
          <span className="text-[11px] text-[var(--text-muted)]">Past 30 days</span>
        </div>
      </ScrollReveal>

      {loadingPast ? (
        <div className="py-12 text-center">
          <Loader2 size={20} className="mx-auto animate-spin text-[var(--text-muted)]" />
        </div>
      ) : pastEarnings.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">
          No recent earnings results available.
        </div>
      ) : (
        <div className="space-y-3">
          {pastEarnings.map((e: any, idx: number) => (
            <ScrollReveal key={e.symbol + e.date} delay={idx * 40}>
              <Link
                href={`/stock/${e.symbol}`}
                className="block glass rounded-xl p-5 hover:bg-[var(--glass-hover)] transition-all card-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[16px] font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                      {e.symbol}
                    </span>
                    <span className="text-[12px] text-[var(--text-secondary)]">
                      {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" · "}Q{e.quarter} {e.year}
                    </span>
                  </div>
                  {/* Stock price reaction */}
                  {e.priceChange != null && (
                    <div className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-mono font-medium",
                      e.priceChange >= 0 ? "bg-[rgba(78,190,150,0.1)] text-[var(--gain)]" : "bg-[rgba(248,113,113,0.1)] text-[var(--loss)]"
                    )}>
                      {e.priceChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {e.priceChange >= 0 ? "+" : ""}{e.priceChange.toFixed(2)}% on earnings day
                    </div>
                  )}
                </div>

                {/* EPS + Revenue results */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="glass rounded-lg px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">EPS Actual</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-mono font-semibold text-white">
                        ${e.epsActual?.toFixed(2)}
                      </span>
                      {e.epsBeat != null && (
                        e.epsBeat
                          ? <CheckCircle size={12} className="text-[var(--gain)]" />
                          : <XCircle size={12} className="text-[var(--loss)]" />
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Est. ${e.epsEstimate?.toFixed(2)}
                      {e.epsSurprise != null && (
                        <span className={e.epsSurprise >= 0 ? "text-[var(--gain)]" : "text-[var(--loss)]"}>
                          {" "}{e.epsSurprise >= 0 ? "+" : ""}{e.epsSurprise.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="glass rounded-lg px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Revenue</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-mono font-semibold text-white">
                        {e.revenueActual ? formatCurrency(e.revenueActual, true) : "—"}
                      </span>
                      {e.revBeat != null && (
                        e.revBeat
                          ? <CheckCircle size={12} className="text-[var(--gain)]" />
                          : <XCircle size={12} className="text-[var(--loss)]" />
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Est. {formatCurrency(e.revenueEstimate, true)}
                    </div>
                  </div>
                  <div className="glass rounded-lg px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Result</div>
                    <span className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                      e.epsBeat && e.revBeat ? "badge-gain" : !e.epsBeat && !e.revBeat ? "badge-loss" : "bg-[rgba(255,191,0,0.1)] text-[#ffbf00]"
                    )}>
                      {e.epsBeat && e.revBeat ? "Double Beat" : !e.epsBeat && !e.revBeat ? "Double Miss" : e.epsBeat ? "EPS Beat" : "Rev Beat"}
                    </span>
                  </div>
                  <div className="glass rounded-lg px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Stock Move</div>
                    <span className={cn(
                      "text-[14px] font-mono font-semibold",
                      e.priceChange != null ? pnlColor(e.priceChange) : "text-[var(--text-muted)]"
                    )}>
                      {e.priceChange != null ? `${e.priceChange >= 0 ? "+" : ""}${e.priceChange.toFixed(2)}%` : "—"}
                    </span>
                  </div>
                </div>

                {/* News headline explaining the move */}
                {e.newsHeadline && (
                  <div className="rounded-lg px-3 py-2 bg-[rgba(255,255,255,0.02)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Why it moved</div>
                    <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                      {e.newsHeadline}
                    </p>
                  </div>
                )}
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
    </div>
    </div>
  );
}
