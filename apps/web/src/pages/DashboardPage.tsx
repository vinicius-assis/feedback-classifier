import { Heading, Text, VStack } from '@chakra-ui/react';

export function DashboardPage() {
  return (
    <VStack align="stretch" gap={2} py={8}>
      <Heading as="h1" size="xl">
        Dashboard
      </Heading>
      <Text color="fg.muted">Feedback overview and filters will appear here.</Text>
    </VStack>
  );
}
