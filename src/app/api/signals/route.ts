import { NextRequest, NextResponse } from "next/server";

function getOptionalSupabase() {
  try {
    const { getSupabase } = require("@/lib/supabase");
    return getSupabase();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // "go" for fired, "pending" for backtested only
  const limit = parseInt(searchParams.get("limit") || "100");

  const supabase = getOptionalSupabase();
  if (!supabase) return NextResponse.json([]);

  let query = supabase
    .from("trade_signals")
    .select("*")
    .order("sharpe", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("validation_status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduplicate — same strategy+ticker keep highest Sharpe
  const seen = new Set<string>();
  const unique: any[] = [];
  for (const s of data || []) {
    const key = `${s.ticker}-${s.strategy}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(s);
  }

  return NextResponse.json(unique);
}
