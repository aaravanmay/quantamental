import { NextRequest, NextResponse } from "next/server";

// This route proxies validation requests to the PC running the Python pipeline.
// The PC must be reachable via Tailscale or local network.
const PC_URL = process.env.PC_VALIDATION_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticker, signal } = body;

  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${PC_URL}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, signal }),
      signal: AbortSignal.timeout(120000), // 2 min timeout for Llama inference
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `PC validation failed: ${text}` },
        { status: 502 }
      );
    }

    const result = await res.json();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Cannot reach PC at ${PC_URL}. Is the validation server running? Error: ${err.message}`,
      },
      { status: 503 }
    );
  }
}
