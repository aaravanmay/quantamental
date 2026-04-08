import { NextRequest, NextResponse } from "next/server";

const FMP_KEY = process.env.FMP_API_KEY || "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  // Fetch 1 year of daily OHLCV data from FMP
  const res = await fetch(
    `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker.toUpperCase()}?timeseries=365&apikey=${FMP_KEY}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return NextResponse.json([], { status: 502 });
  const data = await res.json();

  if (!data?.historical) return NextResponse.json([]);

  // Transform to TradingView Lightweight Charts format
  const candles = data.historical
    .map((d: any) => ({
      time: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))
    .reverse(); // Oldest first for charts

  return NextResponse.json(candles);
}
