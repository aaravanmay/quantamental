import { NextResponse } from "next/server";

const FMP_KEY = process.env.FMP_API_KEY || "";

export async function GET() {
  try {
    const [gainersRes, losersRes] = await Promise.allSettled([
      fetch(
        `https://financialmodelingprep.com/stable/biggest-gainers?apikey=${FMP_KEY}`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `https://financialmodelingprep.com/stable/biggest-losers?apikey=${FMP_KEY}`,
        { next: { revalidate: 300 } }
      ),
    ]);

    const gainers =
      gainersRes.status === "fulfilled" && gainersRes.value.ok
        ? await gainersRes.value.json()
        : [];
    const losers =
      losersRes.status === "fulfilled" && losersRes.value.ok
        ? await losersRes.value.json()
        : [];

    const filterExchange = (list: any[]) =>
      list
        .filter(
          (s: any) =>
            ["NASDAQ", "NYSE", "AMEX"].includes(s.exchange) &&
            s.price > 1 &&
            s.name
        )
        .slice(0, 10);

    return NextResponse.json({
      gainers: filterExchange(gainers),
      losers: filterExchange(losers),
    });
  } catch {
    return NextResponse.json({ gainers: [], losers: [] }, { status: 500 });
  }
}
