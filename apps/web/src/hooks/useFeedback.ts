import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { get, remove, withQuery } from '../lib/api';
import type { FeedbackFilters, FeedbackItem, FeedbackListResult } from '../lib/types';

function listPath(filters: FeedbackFilters): string {
  return withQuery('/feedback', {
    page: filters.page,
    limit: filters.limit,
    sentiment: filters.sentiment,
    featureArea: filters.featureArea,
    urgency: filters.urgency,
    source: filters.source,
    classificationStatus: filters.classificationStatus,
  });
}

export function useFeedbackList(filters: FeedbackFilters) {
  return useQuery({
    queryKey: ['feedback', 'list', filters] as const,
    queryFn: () => get<FeedbackListResult>(listPath(filters)),
  });
}

export function useFeedbackItem(id: string) {
  return useQuery({
    queryKey: ['feedback', 'detail', id] as const,
    queryFn: () => get<FeedbackItem>(`/feedback/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove(`/feedback/${encodeURIComponent(id)}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}
