import { NextResponse } from "next/server";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

export async function GET() {
  const res = await fetch(
    `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) return NextResponse.json([], { status: 502 });
  const data = await res.json();

  const articles = (data || []).slice(0, 20).map((a: any) => ({
    headline: a.headline,
    summary: a.summary,
    source: a.source,
    url: a.url,
    image: a.image,
    datetime: a.datetime,
    category: a.category,
  }));

  return NextResponse.json(articles);
}
