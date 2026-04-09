"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StockSearch } from "@/components/StockSearch";
import { ScrollReveal } from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, Briefcase, Newspaper } from "lucide-react";

const CHIPS = ["Trending", "Earnings this week", "High momentum", "AI & Tech", "Dividend plays", "Energy"];

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
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, { price: number; change_pct: number }>>({});
  const router = useRouter();

  const [marketNews, setMarketNews] = useState<any[]>([]);

  // Fetch market news
  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetch("/api/news");
        if (res.ok) setMarketNews(await res.json());
      } catch {}
    }
    loadNews();
  }, []);

  // Fetch live prices for showcase tickers
  useEffect(() => {
    async function loadPrices() {
      const quotes: Record<string, { price: number; change_pct: number }> = {};
      for (let i = 0; i < SHOWCASE_TICKERS.length; i += 4) {
        const batch = SHOWCASE_TICKERS.slice(i, i + 4);
        const results = await Promise.allSettled(
          batch.map((t) => fetch(`/api/stock/${t.ticker}/quote`).then((r) => r.json()))
        );
        results.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value?.price) {
            quotes[batch[idx].ticker] = { price: r.value.price, change_pct: r.value.change_pct };
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
      {/* ═══════════════════════════════════════════════════════════
          HERO — Product showcase with 3D tilted table
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative pt-20 pb-8 overflow-hidden">
        {/* Glow */}
        <div className="absolute left-1/2 -top-40 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(71,159,250,0.07) 0%, transparent 70%)" }} />

        <div className="max-w-[1220px] mx-auto px-6 text-center relative z-10">
          <ScrollReveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#479FFA] mb-5">
              Quantamental Architect
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="text-[56px] font-semibold leading-[1.05] tracking-tight mb-5"
              style={{
                background: "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Make better trades.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-[18px] text-[#868F97] max-w-[540px] mx-auto leading-[1.55] mb-10">
              Swing trade signals powered by quantitative analysis, fundamental research, and AI-driven event validation.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="max-w-[640px] mx-auto mb-6">
              <StockSearch fullWidth />
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-16">
              {CHIPS.map((label) => (
                <button key={label} onClick={() => setActiveChip(activeChip === label ? null : label)}
                  className={activeChip === label ? "chip chip-active" : "chip"}>
                  {label}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* 3D Product Demo */}
          <ScrollReveal delay={400}>
            <div style={{ perspective: "1200px" }}>
              <div style={{
                transform: "rotateX(10deg) rotateY(-2deg)",
                transition: "transform 0.5s ease",
                borderRadius: "16px",
                overflow: "hidden",
                background: "rgba(255,255,255,0.02)",
                border: "0.5px solid rgba(255,255,255,0.08)",
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
                        <td className="text-[#868F97]">{s.name}</td>
                        <td><span className="text-[12px] px-2 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,0.04)" }}>{s.strategy}</span></td>
                        <td className="text-right font-mono tabular-nums">${s.price.toFixed(2)}</td>
                        <td className={cn("text-right font-mono tabular-nums", s.change >= 0 ? "text-[#4EBE96]" : "text-[#f87171]")}>
                          {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                        </td>
                        <td className="text-right font-mono tabular-nums">{s.sharpe.toFixed(2)}</td>
                        <td className="text-right font-mono tabular-nums">{(s.win_rate * 100).toFixed(0)}%</td>
                        <td className="text-center">
                          <span className={cn("inline-block rounded-full px-3 py-1 text-[11px] font-medium",
                            s.status === "go" && "badge-gain",
                            s.status === "nogo" && "badge-loss",
                            s.status === "pending" && "bg-[rgba(255,255,255,0.06)] text-[#868F97]"
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

      {/* Quick Links */}
      <section className="max-w-[1220px] mx-auto px-6 py-10">
        <ScrollReveal>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/stocks", label: "Browse Stocks", desc: "Search and explore any stock", icon: BarChart3 },
              { href: "/earnings", label: "Earnings Calendar", desc: "Upcoming earnings reports", icon: TrendingUp },
              { href: "/watchlist", label: "Your Watchlist", desc: "Track stocks you're watching", icon: Briefcase },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="glass rounded-xl p-5 hover:bg-[rgba(255,255,255,0.04)] transition-all group card-shadow">
                <item.icon size={20} className="text-[var(--accent)] mb-3" strokeWidth={1.5} />
                <h3 className="text-[14px] font-semibold mb-1 group-hover:text-[var(--accent)] transition-colors">{item.label}</h3>
                <p className="text-[12px] text-[var(--text-secondary)]">{item.desc}</p>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Market News */}
      {marketNews.length > 0 && (
        <section className="max-w-[1220px] mx-auto px-6 py-10">
          <ScrollReveal>
            <div className="flex items-center gap-2 mb-5">
              <Newspaper size={16} className="text-[#479FFA]" />
              <h2 className="text-[18px] font-semibold text-white">Market News</h2>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="grid md:grid-cols-2 gap-3">
              {marketNews.slice(0, 6).map((article: any, i: number) => (
                <a
                  key={i}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-xl p-4 hover:bg-[rgba(255,255,255,0.04)] transition-all group"
                  style={{ boxShadow: "0 0 40px -15px rgba(71,159,250,0.04), 0 8px 20px -8px rgba(0,0,0,0.25)" }}
                >
                  <h3 className="text-[13px] font-medium text-white leading-snug group-hover:text-accent transition-colors">
                    {article.headline}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-[#868F97]">{article.source}</span>
                    <span className="text-[11px] text-[#555]">&middot;</span>
                    <span className="text-[11px] text-[#555]">
                      {new Date(article.datetime * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </ScrollReveal>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CTA
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-28 text-center overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px]"
          style={{ background: "radial-gradient(ellipse, rgba(71,159,250,0.06) 0%, transparent 70%)" }} />

        <div className="max-w-[1220px] mx-auto px-6 relative z-10">
          <ScrollReveal>
            <h2 className="text-[48px] font-semibold leading-[1.08] tracking-tight mb-4"
              style={{
                background: "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Finance made effortless.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="text-[18px] text-[#868F97] max-w-[460px] mx-auto leading-[1.55] mb-8">
              Your personal quantamental trading system. Math, AI, and real-world context — all in one.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 40px 8px rgba(71,159,250,0.15)" }} />
              <button onClick={() => router.push("/stock-finder")}
                className="relative inline-flex items-center gap-2 rounded-full px-8 py-3 text-[14px] font-medium text-white transition-all hover:scale-[1.03]"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "0.5px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}>
                Start screening
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="h-16" />
    </div>
  );
}
