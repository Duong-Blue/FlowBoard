import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDeadlineState, formatDate } from './dateUtils';

describe('dateUtils', () => {
  describe('getDeadlineState', () => {
    beforeEach(() => {
      // Set fixed time to 2026-09-21T12:00:00Z for predictable tests
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-21T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns NO_DUE_DATE if dueDate is not provided', () => {
      expect(getDeadlineState('TODO', null)).toBe('NO_DUE_DATE');
      expect(getDeadlineState('TODO', undefined)).toBe('NO_DUE_DATE');
    });

    it('returns COMPLETED if status is DONE, regardless of due date', () => {
      // Even if overdue
      expect(getDeadlineState('DONE', '2026-09-20T12:00:00Z')).toBe('COMPLETED');
      // Even if upcoming
      expect(getDeadlineState('DONE', '2026-09-25T12:00:00Z')).toBe('COMPLETED');
    });

    it('returns OVERDUE if the current time is past the due date', () => {
      expect(getDeadlineState('TODO', '2026-09-21T11:59:59Z')).toBe('OVERDUE');
      expect(getDeadlineState('IN_PROGRESS', '2026-09-20T12:00:00Z')).toBe('OVERDUE');
    });

    it('returns OVERDUE if the current time is exactly the due date', () => {
      expect(getDeadlineState('TODO', '2026-09-21T12:00:00Z')).toBe('OVERDUE');
    });

    it('returns DUE_SOON for dates within the warning hours (48h)', () => {
      // 24 hours from now
      expect(getDeadlineState('TODO', '2026-09-22T12:00:00Z')).toBe('DUE_SOON');
      // 47 hours from now
      expect(getDeadlineState('TODO', '2026-09-23T11:00:00Z')).toBe('DUE_SOON');
    });

    it('returns DUE_SOON at the exact 48-hour boundary', () => {
      // Exactly 48 hours from now
      expect(getDeadlineState('TODO', '2026-09-23T12:00:00Z')).toBe('DUE_SOON');
    });

    it('returns UPCOMING for dates beyond the warning hours', () => {
      // 48 hours and 1 second from now
      expect(getDeadlineState('TODO', '2026-09-23T12:00:01Z')).toBe('UPCOMING');
      // 1 week from now
      expect(getDeadlineState('TODO', '2026-09-28T12:00:00Z')).toBe('UPCOMING');
    });
  });

  describe('formatDate', () => {
    it('returns empty string if no date is provided', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });

    it('formats valid ISO strings according to default options', () => {
      const result = formatDate('2026-09-21T12:00:00Z');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe('Invalid Date');
    });

    it('applies custom format options when provided', () => {
      const result = formatDate('2026-09-21T12:00:00Z', { year: 'numeric', timeZone: 'UTC' });
      expect(typeof result).toBe('string');
      expect(result).toContain('2026');
    });
  });
});
