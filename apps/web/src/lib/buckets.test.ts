import { describe, expect, it } from 'vitest';

import { bucketCounts } from './buckets';

describe('bucketCounts', () => {
  it('returns an empty map when buckets are undefined', () => {
    expect(bucketCounts(undefined).size).toBe(0);
  });

  it('indexes counts by _id', () => {
    const counts = bucketCounts([
      { _id: 'positive', count: 3 },
      { _id: 'negative', count: 1 },
    ]);
    expect(counts.get('positive')).toBe(3);
    expect(counts.get('negative')).toBe(1);
  });

  it('collapses a null _id into the unknown bucket', () => {
    expect(bucketCounts([{ _id: null, count: 5 }]).get('unknown')).toBe(5);
  });

  it('returns undefined for a key that has no bucket', () => {
    expect(bucketCounts([{ _id: 'positive', count: 3 }]).get('neutral')).toBeUndefined();
  });

  it('keeps the last value when a key repeats', () => {
    const counts = bucketCounts([
      { _id: 'a', count: 1 },
      { _id: 'a', count: 9 },
    ]);
    expect(counts.get('a')).toBe(9);
  });
});
