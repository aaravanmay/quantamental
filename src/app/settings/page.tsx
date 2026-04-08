"use client";

import { useState } from "react";
import { useSettings, useUpdateSettings } from "@/lib/settings-context";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Save, Monitor, Clock, DollarSign, Wifi, Database, Brain } from "lucide-react";

const gradientText = {
  background: "linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
} as const;

type Timeframe = "day" | "swing" | "longterm";

const TIMEFRAMES: { key: Timeframe; label: string; desc: string; hold: string }[] = [
  { key: "day", label: "Day Trade", desc: "Intraday momentum plays executed every minute", hold: "Minutes to hours" },
  { key: "swing", label: "Swing Trade", desc: "Medium-term technical + fundamental analysis", hold: "4-5 months" },
  { key: "longterm", label: "Long-Term", desc: "Value investing with macro thesis", hold: "~1 year" },
];

export default function SettingsPage() {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();

  const [timeframe, setTimeframe] = useState<Timeframe>(settings.timeframe);
  const [startingBalance, setStartingBalance] = useState(String(settings.startingBalance));
  const [autoMode, setAutoMode] = useState(settings.autoMode);
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaUrl);
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel);
  const [finnhubKey, setFinnhubKey] = useState("");
  const [fmpKey, setFmpKey] = useState("");
  const [perplexityKey, setPerplexityKey] = useState("");
  const [dataRefreshInterval, setDataRefreshInterval] = useState(String(settings.dataRefreshMin));
  const [stopLoss, setStopLoss] = useState(String(settings.stopLossPct));
  const [takeProfit, setTakeProfit] = useState(String(settings.takeProfitPct));
  const [maxPositionSize, setMaxPositionSize] = useState(String(settings.maxPositionPct));

  function handleSave() {
    updateSettings({
      timeframe,
      autoMode,
      startingBalance: Number(startingBalance),
      stopLossPct: Number(stopLoss),
      takeProfitPct: Number(takeProfit),
      maxPositionPct: Number(maxPositionSize),
      dataRefreshMin: Number(dataRefreshInterval),
      ollamaUrl,
      ollamaModel,
    });
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 w-[600px] h-[400px]"
        style={{ background: "radial-gradient(ellipse, rgba(71,159,250,0.05) 0%, transparent 70%)" }} />

      <div className="max-w-[1220px] mx-auto px-6 py-8">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-10 flex items-center justify-between">
            <h1 className="text-[32px] font-semibold tracking-tight" style={gradientText}>
              Settings
            </h1>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(71,159,250,0.12)",
                border: "1px solid rgba(71,159,250,0.2)",
              }}
            >
              <Save size={14} />
              Save Settings
            </button>
          </div>
        </ScrollReveal>

        {/* ═══ Trading Timeframe ═══ */}
        <ScrollReveal delay={50}>
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-[#479FFA]" />
              <h2 className="text-[18px] font-semibold">Trading Timeframe</h2>
            </div>
            <p className="text-[13px] text-[#868F97] mb-5">
              Select your default trading strategy timeframe. This affects signal generation, validation prompts, and exit rules.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  className="glass text-left p-5 transition-all"
                  style={{
                    borderColor: timeframe === tf.key ? "rgba(71,159,250,0.3)" : undefined,
                    background: timeframe === tf.key ? "rgba(71,159,250,0.06)" : undefined,
                    boxShadow: timeframe === tf.key ? "0 0 40px -10px rgba(71,159,250,0.15)" : undefined,
                  }}
                >
                  <div className="text-[14px] font-semibold mb-1">{tf.label}</div>
                  <div className="text-[12px] text-[#868F97] mb-2">{tf.desc}</div>
                  <div className="text-[11px] text-[#555]">Hold period: {tf.hold}</div>
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ═══ Paper Trading Settings ═══ */}
        <ScrollReveal delay={100}>
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-[#4EBE96]" />
              <h2 className="text-[18px] font-semibold">Paper Trading</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SettingCard label="Starting Balance" desc="Initial paper trading capital">
                <div className="flex items-center gap-1">
                  <span className="text-[#555]">$</span>
                  <input value={startingBalance} onChange={(e) => setStartingBalance(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-sm font-mono tabular-nums text-white placeholder:text-[#555]"
                    type="number" />
                </div>
              </SettingCard>
              <SettingCard label="Auto Mode" desc="Automatically execute GO signals">
                <button
                  onClick={() => setAutoMode(!autoMode)}
                  className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
                  style={{
                    background: autoMode ? "rgba(78,190,150,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${autoMode ? "rgba(78,190,150,0.2)" : "rgba(255,255,255,0.08)"}`,
                    color: autoMode ? "#4EBE96" : "#868F97",
                  }}
                >
                  {autoMode ? "Enabled" : "Disabled"}
                </button>
              </SettingCard>
              <SettingCard label="Stop Loss %" desc="Auto-exit when loss exceeds this threshold">
                <div className="flex items-center gap-1">
                  <input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-sm font-mono text-white" type="number" />
                  <span className="text-[#555]">%</span>
                </div>
              </SettingCard>
              <SettingCard label="Take Profit %" desc="Auto-exit when profit exceeds this threshold">
                <div className="flex items-center gap-1">
                  <input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-sm font-mono text-white" type="number" />
                  <span className="text-[#555]">%</span>
                </div>
              </SettingCard>
              <SettingCard label="Max Position Size %" desc="Maximum portfolio allocation per trade">
                <div className="flex items-center gap-1">
                  <input value={maxPositionSize} onChange={(e) => setMaxPositionSize(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-sm font-mono text-white" type="number" />
                  <span className="text-[#555]">%</span>
                </div>
              </SettingCard>
              <SettingCard label="Data Refresh" desc="How often to refresh live market data">
                <div className="flex items-center gap-1">
                  <input value={dataRefreshInterval} onChange={(e) => setDataRefreshInterval(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-sm font-mono text-white" type="number" />
                  <span className="text-[#555]">min</span>
                </div>
              </SettingCard>
            </div>
          </div>
        </ScrollReveal>

        {/* ═══ AI / Ollama Settings ═══ */}
        <ScrollReveal delay={150}>
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-[#FFA16C]" />
              <h2 className="text-[18px] font-semibold">AI Model (Local Llama)</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SettingCard label="Ollama URL" desc="Your PC's Ollama server address">
                <input value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-sm font-mono text-white placeholder:text-[#555]"
                  placeholder="http://localhost:11434" />
              </SettingCard>
              <SettingCard label="Model Name" desc="Ollama model to use for validation">
                <input value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-sm font-mono text-white placeholder:text-[#555]"
                  placeholder="quantamental" />
              </SettingCard>
            </div>
          </div>
        </ScrollReveal>

        {/* ═══ API Keys ═══ */}
        <ScrollReveal delay={200}>
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Wifi size={16} className="text-[#479FFA]" />
              <h2 className="text-[18px] font-semibold">API Keys</h2>
            </div>
            <p className="text-[13px] text-[#868F97] mb-5">
              Keys are stored locally and never sent to external servers. Used for real-time market data and news.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <SettingCard label="Finnhub API Key" desc="Free tier: 60 requests/min — used for company news and market data">
                <input value={finnhubKey} onChange={(e) => setFinnhubKey(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-sm font-mono text-white placeholder:text-[#555]"
                  placeholder="Enter your Finnhub API key" type="password" />
              </SettingCard>
              <SettingCard label="FMP API Key" desc="Free tier: 250 requests/day — used for fundamentals, balance sheets, insider trades">
                <input value={fmpKey} onChange={(e) => setFmpKey(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-sm font-mono text-white placeholder:text-[#555]"
                  placeholder="Enter your FMP API key" type="password" />
              </SettingCard>
              <SettingCard label="Perplexity API Key (Optional)" desc="~$0.001/request — used for deep AI-powered web search on current events">
                <input value={perplexityKey} onChange={(e) => setPerplexityKey(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-sm font-mono text-white placeholder:text-[#555]"
                  placeholder="Optional — skip for free mode" type="password" />
              </SettingCard>
            </div>
          </div>
        </ScrollReveal>

        {/* ═══ System Status ═══ */}
        <ScrollReveal delay={250}>
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Monitor size={16} className="text-[#868F97]" />
              <h2 className="text-[18px] font-semibold">System Status</h2>
            </div>
            <div className="glass p-5" style={{ boxShadow: "0 0 60px -20px rgba(71,159,250,0.06), 0 20px 40px -20px rgba(0,0,0,0.3)" }}>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatusItem label="Ollama" status={ollamaUrl ? "configured" : "not set"} ok={!!ollamaUrl} />
                <StatusItem label="Finnhub" status={finnhubKey ? "configured" : "not set"} ok={!!finnhubKey} />
                <StatusItem label="FMP" status={fmpKey ? "configured" : "not set"} ok={!!fmpKey} />
                <StatusItem label="Perplexity" status={perplexityKey ? "configured" : "optional"} ok={!!perplexityKey} />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ═══ Data & Storage ═══ */}
        <ScrollReveal delay={300}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Database size={16} className="text-[#868F97]" />
              <h2 className="text-[18px] font-semibold">Data & Storage</h2>
            </div>
            <div className="glass p-5" style={{ boxShadow: "0 0 60px -20px rgba(71,159,250,0.06), 0 20px 40px -20px rgba(0,0,0,0.3)" }}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#555] mb-1">Supabase</div>
                  <div className="text-[13px] text-[#868F97]">Connected via environment variables</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#555] mb-1">Cache</div>
                  <div className="text-[13px] text-[#868F97]">SQLite on PC — auto-expires stale data</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

function SettingCard({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="glass p-4">
      <div className="text-[13px] font-medium text-white mb-0.5">{label}</div>
      <div className="text-[11px] text-[#555] mb-3">{desc}</div>
      {children}
    </div>
  );
}

function StatusItem({ label, status, ok }: { label: string; status: string; ok: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${ok ? "bg-[#4EBE96]" : "bg-[#555]"}`} />
        <span className="text-[13px] font-medium text-white">{label}</span>
      </div>
      <span className="ml-4 text-[11px] text-[#868F97]">{status}</span>
    </div>
  );
}
