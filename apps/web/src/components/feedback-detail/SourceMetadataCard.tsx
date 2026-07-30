import { Card, HStack, Stack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

import { formatDate, humanizeSource } from '../../lib/format';
import type { FeedbackItem } from '@feedback-classifier/shared';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Text>
      <Text as="span" color="fg.muted">
        {label}:{' '}
      </Text>
      {children}
    </Text>
  );
}

export function SourceMetadataCard({ item }: { item: FeedbackItem }) {
  const metadata = item.sourceMetadata;

  return (
    <Card.Root variant="subtle">
      <Card.Header>
        <Card.Title>Source &amp; metadata</Card.Title>
      </Card.Header>
      <Card.Body>
        <Stack gap={2}>
          <Row label="Source">
            <Text as="span" textTransform="capitalize">
              {humanizeSource(item.source)}
            </Text>
          </Row>
          {metadata?.externalMessageId ? (
            <Row label="External message ID">
              <Text as="span" fontFamily="mono">
                {metadata.externalMessageId}
              </Text>
            </Row>
          ) : null}
          {metadata?.channel ? <Row label="Channel">{metadata.channel}</Row> : null}
          {metadata?.userDisplayName ? <Row label="User">{metadata.userDisplayName}</Row> : null}
          <HStack gap={6} flexWrap="wrap" pt={2}>
            <Text fontSize="sm" color="fg.muted">
              Created: {formatDate(item.createdAt)}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Updated: {formatDate(item.updatedAt)}
            </Text>
          </HStack>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
