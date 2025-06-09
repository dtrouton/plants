/**
 * Convert API watering frequency string to number of days
 */
export const convertWateringToDays = (watering?: string): number | null => {
  if (!watering) {return null;}

  const lowerWatering = watering.toLowerCase();

  // Map common watering frequencies to days (order matters - more specific first)
  const frequencyMap: Array<[string, number]> = [
    ['twice a week', 3],
    ['twice a month', 14],
    ['biweekly', 14],
    ['daily', 1],
    ['weekly', 7],
    ['monthly', 30],
    ['rarely', 60],
    ['minimum', 14],
    ['average', 7],
    ['frequent', 3],
  ];

  // Check for direct matches
  for (const [key, value] of frequencyMap) {
    if (lowerWatering.includes(key)) {
      return value;
    }
  }

  // Try to extract number from "every X days" format
  const dayMatch = lowerWatering.match(/every\s+(\d+)\s+days?/);
  if (dayMatch) {
    return parseInt(dayMatch[1], 10);
  }

  return 7; // Default fallback
};

/**
 * Format sunlight requirements array to string
 */
export const formatSunlight = (sunlight?: string[]): string => {
  if (!sunlight || sunlight.length === 0) {return 'Unknown';}
  return sunlight.join(', ');
};
