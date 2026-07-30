import { Box, Card, HStack, Stack, Text } from '@chakra-ui/react';

import type { FeedbackItem, Sentiment, Urgency } from '../../lib/types';
import { StatusBadge } from '../StatusBadge';

function sentimentPalette(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'positive':
      return 'green';
    case 'negative':
      return 'red';
    case 'neutral':
      return 'gray';
    case 'unknown':
    default:
      return 'orange';
  }
}

function urgencyPalette(urgency: Urgency | string): string {
  switch (urgency) {
    case 'critical':
      return 'red';
    case 'high':
      return 'orange';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'green';
    case 'unknown':
    default:
      return 'gray';
  }
}

function formatClassificationRaw(raw: unknown): string {
  if (raw === undefined || raw === null) return '—';
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
}

export function ClassificationCard({ item }: { item: FeedbackItem }) {
  const failed = item.classificationStatus === 'failed';
  const hasRaw = item.classificationRaw !== undefined && item.classificationRaw !== null;

  return (
    <Card.Root variant="subtle" borderColor={failed ? 'red.emphasized' : undefined}>
      <Card.Header>
        <Card.Title>Classification</Card.Title>
      </Card.Header>
      <Card.Body>
        <Stack gap={4}>
          <HStack flexWrap="wrap" gap={2} align="center" rowGap={2}>
            {item.classificationStatus ? (
              <StatusBadge colorPalette={failed ? 'red' : 'green'}>
                {item.classificationStatus}
              </StatusBadge>
            ) : null}
            {item.sentiment ? (
              <StatusBadge colorPalette={sentimentPalette(item.sentiment)}>
                {item.sentiment}
              </StatusBadge>
            ) : null}
            {item.featureArea ? (
              <StatusBadge colorPalette="purple">{item.featureArea}</StatusBadge>
            ) : null}
            {item.urgency ? (
              <StatusBadge colorPalette={urgencyPalette(item.urgency)}>{item.urgency}</StatusBadge>
            ) : null}
          </HStack>
          {item.summary ? (
            <Stack gap={1}>
              <Text fontWeight="semibold" fontSize="sm" color="fg.muted">
                Summary
              </Text>
              <Text>{item.summary}</Text>
            </Stack>
          ) : null}
          <HStack gap={4} flexWrap="wrap" color="fg.muted" fontSize="sm">
            {item.model ? <Text>Model: {item.model}</Text> : null}
            {item.promptVersion ? <Text>Prompt version: {item.promptVersion}</Text> : null}
          </HStack>
          {hasRaw ? (
            <Stack gap={1}>
              <Text fontWeight="semibold" fontSize="sm" color="fg.muted">
                Raw model output
              </Text>
              <Box
                as="pre"
                fontSize="sm"
                p={4}
                borderRadius="md"
                bg="bg.subtle"
                overflow="auto"
                whiteSpace="pre-wrap"
                fontFamily="mono"
              >
                {formatClassificationRaw(item.classificationRaw)}
              </Box>
            </Stack>
          ) : null}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
