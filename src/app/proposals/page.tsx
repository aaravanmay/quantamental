"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Shield, Clock } from "lucide-react";
import { RegimeBadge } from "@/components/RegimeBadge";
import { SectorRotationCard } from "@/components/SectorRotationCard";
import { cn } from "@/lib/utils";

type Proposal = {
  ticker: string;
  strategy: string;
  strategy_type?: string;
  sharpe?: number;
  win_rate?: number;
  final_pct: number;
  stop_loss: number;
  take_profit: number;
  reasoning?: string;
  sector?: string;
  sector_leader?: boolean;
  earnings_warning?: boolean;
  confluence?: boolean;
};

type Scan = {
  proposals: Proposal[];
  regime?: { name?: string; risk_multiplier?: number };
  generated_at?: string;
  source?: string;
};

export default function ProposalsPage() {
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/v2/daily-scan");
        if (r.ok) {
          const data = await r.json();
          if (!data.error) setScan(data);
        }
      } catch {}
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const proposals = scan?.proposals || [];

  return (
    <div className="relative overflow-hidden">
      {/* Atmospheric glow */}
      <div
        className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-[700px] h-[400px]"
        style={{
          background: "radial-gradient(ellipse, rgba(71,159,250,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[1220px] mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="page-heading text-[32px]">Today's Proposals</h1>
            <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium badge-gain animate-pulse">
              LIVE
            </span>
          </div>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Regime-filtered, Kelly-sized trade ideas
            {scan?.source && (
              <span className="ml-2 text-zinc-600">— {scan.source}</span>
            )}
          </p>
          {scan?.generated_at && (
            <p className="mt-1 text-[11px] text-zinc-600">
              Updated: {new Date(scan.generated_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Regime + Sector context */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="md:col-span-2"><RegimeBadge /></div>
          <SectorRotationCard />
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="glass glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Proposals</span>
            </div>
            <div className="text-2xl font-bold text-white">{proposals.length}</div>
          </div>
          <div className="glass glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-blue-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Regime</span>
            </div>
            <div className="text-lg font-bold text-white">{scan?.regime?.name || "—"}</div>
          </div>
          <div className="glass glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-amber-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Execute After</span>
            </div>
            <div className="text-lg font-bold text-amber-400">9:45 ET</div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass rounded-xl p-4 space-y-3">
                <div className="skeleton h-6 w-20" />
                <div className="skeleton h-4 w-40" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="skeleton h-10" />
                  <div className="skeleton h-10" />
                  <div className="skeleton h-10" />
                </div>
                <div className="skeleton h-3 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Halted state */}
        {scan?.regime?.name === "CRASH" && (
          <div className="glass rounded-xl border-red-500/30 bg-red-500/5 p-6 mb-6 animate-fade-in">
            <div className="text-red-400 font-bold text-lg mb-1">Trading Halted</div>
            <div className="text-red-300/70 text-sm">
              CRASH regime detected. No new positions until conditions stabilize.
            </div>
          </div>
        )}

        {/* Proposal cards */}
        {!loading && proposals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {proposals.map((p, i) => {
              const sl = p.stop_loss ?? 0.08;
              const tp = p.take_profit ?? 0.16;
              const wr = p.win_rate ?? 0.5;
              const expGain = wr * tp - (1 - wr) * sl;

              return (
                <Link
                  key={`${p.ticker}-${i}`}
                  href={`/stock/${p.ticker}`}
                  className={cn(
                    "group glass glass-card rounded-xl p-4 card-stagger block",
                    p.confluence && "border-emerald-500/20 animate-pulse-glow",
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{p.ticker}</span>
                      {p.sector_leader && <span className="text-amber-400 text-xs">★</span>}
                      {p.confluence && (
                        <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          MULTI
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      {((p.final_pct ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Strategy */}
                  <div className="text-[11px] text-zinc-500 mb-3 truncate">
                    {p.strategy}
                    {p.strategy_type && (
                      <span className="ml-1 text-zinc-600 uppercase">{p.strategy_type}</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">Sharpe</div>
                      <div className="text-sm font-mono font-semibold text-white">
                        {p.sharpe?.toFixed(2) ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">Win Rate</div>
                      <div className="text-sm font-mono font-semibold text-white">
                        {wr ? `${Math.round(wr * 100)}%` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">Exp. Gain</div>
                      <div className={cn(
                        "text-sm font-mono font-semibold",
                        expGain > 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {expGain > 0 ? "+" : ""}{(expGain * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Risk bar */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-red-400 font-mono">-{(sl * 100).toFixed(0)}%</span>
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, wr * 100)}%`,
                            background: "linear-gradient(90deg, rgba(248,113,113,0.4), rgba(16,185,129,0.6))",
                          }}
                        />
                      </div>
                      <span className="text-emerald-400 font-mono">+{(tp * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                    <span className="text-[10px] text-zinc-600">{p.sector || "—"}</span>
                    <ArrowRight size={14} className="text-zinc-700 group-hover:text-[var(--accent)] transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && proposals.length === 0 && (
          <div className="glass rounded-xl p-12 text-center animate-fade-in">
            <p className="text-zinc-400">No proposals today — regime or sector filters may be blocking signals.</p>
          </div>
        )}

        {/* Footer warnings */}
        <div className="mt-8 space-y-2 text-[11px] text-zinc-600 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <p>
            Size shows Kelly-optimal position as % of portfolio. Sorted by conviction.
          </p>
          <p className="text-amber-500/80">
            ⏰ Execute after <strong>9:45 ET</strong>. Use limit orders at the 9:45 price.
          </p>
          <p className="text-red-400/70">
            ⛔ Earnings blackout active — tickers within 2 trading days of earnings are auto-filtered.
          </p>
        </div>
      </div>
    </div>
  );
}
