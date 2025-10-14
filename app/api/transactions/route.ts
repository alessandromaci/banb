import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    // 0. Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "⚠️ SUPABASE_SERVICE_ROLE_KEY not found, using anon key (less secure)"
      );
    }

    // 1. Get the transaction data from the request body
    const { sender_profile_id, recipient_id, chain, amount, token } =
      await request.json();

    // 2. Validate required fields
    if (!sender_profile_id || !recipient_id || !chain || !amount || !token) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sender_profile_id, recipient_id, chain, amount, token",
        },
        { status: 400 }
      );
    }

    // 3. Validate that the sender profile exists
    const { data: senderProfile, error: senderError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, wallet_address")
      .eq("id", sender_profile_id)
      .single();

    if (senderError || !senderProfile) {
      return NextResponse.json(
        { error: "Invalid sender - profile not found" },
        { status: 400 }
      );
    }

    // 4. Validate that the recipient exists and belongs to the sender
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from("recipients")
      .select("id, name, profile_id")
      .eq("id", recipient_id)
      .eq("profile_id", sender_profile_id) // Ensure recipient belongs to sender
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json(
        {
          error:
            "Invalid recipient - recipient not found or doesn't belong to you",
        },
        { status: 400 }
      );
    }

    // 5. Create the transaction (no RLS needed since it's server-side)

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .insert({
        sender_profile_id: sender_profile_id,
        recipient_id: recipient_id,
        chain: chain,
        amount: amount,
        token: token,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error details:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      return NextResponse.json(
        {
          error: "Failed to create transaction in database",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: data,
      message: `Transaction created successfully`,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
