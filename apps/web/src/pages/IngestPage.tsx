import { Heading, Text, VStack } from '@chakra-ui/react';

export function IngestPage() {
  return (
    <VStack align="stretch" gap={2} py={8}>
      <Heading as="h1" size="xl">
        Ingest feedback
      </Heading>
      <Text color="fg.muted">Single feedback submission form will appear here.</Text>
    </VStack>
  );
}
