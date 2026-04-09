"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { searchTickers } from "@/lib/api";
import { formatCurrency, formatPct, pnlColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ScrollReveal";

interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  exchange: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  currency: string;
  exchangeFullName: string;
  exchange: string;
}

const POPULAR_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM",
  "V", "UNH", "XOM", "JNJ", "PG", "HD", "KO", "DIS",
];

export default function StocksPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gainers, setGainers] = useState<MarketMover[]>([]);
  const [losers, setLosers] = useState<MarketMover[]>([]);
  const [popularQuotes, setPopularQuotes] = useState<Record<string, any>>({});
  const [loadingMarket, setLoadingMarket] = useState(true);

  // Load market movers on mount
  useEffect(() => {
    async function loadMarket() {
      try {
        const res = await fetch("/api/market");
        if (res.ok) {
          const data = await res.json();
          setGainers(data.gainers || []);
          setLosers(data.losers || []);
        }
      } catch {}
      setLoadingMarket(false);
    }
    loadMarket();
  }, []);

  // Load popular stock quotes
  useEffect(() => {
    async function loadPopular() {
      const quotes: Record<string, any> = {};
      // Fetch in batches of 4 to avoid rate limits
      for (let i = 0; i < POPULAR_TICKERS.length; i += 4) {
        const batch = POPULAR_TICKERS.slice(i, i + 4);
        const results = await Promise.allSettled(
          batch.map((t) =>
            fetch(`/api/stock/${t}/quote`).then((r) => r.json())
          )
        );
        results.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value?.ticker) {
            quotes[batch[idx]] = r.value;
          }
        });
      }
      setPopularQuotes(quotes);
    }
    loadPopular();
  }, []);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchTickers(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="max-w-[1220px] mx-auto px-6 py-8">
      {/* Header */}
      <ScrollReveal delay={0}>
        <div className="mb-10">
          <h1
            className="text-[32px] font-semibold tracking-tight mb-2"
            style={{
              background:
                "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Stocks
          </h1>
          <p className="text-[14px] text-[#868F97]">
            Search any stock, view market movers, and explore fundamentals.
          </p>
        </div>
      </ScrollReveal>

      {/* Search Bar */}
      <ScrollReveal delay={100}>
        <div className="relative mb-10">
          <div className="glass rounded-xl flex items-center px-4 py-3 gap-3 border border-[rgba(255,255,255,0.06)]">
            <Search size={18} className="text-[#868F97] flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company name or ticker (e.g. Apple, AAPL, Tesla)..."
              className="flex-1 bg-transparent text-[15px] text-white placeholder:text-[#555] outline-none"
            />
            {searching && <Loader2 size={16} className="animate-spin text-[#868F97]" />}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && query.length > 0 && (
            <div className="absolute z-50 mt-2 w-full glass rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden shadow-2xl">
              {searchResults.slice(0, 8).map((r) => (
                <Link
                  key={r.symbol}
                  href={`/stock/${r.symbol}`}
                  onClick={() => { setQuery(""); setSearchResults([]); }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  <div>
                    <span className="text-[14px] font-medium text-white">
                      {r.symbol}
                    </span>
                    <span className="ml-2 text-[13px] text-[#868F97]">
                      {r.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#555]">
                      {r.exchange}
                    </span>
                    <ArrowUpRight size={14} className="text-[#555]" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Market Movers */}
      <ScrollReveal delay={200}>
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Gainers */}
          <div className="glass rounded-2xl p-5" style={{ boxShadow: "0 0 60px -20px rgba(71,159,250,0.06), 0 20px 40px -20px rgba(0,0,0,0.3)" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-emerald-400" />
              <h2 className="text-[13px] font-medium text-white uppercase tracking-wider">
                Top Gainers
              </h2>
            </div>
            {loadingMarket ? (
              <div className="py-8 text-center">
                <Loader2 size={20} className="mx-auto animate-spin text-[#555]" />
              </div>
            ) : gainers.length > 0 ? (
              <div className="space-y-0.5">
                {gainers.map((s) => (
                  <Link
                    key={s.symbol}
                    href={`/stock/${s.symbol}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                  >
                    <div>
                      <span className="text-[14px] font-medium text-white">
                        {s.symbol}
                      </span>
                      <span className="ml-2 text-[12px] text-[#868F97] hidden sm:inline">
                        {s.name.length > 25
                          ? s.name.slice(0, 25) + "..."
                          : s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-mono tabular-nums text-white">
                        {formatCurrency(s.price)}
                      </span>
                      <span className="text-[12px] font-mono tabular-nums text-emerald-400 min-w-[60px] text-right">
                        +{s.changesPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-[#868F97]">
                Market data unavailable outside trading hours.
              </p>
            )}
          </div>

          {/* Losers */}
          <div className="glass rounded-2xl p-5" style={{ boxShadow: "0 0 60px -20px rgba(71,159,250,0.06), 0 20px 40px -20px rgba(0,0,0,0.3)" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={16} className="text-red-400" />
              <h2 className="text-[13px] font-medium text-white uppercase tracking-wider">
                Top Losers
              </h2>
            </div>
            {loadingMarket ? (
              <div className="py-8 text-center">
                <Loader2 size={20} className="mx-auto animate-spin text-[#555]" />
              </div>
            ) : losers.length > 0 ? (
              <div className="space-y-0.5">
                {losers.map((s) => (
                  <Link
                    key={s.symbol}
                    href={`/stock/${s.symbol}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                  >
                    <div>
                      <span className="text-[14px] font-medium text-white">
                        {s.symbol}
                      </span>
                      <span className="ml-2 text-[12px] text-[#868F97] hidden sm:inline">
                        {s.name.length > 25
                          ? s.name.slice(0, 25) + "..."
                          : s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-mono tabular-nums text-white">
                        {formatCurrency(s.price)}
                      </span>
                      <span className="text-[12px] font-mono tabular-nums text-red-400 min-w-[60px] text-right">
                        {s.changesPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-[#868F97]">
                Market data unavailable outside trading hours.
              </p>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Popular Stocks Grid */}
      <ScrollReveal delay={300}>
        <div className="mb-10">
          <h2 className="text-[13px] font-medium text-[#868F97] uppercase tracking-wider mb-4">
            Popular Stocks
          </h2>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {POPULAR_TICKERS.map((ticker) => {
              const q = popularQuotes[ticker];
              return (
                <Link
                  key={ticker}
                  href={`/stock/${ticker}`}
                  className="glass rounded-xl px-4 py-3.5 hover:bg-[rgba(255,255,255,0.04)] transition-all hover:scale-[1.01]"
                  style={{
                    boxShadow:
                      "0 0 40px -15px rgba(71,159,250,0.04), 0 8px 20px -8px rgba(0,0,0,0.25)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] font-semibold text-white">
                      {ticker}
                    </span>
                    {q && (
                      <span
                        className={cn(
                          "text-[11px] font-mono tabular-nums",
                          pnlColor(q.change)
                        )}
                      >
                        {q.change >= 0 ? "+" : ""}
                        {formatPct(q.change_pct)}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#868F97] truncate mb-1.5">
                    {q?.name || ticker}
                  </div>
                  <div className="text-[16px] font-mono tabular-nums text-white">
                    {q ? formatCurrency(q.price) : "—"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
