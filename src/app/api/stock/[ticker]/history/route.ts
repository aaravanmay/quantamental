import { NextRequest, NextResponse } from "next/server";

const FMP_KEY = process.env.FMP_API_KEY || "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  // Fetch 1 year of daily OHLCV data from FMP (stable API)
  const res = await fetch(
    `https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=${ticker.toUpperCase()}&apikey=${FMP_KEY}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return NextResponse.json([], { status: 502 });
  const data = await res.json();

  // Stable API returns flat array, not { historical: [...] }
  const records = Array.isArray(data) ? data : data?.historical || [];
  if (records.length === 0) return NextResponse.json([]);

  // Transform to TradingView Lightweight Charts format, take last 365 days
  // Filter out any records with missing data and deduplicate by date
  const seen = new Set<string>();
  const candles = records
    .slice(0, 365)
    .filter((d: any) => {
      if (!d.date || d.open == null || d.close == null) return false;
      if (seen.has(d.date)) return false;
      seen.add(d.date);
      return true;
    })
    .map((d: any) => ({
      time: d.date,
      open: d.open,
      high: d.high ?? Math.max(d.open, d.close),
      low: d.low ?? Math.min(d.open, d.close),
      close: d.close,
    }))
    .reverse(); // Oldest first for charts

  return NextResponse.json(candles);
}
