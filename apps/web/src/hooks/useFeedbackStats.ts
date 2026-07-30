import { useQuery } from '@tanstack/react-query';

import { get } from '../lib/api';
import type { FeedbackStatsSummary } from '@feedback-classifier/shared';

export function useFeedbackStats() {
  return useQuery({
    queryKey: ['feedback', 'stats'] as const,
    queryFn: () => get<FeedbackStatsSummary>('/feedback/stats/summary'),
  });
}
