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

// GET /api/v2/daily-scan
// Returns the most recent persisted daily scan with full regime + rotation
// + proposals + reasoning. Three layers of fallback:
//   1. PC validation server (canonical source if Tailscale up)
//   2. Supabase `daily_scans` table (persisted by daily_scan_persister.py)
//   3. Live recompute via /api/v2/proposals (always works but slower)
export async function GET(req: NextRequest) {
  // 1. Try PC pipeline
  try {
    const res = await fetch(`${PC_URL}/proposals?limit=15`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, source: "pc" });
    }
  } catch {
    /* PC offline */
  }

  // 2. Try Supabase persisted scan
  const supabase = getOptionalSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("daily_scans")
        .select("*")
        .order("scan_date", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        const scan = data[0];
        return NextResponse.json({
          regime: scan.regime,
          rotation: scan.rotation,
          proposals: scan.proposals || [],
          vetoed: scan.vetoed || [],
          halted: scan.halted || false,
          scan_date: scan.scan_date,
          generated_at: scan.generated_at,
          source: "supabase",
        });
      }
    } catch {
      /* table may not exist yet */
    }
  }

  // 3. Live fallback — call the existing /api/v2/proposals route
  try {
    const origin = req.nextUrl.origin;
    const res = await fetch(`${origin}/api/v2/proposals?limit=15`, {
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, source: "live" });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "All scan sources failed" },
      { status: 503 }
    );
  }

  return NextResponse.json({ error: "no scan available" }, { status: 503 });
}
