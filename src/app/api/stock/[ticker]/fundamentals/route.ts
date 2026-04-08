import { NextRequest, NextResponse } from "next/server";

const FMP_KEY = process.env.FMP_API_KEY || "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const t = ticker.toUpperCase();

  // Fetch ratios, key metrics, and insider trades in parallel
  const [ratiosRes, metricsRes, insiderRes] = await Promise.allSettled([
    fetch(
      `https://financialmodelingprep.com/api/v3/ratios/${t}?period=quarter&limit=1&apikey=${FMP_KEY}`,
      { next: { revalidate: 3600 } }
    ),
    fetch(
      `https://financialmodelingprep.com/api/v3/key-metrics/${t}?period=quarter&limit=1&apikey=${FMP_KEY}`,
      { next: { revalidate: 3600 } }
    ),
    fetch(
      `https://financialmodelingprep.com/api/v4/insider-trading?symbol=${t}&limit=10&apikey=${FMP_KEY}`,
      { next: { revalidate: 3600 } }
    ),
  ]);

  const ratios =
    ratiosRes.status === "fulfilled" && ratiosRes.value.ok
      ? await ratiosRes.value.json()
      : [];
  const metrics =
    metricsRes.status === "fulfilled" && metricsRes.value.ok
      ? await metricsRes.value.json()
      : [];
  const insider =
    insiderRes.status === "fulfilled" && insiderRes.value.ok
      ? await insiderRes.value.json()
      : [];

  return NextResponse.json({ ratios, metrics, insider });
}
