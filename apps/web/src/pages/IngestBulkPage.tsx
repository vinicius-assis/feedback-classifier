import { Button, Container, Field, Heading, Stack, Text, Textarea, VStack } from '@chakra-ui/react';
import { FormEvent, useState } from 'react';

import { useIngestBulk } from '../hooks/useIngest';
import { ApiError } from '../lib/api';
import { toaster } from '../lib/toaster';

const MAX_ITEMS = 20;

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Request failed';
}

export function IngestBulkPage() {
  const [bulkText, setBulkText] = useState('');
  const mutation = useIngestBulk();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const lines = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      toaster.create({
        type: 'error',
        title: 'Validation error',
        description: 'Enter at least one non-empty line of feedback.',
      });
      return;
    }

    if (lines.length > MAX_ITEMS) {
      toaster.create({
        type: 'error',
        title: 'Too many items',
        description: `Bulk ingest accepts at most ${MAX_ITEMS} items. You have ${lines.length} lines.`,
      });
      return;
    }

    mutation.mutate(
      { items: lines.map((rawText) => ({ rawText })) },
      {
        onSuccess: (results) => {
          const fulfilled = results.filter((r) => r.status === 'fulfilled');
          const rejected = results.filter((r) => r.status === 'rejected');
          const classificationFailed = fulfilled.filter(
            (r) => r.status === 'fulfilled' && r.data.classificationStatus === 'failed',
          ).length;
          const hasIssues = rejected.length > 0 || classificationFailed > 0;
          const type =
            rejected.length > 0 ? 'error' : classificationFailed > 0 ? 'warning' : 'success';

          const parts: string[] = [`${fulfilled.length} saved`];
          if (classificationFailed > 0) {
            parts.push(
              `${classificationFailed} classification failure${classificationFailed > 1 ? 's' : ''}`,
            );
          }
          if (rejected.length > 0) {
            parts.push(`${rejected.length} rejected`);
          }

          toaster.create({
            type,
            title: hasIssues ? 'Bulk ingest complete with issues' : 'Bulk ingest complete',
            description: parts.join(' · '),
            closable: true,
          });
          if (rejected.length === 0) {
            setBulkText('');
          }
        },
        onError: (error) => {
          toaster.create({
            type: 'error',
            title: 'Bulk ingest failed',
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
            Bulk ingest
          </Heading>
          <Text color="fg.muted">
            One feedback per line (max {MAX_ITEMS} lines). Each line is submitted as a separate item
            with source{' '}
            <Text as="span" fontWeight="medium">
              web_bulk
            </Text>
            .
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <VStack align="stretch" gap={4}>
            <Field.Root required>
              <Field.Label>Feedback lines</Field.Label>
              <Textarea
                value={bulkText}
                onChange={(ev) => setBulkText(ev.target.value)}
                placeholder={'Line 1…\nLine 2…'}
                rows={14}
                resize="vertical"
                fontFamily="mono"
                fontSize="sm"
              />
            </Field.Root>

            <Button type="submit" loading={mutation.isPending} alignSelf="flex-start">
              Submit bulk
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
}
