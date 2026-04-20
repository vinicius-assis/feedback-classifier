import { Heading, Text, VStack } from '@chakra-ui/react';

export function IngestBulkPage() {
  return (
    <VStack align="stretch" gap={2} py={8}>
      <Heading as="h1" size="xl">
        Bulk ingest
      </Heading>
      <Text color="fg.muted">Bulk feedback submission will appear here.</Text>
    </VStack>
  );
}
