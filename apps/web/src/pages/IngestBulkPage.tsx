import { Button, Container, Field, Text, Textarea, VStack } from '@chakra-ui/react';
import { FormEvent, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { MAX_BULK_ITEMS } from '@feedback-classifier/shared';

import { FormCard } from '../components/FormCard';
import { PageHeader } from '../components/PageHeader';
import { useIngestBulk } from '../hooks/useIngest';
import { errorMessage } from '../lib/errors';
import { toaster } from '../lib/toaster';

/** The API rejects anything above this, so fail fast before the round trip. */
const MAX_ITEMS = MAX_BULK_ITEMS;

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
        <PageHeader
          title="Bulk ingest"
          description={
            <>
              One feedback per line (max {MAX_ITEMS} lines). Each line is submitted as a separate
              item with source{' '}
              <Text as="span" fontWeight="medium">
                web_bulk
              </Text>
              .
            </>
          }
          footnote={
            <>
              Have a spreadsheet?{' '}
              <NavLink to="/ingest/file">
                <Text as="span" color="fg" textDecoration="underline" _hover={{ opacity: 0.85 }}>
                  Import CSV or Excel
                </Text>
              </NavLink>
            </>
          }
        />

        <FormCard>
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
        </FormCard>
      </VStack>
    </Container>
  );
}
