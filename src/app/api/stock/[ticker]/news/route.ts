import { NextRequest, NextResponse } from "next/server";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;

    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${ticker.toUpperCase()}&from=${
        from.toISOString().split("T")[0]
      }&to=${now.toISOString().split("T")[0]}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 900 } }
    );

    if (!res.ok) return NextResponse.json([], { status: 502 });
    const data = await res.json();
    return NextResponse.json(data.slice(0, 30));
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
