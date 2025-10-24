/**
 * @fileoverview Server-side portfolio insights generation.
 * Analyzes transaction history to generate spending patterns and metrics.
 * Can be safely imported from both client and server contexts.
 */

import { getSentTransactions } from "./transactions";

/**
 * Portfolio insights generated from transaction analysis.
 * 
 * @interface PortfolioInsights
 * @property {string} totalSpent - Total amount spent in period
 * @property {Array<{name: string; amount: string}>} topRecipients - Most frequent recipients
 * @property {"increasing" | "decreasing" | "stable"} spendingTrend - Spending pattern
 * @property {string} averageTransaction - Average transaction amount
 */
export interface PortfolioInsights {
  totalSpent: string;
  topRecipients: Array<{ name: string; amount: string }>;
  spendingTrend: "increasing" | "decreasing" | "stable";
  averageTransaction: string;
}

/**
 * Generates portfolio insights from transaction history.
 * Analyzes spending patterns, identifies top recipients, and calculates metrics.
 * 
 * @async
 * @param {string} profileId - Profile ID to analyze
 * @returns {Promise<PortfolioInsights>} Portfolio insights and metrics
 * @throws {Error} If data fetch fails
 * 
 * @example
 * ```typescript
 * const insights = await getPortfolioInsights(currentUser.id);
 * console.log(`Total spent: ${insights.totalSpent}`);
 * console.log(`Top recipient: ${insights.topRecipients[0].name}`);
 * console.log(`Spending trend: ${insights.spendingTrend}`);
 * ```
 */
export async function getPortfolioInsights(profileId: string): Promise<PortfolioInsights> {
  try {
    // Fetch all sent transactions
    const transactions = await getSentTransactions(profileId);

    if (transactions.length === 0) {
      return {
        totalSpent: "0.00",
        topRecipients: [],
        spendingTrend: "stable",
        averageTransaction: "0.00",
      };
    }

    // Calculate total spent
    const totalSpent = transactions.reduce((sum, tx) => {
      return sum + parseFloat(tx.amount);
    }, 0);

    // Calculate average transaction
    const averageTransaction = totalSpent / transactions.length;

    // Group by recipient and calculate totals
    const recipientTotals = new Map<string, { name: string; amount: number }>();
    transactions.forEach((tx) => {
      const recipientName = tx.recipient?.name || "Unknown";
      const current = recipientTotals.get(recipientName) || { name: recipientName, amount: 0 };
      current.amount += parseFloat(tx.amount);
      recipientTotals.set(recipientName, current);
    });

    // Get top 3 recipients
    const topRecipients = Array.from(recipientTotals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((r) => ({
        name: r.name,
        amount: r.amount.toFixed(2),
      }));

    // Calculate spending trend (compare first half vs second half)
    const midpoint = Math.floor(transactions.length / 2);
    const firstHalf = transactions.slice(0, midpoint);
    const secondHalf = transactions.slice(midpoint);

    const firstHalfTotal = firstHalf.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const secondHalfTotal = secondHalf.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    let spendingTrend: "increasing" | "decreasing" | "stable" = "stable";
    const difference = Math.abs(secondHalfTotal - firstHalfTotal);
    const threshold = totalSpent * 0.1; // 10% threshold

    if (difference > threshold) {
      spendingTrend = secondHalfTotal > firstHalfTotal ? "increasing" : "decreasing";
    }

    return {
      totalSpent: totalSpent.toFixed(2),
      topRecipients,
      spendingTrend,
      averageTransaction: averageTransaction.toFixed(2),
    };
  } catch (err) {
    console.error("[getPortfolioInsights] Error:", err);
    throw new Error("Failed to generate portfolio insights");
  }
}
