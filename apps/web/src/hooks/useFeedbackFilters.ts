import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  CLASSIFICATION_STATUS_OPTIONS,
  FEATURE_AREA_OPTIONS,
  parseOption,
  SENTIMENT_OPTIONS,
  SOURCE_OPTIONS,
  URGENCY_OPTIONS,
} from '../lib/domain';
import type { FeedbackFilters } from '../lib/types';

export const DEFAULT_LIMIT = 20;

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * Keeps the dashboard filters in the query string, so the view survives a
 * reload and can be shared as a link. Unknown values are dropped rather than
 * forwarded to the API.
 */
export function useFeedbackFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<FeedbackFilters>(
    () => ({
      page: parsePage(searchParams.get('page')),
      limit: DEFAULT_LIMIT,
      sentiment: parseOption(searchParams.get('sentiment'), SENTIMENT_OPTIONS),
      featureArea: parseOption(searchParams.get('featureArea'), FEATURE_AREA_OPTIONS),
      urgency: parseOption(searchParams.get('urgency'), URGENCY_OPTIONS),
      source: parseOption(searchParams.get('source'), SOURCE_OPTIONS),
      classificationStatus: parseOption(
        searchParams.get('classificationStatus'),
        CLASSIFICATION_STATUS_OPTIONS,
      ),
    }),
    [searchParams],
  );

  /** Changing any filter resets pagination; page 1 stays out of the URL. */
  const setFilter = useCallback(
    (key: Exclude<keyof FeedbackFilters, 'page' | 'limit'>, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (page > 1) next.set('page', String(page));
          else next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { filters, setFilter, setPage, resetFilters };
}
