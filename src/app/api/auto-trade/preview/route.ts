import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auto-trade/preview
 *
 * Shows what orders the auto-trade system WILL place on the next run,
 * WITHOUT actually executing them. This lets the user review before
 * confirming.
 *
 * Returns:
 * {
 *   pending_buys: [{ ticker, shares, price, size_pct, stop, tp, strategy, reason }],
 *   pending_exits: [{ ticker, shares, pnl_pct, exit_reason }],
 *   summary: { total_buys, total_exits, regime, scan_source }
 * }
 */

const FMP_KEY = process.env.FMP_API_KEY;

function getOptionalSupabase() {
  try {
    const { getSupabase } = require("@/lib/supabase");
    return getSupabase();
  } catch {
    return null;
  }
}

async function fetchPrice(ticker: string): Promise<number | null> {
  if (!FMP_KEY) return null;
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(ticker)}&apikey=${FMP_KEY}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.price ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const supabase = getOptionalSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  // Get user settings for sizing
  let startingBalance = 100_000;
  let maxPositionPct = 10;
  let stopLossPct = 10;
  let takeProfitPct = 25;
  try {
    const { data } = await supabase.from("user_settings").select("*").limit(1).maybeSingle();
    if (data) {
      startingBalance = data.starting_balance || startingBalance;
      maxPositionPct = data.max_position_pct || maxPositionPct;
      stopLossPct = data.stop_loss_pct || stopLossPct;
      takeProfitPct = data.take_profit_pct || takeProfitPct;
    }
  } catch {}

  // Get existing open positions
  const { data: existingTrades } = await supabase
    .from("paper_trades")
    .select("*")
    .eq("status", "open")
    .eq("mode", "auto");

  const openTickers = new Set(
    (existingTrades ?? []).map((t: any) => t.ticker)
  );

  // ── PREVIEW: what WOULD be bought ──
  let proposals: any[] = [];
  let scanSource = "none";
  let regime: any = null;

  try {
    const origin = req.nextUrl?.origin || "http://localhost:3000";
    const v2Res = await fetch(`${origin}/api/v2/daily-scan`, {
      signal: AbortSignal.timeout(30000),
    });
    if (v2Res.ok) {
      const v2Data = await v2Res.json();
      proposals = v2Data.proposals || [];
      regime = v2Data.regime;
      scanSource = v2Data.source || "v2";
    }
  } catch {}

  // Build pending buys list
  const pendingBuys: any[] = [];
  let currentOpen = openTickers.size;

  for (const p of proposals) {
    if (currentOpen >= 15) break;
    if (openTickers.has(p.ticker)) continue;

    const price = await fetchPrice(p.ticker);
    if (price === null) continue;

    const sizePct = p.final_pct
      ? Math.min(p.final_pct, maxPositionPct / 100)
      : maxPositionPct / 100;
    const positionValue = startingBalance * sizePct;
    const shares = Math.floor(positionValue / price);
    if (shares <= 0) continue;

    const sl = p.stop_loss ? Math.round(p.stop_loss * 100 * 10) / 10 : stopLossPct;
    const tp = p.take_profit ? Math.round(p.take_profit * 100 * 10) / 10 : takeProfitPct;

    pendingBuys.push({
      ticker: p.ticker,
      strategy: p.strategy || "v2_proposal",
      price: Math.round(price * 100) / 100,
      shares,
      position_value: Math.round(positionValue),
      size_pct: Math.round(sizePct * 1000) / 10,
      stop_loss_pct: sl,
      take_profit_pct: tp,
      sector: p.sector || "—",
      sector_leader: p.sector_leader || false,
      confluence: p.confluence || false,
      delay_entry: p.delay_entry || false,
      delay_reason: p.delay_reason || null,
      execute_after: p.execute_after || "09:45 ET",
      reasoning: p.reasoning || p.execution_note || "",
    });

    currentOpen++;
  }

  // ── PREVIEW: what WOULD be sold ──
  const pendingExits: any[] = [];
  if (existingTrades) {
    for (const trade of existingTrades) {
      const currentPrice = await fetchPrice(trade.ticker);
      if (currentPrice === null) continue;

      const pnlPct =
        trade.direction === "SHORT"
          ? ((trade.entry_price - currentPrice) / trade.entry_price) * 100
          : ((currentPrice - trade.entry_price) / trade.entry_price) * 100;

      const tradeStopLoss = trade.stop_loss_pct || stopLossPct;
      const tradeTakeProfit = trade.take_profit_pct || takeProfitPct;

      const hitStop = pnlPct <= -tradeStopLoss;
      const hitTP = pnlPct >= tradeTakeProfit;

      // Time-stop check: 21+ days held and < 3% gain = will auto-close
      const entryDate = new Date(trade.entry_date || trade.created_at);
      const daysHeld = Math.floor((Date.now() - entryDate.getTime()) / 86400000);
      const hitTimeStop = daysHeld >= 21 && pnlPct < 3;

      if (hitStop || hitTP || hitTimeStop) {
        pendingExits.push({
          ticker: trade.ticker,
          shares: trade.shares,
          entry_price: trade.entry_price,
          current_price: Math.round(currentPrice * 100) / 100,
          pnl_pct: Math.round(pnlPct * 10) / 10,
          days_held: daysHeld,
          exit_reason: hitStop ? "stop_loss" : hitTP ? "take_profit" : "time_stop (flat 21+ days)",
          strategy: trade.strategy || "unknown",
          scaled_out: trade.scaled_out || false,
        });
      }
    }
  }

  return NextResponse.json({
    pending_buys: pendingBuys,
    pending_exits: pendingExits,
    existing_open: existingTrades?.length || 0,
    summary: {
      total_buys: pendingBuys.length,
      total_exits: pendingExits.length,
      regime: regime?.name || "unknown",
      scan_source: scanSource,
      generated_at: new Date().toISOString(),
    },
  });
}
