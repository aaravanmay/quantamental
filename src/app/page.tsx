"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StockSearch } from "@/components/StockSearch";
import { ScrollReveal } from "@/components/ScrollReveal";
import { cn } from "@/lib/utils";
import { BarChart3, Brain, Shield, TrendingUp, Zap, Search, LineChart, Briefcase } from "lucide-react";

const CHIPS = ["Trending", "Earnings this week", "High momentum", "AI & Tech", "Dividend plays", "Energy"];

const SAMPLE = [
  { id: "1", ticker: "NVDA", name: "NVIDIA Corp", strategy: "EMA Cross + RSI", sharpe: 2.14, win_rate: 0.72, price: 892.47, change: 2.34, status: "go" },
  { id: "2", ticker: "AAPL", name: "Apple Inc", strategy: "Bollinger Squeeze", sharpe: 1.87, win_rate: 0.65, price: 213.25, change: 0.87, status: "go" },
  { id: "3", ticker: "XOM", name: "Exxon Mobil", strategy: "MACD Divergence", sharpe: 1.62, win_rate: 0.61, price: 118.92, change: -1.23, status: "nogo" },
  { id: "4", ticker: "JPM", name: "JPMorgan Chase", strategy: "Mean Reversion", sharpe: 1.54, win_rate: 0.58, price: 198.34, change: 0.45, status: "go" },
  { id: "5", ticker: "TSLA", name: "Tesla Inc", strategy: "Momentum Breakout", sharpe: 1.91, win_rate: 0.55, price: 245.18, change: -3.12, status: "pending" },
  { id: "6", ticker: "AMZN", name: "Amazon.com", strategy: "EMA Cross + RSI", sharpe: 1.78, win_rate: 0.63, price: 186.75, change: 1.56, status: "go" },
  { id: "7", ticker: "META", name: "Meta Platforms", strategy: "Volume Profile", sharpe: 1.69, win_rate: 0.60, price: 502.30, change: 0.92, status: "pending" },
  { id: "8", ticker: "MSFT", name: "Microsoft Corp", strategy: "Bollinger Squeeze", sharpe: 1.83, win_rate: 0.67, price: 420.15, change: 1.18, status: "go" },
];

export default function HomePage() {
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const router = useRouter();

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

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — Highlights with product mockups (like Fey s1)
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute right-0 top-0 w-[600px] h-[400px]"
          style={{ background: "radial-gradient(ellipse, rgba(255,161,108,0.05) 0%, transparent 70%)" }} />
        <div className="max-w-[1220px] mx-auto px-6">
          <ScrollReveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#FFA16C] mb-3">Highlights</p>
            <p className="text-[16px] text-[#868F97] max-w-[560px] leading-[1.6] mb-14">
              Quantamental turns complex data, grid-searched strategies, and noisy markets into instant trade theses — so you can stay informed without feeling overwhelmed.
            </p>
          </ScrollReveal>

          {/* Three product mockup cards */}
          <div className="grid grid-cols-3 gap-5">
            <ScrollReveal delay={0}>
              <div className="glass overflow-hidden group">
                <div className="h-[260px] relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(71,159,250,0.06) 0%, rgba(0,0,0,0) 60%)" }}>
                  {/* Fake stock chart mockup */}
                  <div className="absolute inset-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold">NVDA</span>
                      <span className="text-[10px] text-[#4EBE96]">+2.34%</span>
                    </div>
                    <svg viewBox="0 0 300 120" className="flex-1 w-full opacity-60">
                      <polyline fill="none" stroke="#479FFA" strokeWidth="1.5"
                        points="0,90 20,85 40,70 60,75 80,60 100,55 120,40 140,45 160,30 180,25 200,35 220,20 240,15 260,25 280,10 300,18" />
                      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#479FFA" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#479FFA" stopOpacity="0" />
                      </linearGradient>
                      <polygon fill="url(#chartFill)"
                        points="0,90 20,85 40,70 60,75 80,60 100,55 120,40 140,45 160,30 180,25 200,35 220,20 240,15 260,25 280,10 300,18 300,120 0,120" />
                    </svg>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-[14px] font-semibold mb-1">Beautiful stock pages</h3>
                  <p className="text-[13px] text-[#868F97]">Live charts, fundamentals, and AI thesis in one view.</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="glass overflow-hidden group">
                <div className="h-[260px] relative overflow-hidden p-5" style={{ background: "linear-gradient(135deg, rgba(78,190,150,0.05) 0%, rgba(0,0,0,0) 60%)" }}>
                  {/* Fake validation pipeline mockup */}
                  <div className="space-y-2">
                    <div className="rounded-lg p-3" style={{ background: "rgba(78,190,150,0.06)", border: "0.5px solid rgba(78,190,150,0.12)" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-[#4EBE96]">GO — NVDA</span>
                        <span className="text-[9px] text-[#868F97]">High</span>
                      </div>
                      <p className="text-[10px] text-[#868F97] mt-1 leading-relaxed">Strong momentum confirmed by AI. No fundamental red flags.</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "rgba(248,113,113,0.06)", border: "0.5px solid rgba(248,113,113,0.12)" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-[#f87171]">NO-GO — XOM</span>
                        <span className="text-[9px] text-[#868F97]">OPEC</span>
                      </div>
                      <p className="text-[10px] text-[#868F97] mt-1 leading-relaxed">Technical valid but OPEC+ risk flagged by AI.</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold">Pending — TSLA</span>
                        <span className="text-[9px] text-[#868F97]">Validating...</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-[14px] font-semibold mb-1">AI signal validation</h3>
                  <p className="text-[13px] text-[#868F97]">Every signal checked against news, events, and fundamentals.</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="glass overflow-hidden group">
                <div className="h-[260px] relative overflow-hidden p-5" style={{ background: "linear-gradient(135deg, rgba(255,161,108,0.05) 0%, rgba(0,0,0,0) 60%)" }}>
                  {/* Fake portfolio scan mockup */}
                  <div className="space-y-2">
                    {[
                      { ticker: "AAPL", action: "HOLD", color: "#4EBE96" },
                      { ticker: "NVDA", action: "HOLD", color: "#4EBE96" },
                      { ticker: "JPM", action: "WATCH", color: "#FFA16C" },
                      { ticker: "XOM", action: "EXIT", color: "#f87171" },
                    ].map((h) => (
                      <div key={h.ticker} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <span className="text-[11px] font-semibold">{h.ticker}</span>
                        <span className="text-[10px] font-semibold rounded-full px-2 py-0.5" style={{ color: h.color, background: `${h.color}15` }}>{h.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-[14px] font-semibold mb-1">Portfolio scanning</h3>
                  <p className="text-[13px] text-[#868F97]">AI scans your holdings and recommends HOLD, WATCH, or EXIT.</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — Full-bleed image section (like Fey's rock/person)
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80"
            alt="Trading visualization"
            width={1200}
            height={600}
            className="opacity-[0.3] object-cover"
            style={{ maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%)" }}
          />
        </div>
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(71,159,250,0.04) 0%, transparent 70%)" }} />

        <div className="max-w-[1220px] mx-auto px-6 text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-[48px] font-semibold leading-[1.08] tracking-tight mb-5"
              style={{
                background: "linear-gradient(180deg, #fff 20%, rgba(255,255,255,0.35) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              From overwhelming<br />to effortless.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <p className="text-[18px] text-[#868F97] max-w-[500px] mx-auto leading-[1.55]">
              Stop drowning in screeners, news feeds, and spreadsheets. One system, one thesis, one decision.
            </p>
          </ScrollReveal>

          {/* Icon row overlaid on image area like Fey */}
          <ScrollReveal delay={300}>
            <div className="relative z-10 mt-12">
              <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
                {[Briefcase, BarChart3, Brain, LineChart, Shield, TrendingUp, Search, Zap].map((Icon, i) => (
                  <div key={i} className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.08)]">
                    <Icon size={20} className="text-[#868F97]" strokeWidth={1.5} />
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — Split layout with image (like Fey's earnings)
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 w-[500px] h-[400px]"
          style={{ background: "radial-gradient(ellipse, rgba(255,161,108,0.06) 0%, transparent 70%)" }} />

        <div className="max-w-[1220px] mx-auto px-6 text-center">
          {/* Centered layout like Fey's "Earnings in real time" */}
          <ScrollReveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#868F97] mb-3">Learn more</p>
            <h2 className="text-[48px] font-semibold leading-[1.08] tracking-tight mb-5">
              <span style={{
                background: "linear-gradient(135deg, #FFA16C 0%, #f87171 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Signals</span> in real time.
            </h2>
            <p className="text-[16px] text-[#868F97] max-w-[520px] mx-auto leading-[1.6] mb-12">
              Your local Llama model monitors breaking news, earnings surprises, and geopolitical shifts — cross-referencing everything against your open positions and pending signals.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="relative max-w-[700px] mx-auto">
              {/* Dramatic image with orange backlight */}
              <div className="absolute inset-0 -inset-x-20"
                style={{ background: "radial-gradient(ellipse 60% 80% at 50% 40%, rgba(255,161,108,0.12) 0%, transparent 60%)" }} />
              <Image
                src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80"
                alt="Financial data analysis"
                width={700}
                height={420}
                className="relative z-10 rounded-2xl opacity-60 object-cover mx-auto"
                style={{
                  maskImage: "radial-gradient(ellipse 80% 80% at 50% 40%, black 30%, transparent 70%)",
                }}
              />
              {/* Floating notification overlays */}
              <div className="absolute z-20 bottom-12 left-1/2 -translate-x-1/2 w-[380px]">
                <div className="glass-sm p-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#4EBE96] animate-pulse shrink-0" />
                  <span className="text-[12px]"><strong>NVDA</strong> signal confirmed — GO with high confidence</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — Not just filters (screener reimagined)
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute right-0 top-1/3 translate-x-1/3 w-[500px] h-[400px]"
          style={{ background: "radial-gradient(ellipse, rgba(78,190,150,0.05) 0%, transparent 70%)" }} />

        <div className="max-w-[1220px] mx-auto px-6 text-center">
          <ScrollReveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#868F97] mb-3">Learn more</p>
            <h2 className="text-[52px] font-semibold leading-[1.08] tracking-tight mb-5">
              <span style={{
                background: "linear-gradient(135deg, #555 0%, #fff 35%, #555 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Screener reimagined.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="text-[16px] text-[#868F97] max-w-[520px] mx-auto leading-[1.6] mb-14">
              Discover stocks by typing exactly what you&apos;re looking for. No complicated filters. Your AI turns words into precise trade candidates.
            </p>
          </ScrollReveal>

          {/* Layered screener mockup like Fey s4 */}
          <ScrollReveal delay={200}>
            <div className="relative max-w-[800px] mx-auto">
              {/* Background ticker list (visible like Fey) */}
              <div className="absolute inset-0 flex flex-col justify-center gap-2 opacity-[0.25] pointer-events-none">
                {[
                  { t: "AAPL", n: "Apple Inc.", c: "#4EBE96" },
                  { t: "TSLA", n: "Tesla Inc.", c: "#f87171" },
                  { t: "GOOG", n: "Alphabet Inc.", c: "#4EBE96" },
                  { t: "NVDA", n: "NVIDIA Corp", c: "#4EBE96" },
                  { t: "AMZN", n: "Amazon.com", c: "#4EBE96" },
                  { t: "COST", n: "Costco Wholesale", c: "#f87171" },
                  { t: "MSFT", n: "Microsoft Corp", c: "#4EBE96" },
                  { t: "CRM", n: "Salesforce Inc.", c: "#4EBE96" },
                  { t: "SNAP", n: "Snap Inc.", c: "#f87171" },
                  { t: "SBUX", n: "Starbucks Corp", c: "#4EBE96" },
                ].map((s) => (
                  <div key={s.t} className="flex items-center gap-3 text-[14px] text-left pl-8">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.c }} />
                    <span className="font-semibold w-14">{s.t}</span>
                    <span className="text-[#868F97]">{s.n}</span>
                  </div>
                ))}
              </div>
              {/* Search overlay */}
              <div className="relative z-10 pt-10 pb-16">
                <div className="glass-sm p-4 max-w-[500px] mx-auto" style={{ boxShadow: "0 20px 60px -20px rgba(0,0,0,0.5)" }}>
                  <div className="flex items-center gap-2 text-[14px] text-[#868F97]">
                    <Search size={16} className="text-[#555]" />
                    <span>Undervalued tech stocks with a strong b<span className="animate-pulse">|</span></span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className="chip text-[11px]">Small-cap stocks with insider buying</span>
                    <span className="chip text-[11px]">Recovering from 52-week low</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

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
