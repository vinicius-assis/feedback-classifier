import {
  Box,
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
import type { FeedbackItem, FeedbackSource } from '../lib/types';

const SOURCE_OPTIONS: { value: FeedbackSource; label: string }[] = [
  { value: 'web_form', label: 'Web form' },
  { value: 'web_bulk', label: 'Web bulk' },
  // { value: 'slack_like', label: 'Slack-like' }, // Slack — disabled in web app
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

function classificationToast(data: FeedbackItem): {
  type: 'success' | 'warning';
  description: string;
} {
  if (data.classificationStatus === 'failed') {
    return { type: 'warning', description: 'Saved · Classification failed' };
  }
  if (data.classificationStatus === 'success') {
    const parts = [
      data.sentiment && data.sentiment !== 'unknown' ? `Sentiment: ${data.sentiment}` : null,
      data.featureArea && data.featureArea !== 'unknown' ? `Area: ${data.featureArea}` : null,
      data.urgency && data.urgency !== 'unknown' ? `Urgency: ${data.urgency}` : null,
    ].filter(Boolean);
    return {
      type: 'success',
      description: parts.length > 0 ? parts.join(' · ') : 'Classification complete',
    };
  }
  return { type: 'success', description: 'Saved' };
}

/* Slack — clearSlackFields and slack ingest path removed (web app only)
function clearSlackFields(setters: {
  setExternalMessageId: (v: string) => void;
  setChannel: (v: string) => void;
  setUserDisplayName: (v: string) => void;
  setIngestSecret: (v: string) => void;
}) {
  setters.setExternalMessageId('');
  setters.setChannel('');
  setters.setUserDisplayName('');
  setters.setIngestSecret('');
}
*/

export function IngestPage() {
  const [rawText, setRawText] = useState('');
  const [source, setSource] = useState<FeedbackSource>('web_form');

  const ingestFeedback = useIngestFeedback();

  const isPending = ingestFeedback.isPending;

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

    ingestFeedback.mutate(
      { rawText: trimmed, source },
      {
        onSuccess: (data) => {
          const { type, description } = classificationToast(data);
          toaster.create({
            type,
            title: 'Feedback submitted',
            description,
            closable: true,
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

        <Box
          maxW="2xl"
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          bg="bg.subtle"
          p={6}
        >
          <form onSubmit={handleSubmit}>
            <VStack align="stretch" gap={4}>
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

              <Button type="submit" loading={isPending} alignSelf="flex-start">
                Submit
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
}
