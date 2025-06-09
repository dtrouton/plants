import { convertWateringToDays, formatSunlight } from '../plantUtils';

describe('plantUtils', () => {
  describe('convertWateringToDays', () => {
    it('should convert common frequencies', () => {
      expect(convertWateringToDays('daily')).toBe(1);
      expect(convertWateringToDays('weekly')).toBe(7);
      expect(convertWateringToDays('monthly')).toBe(30);
      expect(convertWateringToDays('every 5 days')).toBe(5);
      expect(convertWateringToDays('twice a week')).toBe(3);
      expect(convertWateringToDays('biweekly')).toBe(14);
      expect(convertWateringToDays('rarely')).toBe(60);
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

    it('should handle single requirement', () => {
      expect(formatSunlight(['Full sun'])).toBe('Full sun');
    });

    it('should return "Unknown" for empty/undefined', () => {
      expect(formatSunlight([])).toBe('Unknown');
      expect(formatSunlight()).toBe('Unknown');
    });
  });
});
