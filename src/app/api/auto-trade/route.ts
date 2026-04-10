import { NextRequest, NextResponse } from "next/server";

// ── Types ───────────────────────────────────────────────────────────────────

interface UserSettings {
  auto_mode: boolean;
  stop_loss_pct: number;
  take_profit_pct: number;
  max_position_pct: number;
  starting_balance: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  auto_mode: false,
  stop_loss_pct: 10,
  take_profit_pct: 25,
  max_position_pct: 10,
  starting_balance: 100_000,
};

// ── Supabase (optional) ─────────────────────────────────────────────────────

function getOptionalSupabase() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getSupabase } = require("@/lib/supabase");
    return getSupabase();
  } catch {
    return null;
  }
}

// ── FMP price fetch ─────────────────────────────────────────────────────────

const FMP_KEY = process.env.FMP_API_KEY;

async function fetchPrice(ticker: string): Promise<number | null> {
  if (!FMP_KEY) return null;
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(ticker)}&apikey=${FMP_KEY}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.price ?? null;
  } catch {
    return null;
  }
}

// ── POST/GET /api/auto-trade ───────────────────────────────────────────────
// GET is for Vercel Cron, POST is for manual triggers from the dashboard

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(_req: NextRequest) {
  const supabase = getOptionalSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured — auto-trade requires a database." },
      { status: 503 },
    );
  }

  // 1. Fetch user settings
  let settings: UserSettings = DEFAULT_SETTINGS;
  try {
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) {
      settings = { ...DEFAULT_SETTINGS, ...data };
    }
  } catch {
    // Use defaults
  }

  // 2. Check auto-mode
  if (!settings.auto_mode) {
    return NextResponse.json({ skipped: true, reason: "auto mode disabled" });
  }

  let tradesOpened = 0;
  let tradesClosed = 0;

  // ── Open new trades for GO signals ──────────────────────────────────────

  try {
    // 3. Fetch all GO signals
    const { data: goSignals } = await supabase
      .from("trade_signals")
      .select("*")
      .eq("validation_status", "go");

    if (goSignals && goSignals.length > 0) {
      // 4. Fetch existing open paper trades to avoid duplicates
      const { data: existingTrades } = await supabase
        .from("paper_trades")
        .select("ticker")
        .eq("status", "open")
        .eq("mode", "auto");

      const openTickers = new Set(
        (existingTrades ?? []).map((t: { ticker: string }) => t.ticker),
      );

      // 5. Open new trades for signals without an existing paper trade
      for (const signal of goSignals) {
        if (openTickers.has(signal.ticker)) continue;

        const price = await fetchPrice(signal.ticker);
        if (price === null) continue; // skip if FMP fails for this ticker

        // Calculate shares based on max position size
        const positionValue =
          settings.starting_balance * (settings.max_position_pct / 100);
        const shares = Math.floor(positionValue / price);
        if (shares <= 0) continue;

        const { error } = await supabase.from("paper_trades").insert({
          ticker: signal.ticker,
          direction: signal.direction ?? "LONG",
          entry_price: price,
          entry_date: new Date().toISOString(),
          shares,
          mode: "auto",
          status: "open",
          thesis_id: signal.id,
        });

        if (!error) tradesOpened++;
      }
    }
  } catch {
    // Non-fatal — continue to check open trades
  }

  // ── Check exit rules on open trades ─────────────────────────────────────

  try {
    const { data: openTrades } = await supabase
      .from("paper_trades")
      .select("*")
      .eq("status", "open");

    if (openTrades && openTrades.length > 0) {
      for (const trade of openTrades) {
        const currentPrice = await fetchPrice(trade.ticker);
        if (currentPrice === null) continue;

        // Calculate P&L %
        const pnlPct =
          trade.direction === "SHORT"
            ? ((trade.entry_price - currentPrice) / trade.entry_price) * 100
            : ((currentPrice - trade.entry_price) / trade.entry_price) * 100;

        // Check stop-loss and take-profit
        const hitStopLoss = pnlPct <= -settings.stop_loss_pct;
        const hitTakeProfit = pnlPct >= settings.take_profit_pct;

        if (hitStopLoss || hitTakeProfit) {
          // Close the trade
          const { error } = await supabase
            .from("paper_trades")
            .update({
              status: "closed",
              exit_price: currentPrice,
              exit_date: new Date().toISOString(),
              pnl_pct: Math.round(pnlPct * 100) / 100,
            })
            .eq("id", trade.id);

          if (!error) tradesClosed++;
        } else {
          // Update current P&L on the record
          await supabase
            .from("paper_trades")
            .update({ pnl_pct: Math.round(pnlPct * 100) / 100 })
            .eq("id", trade.id);
        }
      }
    }
  } catch {
    // Non-fatal
  }

  // ── Summary ─────────────────────────────────────────────────────────────

  // Get final count of open trades
  let totalOpen = 0;
  try {
    const { count } = await supabase
      .from("paper_trades")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");
    totalOpen = count ?? 0;
  } catch {
    // ignore
  }

  return NextResponse.json({
    trades_opened: tradesOpened,
    trades_closed: tradesClosed,
    total_open: totalOpen,
  });
}
