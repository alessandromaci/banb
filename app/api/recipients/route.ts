import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!,
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

    // 1. Get the profile_id and recipient_profile_id from the request body
    const { profile_id, recipient_profile_id } = await request.json();

    // 2. Validate required fields
    if (!profile_id || !recipient_profile_id) {
      return NextResponse.json(
        {
          error: "Missing required fields: profile_id and recipient_profile_id",
        },
        { status: 400 }
      );
    }

    // 3. Validate that the profile_id exists and is valid
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, wallet_address")
      .eq("id", profile_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Invalid profile - profile not found" },
        { status: 400 }
      );
    }

    // 4. Validate that the recipient profile exists
    const { data: recipientProfile, error: recipientError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, name, handle, wallet_address")
        .eq("id", recipient_profile_id)
        .single();

    if (recipientError || !recipientProfile) {
      return NextResponse.json(
        { error: "Invalid recipient - recipient profile not found" },
        { status: 400 }
      );
    }

    // 5. Check if recipient already exists for this user (by profile link)
    const { data: existingRecipient, error: checkError } = await supabaseAdmin
      .from("recipients")
      .select("id, name")
      .eq("profile_id", profile_id)
      .eq("profile_id_link", recipient_profile_id)
      .single();

    if (existingRecipient && !checkError) {
      return NextResponse.json(
        {
          error: `Recipient already exists in your friends list as "${existingRecipient.name}"`,
        },
        { status: 409 }
      );
    }

    // 6. Check if recipient already exists by external address (for crypto recipients)
    const { data: existingByAddress, error: addressCheckError } =
      await supabaseAdmin
        .from("recipients")
        .select("id, name, external_address")
        .eq("profile_id", profile_id)
        .eq("external_address", recipientProfile.wallet_address)
        .single();

    if (existingByAddress && !addressCheckError) {
      return NextResponse.json(
        {
          error: `Recipient with this address already exists as "${existingByAddress.name}"`,
        },
        { status: 409 }
      );
    }

    // 7. Prevent users from adding themselves
    if (profile_id === recipient_profile_id) {
      return NextResponse.json(
        { error: "Cannot add yourself as a recipient" },
        { status: 400 }
      );
    }

    // 8. Insert the recipient (no RLS needed since it's server-side)

    const { data, error } = await supabaseAdmin
      .from("recipients")
      .insert({
        profile_id: profile_id,
        profile_id_link: recipient_profile_id,
        name: recipientProfile.name, // Use the actual name from the profile
        status: "active",
        recipient_type: "crypto", // Default to crypto for now
        external_address: recipientProfile.wallet_address, // Store wallet address
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
          error: "Failed to add recipient to database",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recipient: data,
      message: `Successfully added ${recipientProfile.name} to your friends list`,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
