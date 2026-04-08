import { NextRequest, NextResponse } from "next/server";

const FMP_KEY = process.env.FMP_API_KEY || "";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.length < 1) return NextResponse.json([]);

  const res = await fetch(
    `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(q)}&limit=10&apikey=${FMP_KEY}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) return NextResponse.json([], { status: 502 });
  const data = await res.json();
  return NextResponse.json(data);
}
