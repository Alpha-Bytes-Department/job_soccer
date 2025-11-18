/**
 * AI Score Level Ranges
 * These ranges map user-friendly labels to percentage ranges
 * You can easily adjust these values as needed
 */
export const AI_SCORE_RANGES = {
  Low: { min: 10, max: 30 },
  Medium: { min: 31, max: 50 },
  Good: { min: 51, max: 80 },
  High: { min: 81, max: 100 },
} as const;

export type AiScoreLevel = keyof typeof AI_SCORE_RANGES;

/**
 * Helper function to get AI score range from level
 */
export const getAiScoreRange = (level: AiScoreLevel) => {
  return AI_SCORE_RANGES[level];
};

/**
 * Date Filter Options
 * Filters jobs based on when they were created
 */
export enum DateFilterEnum {
  LAST_WEEK = "Last Week",
  THIS_MONTH = "This Month",
  ANY_TIME = "Any Time",
}

export type DateFilter = "Last Week" | "This Month" | "Any Time";

/**
 * Helper function to get date range based on filter
 * Returns the start date for filtering (jobs created after this date)
 */
export const getDateFilterRange = (filter: DateFilter): Date | null => {
  const now = new Date();
  
  switch (filter) {
    case "Last Week":
      // Get date 7 days ago
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      return lastWeek;
      
    case "This Month":
      // Get first day of current month
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return thisMonth;
      
    case "Any Time":
      // No date filter
      return null;
      
    default:
      return null;
  }
};
