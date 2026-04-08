import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { deleteUser } from "@/lib/snaptrade";

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

    if (lookupError) {
      return NextResponse.json(
        { error: `Database lookup failed: ${lookupError.message}` },
        { status: 500 }
      );
    }

    // Delete user from SnapTrade (if they exist)
    if (brokerAccount?.snaptrade_user_id) {
      try {
        await deleteUser(brokerAccount.snaptrade_user_id);
      } catch (snapErr: any) {
        // Log but don't fail — user may already be deleted on SnapTrade side
        console.warn(
          "[fidelity/disconnect] SnapTrade deletion warning:",
          snapErr.message
        );
      }
    }

    // Remove all fidelity-sourced holdings for this user
    const { error: holdingsError } = await supabase
      .from("portfolio_holdings")
      .delete()
      .eq("user_id", userId)
      .eq("source", "fidelity");

    if (holdingsError) {
      console.error(
        "[fidelity/disconnect] Failed to remove holdings",
        holdingsError
      );
    }

    // Remove the broker_accounts record
    if (brokerAccount) {
      const { error: deleteError } = await supabase
        .from("broker_accounts")
        .delete()
        .eq("id", brokerAccount.id);

      if (deleteError) {
        return NextResponse.json(
          { error: `Failed to remove broker account: ${deleteError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[fidelity/disconnect]", err);
    return NextResponse.json(
      { error: err.message || "Disconnect failed" },
      { status: 500 }
    );
  }
}
