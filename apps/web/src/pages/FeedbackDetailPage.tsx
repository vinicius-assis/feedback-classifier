import { Heading, Text, VStack } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';

export function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <VStack align="stretch" gap={2} py={8}>
      <Heading as="h1" size="xl">
        Feedback detail
      </Heading>
      <Text color="fg.muted">
        Item ID: <strong>{id ?? '—'}</strong>
      </Text>
      <Text color="fg.muted">Raw text and classification will appear here.</Text>
    </VStack>
  );
}
