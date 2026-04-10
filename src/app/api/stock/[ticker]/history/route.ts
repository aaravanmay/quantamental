import { NextRequest, NextResponse } from "next/server";

const FMP_KEY = process.env.FMP_API_KEY || "";

// In-memory cache to avoid burning FMP's 250 calls/day limit
const cache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours — historical data doesn't change frequently

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const t = ticker.toUpperCase();

  // Check in-memory cache first
  const cached = cache.get(t);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const res = await fetch(
    `https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=${t}&apikey=${FMP_KEY}`,
    { next: { revalidate: 86400 } } // 24 hour Vercel cache too
  );

  if (!res.ok) {
    // Return cached data if available even if stale
    if (cached) return NextResponse.json(cached.data);
    return NextResponse.json([], { status: 502 });
  }

  const data = await res.json();

  // Check for rate limit error from FMP
  if (data?.["Error Message"]?.includes("Limit")) {
    if (cached) return NextResponse.json(cached.data);
    return NextResponse.json([], { status: 429 });
  }

  const records = Array.isArray(data) ? data : data?.historical || [];
  if (records.length === 0) {
    if (cached) return NextResponse.json(cached.data);
    return NextResponse.json([]);
  }

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
    .reverse();

  // Store in cache
  cache.set(t, { data: candles, timestamp: Date.now() });

  return NextResponse.json(candles);
}
