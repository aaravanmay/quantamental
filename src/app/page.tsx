"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StockSearch } from "@/components/StockSearch";
import { ScrollReveal } from "@/components/ScrollReveal";
import { formatCurrency, formatPct, pnlColor, cn } from "@/lib/utils";
import {
  BarChart3, TrendingUp, TrendingDown, Briefcase, Newspaper,
  Calendar, Star, ArrowRight, LineChart, Zap,
} from "lucide-react";

const SHOWCASE_TICKERS = [
  { ticker: "NVDA", name: "NVIDIA Corp", strategy: "EMA Cross + RSI", sharpe: 2.14, win_rate: 0.72, status: "go" },
  { ticker: "AAPL", name: "Apple Inc", strategy: "Bollinger Squeeze", sharpe: 1.87, win_rate: 0.65, status: "go" },
  { ticker: "XOM", name: "Exxon Mobil", strategy: "MACD Divergence", sharpe: 1.62, win_rate: 0.61, status: "nogo" },
  { ticker: "JPM", name: "JPMorgan Chase", strategy: "Mean Reversion", sharpe: 1.54, win_rate: 0.58, status: "go" },
  { ticker: "TSLA", name: "Tesla Inc", strategy: "Momentum Breakout", sharpe: 1.91, win_rate: 0.55, status: "pending" },
  { ticker: "AMZN", name: "Amazon.com", strategy: "EMA Cross + RSI", sharpe: 1.78, win_rate: 0.63, status: "go" },
  { ticker: "META", name: "Meta Platforms", strategy: "Volume Profile", sharpe: 1.69, win_rate: 0.60, status: "pending" },
  { ticker: "MSFT", name: "Microsoft Corp", strategy: "Bollinger Squeeze", sharpe: 1.83, win_rate: 0.67, status: "go" },
];

export default function HomePage() {
  const router = useRouter();
  const [liveQuotes, setLiveQuotes] = useState<Record<string, any>>({});
  const [marketNews, setMarketNews] = useState<any[]>([]);
  const [gainers, setGainers] = useState<any[]>([]);
  const [losers, setLosers] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

  // Fetch all data in parallel
  useEffect(() => {
    Promise.allSettled([
      fetch("/api/news").then((r) => r.json()),
      fetch("/api/market").then((r) => r.json()),
      fetch("/api/earnings").then((r) => r.json()),
      fetch("/api/watchlist").then((r) => r.json()),
      fetch("/api/paper-trade?status=open").then((r) => r.json()),
    ]).then(([newsR, marketR, earningsR, watchR, tradesR]) => {
      if (newsR.status === "fulfilled") setMarketNews(newsR.value);
      if (marketR.status === "fulfilled") {
        setGainers(marketR.value.gainers || []);
        setLosers(marketR.value.losers || []);
      }
      if (earningsR.status === "fulfilled") setEarnings(earningsR.value);
      if (watchR.status === "fulfilled") setWatchlist(watchR.value.items || []);
      if (tradesR.status === "fulfilled") setTrades(tradesR.value.trades || []);
    });
  }, []);

  // Fetch live prices for showcase tickers
  useEffect(() => {
    async function loadPrices() {
      const quotes: Record<string, any> = {};
      for (let i = 0; i < SHOWCASE_TICKERS.length; i += 4) {
        const batch = SHOWCASE_TICKERS.slice(i, i + 4);
        const results = await Promise.allSettled(
          batch.map((t) => fetch(`/api/stock/${t.ticker}/quote`).then((r) => r.json()))
        );
        results.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value?.price) {
            quotes[batch[idx].ticker] = r.value;
          }
        });
      }
      setLiveQuotes(quotes);
    }
    loadPrices();
  }, []);

  const SAMPLE = SHOWCASE_TICKERS.map((t, i) => ({
    id: String(i + 1),
    ...t,
    price: liveQuotes[t.ticker]?.price ?? 0,
    change: liveQuotes[t.ticker]?.change_pct ?? 0,
  }));

  return (
    <div className="relative overflow-hidden">
      {/* ═══ HERO ═══ */}
      <section className="relative pt-20 pb-8 overflow-hidden">
        <div className="absolute left-1/2 -top-40 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(71,159,250,0.07) 0%, transparent 70%)" }} />

        <div className="max-w-[1220px] mx-auto px-6 text-center relative z-10">
          <ScrollReveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-5">
              Quantamental Architect
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="page-heading text-[56px] mb-5">
              Make better trades.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-[18px] text-[var(--text-secondary)] max-w-[540px] mx-auto leading-[1.55] mb-10">
              Swing trade signals powered by quantitative analysis, fundamental research, and AI-driven event validation.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="max-w-[640px] mx-auto mb-16">
              <StockSearch fullWidth />
            </div>
          </ScrollReveal>

          {/* Signals Table */}
          <ScrollReveal delay={400}>
            <div style={{ perspective: "1200px" }}>
              <div style={{
                transform: "rotateX(10deg) rotateY(-2deg)",
                transition: "transform 0.5s ease",
                borderRadius: "16px",
                overflow: "hidden",
                background: "rgba(255,255,255,0.02)",
                border: "0.5px solid var(--border)",
                boxShadow: "0 0 120px -30px rgba(71,159,250,0.1), 0 60px 100px -40px rgba(0,0,0,0.7)",
              }}>
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th className="w-20">Ticker</th>
                      <th>Company</th>
                      <th>Strategy</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Change</th>
                      <th className="text-right">Sharpe</th>
                      <th className="text-right">Win Rate</th>
                      <th className="text-center">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE.map((s) => (
                      <tr key={s.id} onClick={() => router.push(`/stock/${s.ticker}`)}>
                        <td className="font-semibold">{s.ticker}</td>
                        <td className="text-[var(--text-secondary)]">{s.name}</td>
                        <td><span className="text-[12px] px-2 py-0.5 rounded-md bg-[var(--glass)]">{s.strategy}</span></td>
                        <td className="text-right font-mono tabular-nums">{s.price ? `$${s.price.toFixed(2)}` : "—"}</td>
                        <td className={cn("text-right font-mono tabular-nums", pnlColor(s.change))}>
                          {s.change ? formatPct(s.change) : "—"}
                        </td>
                        <td className="text-right font-mono tabular-nums">{s.sharpe.toFixed(2)}</td>
                        <td className="text-right font-mono tabular-nums">{(s.win_rate * 100).toFixed(0)}%</td>
                        <td className="text-center">
                          <span className={cn("inline-block rounded-full px-3 py-1 text-[11px] font-medium",
                            s.status === "go" && "badge-gain",
                            s.status === "nogo" && "badge-loss",
                            s.status === "pending" && "bg-[var(--glass-hover)] text-[var(--text-secondary)]"
                          )}>{s.status === "go" ? "GO" : s.status === "nogo" ? "NO-GO" : "Pending"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ MARKET MOVERS ═══ */}
      <section className="max-w-[1220px] mx-auto px-6 py-14">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-heading">Market Movers</h2>
            <Link href="/stocks" className="text-[12px] text-[var(--text-secondary)] hover:text-white flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
        </ScrollReveal>
        <div className="grid md:grid-cols-2 gap-4">
          <ScrollReveal delay={100}>
            <div className="glass rounded-2xl p-5 card-shadow">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-[var(--gain)]" />
                <span className="text-[12px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">Top Gainers</span>
              </div>
              {gainers.length > 0 ? (
                <div className="space-y-0.5">
                  {gainers.slice(0, 5).map((s: any) => (
                    <Link key={s.symbol} href={`/stock/${s.symbol}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors">
                      <div>
                        <span className="text-[13px] font-medium text-white">{s.symbol}</span>
                        <span className="ml-2 text-[11px] text-[var(--text-secondary)] hidden sm:inline">{s.name?.slice(0, 20)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-mono tabular-nums text-white">{formatCurrency(s.price)}</span>
                        <span className="text-[11px] font-mono tabular-nums text-[var(--gain)]">+{s.changesPercentage?.toFixed(1)}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-[12px] text-[var(--text-muted)]">Market closed</p>
              )}
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="glass rounded-2xl p-5 card-shadow">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={16} className="text-[var(--loss)]" />
                <span className="text-[12px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">Top Losers</span>
              </div>
              {losers.length > 0 ? (
                <div className="space-y-0.5">
                  {losers.slice(0, 5).map((s: any) => (
                    <Link key={s.symbol} href={`/stock/${s.symbol}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--glass-hover)] transition-colors">
                      <div>
                        <span className="text-[13px] font-medium text-white">{s.symbol}</span>
                        <span className="ml-2 text-[11px] text-[var(--text-secondary)] hidden sm:inline">{s.name?.slice(0, 20)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-mono tabular-nums text-white">{formatCurrency(s.price)}</span>
                        <span className="text-[11px] font-mono tabular-nums text-[var(--loss)]">{s.changesPercentage?.toFixed(1)}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-[12px] text-[var(--text-muted)]">Market closed</p>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ EARNINGS PREVIEW ═══ */}
      {earnings.length > 0 && (
        <section className="max-w-[1220px] mx-auto px-6 py-14 relative">
          <div className="glow-green absolute right-0 top-0 -translate-y-1/2 translate-x-1/3" />
          <ScrollReveal>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[var(--accent)]" />
                <h2 className="section-heading">Upcoming Earnings</h2>
              </div>
              <Link href="/earnings" className="text-[12px] text-[var(--text-secondary)] hover:text-white flex items-center gap-1 transition-colors">
                Full calendar <ArrowRight size={12} />
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="glass rounded-2xl overflow-hidden card-shadow">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th className="text-right">EPS Est.</th>
                    <th className="text-right">Revenue Est.</th>
                    <th className="text-right">Quarter</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.slice(0, 8).map((e: any, i: number) => (
                    <tr key={e.symbol + e.date + i} onClick={() => router.push(`/stock/${e.symbol}`)}>
                      <td className="font-semibold text-white">{e.symbol}</td>
                      <td className="text-[var(--text-secondary)]">
                        {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td>
                        <span className={cn("text-[10px] font-medium rounded px-1.5 py-0.5",
                          e.hour === "bmo" ? "bg-[rgba(255,191,0,0.1)] text-[#ffbf00]" : "bg-[rgba(147,130,255,0.1)] text-[#9382ff]"
                        )}>
                          {e.hour === "bmo" ? "Pre-Market" : "After Hours"}
                        </span>
                      </td>
                      <td className="text-right font-mono tabular-nums text-[var(--text-secondary)]">
                        {e.epsEstimate != null ? `$${e.epsEstimate.toFixed(2)}` : "—"}
                      </td>
                      <td className="text-right font-mono tabular-nums text-[var(--text-secondary)]">
                        {e.revenueEstimate ? formatCurrency(e.revenueEstimate, true) : "—"}
                      </td>
                      <td className="text-right text-[12px] text-[var(--text-secondary)]">Q{e.quarter} {e.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ═══ WATCHLIST + OPEN TRADES ═══ */}
      <section className="max-w-[1220px] mx-auto px-6 py-14">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Watchlist Preview */}
          <ScrollReveal>
            <div className="glass rounded-2xl p-5 card-shadow h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-[#ffbf00]" />
                  <span className="text-[12px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">Watchlist</span>
                </div>
                <Link href="/watchlist" className="text-[11px] text-[var(--text-secondary)] hover:text-white flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={10} />
                </Link>
              </div>
              {watchlist.length > 0 ? (
                <div className="space-y-0.5">
                  {watchlist.slice(0, 5).map((item: any) => (
                    <Link key={item.ticker} href={`/stock/${item.ticker}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors">
                      <span className="text-[13px] font-semibold text-white">{item.ticker}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">{item.added_date}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Star size={20} className="mx-auto mb-2 text-[var(--text-muted)]" strokeWidth={1} />
                  <p className="text-[12px] text-[var(--text-secondary)]">No stocks on your watchlist yet.</p>
                  <Link href="/stocks" className="text-[11px] text-[var(--accent)] hover:underline mt-1 inline-block">
                    Browse stocks to add some
                  </Link>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Open Trades Preview */}
          <ScrollReveal delay={150}>
            <div className="glass rounded-2xl p-5 card-shadow h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <LineChart size={16} className="text-[var(--accent)]" />
                  <span className="text-[12px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">Open Trades</span>
                </div>
                <Link href="/paper-trading" className="text-[11px] text-[var(--text-secondary)] hover:text-white flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={10} />
                </Link>
              </div>
              {trades.length > 0 ? (
                <div className="space-y-0.5">
                  {trades.slice(0, 5).map((t: any) => (
                    <Link key={t.id} href={`/stock/${t.ticker}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--glass-hover)] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-white">{t.ticker}</span>
                        <span className={cn("text-[10px] font-medium rounded px-1.5 py-0.5",
                          t.direction === "LONG" ? "badge-gain" : "badge-loss"
                        )}>{t.direction}</span>
                      </div>
                      <span className="text-[12px] font-mono tabular-nums text-[var(--text-secondary)]">
                        {t.shares} @ ${t.entry_price?.toFixed(2)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <LineChart size={20} className="mx-auto mb-2 text-[var(--text-muted)]" strokeWidth={1} />
                  <p className="text-[12px] text-[var(--text-secondary)]">No open paper trades.</p>
                  <Link href="/paper-trading" className="text-[11px] text-[var(--accent)] hover:underline mt-1 inline-block">
                    Place your first trade
                  </Link>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ MARKET NEWS ═══ */}
      {marketNews.length > 0 && (
        <section className="max-w-[1220px] mx-auto px-6 py-14 relative">
          <div className="glow-blue absolute left-0 top-0 -translate-x-1/3" />
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-6">
              <Newspaper size={16} className="text-[var(--accent)]" />
              <h2 className="section-heading">Market News</h2>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-3">
            {marketNews.slice(0, 8).map((article: any, i: number) => (
              <ScrollReveal key={i} delay={i * 50}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block glass rounded-xl p-4 hover:bg-[var(--glass-hover)] transition-all group card-shadow"
                >
                  <h3 className="text-[13px] font-medium text-white leading-snug group-hover:text-[var(--accent)] transition-colors">
                    {article.headline}
                  </h3>
                  {article.summary && (
                    <p className="mt-1.5 text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
                      {article.summary.slice(0, 120)}...
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-[var(--text-secondary)]">{article.source}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">&middot;</span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {new Date(article.datetime * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* ═══ QUICK LINKS ═══ */}
      <section className="max-w-[1220px] mx-auto px-6 py-14">
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/stocks", label: "Browse Stocks", desc: "Search and explore any stock", icon: BarChart3, color: "var(--accent)" },
              { href: "/earnings", label: "Earnings Calendar", desc: "Upcoming earnings reports", icon: Calendar, color: "var(--gain)" },
              { href: "/watchlist", label: "Your Watchlist", desc: "Track stocks you're watching", icon: Star, color: "#ffbf00" },
              { href: "/portfolio", label: "Portfolio", desc: "Holdings and allocation", icon: Briefcase, color: "var(--orange)" },
            ].map((item, i) => (
              <ScrollReveal key={item.href} delay={i * 75}>
                <Link href={item.href}
                  className="glass rounded-xl p-5 hover:bg-[var(--glass-hover)] transition-all group card-shadow block h-full">
                  <item.icon size={20} style={{ color: item.color }} className="mb-3" strokeWidth={1.5} />
                  <h3 className="text-[14px] font-semibold mb-1 group-hover:text-[var(--accent)] transition-colors">{item.label}</h3>
                  <p className="text-[12px] text-[var(--text-secondary)]">{item.desc}</p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative py-24 text-center overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px]"
          style={{ background: "radial-gradient(ellipse, rgba(71,159,250,0.06) 0%, transparent 70%)" }} />

        <div className="max-w-[1220px] mx-auto px-6 relative z-10">
          <ScrollReveal>
            <h2 className="page-heading text-[44px] mb-4">
              Your edge, automated.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="text-[16px] text-[var(--text-secondary)] max-w-[460px] mx-auto leading-[1.55] mb-8">
              Quantitative signals. AI validation. Paper trading. All in one system.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="flex items-center justify-center gap-3">
              <Link href="/stocks"
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-medium text-white transition-all hover:scale-[1.03]"
                style={{ background: "rgba(71,159,250,0.15)", border: "1px solid rgba(71,159,250,0.25)" }}>
                <Zap size={14} />
                Explore Stocks
              </Link>
              <Link href="/paper-trading"
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] transition-all hover:scale-[1.03] hover:text-white"
                style={{ background: "var(--glass-hover)", border: "1px solid var(--border)" }}>
                Start Trading
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="h-10" />
    </div>
  );
}
