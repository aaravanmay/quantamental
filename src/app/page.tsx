"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { StockSearch } from "@/components/StockSearch";
import { ScrollReveal } from "@/components/ScrollReveal";
import { RegimeBadge } from "@/components/RegimeBadge";
import { SectorRotationCard } from "@/components/SectorRotationCard";
import { cn } from "@/lib/utils";
import { ArrowRight, Zap, Shield, TrendingUp, BarChart3 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [topSignals, setTopSignals] = useState<any[]>([]);
  const [marketNews, setMarketNews] = useState<any[]>([]);
  const [gainers, setGainers] = useState<any[]>([]);

  useEffect(() => {
    // Load top proposals
    fetch("/api/v2/daily-scan")
      .then((r) => r.json())
      .then((d) => setTopSignals((d.proposals || []).slice(0, 3)))
      .catch(() => {});
    // Load news
    fetch("/api/news")
      .then((r) => r.json())
      .then((d) => setMarketNews(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => {});
    // Load gainers
    fetch("/api/market")
      .then((r) => r.json())
      .then((d) => setGainers(d.gainers?.slice(0, 5) || []))
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      {/* ═══ SECTION 1: HERO ═══ */}
      <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px]"
          style={{ background: "radial-gradient(ellipse, rgba(71,159,250,0.08) 0%, transparent 60%)" }}
        />
        {/* Atmospheric image */}
        <div className="pointer-events-none absolute right-0 top-0 w-[600px] h-[500px] opacity-[0.06]">
          <Image
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=60"
            alt=""
            fill
            className="object-cover"
            style={{ maskImage: "radial-gradient(ellipse 80% 80% at 80% 30%, black, transparent)" }}
          />
        </div>

        <div className="max-w-[1220px] mx-auto px-6 relative z-10">
          <ScrollReveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-[var(--accent)] mb-6">
              Quantamental Architect
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="text-[42px] sm:text-[56px] md:text-[72px] font-bold leading-[1.05] tracking-tight mb-6" style={{
              background: "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.35) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Make better trades.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-[18px] text-[var(--text-secondary)] max-w-[520px] leading-[1.6] mb-10">
              Swing trade signals powered by quantitative analysis,
              fundamental research, and AI-driven event validation.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={300}>
            <div className="max-w-[580px] mb-12">
              <StockSearch fullWidth />
            </div>
          </ScrollReveal>

          {/* Regime + Rotation */}
          <ScrollReveal delay={400}>
            <div className="max-w-[820px] grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
              <div className="md:col-span-2"><RegimeBadge /></div>
              <SectorRotationCard />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ SECTION 2: CINEMATIC STATEMENT ═══ */}
      <section className="relative py-32 md:py-44 overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px]"
          style={{ background: "radial-gradient(ellipse, rgba(78,190,150,0.06) 0%, transparent 70%)" }}
        />
        <div className="max-w-[1220px] mx-auto px-6">
          <ScrollReveal>
            <h2 className="text-[36px] sm:text-[48px] md:text-[64px] font-bold leading-[1.1] tracking-tight max-w-[800px]" style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              From data to conviction.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <p className="mt-6 text-[16px] text-zinc-500 max-w-[500px] leading-relaxed">
              4 independent strategies scan 109 stocks every day. Regime detection,
              sector rotation, and Kelly sizing do the thinking. You make the call.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ SECTION 3: ASYMMETRIC FEATURE SHOWCASE ═══ */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-[1220px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Screenshot-style card */}
            <ScrollReveal>
              <div className="relative rounded-2xl overflow-hidden" style={{
                background: "rgba(255,255,255,0.02)",
                border: "0.5px solid rgba(255,255,255,0.06)",
                boxShadow: "0 0 120px -30px rgba(71,159,250,0.08), 0 40px 80px -30px rgba(0,0,0,0.6)",
              }}>
                <Image
                  src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&q=75"
                  alt="Market analysis"
                  width={900}
                  height={500}
                  className="w-full opacity-40"
                  style={{
                    maskImage: "linear-gradient(180deg, black 50%, transparent 100%)",
                  }}
                />
                {/* Overlay data */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2">Live Signal</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {topSignals[0]?.ticker || "PLTR"}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {topSignals[0]?.strategy || "EMA100+RSI<40"} · Sharpe {topSignals[0]?.sharpe?.toFixed(2) || "3.17"}
                  </div>
                  <div className="mt-3 flex gap-4 text-xs">
                    <span className="text-emerald-400">
                      Size: {topSignals[0]?.final_pct ? `${(topSignals[0].final_pct * 100).toFixed(1)}%` : "20%"}
                    </span>
                    <span className="text-zinc-500">SL -8%</span>
                    <span className="text-zinc-500">TP +16%</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Right: Feature bullets */}
            <ScrollReveal delay={200}>
              <div className="space-y-8">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[var(--accent)] mb-3">How it works</div>
                  <h3 className="text-[28px] font-bold text-white leading-tight mb-4">
                    Four brains. One decision.
                  </h3>
                </div>
                {[
                  { icon: TrendingUp, title: "Pattern Matcher", desc: "14 technical strategies scan for momentum, mean-reversion, and breakout setups." },
                  { icon: Zap, title: "Sector Winner Picker", desc: "Weekly rotation into the strongest stock per sector. Rides momentum, drops losers." },
                  { icon: BarChart3, title: "Earnings Surfer", desc: "Post-earnings drift on beats with day-of confirmation. 57% win rate." },
                  { icon: Shield, title: "Small-Cap Hunter", desc: "52-week breakouts on $1-10B names where institutions can't go." },
                ].map((f, i) => (
                  <div key={i} className="flex gap-4 items-start group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{
                      background: "rgba(71,159,250,0.08)",
                      border: "0.5px solid rgba(71,159,250,0.15)",
                    }}>
                      <f.icon size={18} className="text-[var(--accent)]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white mb-1">{f.title}</div>
                      <div className="text-[13px] text-zinc-500 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4: ANOTHER CINEMATIC STATEMENT ═══ */}
      <section className="py-32 md:py-44 text-center overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
          style={{ background: "radial-gradient(ellipse, rgba(248,161,108,0.06) 0%, transparent 70%)" }}
        />
        <ScrollReveal>
          <h2 className="text-[36px] sm:text-[48px] md:text-[64px] font-bold leading-[1.1] tracking-tight mx-auto max-w-[700px] px-6" style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Every edge. Automated.
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={150}>
          <p className="mt-6 text-[16px] text-zinc-500 max-w-[480px] mx-auto px-6 leading-relaxed">
            Regime detection. Earnings blackout. Kelly sizing. Sector rotation.
            The system runs at 9:30 AM every weekday — even when you're asleep.
          </p>
        </ScrollReveal>
      </section>

      {/* ═══ SECTION 5: TOP SIGNALS CARDS ═══ */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-[1220px] mx-auto px-6">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--accent)] mb-2">Today's Picks</div>
                <h3 className="text-[24px] font-bold text-white">Top Signals</h3>
              </div>
              <Link
                href="/proposals"
                className="flex items-center gap-2 text-[13px] text-zinc-400 hover:text-white transition-colors"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(topSignals.length > 0 ? topSignals : [
              { ticker: "—", strategy: "Loading...", sharpe: 0, final_pct: 0 },
              { ticker: "—", strategy: "Loading...", sharpe: 0, final_pct: 0 },
              { ticker: "—", strategy: "Loading...", sharpe: 0, final_pct: 0 },
            ]).map((s: any, i: number) => (
              <ScrollReveal key={i} delay={i * 100}>
                <div
                  onClick={() => s.ticker !== "—" && router.push(`/stock/${s.ticker}`)}
                  className={cn(
                    "group glass glass-card rounded-2xl p-5 cursor-pointer card-stagger",
                    i === 0 && "border-emerald-500/15 animate-pulse-glow",
                  )}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-white">{s.ticker}</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {s.final_pct ? `${(s.final_pct * 100).toFixed(1)}%` : "—"}
                    </span>
                  </div>
                  <div className="text-[12px] text-zinc-500 mb-4">{s.strategy}</div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-600">
                      Sharpe {s.sharpe?.toFixed(2) || "—"}
                    </span>
                    <ArrowRight size={14} className="text-zinc-700 group-hover:text-[var(--accent)] transition-colors" />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6: NEWS + GAINERS (asymmetric) ═══ */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-[1220px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* News — takes 3 cols */}
            <div className="lg:col-span-3">
              <ScrollReveal>
                <div className="text-[11px] uppercase tracking-wider text-[var(--accent)] mb-3">Market News</div>
                <div className="space-y-3">
                  {marketNews.map((n: any, i: number) => (
                    <a
                      key={i}
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block glass glass-card rounded-xl p-4 card-stagger"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-[13px] font-medium text-white leading-snug mb-1 line-clamp-2">
                            {n.headline || n.title}
                          </div>
                          <div className="text-[11px] text-zinc-600">
                            {n.source} · {n.datetime ? new Date(n.datetime * 1000).toLocaleDateString() : ""}
                          </div>
                        </div>
                        {n.image && (
                          <Image
                            src={n.image}
                            alt=""
                            width={80}
                            height={52}
                            className="rounded-lg object-cover flex-shrink-0 opacity-70"
                          />
                        )}
                      </div>
                    </a>
                  ))}
                  {marketNews.length === 0 && (
                    <div className="glass rounded-xl p-8 text-center text-zinc-600 text-sm">
                      Loading news...
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>

            {/* Gainers — takes 2 cols */}
            <div className="lg:col-span-2">
              <ScrollReveal delay={100}>
                <div className="text-[11px] uppercase tracking-wider text-emerald-400 mb-3">Top Movers</div>
                <div className="glass rounded-xl overflow-hidden">
                  {gainers.map((g: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => router.push(`/stock/${g.ticker || g.symbol}`)}
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--glass-hover)] transition-colors border-b border-zinc-800/30 last:border-0"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">{g.ticker || g.symbol}</div>
                        <div className="text-[10px] text-zinc-600">{g.name || g.companyName || ""}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-white">${g.price?.toFixed(2) || "—"}</div>
                        <div className={cn(
                          "text-[11px] font-mono",
                          (g.changesPercentage || g.change_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {(g.changesPercentage || g.change_pct || 0) >= 0 ? "+" : ""}
                          {(g.changesPercentage || g.change_pct || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {gainers.length === 0 && (
                    <div className="p-6 text-center text-zinc-600 text-sm">Loading...</div>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7: PERFORMANCE STATS ═══ */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-[1220px] mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="text-[11px] uppercase tracking-wider text-[var(--accent)] mb-3">Backtested Performance</div>
              <h3 className="text-[28px] font-bold text-white">Real numbers. No cherry-picking.</h3>
              <p className="mt-3 text-[14px] text-zinc-500 max-w-[500px] mx-auto">
                2024-2026 walk-forward backtest on 63 S&P 500 stocks with realistic slippage.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Annualized Return", value: "+15.7%", color: "text-emerald-400" },
              { label: "Sharpe Ratio", value: "0.93", color: "text-white" },
              { label: "Max Drawdown", value: "7.4%", color: "text-amber-400" },
              { label: "Profit Factor", value: "1.88", color: "text-white" },
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="glass glass-card rounded-xl p-6 text-center card-stagger" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">{stat.label}</div>
                  <div className={cn("text-[32px] font-bold font-mono", stat.color)}>{stat.value}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 8: CTA ═══ */}
      <section className="py-32 text-center overflow-hidden">
        <ScrollReveal>
          <h2 className="text-[28px] sm:text-[36px] font-bold text-white mb-4 px-6">
            Ready to trade smarter?
          </h2>
          <p className="text-[15px] text-zinc-500 mb-8 px-6">
            Check today's signals or start paper trading.
          </p>
          <div className="flex items-center justify-center gap-3 px-6 flex-wrap">
            <Link
              href="/proposals"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium text-white transition-all hover:scale-[1.03]"
              style={{
                background: "rgba(71,159,250,0.15)",
                border: "1px solid rgba(71,159,250,0.25)",
              }}
            >
              <Zap size={16} />
              View Proposals
            </Link>
            <Link
              href="/paper-trading"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium text-zinc-400 transition-all hover:text-white hover:scale-[1.03]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Paper Trade
              <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Spacer before global layout footer */}
      <div className="h-8" />
    </div>
  );
}
