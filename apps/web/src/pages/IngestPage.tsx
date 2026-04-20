import {
  Button,
  Container,
  Field,
  Heading,
  NativeSelect,
  Stack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { FormEvent, useState } from 'react';

import { useIngestFeedback } from '../hooks/useIngest';
import { ApiError } from '../lib/api';
import { toaster } from '../lib/toaster';
import type { FeedbackSource } from '../lib/types';

const SOURCE_OPTIONS: { value: FeedbackSource; label: string }[] = [
  { value: 'web_form', label: 'Web form' },
  { value: 'web_bulk', label: 'Web bulk' },
  { value: 'slack_like', label: 'Slack-like' },
];

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Request failed';
}

export function IngestPage() {
  const [rawText, setRawText] = useState('');
  const [source, setSource] = useState<FeedbackSource>('web_form');
  const mutation = useIngestFeedback();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = rawText.trim();
    if (!trimmed) {
      toaster.create({
        type: 'error',
        title: 'Validation error',
        description: 'Please enter feedback text.',
      });
      return;
    }

    mutation.mutate(
      { rawText: trimmed, source },
      {
        onSuccess: (data) => {
          toaster.create({
            type: 'success',
            title: 'Feedback submitted',
            description: `Saved with id ${data._id}.`,
          });
          setRawText('');
        },
        onError: (error) => {
          toaster.create({
            type: 'error',
            title: 'Submission failed',
            description: errorMessage(error),
          });
        },
      },
    );
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" gap={6}>
        <Stack gap={1}>
          <Heading as="h1" size="xl">
            Ingest feedback
          </Heading>
          <Text color="fg.muted">Submit a single feedback item for classification.</Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <VStack align="stretch" gap={4} maxW="2xl">
            <Field.Root required>
              <Field.Label>Feedback text</Field.Label>
              <Textarea
                value={rawText}
                onChange={(ev) => setRawText(ev.target.value)}
                placeholder="Describe the feedback…"
                rows={8}
                resize="vertical"
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>Source</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={source}
                  onChange={(ev) => setSource(ev.target.value as FeedbackSource)}
                >
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Button type="submit" loading={mutation.isPending} alignSelf="flex-start">
              Submit
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
}
