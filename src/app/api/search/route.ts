import { NextRequest, NextResponse } from "next/server";

const FMP_KEY = process.env.FMP_API_KEY || "";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.length < 1) return NextResponse.json([]);

  // Search both by ticker and by name, then merge with exact matches first
  const [tickerRes, nameRes] = await Promise.allSettled([
    fetch(
      `https://financialmodelingprep.com/stable/search-ticker?query=${encodeURIComponent(q)}&limit=5&apikey=${FMP_KEY}`,
      { next: { revalidate: 300 } }
    ),
    fetch(
      `https://financialmodelingprep.com/stable/search-name?query=${encodeURIComponent(q)}&limit=10&apikey=${FMP_KEY}`,
      { next: { revalidate: 300 } }
    ),
  ]);

  const tickerResults =
    tickerRes.status === "fulfilled" && tickerRes.value.ok
      ? await tickerRes.value.json()
      : [];
  const nameResults =
    nameRes.status === "fulfilled" && nameRes.value.ok
      ? await nameRes.value.json()
      : [];

  // Handle rate limit responses (FMP returns object with Error Message)
  const tickers = Array.isArray(tickerResults) ? tickerResults : [];
  const names = Array.isArray(nameResults) ? nameResults : [];

  // Merge: ticker matches first, then name matches (deduplicated)
  const seen = new Set<string>();
  const merged: any[] = [];

  for (const r of [...tickers, ...names]) {
    if (!r.symbol || seen.has(r.symbol)) continue;
    seen.add(r.symbol);
    merged.push(r);
    if (merged.length >= 10) break;
  }

  return NextResponse.json(merged);
}
