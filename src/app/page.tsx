"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { StockSearch } from "@/components/StockSearch";
import { RegimeBadge } from "@/components/RegimeBadge";
import { SectorRotationCard } from "@/components/SectorRotationCard";
import { cn } from "@/lib/utils";
import { ArrowRight, Zap, Shield, TrendingUp, BarChart3 } from "lucide-react";

// ── Fade-in wrapper with intersection observer ──
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.7, delay: delay / 1000, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [topSignals, setTopSignals] = useState<any[]>([]);
  const [marketNews, setMarketNews] = useState<any[]>([]);
  const [gainers, setGainers] = useState<any[]>([]);

  // Parallax for hero
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 0.95]);

  // Parallax for app mockup
  const mockupRef = useRef(null);
  const { scrollYProgress: mockupScroll } = useScroll({
    target: mockupRef,
    offset: ["start end", "end start"],
  });
  const mockupY = useTransform(mockupScroll, [0, 1], [80, -80]);
  const mockupRotateX = useTransform(mockupScroll, [0, 0.5, 1], [8, 0, -3]);
  const mockupScale = useTransform(mockupScroll, [0, 0.5], [0.9, 1]);

  useEffect(() => {
    fetch("/api/v2/daily-scan").then(r => r.json())
      .then(d => setTopSignals((d.proposals || []).slice(0, 3))).catch(() => {});
    fetch("/api/news").then(r => r.json())
      .then(d => setMarketNews(Array.isArray(d) ? d.slice(0, 3) : [])).catch(() => {});
    fetch("/api/market").then(r => r.json())
      .then(d => setGainers(d.gainers?.slice(0, 5) || [])).catch(() => {});
  }, []);

  return (
    <div className="relative overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: HERO — full viewport, parallax text, search
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Gradient mesh background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[70%] h-[60%]" style={{
            background: "radial-gradient(ellipse at 70% 20%, rgba(71,159,250,0.12) 0%, transparent 50%)",
          }} />
          <div className="absolute bottom-0 left-0 w-[50%] h-[40%]" style={{
            background: "radial-gradient(ellipse at 30% 80%, rgba(78,190,150,0.06) 0%, transparent 50%)",
          }} />
        </div>

        {/* Atmospheric background image — faded stock chart */}
        <div className="pointer-events-none absolute right-0 top-[10%] w-[55%] h-[70%] opacity-[0.07]">
          <Image
            src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200&q=60"
            alt=""
            fill
            className="object-cover"
            style={{ maskImage: "radial-gradient(ellipse 80% 70% at 70% 40%, black, transparent)" }}
            priority
          />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="max-w-[1220px] mx-auto px-6 relative z-10 w-full"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[var(--accent)] mb-6"
          >
            Quantamental Architect
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-[48px] sm:text-[64px] md:text-[80px] font-bold leading-[1.02] tracking-[-0.02em] mb-6 max-w-[700px]"
            style={{
              background: "linear-gradient(175deg, #fff 30%, rgba(255,255,255,0.25) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Make better trades.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-[17px] text-zinc-400 max-w-[480px] leading-[1.65] mb-10"
          >
            Swing trade signals powered by quantitative analysis,
            fundamental research, and AI-driven event validation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="max-w-[540px] mb-14"
          >
            <StockSearch fullWidth />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="max-w-[820px] grid grid-cols-1 md:grid-cols-3 gap-3 text-left"
          >
            <div className="md:col-span-2"><RegimeBadge /></div>
            <SectorRotationCard />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-5 h-8 rounded-full border border-zinc-700 flex items-start justify-center p-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-zinc-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: CINEMATIC STATEMENT — sticky text reveal
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-40 md:py-56">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px]" style={{
          background: "radial-gradient(ellipse, rgba(78,190,150,0.05) 0%, transparent 60%)",
        }} />
        <div className="max-w-[1220px] mx-auto px-6">
          <Reveal>
            <h2 className="text-[40px] sm:text-[56px] md:text-[76px] font-bold leading-[1.05] tracking-[-0.03em] max-w-[800px]" style={{
              background: "linear-gradient(175deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.2) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              From data to conviction.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-8 text-[16px] text-zinc-500 max-w-[460px] leading-[1.7]">
              4 independent strategies scan 109 stocks every day. Regime detection,
              sector rotation, and Kelly sizing do the thinking.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: APP MOCKUP — perspective transform on scroll
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={mockupRef} className="py-20 overflow-hidden">
        <div className="max-w-[1220px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Perspective mockup */}
            <Reveal>
              <motion.div
                style={{ y: mockupY, rotateX: mockupRotateX, scale: mockupScale }}
                className="relative rounded-2xl overflow-hidden"
              >
                <div style={{
                  perspective: "1200px",
                  transformStyle: "preserve-3d",
                }}>
                  <div className="rounded-2xl overflow-hidden" style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 0 100px -20px rgba(71,159,250,0.1), 0 50px 100px -40px rgba(0,0,0,0.7)",
                  }}>
                    <Image
                      src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&q=75"
                      alt="Market analysis"
                      width={900}
                      height={500}
                      className="w-full opacity-50"
                      style={{ maskImage: "linear-gradient(180deg, black 40%, transparent 100%)" }}
                    />
                    {/* Overlay live data */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="backdrop-blur-md bg-black/40 rounded-xl p-4 max-w-[280px] border border-white/5">
                        <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">Live Signal</div>
                        <div className="text-xl font-bold text-white mb-0.5">
                          {topSignals[0]?.ticker || "PLTR"}
                        </div>
                        <div className="text-[12px] text-zinc-400 mb-2">
                          {topSignals[0]?.strategy || "EMA100+RSI<40"}
                        </div>
                        <div className="flex gap-3 text-[11px]">
                          <span className="text-emerald-400 font-mono">
                            {topSignals[0]?.final_pct ? `${(topSignals[0].final_pct * 100).toFixed(1)}%` : "20.0%"}
                          </span>
                          <span className="text-zinc-600">|</span>
                          <span className="text-zinc-400">Sharpe {topSignals[0]?.sharpe?.toFixed(2) || "3.17"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Reveal>

            {/* Right: Feature list */}
            <div className="space-y-10">
              <Reveal delay={100}>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)] mb-4">How it works</div>
                  <h3 className="text-[30px] font-bold text-white leading-[1.15] tracking-tight">
                    Four brains.<br />One decision.
                  </h3>
                </div>
              </Reveal>
              {[
                { icon: TrendingUp, title: "Pattern Matcher", desc: "14 technical strategies scan for momentum, mean-reversion, and breakout setups across 109 stocks." },
                { icon: Zap, title: "Sector Winner", desc: "Weekly rotation into the strongest stock per sector. Rides momentum, exits on rotation." },
                { icon: BarChart3, title: "Earnings Surfer", desc: "Post-earnings drift on surprise beats with day-of reaction confirmation. 57% win rate." },
                { icon: Shield, title: "Small-Cap Hunter", desc: "52-week breakouts on $1-10B companies where big funds can't go." },
              ].map((f, i) => (
                <Reveal key={i} delay={200 + i * 100}>
                  <div className="flex gap-4 items-start group cursor-default">
                    <div className="flex-shrink-0 w-11 h-11 rounded-[14px] flex items-center justify-center transition-colors group-hover:border-[var(--accent)]/30" style={{
                      background: "rgba(71,159,250,0.06)",
                      border: "0.5px solid rgba(71,159,250,0.12)",
                    }}>
                      <f.icon size={18} className="text-[var(--accent)] opacity-80" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-white mb-1 tracking-tight">{f.title}</div>
                      <div className="text-[13px] text-zinc-500 leading-[1.6]">{f.desc}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: CINEMATIC STATEMENT 2 — centered
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-40 md:py-56 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]" style={{
          background: "radial-gradient(ellipse, rgba(248,161,108,0.05) 0%, transparent 60%)",
        }} />
        <Reveal>
          <h2 className="text-[40px] sm:text-[56px] md:text-[76px] font-bold leading-[1.05] tracking-[-0.03em] mx-auto max-w-[700px] px-6" style={{
            background: "linear-gradient(175deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.2) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Every edge. Automated.
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-8 text-[15px] text-zinc-500 max-w-[440px] mx-auto px-6 leading-[1.7]">
            Regime detection. Earnings blackout. Kelly sizing. The system
            runs at 9:30 AM every weekday — even when you&apos;re asleep.
          </p>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: TOP SIGNALS — glass cards with hover
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-[1220px] mx-auto px-6">
          <Reveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)] mb-3">Today&apos;s Picks</div>
                <h3 className="text-[28px] font-bold text-white tracking-tight">Top Signals</h3>
              </div>
              <Link href="/proposals" className="flex items-center gap-2 text-[13px] text-zinc-500 hover:text-white transition-colors">
                View all <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(topSignals.length > 0 ? topSignals : [1, 2, 3].map(() => ({
              ticker: "—", strategy: "Loading...", sharpe: 0, final_pct: 0
            }))).map((s: any, i: number) => (
              <Reveal key={i} delay={i * 120}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => s.ticker !== "—" && router.push(`/stock/${s.ticker}`)}
                  className={cn(
                    "glass rounded-2xl p-6 cursor-pointer transition-shadow",
                    i === 0 ? "border-emerald-500/15" : "",
                  )}
                  style={{
                    boxShadow: i === 0
                      ? "0 0 40px -10px rgba(16,185,129,0.12), 0 20px 40px -20px rgba(0,0,0,0.4)"
                      : "0 0 40px -15px rgba(71,159,250,0.06), 0 20px 40px -20px rgba(0,0,0,0.3)",
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-bold text-white tracking-tight">{s.ticker}</span>
                    <span className="text-emerald-400 font-mono text-lg font-bold">
                      {s.final_pct ? `${(s.final_pct * 100).toFixed(1)}%` : "—"}
                    </span>
                  </div>
                  <div className="text-[12px] text-zinc-500 mb-6">{s.strategy}</div>
                  <div className="flex items-center justify-between text-[11px] pt-4 border-t border-zinc-800/50">
                    <span className="text-zinc-600">Sharpe {s.sharpe?.toFixed(2) || "—"}</span>
                    <ArrowRight size={14} className="text-zinc-700" />
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: NEWS + MOVERS — asymmetric layout
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-[1220px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <Reveal>
                <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)] mb-4">Market News</div>
              </Reveal>
              <div className="space-y-3">
                {marketNews.map((n: any, i: number) => (
                  <Reveal key={i} delay={i * 80}>
                    <a href={n.url} target="_blank" rel="noopener noreferrer"
                      className="block glass glass-card rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-white leading-snug mb-1.5 line-clamp-2">
                            {n.headline || n.title}
                          </div>
                          <div className="text-[11px] text-zinc-600">
                            {n.source} · {n.datetime ? new Date(n.datetime * 1000).toLocaleDateString() : ""}
                          </div>
                        </div>
                        {n.image && (
                          <Image src={n.image} alt="" width={72} height={48}
                            className="rounded-lg object-cover flex-shrink-0 opacity-60" />
                        )}
                      </div>
                    </a>
                  </Reveal>
                ))}
                {marketNews.length === 0 && (
                  <div className="glass rounded-xl p-10 text-center text-zinc-600 text-sm">Loading news...</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <Reveal delay={100}>
                <div className="text-[11px] uppercase tracking-[0.15em] text-emerald-400/80 mb-4">Top Movers</div>
                <div className="glass rounded-xl overflow-hidden">
                  {gainers.map((g: any, i: number) => (
                    <div key={i} onClick={() => router.push(`/stock/${g.ticker || g.symbol}`)}
                      className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-zinc-800/30 last:border-0">
                      <div>
                        <div className="text-[13px] font-semibold text-white">{g.ticker || g.symbol}</div>
                        <div className="text-[10px] text-zinc-600 truncate max-w-[140px]">{g.name || g.companyName || ""}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-mono text-white">${g.price?.toFixed(2) || "—"}</div>
                        <div className={cn("text-[11px] font-mono",
                          (g.changesPercentage || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {(g.changesPercentage || 0) >= 0 ? "+" : ""}{(g.changesPercentage || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  {gainers.length === 0 && <div className="p-8 text-center text-zinc-600 text-sm">Loading...</div>}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 7: PERFORMANCE — big numbers
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-[1220px] mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)] mb-3">Backtested Performance</div>
              <h3 className="text-[28px] font-bold text-white tracking-tight">Real numbers. No cherry-picking.</h3>
              <p className="mt-4 text-[14px] text-zinc-500 max-w-[460px] mx-auto leading-relaxed">
                2024-2026 walk-forward backtest on 63 S&P 500 stocks with realistic slippage and commissions.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Annualized Return", value: "+15.7%", color: "text-emerald-400" },
              { label: "Sharpe Ratio", value: "0.93", color: "text-white" },
              { label: "Max Drawdown", value: "7.4%", color: "text-amber-400" },
              { label: "Profit Factor", value: "1.88", color: "text-white" },
            ].map((stat, i) => (
              <Reveal key={i} delay={i * 100}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="glass rounded-xl p-6 text-center"
                  style={{ boxShadow: "0 0 40px -15px rgba(71,159,250,0.05), 0 20px 40px -20px rgba(0,0,0,0.3)" }}
                >
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-4">{stat.label}</div>
                  <div className={cn("text-[36px] font-bold font-mono tracking-tight", stat.color)}>{stat.value}</div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 8: CTA
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-32 text-center relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px]" style={{
          background: "radial-gradient(ellipse, rgba(71,159,250,0.06) 0%, transparent 60%)",
        }} />
        <Reveal>
          <h2 className="text-[32px] sm:text-[40px] font-bold text-white mb-4 px-6 tracking-tight">
            Ready to trade smarter?
          </h2>
          <p className="text-[15px] text-zinc-500 mb-10 px-6">
            Check today&apos;s signals or start paper trading.
          </p>
          <div className="flex items-center justify-center gap-4 px-6 flex-wrap">
            <Link href="/proposals"
              className="inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-medium text-white transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-blue-500/10"
              style={{ background: "rgba(71,159,250,0.15)", border: "1px solid rgba(71,159,250,0.25)" }}>
              <Zap size={16} /> View Proposals
            </Link>
            <Link href="/paper-trading"
              className="inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-medium text-zinc-400 transition-all hover:text-white hover:scale-[1.03]"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Paper Trade <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </section>

      <div className="h-8" />
    </div>
  );
}
