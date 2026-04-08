import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getHoldings } from "@/lib/snaptrade";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Look up broker account
    const { data: brokerAccount, error: lookupError } = await supabase
      .from("broker_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("broker_name", "fidelity")
      .maybeSingle();

    if (lookupError || !brokerAccount) {
      return NextResponse.json(
        { error: "No Fidelity account connected" },
        { status: 404 }
      );
    }

    if (!brokerAccount.account_id) {
      return NextResponse.json(
        { error: "Fidelity account not fully connected — missing account_id" },
        { status: 400 }
      );
    }

    // Fetch holdings from SnapTrade
    const holdings = await getHoldings(
      brokerAccount.snaptrade_user_id,
      brokerAccount.snaptrade_user_secret,
      brokerAccount.account_id
    );

    const now = new Date().toISOString();
    const syncedHoldings: Array<Record<string, any>> = [];

    for (const holding of holdings) {
      if (!holding.symbol || holding.symbol === "UNKNOWN") continue;

      const record = {
        user_id: userId,
        ticker: holding.symbol,
        shares: holding.shares,
        avg_cost: holding.averagePrice,
        sector: "",
        source: "fidelity",
        broker_account_id: brokerAccount.id,
        last_synced_at: now,
      };

      // Upsert: match on user_id + ticker + source to avoid duplicates
      const { data: existing } = await supabase
        .from("portfolio_holdings")
        .select("id")
        .eq("user_id", userId)
        .eq("ticker", holding.symbol)
        .eq("source", "fidelity")
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from("portfolio_holdings")
          .update({
            shares: holding.shares,
            avg_cost: holding.averagePrice,
            broker_account_id: brokerAccount.id,
            last_synced_at: now,
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error(
            `[fidelity/sync] Failed to update ${holding.symbol}`,
            updateError
          );
          continue;
        }

        syncedHoldings.push({ ...record, id: existing.id });
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("portfolio_holdings")
          .insert(record)
          .select("id")
          .single();

        if (insertError) {
          console.error(
            `[fidelity/sync] Failed to insert ${holding.symbol}`,
            insertError
          );
          continue;
        }

        syncedHoldings.push({ ...record, id: inserted?.id });
      }
    }

    // Remove holdings that are no longer in the brokerage account
    const syncedTickers = holdings
      .map((h) => h.symbol)
      .filter((s) => s !== "UNKNOWN");

    if (syncedTickers.length > 0) {
      const { error: cleanupError } = await supabase
        .from("portfolio_holdings")
        .delete()
        .eq("user_id", userId)
        .eq("source", "fidelity")
        .not("ticker", "in", `(${syncedTickers.join(",")})`);

      if (cleanupError) {
        console.error(
          "[fidelity/sync] Failed to clean up stale holdings",
          cleanupError
        );
      }
    }

    // Update last_synced_at on broker_accounts
    await supabase
      .from("broker_accounts")
      .update({ last_synced_at: now })
      .eq("id", brokerAccount.id);

    return NextResponse.json({
      holdings: syncedHoldings,
      count: syncedHoldings.length,
      synced_at: now,
    });
  } catch (err: any) {
    console.error("[fidelity/sync]", err);
    return NextResponse.json(
      { error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}
