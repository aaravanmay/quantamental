import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { registerUser, getLoginLink } from "@/lib/snaptrade";

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

    // Check if user already has a broker_accounts record
    const { data: existing, error: lookupError } = await supabase
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

    let snapUserId: string;
    let snapUserSecret: string;

    if (existing?.snaptrade_user_id && existing?.snaptrade_user_secret) {
      // Re-use existing SnapTrade registration
      snapUserId = existing.snaptrade_user_id;
      snapUserSecret = existing.snaptrade_user_secret;
    } else {
      // Register new user with SnapTrade
      const registration = await registerUser(userId);
      snapUserId = registration.userId;
      snapUserSecret = registration.userSecret;

      // Upsert broker_accounts record
      const { error: upsertError } = await supabase
        .from("broker_accounts")
        .upsert(
          {
            user_id: userId,
            broker_name: "fidelity",
            snaptrade_user_id: snapUserId,
            snaptrade_user_secret: snapUserSecret,
          },
          { onConflict: "user_id,broker_name" }
        );

      if (upsertError) {
        // Fall back to insert if upsert fails (no unique constraint yet)
        const { error: insertError } = await supabase
          .from("broker_accounts")
          .insert({
            user_id: userId,
            broker_name: "fidelity",
            snaptrade_user_id: snapUserId,
            snaptrade_user_secret: snapUserSecret,
          });

        if (insertError) {
          return NextResponse.json(
            { error: `Failed to store credentials: ${insertError.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Get the OAuth redirect URL for Fidelity
    const redirectUrl = await getLoginLink(snapUserId, snapUserSecret);

    return NextResponse.json({ redirectUrl });
  } catch (err: any) {
    console.error("[fidelity/connect]", err);
    return NextResponse.json(
      { error: err.message || "Failed to initiate Fidelity connection" },
      { status: 500 }
    );
  }
}
