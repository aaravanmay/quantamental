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

// ── Fade-in wrapper ──
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay: delay / 1000, ease: [0.25, 0.1, 0.25, 1] }}
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
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroScroll, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.5], [1, 0.95]);

  // Parallax for 3D mockup
  const mockupRef = useRef(null);
  const { scrollYProgress: mockupScroll } = useScroll({ target: mockupRef, offset: ["start end", "end start"] });
  const mockupY = useTransform(mockupScroll, [0, 1], [100, -60]);
  const mockupRotateX = useTransform(mockupScroll, [0, 0.4, 1], [12, 0, -4]);
  const mockupScale = useTransform(mockupScroll, [0, 0.4], [0.88, 1]);

  // Parallax for stats
  const statsRef = useRef(null);
  const { scrollYProgress: statsScroll } = useScroll({ target: statsRef, offset: ["start end", "center center"] });
  const statsScale = useTransform(statsScroll, [0, 1], [0.85, 1]);

  useEffect(() => {
    fetch("/api/v2/daily-scan").then(r => { if (r.ok) return r.json(); throw 0; })
      .then(d => setTopSignals((d.proposals || []).slice(0, 3))).catch(() => {});
    fetch("/api/news").then(r => { if (r.ok) return r.json(); throw 0; })
      .then(d => setMarketNews(Array.isArray(d) ? d.slice(0, 3) : [])).catch(() => {});
    fetch("/api/market").then(r => { if (r.ok) return r.json(); throw 0; })
      .then(d => setGainers(d.gainers?.slice(0, 5) || [])).catch(() => {});
  }, []);

  // Stock tickers for the orbital section
  const orbitalTickers = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "JPM",
    "V", "UNH", "LLY", "AVGO", "MA", "HD", "COST", "NFLX",
    "CRM", "AMD", "ORCL", "ABBV", "PEP", "KO", "MRK", "PLTR",
  ];

  return (
    <div className="relative overflow-x-hidden">

      {/* ═════════════════════════════════════════════════════════════
          SECTION 1: HERO
      ═════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Gradient mesh */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[70%] h-[60%]" style={{
            background: "radial-gradient(ellipse at 70% 20%, rgba(71,159,250,0.12) 0%, transparent 50%)",
          }} />
          <div className="absolute bottom-0 left-0 w-[50%] h-[40%]" style={{
            background: "radial-gradient(ellipse at 30% 80%, rgba(78,190,150,0.06) 0%, transparent 50%)",
          }} />
        </div>

        {/* Atmospheric background */}
        <div className="pointer-events-none absolute right-0 top-[10%] w-[55%] h-[70%] opacity-[0.06]">
          <Image
            src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200&q=60"
            alt="" fill className="object-cover"
            style={{ maskImage: "radial-gradient(ellipse 80% 70% at 70% 40%, black, transparent)" }}
            priority
          />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="max-w-[1220px] mx-auto px-6 relative z-10 w-full">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[var(--accent)] mb-6">
            Quantamental Architect
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-[48px] sm:text-[64px] md:text-[80px] font-bold leading-[1.02] tracking-[-0.02em] mb-6 max-w-[700px]"
            style={{
              background: "linear-gradient(175deg, #fff 30%, rgba(255,255,255,0.25) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
            Make better trades.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-[17px] text-zinc-400 max-w-[480px] leading-[1.65] mb-10">
            Swing trade signals powered by quantitative analysis,
            fundamental research, and AI-driven event validation.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }} className="max-w-[540px] mb-14">
            <StockSearch fullWidth />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="max-w-[820px] grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2"><RegimeBadge /></div>
            <SectorRotationCard />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
            className="w-5 h-8 rounded-full border border-zinc-700 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-zinc-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 2: CINEMATIC STATEMENT
      ═════════════════════════════════════════════════════════════ */}
      <section className="relative py-40 md:py-56">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px]" style={{
          background: "radial-gradient(ellipse, rgba(78,190,150,0.05) 0%, transparent 60%)",
        }} />
        <div className="max-w-[1220px] mx-auto px-6">
          <Reveal>
            <h2 className="text-[40px] sm:text-[56px] md:text-[76px] font-bold leading-[1.05] tracking-[-0.03em] max-w-[800px]" style={{
              background: "linear-gradient(175deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.2) 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
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

      {/* ═════════════════════════════════════════════════════════════
          SECTION 3: 3D LAPTOP MOCKUP — with reflection
          Fey-style: perspective laptop, mirror reflection, glow
      ═════════════════════════════════════════════════════════════ */}
      <section ref={mockupRef} className="py-12 pb-32 overflow-hidden">
        <div className="max-w-[1000px] mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)] mb-3">The Platform</div>
              <h3 className="text-[28px] sm:text-[36px] font-bold text-white tracking-tight">
                Finance made effortless.
              </h3>
              <p className="mt-4 text-[14px] text-zinc-500 max-w-[380px] mx-auto leading-relaxed">
                Clear signals on markets, sectors, and individual stocks.
              </p>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <motion.div style={{ y: mockupY, rotateX: mockupRotateX, scale: mockupScale }}
              className="relative mx-auto" >
              {/* 3D laptop frame */}
              <div style={{ perspective: "1800px", transformStyle: "preserve-3d" }}>
                <div className="relative rounded-[20px] overflow-hidden" style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: `
                    0 0 0 1px rgba(255,255,255,0.04),
                    0 0 80px -20px rgba(71,159,250,0.15),
                    0 60px 120px -40px rgba(0,0,0,0.8),
                    0 100px 200px -60px rgba(0,0,0,0.6)
                  `,
                }}>
                  {/* Screen bezel */}
                  <div className="p-2 sm:p-3">
                    {/* Title bar dots */}
                    <div className="flex items-center gap-1.5 px-3 py-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                      <span className="ml-3 text-[10px] text-zinc-600 font-mono">quantamental — dashboard</span>
                    </div>
                    {/* Screenshot of the app */}
                    <div className="rounded-lg overflow-hidden relative">
                      <Image
                        src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80"
                        alt="Quantamental Dashboard"
                        width={1200} height={680}
                        className="w-full opacity-70"
                      />
                      {/* Overlay data cards */}
                      <div className="absolute inset-0 flex items-end p-4 sm:p-8">
                        <div className="flex gap-3 flex-wrap">
                          <div className="backdrop-blur-xl bg-black/50 rounded-xl px-4 py-3 border border-white/5">
                            <div className="text-[9px] uppercase tracking-wider text-emerald-400 mb-0.5">Live Signal</div>
                            <div className="text-lg font-bold text-white">{topSignals[0]?.ticker || "PLTR"}</div>
                            <div className="text-[11px] text-zinc-400">{topSignals[0]?.strategy || "EMA100+RSI<40"}</div>
                          </div>
                          <div className="backdrop-blur-xl bg-black/50 rounded-xl px-4 py-3 border border-white/5 hidden sm:block">
                            <div className="text-[9px] uppercase tracking-wider text-blue-400 mb-0.5">Regime</div>
                            <div className="text-lg font-bold text-white">Strong Bull</div>
                            <div className="text-[11px] text-zinc-400">VIX 19.2 · 100% size</div>
                          </div>
                          <div className="backdrop-blur-xl bg-black/50 rounded-xl px-4 py-3 border border-white/5 hidden md:block">
                            <div className="text-[9px] uppercase tracking-wider text-amber-400 mb-0.5">Top Sector</div>
                            <div className="text-lg font-bold text-white">Semis</div>
                            <div className="text-[11px] text-zinc-400">+19.8% relative strength</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Bottom chin of the laptop */}
                  <div className="h-4 flex items-center justify-center">
                    <div className="w-16 h-1 rounded-full bg-zinc-800" />
                  </div>
                </div>
              </div>

              {/* ── REFLECTION ── Fey-style mirror reflection below */}
              <div className="mt-1 overflow-hidden" style={{ height: "140px" }}>
                <div style={{
                  transform: "scaleY(-1)",
                  maskImage: "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 70%)",
                  WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 70%)",
                  filter: "blur(1px)",
                  opacity: 0.4,
                }}>
                  <div className="rounded-[20px] overflow-hidden" style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div className="p-2 sm:p-3">
                      <div className="h-7" />
                      <div className="rounded-lg overflow-hidden">
                        <Image
                          src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=40"
                          alt="" width={600} height={340} className="w-full opacity-40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 4: FOUR BRAINS — strategy cards
      ═════════════════════════════════════════════════════════════ */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-[1220px] mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <h3 className="text-[30px] sm:text-[40px] font-bold text-white leading-[1.1] tracking-tight">
                Four brains. One decision.
              </h3>
              <p className="mt-4 text-[14px] text-zinc-500 max-w-[400px] mx-auto">
                Each strategy scans independently, then the engine merges by conviction.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, title: "Pattern Matcher", pct: "40%", desc: "14 technical strategies across 109 stocks." },
              { icon: Zap, title: "Sector Winner", pct: "35%", desc: "Weekly rotation into the strongest per-sector pick." },
              { icon: BarChart3, title: "Earnings Surfer", pct: "15%", desc: "Post-earnings drift on surprise beats. 57% WR." },
              { icon: Shield, title: "Small-Cap Hunter", pct: "10%", desc: "52-week breakouts on $1-10B companies." },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 100}>
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="relative rounded-2xl p-6 h-full"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "0.5px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 20px 60px -20px rgba(0,0,0,0.5), 0 0 40px -15px rgba(71,159,250,0.05)",
                  }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-[14px] flex items-center justify-center" style={{
                      background: "rgba(71,159,250,0.06)", border: "0.5px solid rgba(71,159,250,0.12)",
                    }}>
                      <f.icon size={18} className="text-[var(--accent)] opacity-80" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-600">{f.pct} allocation</span>
                  </div>
                  <div className="text-[15px] font-semibold text-white mb-2 tracking-tight">{f.title}</div>
                  <div className="text-[12px] text-zinc-500 leading-[1.6]">{f.desc}</div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 5: CINEMATIC STATEMENT 2 — centered
      ═════════════════════════════════════════════════════════════ */}
      <section className="relative py-40 md:py-56 text-center">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]" style={{
          background: "radial-gradient(ellipse, rgba(248,161,108,0.05) 0%, transparent 60%)",
        }} />
        <Reveal>
          <h2 className="text-[40px] sm:text-[56px] md:text-[76px] font-bold leading-[1.05] tracking-[-0.03em] mx-auto max-w-[700px] px-6" style={{
            background: "linear-gradient(175deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.2) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
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

      {/* ═════════════════════════════════════════════════════════════
          SECTION 6: ORBITAL STOCKS — Fey "Portfolio in sync" style
          Floating ticker grid with radial glow
      ═════════════════════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        {/* Central glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]" style={{
          background: "radial-gradient(circle, rgba(78,190,150,0.15) 0%, rgba(71,159,250,0.05) 30%, transparent 60%)",
        }} />

        <Reveal>
          <div className="text-center mb-6">
            <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)] mb-3">Universe</div>
            <h3 className="text-[28px] sm:text-[36px] font-bold text-white tracking-tight">109 stocks. Always scanning.</h3>
            <p className="mt-4 text-[14px] text-zinc-500 max-w-[380px] mx-auto">
              S&P 500 coverage across every sector. Real-time regime-aware filtering.
            </p>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="relative max-w-[700px] mx-auto mt-12 px-6">
            {/* Orbital grid */}
            <div className="flex flex-wrap justify-center gap-3">
              {orbitalTickers.map((ticker, i) => {
                // Stagger opacity and size for depth effect
                const ring = i < 8 ? 0 : i < 16 ? 1 : 2;
                const opacity = ring === 0 ? 1 : ring === 1 ? 0.6 : 0.35;
                const scale = ring === 0 ? 1 : ring === 1 ? 0.9 : 0.8;
                const blur = ring === 2 ? "blur(0.5px)" : "none";

                return (
                  <motion.div
                    key={ticker}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity, scale }}
                    transition={{ duration: 0.5, delay: i * 0.03 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.15, opacity: 1, transition: { duration: 0.2 } }}
                    onClick={() => router.push(`/stock/${ticker}`)}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,${0.04 + (ring === 0 ? 0.04 : 0)}) 0%, rgba(255,255,255,0.01) 100%)`,
                      border: `0.5px solid rgba(255,255,255,${0.06 + (ring === 0 ? 0.06 : 0)})`,
                      filter: blur,
                      boxShadow: ring === 0 ? "0 0 20px -5px rgba(71,159,250,0.1)" : "none",
                    }}
                  >
                    <span className="text-[11px] font-semibold text-zinc-300 font-mono">{ticker}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Central glowing core */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-20 h-20 rounded-full" style={{
                background: "radial-gradient(circle, rgba(78,190,150,0.3) 0%, transparent 70%)",
                boxShadow: "0 0 60px 20px rgba(78,190,150,0.1)",
              }} />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 7: TOP SIGNALS — glass cards
      ═════════════════════════════════════════════════════════════ */}
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
                  className={cn("rounded-2xl p-6 cursor-pointer", i === 0 ? "border-emerald-500/15" : "")}
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "0.5px solid rgba(255,255,255,0.06)",
                    boxShadow: i === 0
                      ? "0 0 40px -10px rgba(16,185,129,0.12), 0 20px 40px -20px rgba(0,0,0,0.4)"
                      : "0 0 40px -15px rgba(71,159,250,0.06), 0 20px 40px -20px rgba(0,0,0,0.3)",
                  }}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-bold text-white tracking-tight">{s.ticker}</span>
                    <span className="text-emerald-400 font-mono text-lg font-bold">
                      {s.final_pct ? `${((s.final_pct ?? 0) * 100).toFixed(1)}%` : "—"}
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

      {/* ═════════════════════════════════════════════════════════════
          SECTION 8: NEWS + MOVERS
      ═════════════════════════════════════════════════════════════ */}
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
                      className="block rounded-xl p-4 transition-colors hover:bg-white/[0.02]" style={{
                        background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)",
                      }}>
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
                  <div className="rounded-xl p-10 text-center text-zinc-600 text-sm" style={{
                    background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)",
                  }}>Loading news...</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <Reveal delay={100}>
                <div className="text-[11px] uppercase tracking-[0.15em] text-emerald-400/80 mb-4">Top Movers</div>
                <div className="rounded-xl overflow-hidden" style={{
                  background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)",
                }}>
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

      {/* ═════════════════════════════════════════════════════════════
          SECTION 9: PERFORMANCE — 3D metallic numbers
          Fey "What it costs" style — huge chrome-effect number
      ═════════════════════════════════════════════════════════════ */}
      <section ref={statsRef} className="py-32 overflow-hidden relative">
        {/* Subtle mesh */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px]" style={{
          background: "radial-gradient(ellipse, rgba(71,159,250,0.04) 0%, transparent 50%)",
        }} />

        <Reveal>
          <div className="text-center mb-20">
            <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--accent)] mb-3">Backtested Performance</div>
            <h3 className="text-[28px] font-bold text-white tracking-tight">Real numbers. No cherry-picking.</h3>
            <p className="mt-4 text-[14px] text-zinc-500 max-w-[460px] mx-auto leading-relaxed">
              2024-2026 walk-forward backtest on 63 S&P 500 stocks with realistic slippage and commissions.
            </p>
          </div>
        </Reveal>

        {/* Big hero stat — Fey "30" style metallic number */}
        <Reveal delay={100}>
          <motion.div style={{ scale: statsScale }} className="text-center mb-20">
            <div className="text-[11px] uppercase tracking-widest text-zinc-600 mb-4">Annualized Return</div>
            <div className="text-[120px] sm:text-[160px] md:text-[200px] font-bold leading-[0.85] tracking-[-0.04em] font-mono" style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0.05) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 4px 30px rgba(71,159,250,0.08))",
            }}>
              15.7
            </div>
            <div className="text-[14px] text-zinc-600 mt-2 font-mono">percent per year</div>
          </motion.div>
        </Reveal>

        {/* Supporting stats */}
        <div className="max-w-[900px] mx-auto px-6 grid grid-cols-3 gap-4">
          {[
            { label: "Sharpe Ratio", value: "0.93" },
            { label: "Max Drawdown", value: "7.4%" },
            { label: "Profit Factor", value: "1.88" },
          ].map((stat, i) => (
            <Reveal key={i} delay={200 + i * 80}>
              <motion.div
                whileHover={{ y: -3 }}
                className="rounded-xl p-6 text-center"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  border: "0.5px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 20px 40px -15px rgba(0,0,0,0.4)",
                }}>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">{stat.label}</div>
                <div className="text-[32px] font-bold font-mono text-white tracking-tight" style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>{stat.value}</div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          SECTION 10: CTA
      ═════════════════════════════════════════════════════════════ */}
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
