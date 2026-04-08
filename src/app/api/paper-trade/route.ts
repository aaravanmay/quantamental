import { NextRequest, NextResponse } from "next/server";

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

// ── POST: Create a new paper trade ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticker, direction, shares, price, mode, thesis_id } = body;

    if (!ticker || !direction || !shares || !price) {
      return NextResponse.json(
        { error: "Missing required fields: ticker, direction, shares, price" },
        { status: 400 }
      );
    }

    const supabase = getOptionalSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("paper_trades")
        .insert({
          user_id: "default",
          ticker: ticker.toUpperCase(),
          direction,
          shares,
          entry_price: price,
          status: "open",
          mode: mode || "manual",
          thesis_id: thesis_id || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        trade: data,
        message: `Opened ${direction} position: ${shares} shares of ${ticker} @ $${price}`,
      });
    }

    // Fallback: no Supabase
    return NextResponse.json({
      trade: {
        id: crypto.randomUUID(),
        ticker: ticker.toUpperCase(),
        direction,
        shares,
        entry_price: price,
        status: "open",
        mode: mode || "manual",
        entry_date: new Date().toISOString().split("T")[0],
      },
      message: `Opened ${direction} position: ${shares} shares of ${ticker} @ $${price} (not persisted — Supabase not configured)`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ── PATCH: Close a paper trade ──────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, exit_price } = body;

    if (!id || exit_price == null) {
      return NextResponse.json(
        { error: "Missing required fields: id, exit_price" },
        { status: 400 }
      );
    }

    const supabase = getOptionalSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from("paper_trades")
        .update({
          exit_price,
          exit_date: new Date().toISOString().split("T")[0],
          status: "closed",
        })
        .eq("id", id)
        .eq("status", "open")
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json(
          { error: "Trade not found or already closed" },
          { status: 404 }
        );
      }

      const pnl =
        data.direction === "LONG"
          ? (exit_price - data.entry_price) * data.shares
          : (data.entry_price - exit_price) * data.shares;

      return NextResponse.json({
        trade: data,
        pnl,
        message: `Closed ${data.ticker} @ $${exit_price} — P&L: $${pnl.toFixed(2)}`,
      });
    }

    return NextResponse.json({
      error: "Supabase not configured — cannot close trades",
    }, { status: 500 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ── GET: List paper trades ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "open", "closed", or null for all

    const supabase = getOptionalSupabase();

    if (supabase) {
      let query = supabase
        .from("paper_trades")
        .select("*")
        .eq("user_id", "default")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ trades: data || [] });
    }

    return NextResponse.json({ trades: [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
