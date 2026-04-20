import {
  Button,
  Container,
  Field,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { FormEvent, useState } from 'react';

import { useIngestFeedback, useIngestSlack } from '../hooks/useIngest';
import { ApiError } from '../lib/api';
import { toaster } from '../lib/toaster';
import type { FeedbackSource, SlackFeedbackBody } from '../lib/types';

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

export function IngestPage() {
  const [rawText, setRawText] = useState('');
  const [source, setSource] = useState<FeedbackSource>('web_form');
  const [externalMessageId, setExternalMessageId] = useState('');
  const [channel, setChannel] = useState('');
  const [userDisplayName, setUserDisplayName] = useState('');
  const [ingestSecret, setIngestSecret] = useState('');

  const ingestFeedback = useIngestFeedback();
  const ingestSlack = useIngestSlack();

  const isPending = ingestFeedback.isPending || ingestSlack.isPending;

  const handleSourceChange = (next: FeedbackSource) => {
    if (next !== 'slack_like') {
      clearSlackFields({
        setExternalMessageId,
        setChannel,
        setUserDisplayName,
        setIngestSecret,
      });
    }
    setSource(next);
  };

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

    if (source === 'slack_like') {
      const idTrimmed = externalMessageId.trim();
      const secretTrimmed = ingestSecret.trim();
      if (!idTrimmed) {
        toaster.create({
          type: 'error',
          title: 'Validation error',
          description: 'External message ID is required for Slack-like ingest.',
        });
        return;
      }
      if (!secretTrimmed) {
        toaster.create({
          type: 'error',
          title: 'Validation error',
          description: 'Ingest secret is required for Slack-like ingest.',
        });
        return;
      }

      const body: SlackFeedbackBody = {
        text: trimmed,
        externalMessageId: idTrimmed,
      };
      const ch = channel.trim();
      const un = userDisplayName.trim();
      if (ch) body.channel = ch;
      if (un) body.userDisplayName = un;

      ingestSlack.mutate(
        { body, secret: secretTrimmed },
        {
          onSuccess: (data) => {
            toaster.create({
              type: 'success',
              title: 'Feedback submitted',
              description: `Saved with id ${data._id}.`,
            });
            setRawText('');
            clearSlackFields({
              setExternalMessageId,
              setChannel,
              setUserDisplayName,
              setIngestSecret,
            });
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
      return;
    }

    ingestFeedback.mutate(
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
                  onChange={(ev) => handleSourceChange(ev.target.value as FeedbackSource)}
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

            {source === 'slack_like' && (
              <>
                <Field.Root required>
                  <Field.Label>External message ID</Field.Label>
                  <Input
                    value={externalMessageId}
                    onChange={(ev) => setExternalMessageId(ev.target.value)}
                    placeholder="e.g. slack message ts or unique id"
                    autoComplete="off"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Channel</Field.Label>
                  <Input
                    value={channel}
                    onChange={(ev) => setChannel(ev.target.value)}
                    placeholder="Optional — e.g. #feedback"
                    autoComplete="off"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>User display name</Field.Label>
                  <Input
                    value={userDisplayName}
                    onChange={(ev) => setUserDisplayName(ev.target.value)}
                    placeholder="Optional"
                    autoComplete="off"
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Ingest secret</Field.Label>
                  <Input
                    type="password"
                    value={ingestSecret}
                    onChange={(ev) => setIngestSecret(ev.target.value)}
                    placeholder="Matches SLACK_INGEST_SECRET on the API"
                    autoComplete="off"
                  />
                </Field.Root>
              </>
            )}

            <Button type="submit" loading={isPending} alignSelf="flex-start">
              Submit
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
}
