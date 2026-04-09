import { NextRequest, NextResponse } from "next/server";

function getOptionalSupabase() {
  try {
    const { getSupabase } = require("@/lib/supabase");
    return getSupabase();
  } catch {
    return null;
  }
}

// GET: List watchlist
export async function GET() {
  const supabase = getOptionalSupabase();
  if (!supabase) return NextResponse.json({ items: [] });

  const { data } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", "default")
    .order("added_date", { ascending: false });

  return NextResponse.json({ items: data || [] });
}

// POST: Add to watchlist
export async function POST(req: NextRequest) {
  const { ticker } = await req.json();
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  const supabase = getOptionalSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await supabase
    .from("watchlist")
    .upsert({ user_id: "default", ticker: ticker.toUpperCase() }, { onConflict: "user_id,ticker" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// DELETE: Remove from watchlist
export async function DELETE(req: NextRequest) {
  const { ticker } = await req.json();
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  const supabase = getOptionalSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", "default")
    .eq("ticker", ticker.toUpperCase());

  return NextResponse.json({ removed: ticker.toUpperCase() });
}
