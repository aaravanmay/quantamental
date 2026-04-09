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
    <div className="max-w-[1220px] mx-auto px-6 py-8">
      <ScrollReveal>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-[32px] font-semibold tracking-tight"
              style={{
                background: "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Watchlist
            </h1>
            <p className="mt-2 text-[14px] text-[#868F97]">
              Track stocks you're interested in.
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
    </div>
  );
}
