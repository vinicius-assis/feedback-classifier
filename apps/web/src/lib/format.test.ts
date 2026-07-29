import { describe, expect, it } from 'vitest';

import { formatDate, humanizeSource, truncateText } from './format';

describe('formatDate', () => {
  it('returns an em dash when the value is missing', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('formats a valid ISO date', () => {
    const formatted = formatDate('2026-04-16T12:00:00.000Z');
    expect(formatted).not.toBe('—');
    expect(formatted).toMatch(/2026/);
  });

  it('returns the raw string when the date is unparsable', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('truncateText', () => {
  it('leaves text shorter than the limit untouched', () => {
    expect(truncateText('short', 10)).toBe('short');
  });

  it('leaves text exactly at the limit untouched', () => {
    expect(truncateText('abcde', 5)).toBe('abcde');
  });

  it('truncates and appends an ellipsis past the limit', () => {
    expect(truncateText('abcdef', 5)).toBe('abcde…');
  });

  it('defaults the limit to 72 characters', () => {
    const long = 'a'.repeat(100);
    expect(truncateText(long)).toBe(`${'a'.repeat(72)}…`);
  });
});

describe('humanizeSource', () => {
  it('replaces every underscore with a space', () => {
    expect(humanizeSource('web_form')).toBe('web form');
    expect(humanizeSource('slack_like')).toBe('slack like');
  });

  it('leaves a source without underscores untouched', () => {
    expect(humanizeSource('web')).toBe('web');
  });
});
