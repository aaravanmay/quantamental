import { NextRequest, NextResponse } from "next/server";

const PC_URL = process.env.PC_VALIDATION_URL || "http://localhost:8000";

// POST /api/v2/chat
// Body: { message: string, history?: [{role, content}] }
// Proxies to the PC's portfolio_chat (Llama). Falls back to a static reply.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, history } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // Try PC pipeline (Llama is on the PC)
  try {
    const res = await fetch(`${PC_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history || [] }),
      signal: AbortSignal.timeout(60000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    /* PC offline */
  }

  // Fallback: explain that the AI is offline
  return NextResponse.json({
    reply:
      "The local Llama model is currently offline. Start it on your PC with `ollama serve` and ensure the validation server is exposed at PC_VALIDATION_URL.",
    source: "fallback",
  });
}
