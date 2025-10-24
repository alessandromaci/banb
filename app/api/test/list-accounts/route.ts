/**
 * Test endpoint to list all accounts in the database
 * Usage: GET /api/test/list-accounts
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Get all accounts with profile info
    const { data: accounts, error } = await supabase
      .from("accounts")
      .select(`
        id,
        profile_id,
        name,
        type,
        address,
        network,
        balance,
        is_primary,
        status,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    // Get profile names
    const profileIds = [...new Set(accounts?.map(a => a.profile_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, handle")
      .in("id", profileIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const accountsWithProfiles = accounts?.map(account => ({
      ...account,
      profile: profileMap.get(account.profile_id),
    }));

    return NextResponse.json({
      success: true,
      count: accounts?.length || 0,
      accounts: accountsWithProfiles,
    });
  } catch (error) {
    console.error("[Test API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
