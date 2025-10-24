/**
 * Test endpoint for debugging onchain transaction fetching
 * Usage: GET /api/test/onchain-tx?profileId=YOUR_PROFILE_ID
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchOnchainTransactions } from "@/lib/onchain-transactions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get("profileId");
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId query parameter is required" },
        { status: 400 }
      );
    }

    console.log(`[Test API] Fetching onchain transactions for profile: ${profileId}, limit: ${limit}`);

    const transactions = await fetchOnchainTransactions(profileId, limit);

    return NextResponse.json({
      success: true,
      profileId,
      transactionCount: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("[Test API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
