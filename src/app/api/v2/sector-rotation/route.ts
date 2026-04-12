import { NextRequest, NextResponse } from "next/server";

const PC_URL = process.env.PC_VALIDATION_URL || "http://localhost:8000";

const SECTOR_ETFS: Record<string, string> = {
  Tech: "XLK",
  Semis: "SOXX",
  Software: "IGV",
  Finance: "XLF",
  Health: "XLV",
  Energy: "XLE",
  Consumer: "XLY",
  Staples: "XLP",
  Industrial: "XLI",
  Materials: "XLB",
  Utilities: "XLU",
  RealEstate: "XLRE",
  Communications: "XLC",
};

async function fetchCloses(ticker: string): Promise<number[]> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 1800 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
    return closes.filter((x: any) => x != null);
  } catch {
    return [];
  }
}

function relativeStrength(sectorCloses: number[], spyCloses: number[], days: number): number {
  if (sectorCloses.length < days || spyCloses.length < days) return 0;
  const sectorReturn = sectorCloses[sectorCloses.length - 1] / sectorCloses[sectorCloses.length - days] - 1;
  const spyReturn = spyCloses[spyCloses.length - 1] / spyCloses[spyCloses.length - days] - 1;
  return sectorReturn - spyReturn;
}

export async function GET(_req: NextRequest) {
  // Try PC first
  try {
    const res = await fetch(`${PC_URL}/sector-rotation`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return NextResponse.json(await res.json());
  } catch {
    /* fall through */
  }

  // Edge fallback
  try {
    const spyCloses = await fetchCloses("SPY");
    if (spyCloses.length < 130) {
      return NextResponse.json({ error: "SPY data unavailable" }, { status: 500 });
    }

    const sectorScores = await Promise.all(
      Object.entries(SECTOR_ETFS).map(async ([sector, etf]) => {
        const closes = await fetchCloses(etf);
        const rs1m = relativeStrength(closes, spyCloses, 21);
        const rs3m = relativeStrength(closes, spyCloses, 63);
        const rs6m = relativeStrength(closes, spyCloses, 126);
        const composite = rs1m * 0.5 + rs3m * 0.3 + rs6m * 0.2;
        return {
          sector,
          etf,
          rs_1m: Math.round(rs1m * 10000) / 10000,
          rs_3m: Math.round(rs3m * 10000) / 10000,
          rs_6m: Math.round(rs6m * 10000) / 10000,
          composite: Math.round(composite * 10000) / 10000,
          trending_up: rs1m > 0 && rs3m > 0,
        };
      })
    );

    const ranked = sectorScores.filter((s) => s.composite !== 0).sort((a, b) => b.composite - a.composite);

    const leaders = ranked.slice(0, 3);
    const laggards = ranked.slice(-3).reverse();
    const rotation_strength = ranked.length >= 2 ? ranked[0].composite - ranked[ranked.length - 1].composite : 0;

    return NextResponse.json({
      leaders,
      laggards,
      rotation_strength: Math.round(rotation_strength * 10000) / 10000,
      all_sectors: Object.fromEntries(ranked.map((s) => [s.sector, s])),
      detected_at: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
