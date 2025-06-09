/**
 * Format a date string to a localized date
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

/**
 * Format a date string to a localized date and time
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

/**
 * Calculate days ago from a date string
 */
export const getDaysAgo = (dateString?: string): number | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if a plant needs watering based on last watered date
 */
export const needsWatering = (lastWatered?: string, frequency: number = 7): boolean => {
  const daysAgo = getDaysAgo(lastWatered);
  return daysAgo === null || daysAgo >= frequency;
};
