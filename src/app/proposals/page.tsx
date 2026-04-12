"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RegimeBadge } from "@/components/RegimeBadge";
import { SectorRotationCard } from "@/components/SectorRotationCard";

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
};

type Scan = {
  proposals: Proposal[];
  regime?: { name?: string; risk_multiplier?: number };
  rotation?: { leaders?: any[]; laggards?: any[] };
  vetoed?: string[];
  halted?: boolean;
  scan_date?: string;
  generated_at?: string;
  source?: string;
};

export default function ProposalsPage() {
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v2/daily-scan")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setScan(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Today's Proposals</h1>
        <p className="text-sm text-zinc-400">
          Regime-filtered, news-vetoed, Kelly-sized trade ideas from the v2 engine
          {scan?.source && (
            <span className="ml-2 text-zinc-500">— source: {scan.source}</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2"><RegimeBadge /></div>
        <SectorRotationCard />
      </div>

      {loading && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center text-zinc-500">
          Loading proposals...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          Error: {error}
        </div>
      )}

      {scan?.halted && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-6 mb-6">
          <div className="text-red-300 font-bold text-lg mb-1">⛔ Trading halted</div>
          <div className="text-red-300/80 text-sm">
            Current regime is CRASH or portfolio drawdown limit hit. No new positions today.
          </div>
        </div>
      )}

      {scan && !scan.halted && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              {scan.proposals.length} proposals
              {scan.vetoed && scan.vetoed.length > 0 && (
                <span className="ml-3 text-red-400">
                  · {scan.vetoed.length} vetoed by news ({scan.vetoed.join(", ")})
                </span>
              )}
            </div>
            {scan.generated_at && (
              <div className="text-xs text-zinc-500">
                Generated: {new Date(scan.generated_at).toLocaleString()}
              </div>
            )}
          </div>

          {scan.proposals.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              No proposals — current regime + sector filters reject all candidates.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                  <th className="px-4 py-2 font-medium">Ticker</th>
                  <th className="px-4 py-2 font-medium">Strategy</th>
                  <th className="px-4 py-2 font-medium text-right">Sharpe</th>
                  <th className="px-4 py-2 font-medium text-right">Size</th>
                  <th className="px-4 py-2 font-medium text-right">Stop / TP</th>
                  <th className="px-4 py-2 font-medium">Sector</th>
                  <th className="px-4 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {scan.proposals.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/stock/${p.ticker}`}
                        className="font-bold text-white hover:text-blue-400"
                      >
                        {p.ticker}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <span className="font-mono text-xs">{p.strategy}</span>
                      {p.strategy_type && (
                        <span className="ml-2 text-[10px] text-zinc-500 uppercase">
                          {p.strategy_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">
                      {p.sharpe?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-bold text-emerald-400">
                        {(p.final_pct * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-zinc-400 font-mono">
                      -{(p.stop_loss * 100).toFixed(1)}% / +{(p.take_profit * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-300">{p.sector || "—"}</span>
                        {p.sector_leader && (
                          <span className="text-amber-400 text-xs" title="Sector leader">
                            ★
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {p.earnings_warning && (
                        <span className="text-amber-400">⚠ earnings ≤3d</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="mt-6 space-y-2 text-xs text-zinc-500">
        <p>
          Sizing uses fractional Kelly × regime multiplier × correlation penalty. Stops are
          support-anchored (1% below prior day low / SMA20 / nearest round number).
          Strategies are pre-filtered by current sector rotation: laggard sectors are
          excluded; leader sectors get a 1.2× sizing boost.
        </p>
        <p className="text-amber-400/90">
          ⏰ <strong>Execution note:</strong> Wait until <strong>9:45 ET</strong> after market
          open before firing orders. The 9:30-9:45 window has the widest spreads of the day.
          Use limit orders at the 9:45 price, not market orders at the open.
        </p>
        <p className="text-red-400/80">
          ⛔ <strong>Earnings blackout:</strong> No new positions within 2 trading days of any
          ticker's earnings announcement. Tickers in the blackout window are auto-filtered
          before this list is generated.
        </p>
      </div>
    </div>
  );
}
