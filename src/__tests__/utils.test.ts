import { formatDate, getDaysAgo, needsWatering } from '../utils/dateUtils';
import { convertWateringToDays, formatSunlight } from '../utils/plantUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format valid date strings', () => {
      const result = formatDate('2023-01-01T00:00:00.000Z');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // MM/DD/YYYY format
    });

    it('should return "Never" for undefined', () => {
      expect(formatDate()).toBe('Never');
    });
  });

  describe('getDaysAgo', () => {
    it('should calculate days correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = getDaysAgo(yesterday.toISOString());
      expect(result).toBe(1);
    });

    it('should return null for undefined', () => {
      expect(getDaysAgo()).toBeNull();
    });
  });

  describe('needsWatering', () => {
    it('should return true when never watered', () => {
      expect(needsWatering()).toBe(true);
    });

    it('should return true when overdue', () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 8);
      expect(needsWatering(weekAgo.toISOString(), 7)).toBe(true);
    });

    it('should return false when recently watered', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(needsWatering(yesterday.toISOString(), 7)).toBe(false);
    });
  });
});

describe('plantUtils', () => {
  describe('convertWateringToDays', () => {
    it('should convert common frequencies', () => {
      expect(convertWateringToDays('daily')).toBe(1);
      expect(convertWateringToDays('weekly')).toBe(7);
      expect(convertWateringToDays('monthly')).toBe(30);
      expect(convertWateringToDays('every 5 days')).toBe(5);
    });

    it('should return null for undefined', () => {
      expect(convertWateringToDays()).toBeNull();
    });

    it('should return default for unknown strings', () => {
      expect(convertWateringToDays('unknown frequency')).toBe(7);
    });
  });

  describe('formatSunlight', () => {
    it('should join multiple requirements', () => {
      expect(formatSunlight(['Full sun', 'Partial shade'])).toBe('Full sun, Partial shade');
    });

    it('should return "Unknown" for empty/undefined', () => {
      expect(formatSunlight([])).toBe('Unknown');
      expect(formatSunlight()).toBe('Unknown');
    });
  });
});
