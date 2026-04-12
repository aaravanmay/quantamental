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

// GET /api/v2/attribution?days=30
// Returns performance attribution by strategy / sector / regime.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");

  // Try PC first
  try {
    const res = await fetch(`${PC_URL}/attribution?days=${days}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return NextResponse.json(await res.json());
  } catch {
    /* fall through */
  }

  // Fallback: derive from paper_trades in Supabase
  const supabase = getOptionalSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "no data source available" }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - days * 86400 * 1000).toISOString();

  const { data: trades } = await supabase
    .from("paper_trades")
    .select("*")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false });

  if (!trades || trades.length === 0) {
    return NextResponse.json({
      overall: { trades: 0 },
      strategies: {},
      sectors: {},
      regimes: {},
      lookback_days: days,
      computed_at: new Date().toISOString(),
    });
  }

  const closed = trades.filter((t: any) => t.pnl != null);

  const aggregate = (group: any[]) => {
    const wins = group.filter((t: any) => (t.pnl || 0) > 0);
    const losses = group.filter((t: any) => (t.pnl || 0) <= 0);
    const totalPnl = group.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
    const grossProfit = wins.reduce((s: number, t: any) => s + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((s: number, t: any) => s + (t.pnl || 0), 0));
    return {
      trades: group.length,
      win_rate: group.length > 0 ? wins.length / group.length : 0,
      total_pnl: Math.round(totalPnl * 100) / 100,
      profit_factor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : 0,
    };
  };

  const overall = aggregate(closed);

  const strategies: Record<string, any> = {};
  for (const t of closed) {
    const k = t.strategy || "unknown";
    if (!strategies[k]) strategies[k] = [];
    strategies[k].push(t);
  }
  const strategiesAgg: Record<string, any> = {};
  for (const [k, v] of Object.entries(strategies)) {
    strategiesAgg[k] = aggregate(v as any[]);
  }

  return NextResponse.json({
    overall,
    strategies: strategiesAgg,
    sectors: {},
    regimes: {},
    lookback_days: days,
    computed_at: new Date().toISOString(),
    source: "supabase fallback",
  });
}
