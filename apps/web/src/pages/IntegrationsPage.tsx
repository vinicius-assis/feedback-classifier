import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Heading,
  HStack,
  List,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';

import { toaster } from '../lib/toaster';

function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim().replace(/\/$/, '');
  }
  return 'http://localhost:3000/api';
}

/** cURL example with JSON body in single-quoted -d (bash-safe escaping for embedded quotes). */
function buildSlackCurlExampleBashSafe(apiBase: string): string {
  const url = `${apiBase}/integrations/slack/feedback`;
  const bodyLines = [
    '{',
    '    "text": "Love the new loan dashboard!",',
    '    "externalMessageId": "slack-ts-1234567890.123456",',
    '    "channel": "#feedback",',
    '    "userDisplayName": "Jane Doe"',
    '  }',
  ];
  const bodyStr = bodyLines.join('\n');
  return [
    `curl -X POST ${url} \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "X-Ingest-Secret: <your-secret>" \\`,
    `  -d '${bodyStr.replace(/'/g, `'\\''`)}'`,
  ].join('\n');
}

export function IntegrationsPage() {
  const apiBase = getApiBaseUrl();
  const curlSnippet = useMemo(() => buildSlackCurlExampleBashSafe(apiBase), [apiBase]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlSnippet);
      setCopied(true);
      toaster.create({
        type: 'success',
        title: 'Copied',
        description: 'cURL example copied to clipboard.',
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toaster.create({
        type: 'error',
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
      });
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" gap={8}>
        <Stack gap={1}>
          <HStack gap={3} flexWrap="wrap" align="center">
            <Heading as="h1" size="xl">
              Integrations
            </Heading>
            <Badge colorPalette="purple" size="md" variant="subtle">
              Slack-like ingest
            </Badge>
          </HStack>
          <Text color="fg.muted" maxW="3xl">
            Send feedback from CS/Sales tools or scripts using the secured HTTP endpoint. Duplicate{' '}
            <Text as="span" fontWeight="semibold">
              externalMessageId
            </Text>{' '}
            values return{' '}
            <Text as="span" fontFamily="mono" fontSize="sm">
              200
            </Text>{' '}
            with the existing document (idempotent).
          </Text>
        </Stack>

        <Card.Root variant="outline">
          <Card.Header>
            <Card.Title>Endpoint</Card.Title>
            <Card.Description>
              <Text as="span" fontWeight="semibold">
                POST
              </Text>{' '}
              <Text as="span" fontFamily="mono" fontSize="sm">
                {apiBase}/integrations/slack/feedback
              </Text>
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <Stack gap={4} align="stretch">
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={2}>
                  Headers
                </Text>
                <List.Root gap={1}>
                  <List.Item>
                    <Text as="span" fontFamily="mono" fontSize="sm">
                      Content-Type: application/json
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text as="span" fontFamily="mono" fontSize="sm">
                      X-Ingest-Secret: &lt;matches SLACK_INGEST_SECRET on the API&gt;
                    </Text>
                  </List.Item>
                </List.Root>
              </Box>
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={2}>
                  JSON body
                </Text>
                <List.Root gap={1}>
                  <List.Item>
                    <Text fontSize="sm">
                      <Text as="span" fontFamily="mono">
                        text
                      </Text>{' '}
                      (string, required) — feedback content
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text fontSize="sm">
                      <Text as="span" fontFamily="mono">
                        externalMessageId
                      </Text>{' '}
                      (string, required) — unique id for idempotency
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text fontSize="sm">
                      <Text as="span" fontFamily="mono">
                        channel
                      </Text>{' '}
                      (string, optional)
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text fontSize="sm">
                      <Text as="span" fontFamily="mono">
                        userDisplayName
                      </Text>{' '}
                      (string, optional)
                    </Text>
                  </List.Item>
                </List.Root>
              </Box>
              <Text fontSize="sm" color="fg.muted">
                First create returns{' '}
                <Text as="span" fontFamily="mono">
                  201
                </Text>
                ; repeat with the same{' '}
                <Text as="span" fontFamily="mono">
                  externalMessageId
                </Text>{' '}
                returns{' '}
                <Text as="span" fontFamily="mono">
                  200
                </Text>{' '}
                with the stored item.
              </Text>
            </Stack>
          </Card.Body>
        </Card.Root>

        <Card.Root variant="outline" borderColor="purple.muted">
          <Card.Header>
            <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
              <Stack gap={1}>
                <Card.Title>cURL example</Card.Title>
                <Card.Description>
                  Copy and replace{' '}
                  <Text as="span" fontFamily="mono">
                    &lt;your-secret&gt;
                  </Text>{' '}
                  with your ingest secret.
                </Card.Description>
              </Stack>
              <Button size="sm" variant="outline" colorPalette="purple" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </HStack>
          </Card.Header>
          <Card.Body pt={0}>
            <Box
              as="pre"
              overflowX="auto"
              p={4}
              borderRadius="md"
              bg="bg.muted"
              borderWidth="1px"
              borderColor="border.subtle"
              fontSize="sm"
              fontFamily="mono"
              whiteSpace="pre"
              lineHeight="tall"
            >
              {curlSnippet}
            </Box>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}
