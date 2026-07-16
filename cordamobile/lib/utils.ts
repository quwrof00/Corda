/**
 * Format a deadline date string into a human-readable "days left" string.
 */
export function formatDaysLeft(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();

  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due Today";
  if (diffDays === 1) return "1 day left";
  return `${diffDays} days left`;
}

/**
 * Get a time-aware greeting based on current hour.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

/**
 * Priority color mapping
 */
export const PRIORITY_COLORS: Record<string, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#22c55e",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "#6b7280",
  "in-progress": "#3b82f6",
  completed: "#22c55e",
  blocked: "#ef4444",
};
