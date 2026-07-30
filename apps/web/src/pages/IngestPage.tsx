import { Button, Container, Field, Textarea, VStack } from '@chakra-ui/react';
import { FormEvent, useState } from 'react';

import { FormCard } from '../components/FormCard';
import { PageHeader } from '../components/PageHeader';
import { useIngestFeedback } from '../hooks/useIngest';
import { classificationToast } from '../lib/classificationToast';
import { errorMessage } from '../lib/errors';
import { toaster } from '../lib/toaster';

export function IngestPage() {
  const [rawText, setRawText] = useState('');

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
      { rawText: trimmed, source: 'web_form' },
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
        <PageHeader
          title="Ingest feedback"
          description="Submit a single feedback item for classification."
        />

        <FormCard>
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

              <Button type="submit" loading={isPending} alignSelf="flex-start">
                Submit
              </Button>
            </VStack>
          </form>
        </FormCard>
      </VStack>
    </Container>
  );
}
