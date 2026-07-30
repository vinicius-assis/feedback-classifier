import { useMutation, useQueryClient } from '@tanstack/react-query';

import { post, postForm } from '../lib/api';
import type {
  BulkFeedbackBody,
  BulkIngestResultItem,
  CreateFeedbackBody,
  FeedbackImportResult,
  FeedbackItem,
} from '@feedback-classifier/shared';

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

export function useIngestFile() {
  const invalidate = useInvalidateFeedback();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return postForm<FeedbackImportResult>('/feedback/import', formData);
    },
    onSuccess: invalidate,
  });
}
