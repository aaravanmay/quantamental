import { NextRequest, NextResponse } from "next/server";

const FMP_KEY = process.env.FMP_API_KEY || "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const t = ticker.toUpperCase();

  // Fetch ratios, key metrics, profile, and income statement in parallel (stable API, annual — free tier)
  const [ratiosRes, metricsRes, profileRes, incomeRes] = await Promise.allSettled([
    fetch(
      `https://financialmodelingprep.com/stable/ratios?symbol=${t}&limit=1&apikey=${FMP_KEY}`,
      { next: { revalidate: 3600 } }
    ),
    fetch(
      `https://financialmodelingprep.com/stable/key-metrics?symbol=${t}&limit=1&apikey=${FMP_KEY}`,
      { next: { revalidate: 3600 } }
    ),
    fetch(
      `https://financialmodelingprep.com/stable/profile?symbol=${t}&apikey=${FMP_KEY}`,
      { next: { revalidate: 3600 } }
    ),
    fetch(
      `https://financialmodelingprep.com/stable/income-statement?symbol=${t}&limit=4&apikey=${FMP_KEY}`,
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
  const profile =
    profileRes.status === "fulfilled" && profileRes.value.ok
      ? await profileRes.value.json()
      : [];
  const income =
    incomeRes.status === "fulfilled" && incomeRes.value.ok
      ? await incomeRes.value.json()
      : [];

  return NextResponse.json({ ratios, metrics, profile, income });
}
