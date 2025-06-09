import { formatDate, formatDateTime, getDaysAgo, needsWatering } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format valid date strings', () => {
      const result = formatDate('2023-01-01T00:00:00.000Z');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should return "Never" for undefined', () => {
      expect(formatDate()).toBe('Never');
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const result = formatDateTime('2023-01-01T12:00:00.000Z');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
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
