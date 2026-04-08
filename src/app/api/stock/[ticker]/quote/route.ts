import { NextRequest, NextResponse } from "next/server";

const FMP_KEY = process.env.FMP_API_KEY || "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  const res = await fetch(
    `https://financialmodelingprep.com/api/v3/quote/${ticker.toUpperCase()}?apikey=${FMP_KEY}`,
    { next: { revalidate: 30 } }
  );

  if (!res.ok) return NextResponse.json({}, { status: 502 });
  const data = await res.json();

  if (!data || data.length === 0) {
    return NextResponse.json({}, { status: 404 });
  }

  const q = data[0];
  return NextResponse.json({
    ticker: q.symbol,
    price: q.price,
    change: q.change,
    change_pct: q.changesPercentage,
    open: q.open,
    high: q.dayHigh,
    low: q.dayLow,
    volume: q.volume,
    market_cap: q.marketCap,
    name: q.name,
    sector: q.sector || "",
  });
}
