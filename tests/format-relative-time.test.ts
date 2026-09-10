import { formatRelativeTime } from '@/lib/format-relative-time';

const NOW = new Date('2026-06-15T12:00:00.000Z');

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60_000);
}

describe('formatRelativeTime', () => {
  it('shows "Just now" for under a minute', () => {
    expect(formatRelativeTime(minutesAgo(0), NOW)).toBe('Just now');
    expect(formatRelativeTime(new Date(NOW.getTime() - 30_000), NOW)).toBe('Just now');
  });

  it('shows minutes for under an hour', () => {
    expect(formatRelativeTime(minutesAgo(1), NOW)).toBe('1m ago');
    expect(formatRelativeTime(minutesAgo(45), NOW)).toBe('45m ago');
  });

  it('shows hours for under a day', () => {
    expect(formatRelativeTime(minutesAgo(60), NOW)).toBe('1h ago');
    expect(formatRelativeTime(minutesAgo(60 * 5), NOW)).toBe('5h ago');
  });

  it('shows days for under a week', () => {
    expect(formatRelativeTime(minutesAgo(60 * 24), NOW)).toBe('1d ago');
    expect(formatRelativeTime(minutesAgo(60 * 24 * 6), NOW)).toBe('6d ago');
  });

  it('falls back to a formatted date without a year for the same year', () => {
    const sameYear = new Date('2026-01-05T12:00:00.000Z');
    expect(formatRelativeTime(sameYear, NOW)).toBe(
      sameYear.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    );
  });

  it('falls back to a formatted date including the year for a different year', () => {
    const lastYear = new Date('2025-06-01T12:00:00.000Z');
    expect(formatRelativeTime(lastYear, NOW)).toBe(
      lastYear.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    );
  });
});
