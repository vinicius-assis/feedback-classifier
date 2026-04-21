import { Container, Heading, Text, VStack } from '@chakra-ui/react';

/*
 * Slack / Slack-like HTTP ingest documentation (buildSlackCurlExampleBashSafe, copy, cards)
 * was removed from the web app — endpoint may still exist on the API.
 */

export function IntegrationsPage() {
  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" gap={4}>
        <Heading as="h1" size="xl">
          Integrations
        </Heading>
        <Text color="fg.muted" maxW="3xl">
          No third-party integrations are exposed in this web app.
        </Text>
      </VStack>
    </Container>
  );
}
