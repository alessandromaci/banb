/**
 * API functions for fetching reward data.
 * This file contains the structure for real API integration.
 */

export interface DailyReward {
  date: string; // ISO date string (YYYY-MM-DD)
  amount: number; // Reward amount in USD
  cumulative: number; // Cumulative rewards up to this date
}

export interface RewardsApiResponse {
  dailyRewards: DailyReward[];
  totalRewards: number;
  monthlyRewards: number;
  period: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
}

/**
 * Fetch daily rewards for a specific investment over a time period.
 *
 * @param {string} investmentId - The investment ID
 * @param {string} startDate - Start date in ISO format (YYYY-MM-DD)
 * @param {string} endDate - End date in ISO format (YYYY-MM-DD)
 * @returns {Promise<RewardsApiResponse>} Daily rewards data
 *
 * @example
 * ```typescript
 * const rewards = await fetchDailyRewards(
 *   "investment-123",
 *   "2024-01-01",
 *   "2024-01-31"
 * );
 * ```
 */
export async function fetchDailyRewards(
  investmentId: string,
  startDate: string,
  endDate: string
): Promise<RewardsApiResponse> {
  // This would be your actual API call
  const response = await fetch(
    `/api/investments/${investmentId}/rewards?start=${startDate}&end=${endDate}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch rewards: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch rewards for the current month.
 *
 * @param {string} investmentId - The investment ID
 * @returns {Promise<RewardsApiResponse>} Current month rewards
 */
export async function fetchCurrentMonthRewards(
  investmentId: string
): Promise<RewardsApiResponse> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return fetchDailyRewards(
    investmentId,
    startOfMonth.toISOString().split("T")[0],
    endOfMonth.toISOString().split("T")[0]
  );
}

/**
 * Fetch rewards for the last 30 days.
 *
 * @param {string} investmentId - The investment ID
 * @returns {Promise<RewardsApiResponse>} Last 30 days rewards
 */
export async function fetchLast30DaysRewards(
  investmentId: string
): Promise<RewardsApiResponse> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  return fetchDailyRewards(
    investmentId,
    startDate.toISOString().split("T")[0],
    endDate.toISOString().split("T")[0]
  );
}

/**
 * Process daily rewards data for chart display.
 * Ensures smooth chart progression and handles missing data points.
 *
 * @param {DailyReward[]} dailyRewards - Raw daily rewards data
 * @returns {Array<{day: number, value: number}>} Processed chart data
 */
export function processChartData(
  dailyRewards: DailyReward[]
): Array<{ day: number; value: number }> {
  if (dailyRewards.length === 0) {
    return [];
  }

  // Sort by date to ensure proper order
  const sortedRewards = dailyRewards.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Fill in missing days with interpolated values
  const startDate = new Date(sortedRewards[0].date);
  const endDate = new Date(sortedRewards[sortedRewards.length - 1].date);
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const chartData: Array<{ day: number; value: number }> = [];

  for (let i = 0; i <= daysDiff; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateString = currentDate.toISOString().split("T")[0];

    // Find the reward for this date
    const dayReward = sortedRewards.find(
      (reward) => reward.date === dateString
    );

    if (dayReward) {
      chartData.push({
        day: i + 1,
        value: dayReward.amount,
      });
    } else {
      // Interpolate missing values
      const prevReward = sortedRewards.find(
        (reward) => new Date(reward.date) < currentDate
      );
      const nextReward = sortedRewards.find(
        (reward) => new Date(reward.date) > currentDate
      );

      if (prevReward && nextReward) {
        // Linear interpolation
        const prevDate = new Date(prevReward.date);
        const nextDate = new Date(nextReward.date);
        const totalDays = Math.ceil(
          (nextDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const currentDay = Math.ceil(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const interpolatedValue =
          prevReward.amount +
          (nextReward.amount - prevReward.amount) * (currentDay / totalDays);

        chartData.push({
          day: i + 1,
          value: Math.max(0, interpolatedValue), // Ensure non-negative values
        });
      } else if (prevReward) {
        // Use previous value if no next value
        chartData.push({
          day: i + 1,
          value: prevReward.amount,
        });
      } else {
        // Use next value if no previous value
        chartData.push({
          day: i + 1,
          value: nextReward?.amount || 0,
        });
      }
    }
  }

  return chartData;
}
