"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
  const [loading, setLoading] = useState(true);

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
    load();
  }, []);

  // Group by date
  const grouped = earnings.reduce<Record<string, EarningsEvent[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="max-w-[1220px] mx-auto px-6 py-8">
      <ScrollReveal>
        <div className="mb-8">
          <h1
            className="text-[32px] font-semibold tracking-tight"
            style={{
              background: "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Earnings Calendar
          </h1>
          <p className="mt-2 text-[14px] text-[#868F97]">
            Upcoming earnings reports for the next 2 weeks.
          </p>
        </div>
      </ScrollReveal>

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
    </div>
  );
}
