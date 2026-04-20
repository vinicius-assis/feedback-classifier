import { useMutation, useQueryClient } from '@tanstack/react-query';

import { post } from '../lib/api';
import type {
  BulkFeedbackBody,
  BulkIngestResultItem,
  CreateFeedbackBody,
  FeedbackItem,
  SlackFeedbackBody,
} from '../lib/types';

function useInvalidateFeedback() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['feedback'] });
  };
}

export function useIngestFeedback() {
  const invalidate = useInvalidateFeedback();
  return useMutation({
    mutationFn: (body: CreateFeedbackBody) => post<FeedbackItem>('/feedback', body),
    onSuccess: invalidate,
  });
}

export function useIngestBulk() {
  const invalidate = useInvalidateFeedback();
  return useMutation({
    mutationFn: (body: BulkFeedbackBody) => post<BulkIngestResultItem[]>('/feedback/bulk', body),
    onSuccess: invalidate,
  });
}

export function useIngestSlack() {
  const invalidate = useInvalidateFeedback();
  return useMutation({
    mutationFn: ({ body, secret }: { body: SlackFeedbackBody; secret: string }) =>
      post<FeedbackItem>('/integrations/slack/feedback', body, {
        headers: { 'X-Ingest-Secret': secret },
      }),
    onSuccess: invalidate,
  });
}
