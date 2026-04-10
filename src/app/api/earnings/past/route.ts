import { NextResponse } from "next/server";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";
const FMP_KEY = process.env.FMP_API_KEY || "";

export async function GET() {
  // Get earnings from the past 30 days
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const res = await fetch(
    `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_KEY}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return NextResponse.json([], { status: 502 });
  const data = await res.json();

  // Filter to stocks that have actual results and are significant companies
  const withResults = (data?.earningsCalendar || [])
    .filter(
      (e: any) =>
        e.epsActual != null &&
        e.symbol &&
        e.symbol.length <= 5 &&
        e.revenueEstimate &&
        e.revenueEstimate > 1_000_000_000
    )
    .sort((a: any, b: any) => b.date.localeCompare(a.date));

  // Take top 15 most recent significant earnings
  const top = withResults.slice(0, 15);

  // For each, fetch stock price change on earnings day + 1 news headline
  const enriched = await Promise.all(
    top.map(async (e: any) => {
      let priceChange = null;
      let newsHeadline = null;

      try {
        // Get price history to find the day's change
        const priceRes = await fetch(
          `https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=${e.symbol}&apikey=${FMP_KEY}`,
          { next: { revalidate: 86400 } }
        );
        if (priceRes.ok) {
          const prices = await priceRes.json();
          const dayOf = (prices || []).find((p: any) => p.date === e.date);
          if (dayOf) {
            priceChange = dayOf.changePercent;
          }
        }
      } catch {}

      try {
        // Get one news headline from around earnings date
        const newsRes = await fetch(
          `https://finnhub.io/api/v1/company-news?symbol=${e.symbol}&from=${e.date}&to=${e.date}&token=${FINNHUB_KEY}`,
          { next: { revalidate: 86400 } }
        );
        if (newsRes.ok) {
          const news = await newsRes.json();
          if (news.length > 0) {
            newsHeadline = news[0].headline;
          }
        }
      } catch {}

      const epsBeat =
        e.epsActual != null && e.epsEstimate != null
          ? e.epsActual >= e.epsEstimate
          : null;
      const revBeat =
        e.revenueActual != null && e.revenueEstimate != null
          ? e.revenueActual >= e.revenueEstimate
          : null;

      return {
        symbol: e.symbol,
        date: e.date,
        quarter: e.quarter,
        year: e.year,
        epsEstimate: e.epsEstimate,
        epsActual: e.epsActual,
        epsSurprise: e.epsActual != null && e.epsEstimate != null
          ? ((e.epsActual - e.epsEstimate) / Math.abs(e.epsEstimate || 1)) * 100
          : null,
        epsBeat,
        revenueEstimate: e.revenueEstimate,
        revenueActual: e.revenueActual,
        revBeat,
        priceChange,
        newsHeadline,
      };
    })
  );

  return NextResponse.json(enriched);
}
