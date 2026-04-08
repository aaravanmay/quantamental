import { NextRequest, NextResponse } from "next/server";

// ── Supabase (required for this endpoint) ──────────────────────────────────

function getSupabaseClient() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getSupabase } = require("@/lib/supabase");
    return getSupabase();
  } catch {
    return null;
  }
}

// ── Constants ──────────────────────────────────────────────────────────────

/** Maximum age (ms) for a thesis to be considered fresh enough for approval. */
const THESIS_STALENESS_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── POST /api/approve-trade ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { approved: false, reason: "Supabase not configured." },
      { status: 503 },
    );
  }

  // ── 1. Parse and validate request body ─────────────────────────────────

  let body: {
    ticker?: string;
    direction?: string;
    shares?: number;
    thesis_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { approved: false, reason: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { ticker, direction, shares, thesis_id } = body;

  if (!ticker || typeof ticker !== "string") {
    return NextResponse.json(
      { approved: false, reason: "Missing or invalid 'ticker'." },
      { status: 400 },
    );
  }

  if (!direction || !["LONG", "SHORT"].includes(direction)) {
    return NextResponse.json(
      { approved: false, reason: "Missing or invalid 'direction'. Must be 'LONG' or 'SHORT'." },
      { status: 400 },
    );
  }

  if (shares === undefined || shares === null || typeof shares !== "number" || shares <= 0) {
    return NextResponse.json(
      { approved: false, reason: "Missing or invalid 'shares'. Must be a positive number." },
      { status: 400 },
    );
  }

  if (!thesis_id || typeof thesis_id !== "string") {
    return NextResponse.json(
      { approved: false, reason: "Missing or invalid 'thesis_id'." },
      { status: 400 },
    );
  }

  // ── 2. Verify thesis exists and has GO recommendation ──────────────────

  const { data: thesis, error: thesisError } = await supabase
    .from("theses")
    .select("id, ticker, recommendation, confidence, synthesis_json, created_at")
    .eq("id", thesis_id)
    .maybeSingle();

  if (thesisError) {
    return NextResponse.json(
      { approved: false, reason: `Database error looking up thesis: ${thesisError.message}` },
      { status: 500 },
    );
  }

  if (!thesis) {
    return NextResponse.json(
      { approved: false, reason: `No thesis found with id '${thesis_id}'.` },
      { status: 404 },
    );
  }

  // Verify the thesis is for the correct ticker
  if (thesis.ticker.toUpperCase() !== ticker.toUpperCase()) {
    return NextResponse.json(
      {
        approved: false,
        reason: `Thesis '${thesis_id}' is for ${thesis.ticker}, not ${ticker}. Ticker mismatch.`,
      },
      { status: 400 },
    );
  }

  // Check GO recommendation
  if (thesis.recommendation !== "GO") {
    return NextResponse.json({
      approved: false,
      reason: `Thesis recommendation is '${thesis.recommendation}', not 'GO'. Cannot approve a NO-GO trade.`,
    });
  }

  // ── 3. Check thesis freshness (must be within 24 hours) ────────────────

  const thesisCreatedAt = new Date(thesis.created_at).getTime();
  const now = Date.now();
  const ageMs = now - thesisCreatedAt;

  if (ageMs > THESIS_STALENESS_MS) {
    const ageHours = Math.round(ageMs / (60 * 60 * 1000));
    return NextResponse.json({
      approved: false,
      reason: `Thesis is ${ageHours} hours old (max: 24h). Re-run validation to get a fresh thesis before approving.`,
    });
  }

  // ── 4. Check for duplicate approved trade (not yet executed) ───────────

  const { data: existingApproval } = await supabase
    .from("approved_trades")
    .select("id")
    .eq("ticker", ticker.toUpperCase())
    .eq("executed", false)
    .limit(1)
    .maybeSingle();

  if (existingApproval) {
    return NextResponse.json({
      approved: false,
      reason: `An unapproved trade for ${ticker.toUpperCase()} already exists in the execution queue. Execute or cancel it first.`,
    });
  }

  // ── 5. Insert into approved_trades ─────────────────────────────────────

  // Derive user_id — use Supabase auth if available, otherwise fallback
  let userId = "default";
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      userId = authData.user.id;
    }
  } catch {
    // Use default — single-user system
  }

  const { data: inserted, error: insertError } = await supabase
    .from("approved_trades")
    .insert({
      user_id: userId,
      ticker: ticker.toUpperCase(),
      direction,
      shares,
      thesis_id,
      executed: false,
    })
    .select("id, approved_at")
    .single();

  if (insertError) {
    return NextResponse.json(
      { approved: false, reason: `Failed to create approval record: ${insertError.message}` },
      { status: 500 },
    );
  }

  // ── 6. Build thesis summary for the response ──────────────────────────

  let thesisSummary = `${ticker.toUpperCase()} — GO (${thesis.confidence} confidence)`;
  if (thesis.synthesis_json) {
    const synthesis =
      typeof thesis.synthesis_json === "string"
        ? JSON.parse(thesis.synthesis_json)
        : thesis.synthesis_json;
    if (synthesis.thesis) {
      thesisSummary += ` | ${synthesis.thesis}`;
    }
  }

  return NextResponse.json({
    approved: true,
    approval_id: inserted.id,
    approved_at: inserted.approved_at,
    thesis_summary: thesisSummary,
    next_step:
      "Trade is now in the Fidelity execution queue. Click 'Execute on Fidelity' to send the order via SnapTrade.",
  });
}
