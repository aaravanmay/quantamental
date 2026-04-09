import { NextRequest, NextResponse } from "next/server";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || new Date().toISOString().split("T")[0];
  const to =
    searchParams.get("to") ||
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

  const res = await fetch(
    `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_KEY}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return NextResponse.json([], { status: 502 });
  const data = await res.json();

  const all = (data?.earningsCalendar || []).filter(
    (e: any) => e.symbol && e.symbol.length <= 5
  );

  // Group by date, sort each day by revenue estimate (biggest companies first), take top 10 per day
  const byDate: Record<string, any[]> = {};
  for (const e of all) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  const result: any[] = [];
  for (const date of Object.keys(byDate).sort()) {
    const dayEvents = byDate[date]
      .sort((a: any, b: any) => (b.revenueEstimate || 0) - (a.revenueEstimate || 0))
      .slice(0, 10);
    result.push(...dayEvents);
  }

  return NextResponse.json(result);
}
