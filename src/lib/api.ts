/**
 * Fetch helpers for the Quantamental API routes and PC validation server.
 */

const PC_VALIDATION_URL = process.env.NEXT_PUBLIC_PC_URL || "http://localhost:8000";

/** Trigger validation pipeline on the PC for a given ticker */
export async function triggerValidation(ticker: string, signal?: Record<string, unknown>) {
  const res = await fetch("/api/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, signal }),
  });
  if (!res.ok) throw new Error(`Validation failed: ${res.statusText}`);
  return res.json();
}

/** Trigger portfolio scan on the PC */
export async function triggerPortfolioScan(holdings: Record<string, unknown>[]) {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ holdings }),
  });
  if (!res.ok) throw new Error(`Scan failed: ${res.statusText}`);
  return res.json();
}

/** Search for tickers via FMP */
export async function searchTickers(query: string) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

/** Get a stock quote */
export async function getQuote(ticker: string) {
  const res = await fetch(`/api/stock/${ticker}/quote`);
  if (!res.ok) throw new Error(`Quote fetch failed: ${res.statusText}`);
  return res.json();
}

/** Get historical price data */
export async function getHistory(ticker: string) {
  const res = await fetch(`/api/stock/${ticker}/history`);
  if (!res.ok) throw new Error(`History fetch failed: ${res.statusText}`);
  return res.json();
}

/** Get stock news */
export async function getNews(ticker: string) {
  const res = await fetch(`/api/stock/${ticker}/news`);
  if (!res.ok) return [];
  return res.json();
}

/** Get fundamentals */
export async function getFundamentals(ticker: string) {
  const res = await fetch(`/api/stock/${ticker}/fundamentals`);
  if (!res.ok) throw new Error(`Fundamentals fetch failed: ${res.statusText}`);
  return res.json();
}

/** Execute a paper trade */
export async function executePaperTrade(trade: {
  ticker: string;
  direction: "LONG" | "SHORT";
  shares: number;
  price: number;
  mode: "auto" | "manual";
  thesis_id?: string;
}) {
  const res = await fetch("/api/paper-trade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trade),
  });
  if (!res.ok) throw new Error(`Trade failed: ${res.statusText}`);
  return res.json();
}

/** Close a paper trade */
export async function closePaperTrade(tradeId: string, exitPrice: number) {
  const res = await fetch("/api/paper-trade", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: tradeId, exit_price: exitPrice }),
  });
  if (!res.ok) throw new Error(`Close trade failed: ${res.statusText}`);
  return res.json();
}
