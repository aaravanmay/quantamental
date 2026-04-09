"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Loader2, X, Plus } from "lucide-react";
import { formatCurrency, formatPct, pnlColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ScrollReveal";

interface WatchlistItem {
  id: string;
  ticker: string;
  added_date: string;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [addTicker, setAddTicker] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/watchlist");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // Fetch quotes for watchlist items
  useEffect(() => {
    if (items.length === 0) return;
    async function loadQuotes() {
      const q: Record<string, any> = {};
      for (let i = 0; i < items.length; i += 4) {
        const batch = items.slice(i, i + 4);
        const results = await Promise.allSettled(
          batch.map((item) =>
            fetch(`/api/stock/${item.ticker}/quote`).then((r) => r.json())
          )
        );
        results.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value?.price) {
            q[batch[idx].ticker] = r.value;
          }
        });
      }
      setQuotes(q);
    }
    loadQuotes();
  }, [items]);

  async function addToWatchlist() {
    if (!addTicker) return;
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: addTicker }),
    });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => [data.item, ...prev]);
      setAddTicker("");
    }
  }

  async function removeFromWatchlist(ticker: string) {
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    setItems((prev) => prev.filter((i) => i.ticker !== ticker));
  }

  return (
    <div className="relative overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-[600px] h-[400px]"
        style={{ background: "radial-gradient(ellipse, rgba(255,191,0,0.04) 0%, transparent 70%)" }} />

      <div className="max-w-[1220px] mx-auto px-6 py-8">
      <ScrollReveal>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="page-heading">Watchlist</h1>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Track stocks you&apos;re interested in. Add tickers or use the star icon on any stock page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={addTicker}
              onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && addToWatchlist()}
              placeholder="Add ticker..."
              className="glass-input px-3 py-2 text-sm font-mono text-white placeholder:text-[#555] w-32"
            />
            <button
              onClick={addToWatchlist}
              disabled={!addTicker}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white transition-all hover:scale-[1.02] disabled:opacity-40"
              style={{ background: "rgba(71,159,250,0.12)", border: "1px solid rgba(71,159,250,0.2)" }}
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="glass overflow-hidden" style={{ boxShadow: "0 0 80px -20px rgba(71,159,250,0.08), 0 20px 60px -20px rgba(0,0,0,0.4)" }}>
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 size={20} className="mx-auto animate-spin text-[#555]" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Star size={24} className="mx-auto mb-3 text-[#555]" strokeWidth={1} />
              <p className="text-[13px] text-[#868F97]">Your watchlist is empty.</p>
              <p className="mt-1 text-[11px] text-[#555]">Add tickers above or click the star icon on any stock page.</p>
            </div>
          ) : (
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Company</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Change</th>
                  <th className="text-right">Mkt Cap</th>
                  <th className="text-right">Sector</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const q = quotes[item.ticker];
                  return (
                    <tr key={item.ticker}>
                      <td>
                        <Link href={`/stock/${item.ticker}`} className="font-semibold text-white hover:text-accent transition-colors">
                          {item.ticker}
                        </Link>
                      </td>
                      <td className="text-[#868F97]">{q?.name || "—"}</td>
                      <td className="text-right font-mono tabular-nums text-white">
                        {q ? formatCurrency(q.price) : "—"}
                      </td>
                      <td className={cn("text-right font-mono tabular-nums", q ? pnlColor(q.change) : "")}>
                        {q ? formatPct(q.change_pct) : "—"}
                      </td>
                      <td className="text-right font-mono tabular-nums text-[#868F97]">
                        {q?.market_cap ? formatCurrency(q.market_cap, true) : "—"}
                      </td>
                      <td className="text-right text-[12px] text-[#868F97]">
                        {q?.sector || "—"}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => removeFromWatchlist(item.ticker)}
                          className="text-[#555] hover:text-loss transition-colors"
                          title="Remove from watchlist"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </ScrollReveal>

      {/* Suggested Tickers */}
      <ScrollReveal delay={200}>
        <div className="mt-10">
          <h2 className="text-[12px] font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">
            Popular tickers to watch
          </h2>
          <div className="flex flex-wrap gap-2">
            {["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM", "V", "UNH", "XOM", "JNJ"].map((ticker) => (
              <button
                key={ticker}
                onClick={async () => {
                  await fetch("/api/watchlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ticker }),
                  });
                  const res = await fetch("/api/watchlist");
                  if (res.ok) {
                    const data = await res.json();
                    setItems(data.items || []);
                  }
                }}
                disabled={items.some((i) => i.ticker === ticker)}
                className={cn(
                  "rounded-lg px-3 py-2 text-[12px] font-mono font-medium transition-all",
                  items.some((i) => i.ticker === ticker)
                    ? "bg-[rgba(255,191,0,0.08)] text-[#ffbf00] border border-[rgba(255,191,0,0.15)]"
                    : "glass hover:bg-[var(--glass-hover)] text-[var(--text-secondary)] hover:text-white"
                )}
              >
                {items.some((i) => i.ticker === ticker) ? `★ ${ticker}` : `+ ${ticker}`}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Stats */}
      {items.length > 0 && (
        <ScrollReveal delay={300}>
          <div className="mt-10 grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-4 card-shadow">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Watching</div>
              <div className="text-[24px] font-mono font-semibold text-white">{items.length}</div>
              <div className="text-[11px] text-[var(--text-secondary)]">stocks</div>
            </div>
            <div className="glass rounded-xl p-4 card-shadow">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Best Performer</div>
              <div className="text-[24px] font-mono font-semibold text-[var(--gain)]">
                {(() => {
                  const best = Object.entries(quotes).sort((a, b) => (b[1]?.change_pct || 0) - (a[1]?.change_pct || 0))[0];
                  return best ? best[0] : "—";
                })()}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">today</div>
            </div>
            <div className="glass rounded-xl p-4 card-shadow">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Worst Performer</div>
              <div className="text-[24px] font-mono font-semibold text-[var(--loss)]">
                {(() => {
                  const worst = Object.entries(quotes).sort((a, b) => (a[1]?.change_pct || 0) - (b[1]?.change_pct || 0))[0];
                  return worst ? worst[0] : "—";
                })()}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">today</div>
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
    </div>
  );
}
