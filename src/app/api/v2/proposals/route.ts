import { NextRequest, NextResponse } from "next/server";

const PC_URL = process.env.PC_VALIDATION_URL || "http://localhost:8000";

function getOptionalSupabase() {
  try {
    const { getSupabase } = require("@/lib/supabase");
    return getSupabase();
  } catch {
    return null;
  }
}

// GET /api/v2/proposals — returns the most recent daily-scan proposals.
// Tries the PC pipeline first, then falls back to a derived list from
// stored Supabase signals + the live regime endpoint.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  // Try PC pipeline first
  try {
    const res = await fetch(`${PC_URL}/proposals?limit=${limit}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch {
    /* PC offline → fallback */
  }

  // Fallback: synthesize from Supabase signals + edge regime
  const supabase = getOptionalSupabase();
  if (!supabase) return NextResponse.json({ proposals: [], regime: null });

  // Pull regime
  let regime: any = null;
  try {
    const origin = req.nextUrl.origin;
    const r = await fetch(`${origin}/api/v2/regime`, { signal: AbortSignal.timeout(8000) });
    if (r.ok) regime = await r.json();
  } catch {
    /* ignore */
  }

  const favored: string[] = regime?.favored_strategies || [];
  const riskMult: number = regime?.risk_multiplier ?? 0.5;

  // Top signals from Supabase
  const { data: signals } = await supabase
    .from("trade_signals")
    .select("*")
    .order("sharpe", { ascending: false })
    .limit(50);

  if (!signals) return NextResponse.json({ proposals: [], regime });

  // Helper: extract bare strategy type from params_json (e.g. "ema_rsi")
  // The trade_signals.strategy column is the parameterized name like
  // "EMA100+RSI<40" — useless for regime filtering. The bare type lives
  // inside params_json.t.
  const extractStrategyType = (s: any): string | null => {
    let params: any = s.params_json || s.params || {};
    if (typeof params === "string") {
      try { params = JSON.parse(params); } catch { params = {}; }
    }
    return params?.t || params?.type || null;
  };

  // Filter by regime + dedupe by ticker (keep highest Sharpe per ticker)
  const seen = new Set<string>();
  const proposals: any[] = [];
  for (const s of signals) {
    const stratType = extractStrategyType(s);
    if (favored.length > 0 && stratType && !favored.includes(stratType)) continue;
    if (seen.has(s.ticker)) continue;
    seen.add(s.ticker);

    const sharpe = parseFloat(s.sharpe || 0);
    const winRate = parseFloat(s.win_rate || 0.5);
    // Quick Kelly approximation
    const kellyApprox = Math.min(0.2, (sharpe * sharpe) / 50);
    const finalPct = Math.min(0.2, kellyApprox * riskMult);

    proposals.push({
      ticker: s.ticker,
      strategy: s.strategy,
      strategy_type: stratType,
      sharpe,
      win_rate: winRate,
      final_pct: Math.round(finalPct * 10000) / 10000,
      stop_loss: 0.08,
      take_profit: 0.16,
      reasoning: `Regime ${regime?.name || "unknown"} (${(riskMult * 100).toFixed(0)}% sizing) | Sharpe ${sharpe.toFixed(2)}`,
    });

    if (proposals.length >= limit) break;
  }

  return NextResponse.json({
    proposals,
    regime,
    source: "fallback (PC offline)",
    generated_at: new Date().toISOString(),
  });
}
