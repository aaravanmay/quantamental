import { NextRequest, NextResponse } from "next/server";

const PC_URL = process.env.PC_VALIDATION_URL || "http://localhost:8000";

// Lightweight regime detector that runs in the Edge — uses public Yahoo data.
// Falls back to PC if reachable for the canonical version.

type Regime = {
  name: "STRONG_BULL" | "WEAK_BULL" | "SIDEWAYS" | "WEAK_BEAR" | "CRASH";
  description: string;
  confidence: number;
  spy_price: number;
  vix: number;
  spy_above_200sma: boolean;
  spy_above_50sma: boolean;
  spy_30d_drawdown: number;
  risk_multiplier: number;
  favored_strategies: string[];
  detected_at: string;
};

const REGIME_INFO: Record<string, { description: string; risk_multiplier: number; favored: string[] }> = {
  STRONG_BULL: {
    description: "Risk-on. Trend-following dominates.",
    risk_multiplier: 1.0,
    favored: ["ema", "donch", "vol", "roc", "adx", "ema_rsi", "macd_vol", "triple", "brk_conf"],
  },
  WEAK_BULL: {
    description: "Choppy uptrend. Mean reversion + momentum mix.",
    risk_multiplier: 0.75,
    favored: ["ema", "rsi", "macd", "ema_rsi", "macd_vol", "stoch"],
  },
  SIDEWAYS: {
    description: "No trend. Mean reversion only.",
    risk_multiplier: 0.5,
    favored: ["rsi", "bb", "stoch", "bb_rsi"],
  },
  WEAK_BEAR: {
    description: "Downtrend. Reduce exposure, short opportunities.",
    risk_multiplier: 0.25,
    favored: ["rsi"],
  },
  CRASH: {
    description: "Extreme volatility. Cash is king. No new positions.",
    risk_multiplier: 0,
    favored: [],
  },
};

async function fetchYahooHistory(ticker: string, period = "1y"): Promise<number[]> {
  try {
    const range = period === "3mo" ? "3mo" : "1y";
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=1d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        next: { revalidate: 600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    return closes.filter((x: any) => x != null);
  } catch {
    return [];
  }
}

function sma(arr: number[], period: number): number {
  if (arr.length < period) return 0;
  const slice = arr.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function detectRegime(spyCloses: number[], vix: number): Regime {
  const spyPrice = spyCloses[spyCloses.length - 1] || 0;
  const sma200 = sma(spyCloses, 200);
  const sma50 = sma(spyCloses, 50);
  const above200 = spyPrice > sma200;
  const above50 = spyPrice > sma50;

  const last30 = spyCloses.slice(-30);
  const max30 = Math.max(...last30);
  const drawdown30 = max30 > 0 ? (max30 - spyPrice) / max30 : 0;

  let name: Regime["name"];
  let confidence: number;

  if (vix > 35 || drawdown30 > 0.1) {
    name = "CRASH";
    confidence = Math.min(1, Math.max(vix / 50, drawdown30 / 0.15));
  } else if (!above200 && vix > 25) {
    name = "WEAK_BEAR";
    confidence = 0.75;
  } else if (above200 && above50 && vix < 20) {
    name = "STRONG_BULL";
    confidence = 0.9;
  } else if (above200 && vix < 25) {
    name = "WEAK_BULL";
    confidence = 0.7;
  } else {
    name = "SIDEWAYS";
    confidence = 0.6;
  }

  const info = REGIME_INFO[name];
  return {
    name,
    description: info.description,
    confidence: Math.round(confidence * 100) / 100,
    spy_price: Math.round(spyPrice * 100) / 100,
    vix: Math.round(vix * 100) / 100,
    spy_above_200sma: above200,
    spy_above_50sma: above50,
    spy_30d_drawdown: Math.round(drawdown30 * 10000) / 10000,
    risk_multiplier: info.risk_multiplier,
    favored_strategies: info.favored,
    detected_at: new Date().toISOString(),
  };
}

export async function GET(_req: NextRequest) {
  // Try the PC first for canonical regime
  try {
    const res = await fetch(`${PC_URL}/regime`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    /* PC unavailable, continue with edge fallback */
  }

  // Edge fallback
  try {
    const [spyCloses, vixCloses] = await Promise.all([
      fetchYahooHistory("SPY", "1y"),
      fetchYahooHistory("^VIX", "3mo"),
    ]);

    if (spyCloses.length < 200) {
      return NextResponse.json({
        error: "Insufficient SPY data",
        name: "WEAK_BULL",
        confidence: 0,
        favored_strategies: REGIME_INFO.WEAK_BULL.favored,
        risk_multiplier: 0.5,
      });
    }

    const vix = vixCloses[vixCloses.length - 1] || 20;
    const regime = detectRegime(spyCloses, vix);
    return NextResponse.json(regime);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Regime detection failed" },
      { status: 500 }
    );
  }
}
