import { NextRequest, NextResponse } from "next/server";

// In-memory alerts store (persists per serverless instance — for a personal tool this is fine)
// For persistence across deploys, these could go into Supabase
let alerts: { id: string; ticker: string; target_price: number; direction: "above" | "below"; created_at: string; triggered: boolean }[] = [];

export async function GET() {
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const { ticker, target_price, direction } = await req.json();
  if (!ticker || !target_price || !direction) {
    return NextResponse.json({ error: "ticker, target_price, direction required" }, { status: 400 });
  }

  const alert = {
    id: crypto.randomUUID(),
    ticker: ticker.toUpperCase(),
    target_price,
    direction,
    created_at: new Date().toISOString(),
    triggered: false,
  };

  alerts.push(alert);
  return NextResponse.json({ alert });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  alerts = alerts.filter((a) => a.id !== id);
  return NextResponse.json({ removed: id });
}
