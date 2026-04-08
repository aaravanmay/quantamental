import { NextRequest, NextResponse } from "next/server";

const PC_URL = process.env.PC_VALIDATION_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { holdings } = body;

  if (!holdings || !Array.isArray(holdings)) {
    return NextResponse.json({ error: "holdings array required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${PC_URL}/scan-portfolio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings }),
      signal: AbortSignal.timeout(300000), // 5 min timeout for full portfolio scan
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `PC scan failed: ${text}` },
        { status: 502 }
      );
    }

    const result = await res.json();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Cannot reach PC: ${err.message}` },
      { status: 503 }
    );
  }
}
