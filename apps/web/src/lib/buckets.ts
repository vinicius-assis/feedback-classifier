/** A `$group` bucket as returned by the API stats aggregation. */
export type StatBucket = { _id: string | null; count: number };

/** Props shared by every chart that renders a single stats dimension. */
export type BucketChartProps = {
  buckets: StatBucket[] | undefined;
  isLoading: boolean;
};

/**
 * Indexes stats buckets by key. A null `_id` (documents never classified)
 * collapses into the `unknown` bucket the UI already renders.
 */
export function bucketCounts(buckets: StatBucket[] | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  if (!buckets) return counts;
  for (const bucket of buckets) {
    counts.set(String(bucket._id ?? 'unknown'), bucket.count);
  }
  return counts;
}
