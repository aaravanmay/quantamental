import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAccounts } from "@/lib/snaptrade";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // SnapTrade sends back userId and other params in the redirect
    const userId = searchParams.get("userId") || searchParams.get("user_id");
    const status =
      searchParams.get("status") || searchParams.get("connectionStatus");

    if (!userId) {
      return NextResponse.redirect(
        new URL("/portfolio?error=missing_user_id", req.url)
      );
    }

    if (status === "ERROR" || status === "error") {
      return NextResponse.redirect(
        new URL("/portfolio?error=connection_failed", req.url)
      );
    }

    // Look up the broker_accounts record for this user
    const { data: brokerAccount, error: lookupError } = await supabase
      .from("broker_accounts")
      .select("*")
      .eq("snaptrade_user_id", userId)
      .eq("broker_name", "fidelity")
      .maybeSingle();

    if (lookupError || !brokerAccount) {
      console.error(
        "[fidelity/callback] Broker account not found",
        lookupError
      );
      return NextResponse.redirect(
        new URL("/portfolio?error=account_not_found", req.url)
      );
    }

    // Fetch account details from SnapTrade
    try {
      const accounts = await getAccounts(
        brokerAccount.snaptrade_user_id,
        brokerAccount.snaptrade_user_secret
      );

      if (accounts.length > 0) {
        const primaryAccount = accounts[0];

        // Update broker_accounts with the connected account details
        const { error: updateError } = await supabase
          .from("broker_accounts")
          .update({
            account_id: primaryAccount.id,
            account_name:
              primaryAccount.name || primaryAccount.institutionName,
            connected_at: new Date().toISOString(),
          })
          .eq("id", brokerAccount.id);

        if (updateError) {
          console.error(
            "[fidelity/callback] Failed to update broker account",
            updateError
          );
        }
      }
    } catch (accountErr) {
      // Non-fatal: the connection still succeeded, we just couldn't fetch details yet
      console.error(
        "[fidelity/callback] Could not fetch account details",
        accountErr
      );
    }

    // Redirect back to the portfolio page
    const baseUrl = new URL(req.url).origin;
    return NextResponse.redirect(
      new URL("/portfolio?connected=true", baseUrl)
    );
  } catch (err: any) {
    console.error("[fidelity/callback]", err);
    return NextResponse.redirect(
      new URL("/portfolio?error=callback_failed", req.url)
    );
  }
}
