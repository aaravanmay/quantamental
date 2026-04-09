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

  // Filter to well-known stocks (revenue estimate > $1B or symbol length <= 4)
  const earnings = (data?.earningsCalendar || [])
    .filter(
      (e: any) =>
        e.symbol &&
        e.symbol.length <= 5 &&
        (e.revenueEstimate > 500_000_000 || e.epsEstimate != null)
    )
    .slice(0, 50);

  return NextResponse.json(earnings);
}
