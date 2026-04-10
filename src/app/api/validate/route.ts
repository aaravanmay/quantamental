import { NextRequest, NextResponse } from "next/server";

const PC_URL = process.env.PC_VALIDATION_URL || "http://localhost:8000";
const FMP_KEY = process.env.FMP_API_KEY || "";
const FINNHUB_KEY = process.env.FINNHUB_API_KEY || "";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticker, signal } = body;

  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  // Try PC pipeline first
  try {
    const res = await fetch(`${PC_URL}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, signal }),
      signal: AbortSignal.timeout(10000), // 10s timeout — fail fast if PC unreachable
    });

    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch {
    // PC not reachable — fall through to data-driven thesis
  }

  // ── Fallback: Generate thesis from available API data ──
  try {
    const t = ticker.toUpperCase();

    // Fetch all available data in parallel
    const [profileRes, ratiosRes, metricsRes, newsRes] = await Promise.allSettled([
      fetch(`https://financialmodelingprep.com/stable/profile?symbol=${t}&apikey=${FMP_KEY}`),
      fetch(`https://financialmodelingprep.com/stable/ratios?symbol=${t}&limit=1&apikey=${FMP_KEY}`),
      fetch(`https://financialmodelingprep.com/stable/key-metrics?symbol=${t}&limit=1&apikey=${FMP_KEY}`),
      fetch(`https://finnhub.io/api/v1/company-news?symbol=${t}&from=${new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]}&to=${new Date().toISOString().split("T")[0]}&token=${FINNHUB_KEY}`),
    ]);

    const profile = profileRes.status === "fulfilled" && profileRes.value.ok
      ? await profileRes.value.json() : [];
    const ratios = ratiosRes.status === "fulfilled" && ratiosRes.value.ok
      ? await ratiosRes.value.json() : [];
    const metrics = metricsRes.status === "fulfilled" && metricsRes.value.ok
      ? await metricsRes.value.json() : [];
    const news = newsRes.status === "fulfilled" && newsRes.value.ok
      ? await newsRes.value.json() : [];

    const p = Array.isArray(profile) ? profile[0] : null;
    const r = Array.isArray(ratios) ? ratios[0] : null;
    const m = Array.isArray(metrics) ? metrics[0] : null;
    const recentNews = Array.isArray(news) ? news.slice(0, 5) : [];

    if (!p) {
      return NextResponse.json({
        ticker: t,
        recommendation: "NO-GO",
        confidence: "LOW",
        signal: "Insufficient data",
        thesis: `Unable to fetch data for ${t}. The FMP API may be rate limited (250 calls/day on free tier). Try again later.`,
        risk: "No data available to assess risk.",
        monitoring: "Retry when API limit resets.",
        events_assessment: "No data",
        fundamentals_assessment: "No data",
      });
    }

    // ── Analyze fundamentals ──
    const issues: string[] = [];
    const strengths: string[] = [];

    // Profitability
    if (r?.netProfitMargin != null) {
      if (r.netProfitMargin > 0.15) strengths.push(`Strong net margin (${(r.netProfitMargin * 100).toFixed(1)}%)`);
      else if (r.netProfitMargin < 0) issues.push(`Negative net margin (${(r.netProfitMargin * 100).toFixed(1)}%)`);
    }
    if (r?.returnOnEquity != null) {
      if (r.returnOnEquity > 0.15) strengths.push(`High ROE (${(r.returnOnEquity * 100).toFixed(1)}%)`);
      else if (r.returnOnEquity < 0.05) issues.push(`Low ROE (${(r.returnOnEquity * 100).toFixed(1)}%)`);
    }

    // Valuation
    if (m?.evToEBITDA != null) {
      if (m.evToEBITDA < 15) strengths.push(`Reasonable EV/EBITDA (${m.evToEBITDA.toFixed(1)}x)`);
      else if (m.evToEBITDA > 30) issues.push(`Expensive EV/EBITDA (${m.evToEBITDA.toFixed(1)}x)`);
    }

    // Balance sheet
    if (m?.currentRatio != null) {
      if (m.currentRatio > 1.5) strengths.push(`Strong liquidity (current ratio ${m.currentRatio.toFixed(1)})`);
      else if (m.currentRatio < 0.8) issues.push(`Weak liquidity (current ratio ${m.currentRatio.toFixed(1)})`);
    }

    // Price action
    if (p.change != null) {
      if (p.change > 0) strengths.push(`Positive momentum (${p.changePercentage > 0 ? "+" : ""}${p.changePercentage?.toFixed(1)}% today)`);
      else issues.push(`Negative momentum (${p.changePercentage?.toFixed(1)}% today)`);
    }

    // Beta
    if (p.beta != null) {
      if (p.beta > 1.5) issues.push(`High volatility (beta ${p.beta.toFixed(2)})`);
    }

    // ── Analyze news sentiment (simple keyword-based) ──
    const negativeKeywords = ["lawsuit", "investigation", "downgrade", "miss", "decline", "loss", "warning", "recall", "layoff", "cut"];
    const positiveKeywords = ["upgrade", "beat", "growth", "record", "surge", "approve", "partnership", "expand", "raise"];

    let newsPositive = 0;
    let newsNegative = 0;
    const newsHeadlines: string[] = [];

    for (const article of recentNews) {
      const headline = (article.headline || "").toLowerCase();
      newsHeadlines.push(article.headline);
      if (positiveKeywords.some((k) => headline.includes(k))) newsPositive++;
      if (negativeKeywords.some((k) => headline.includes(k))) newsNegative++;
    }

    if (newsPositive > newsNegative) strengths.push(`Positive news sentiment (${newsPositive} bullish headlines)`);
    if (newsNegative > newsPositive) issues.push(`Negative news sentiment (${newsNegative} bearish headlines)`);

    // ── Make recommendation ──
    const score = strengths.length - issues.length;
    const recommendation = score >= 2 ? "GO" : "NO-GO";
    const confidence = Math.abs(score) >= 3 ? "HIGH" : Math.abs(score) >= 1 ? "MEDIUM" : "LOW";

    const thesis = recommendation === "GO"
      ? `${t} shows ${strengths.length} fundamental strengths: ${strengths.slice(0, 3).join(", ")}. ${issues.length > 0 ? `Watch for: ${issues[0]}.` : "No significant red flags detected."}`
      : `${t} has ${issues.length} concerns: ${issues.slice(0, 3).join(", ")}. ${strengths.length > 0 ? `Positives include: ${strengths[0]}.` : ""} Recommend waiting for better entry.`;

    const risk = issues.length > 0
      ? issues.join(". ") + "."
      : "No significant risks identified in current data.";

    return NextResponse.json({
      ticker: t,
      recommendation,
      confidence,
      signal: signal?.strategy || "Data-driven analysis",
      thesis,
      risk,
      monitoring: `Watch ${p.companyName || t} for earnings, sector rotation, and ${p.beta > 1.2 ? "elevated volatility" : "market correlation"}.`,
      events_assessment: recentNews.length > 0
        ? `${recentNews.length} news articles in past 7 days. Sentiment: ${newsPositive > newsNegative ? "positive" : newsNegative > newsPositive ? "negative" : "neutral"}.`
        : "No recent news found.",
      fundamentals_assessment: `${p.companyName || t} (${p.sector || "Unknown sector"}). Market cap: $${((p.marketCap || 0) / 1e9).toFixed(1)}B. ${r?.netProfitMargin != null ? `Net margin: ${(r.netProfitMargin * 100).toFixed(1)}%.` : ""} ${m?.evToEBITDA != null ? `EV/EBITDA: ${m.evToEBITDA.toFixed(1)}x.` : ""}`,
      source: "data-driven (PC offline)",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Thesis generation failed: ${err.message}` },
      { status: 500 }
    );
  }
}
