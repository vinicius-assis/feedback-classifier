import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Heading,
  HStack,
  Skeleton,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';

import { useFeedbackItem } from '../hooks/useFeedback';
import { ApiError } from '../lib/api';
import type { Sentiment } from '../lib/types';

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

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
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

export function FeedbackDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam?.trim() ?? '';
  const navigate = useNavigate();
  const query = useFeedbackItem(id);

  if (!id) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack align="stretch" gap={4}>
          <Button variant="ghost" alignSelf="flex-start" onClick={() => navigate('/dashboard')}>
            ← Back
          </Button>
          <Alert.Root status="error" variant="subtle">
            <Alert.Title>Invalid feedback ID</Alert.Title>
            <Alert.Description>The URL does not include a valid item id.</Alert.Description>
          </Alert.Root>
        </VStack>
      </Container>
    );
  }

  if (query.isLoading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack align="stretch" gap={6}>
          <Skeleton height="10" />
          <Skeleton height="200px" borderRadius="l2" />
          <Skeleton height="180px" borderRadius="l2" />
        </VStack>
      </Container>
    );
  }

  if (query.isError) {
    const err = query.error;
    const is404 = err instanceof ApiError && err.status === 404;
    return (
      <Container maxW="7xl" py={8}>
        <VStack align="stretch" gap={4}>
          <Button variant="ghost" alignSelf="flex-start" onClick={() => navigate('/dashboard')}>
            ← Back
          </Button>
          <Alert.Root status="error" variant="subtle">
            <Alert.Title>{is404 ? 'Item not found.' : 'Failed to load feedback item.'}</Alert.Title>
            {!is404 && err instanceof Error ? (
              <Alert.Description>{err.message}</Alert.Description>
            ) : null}
          </Alert.Root>
        </VStack>
      </Container>
    );
  }

  const item = query.data;
  if (!item) {
    return null;
  }

  const failed = item.classificationStatus === 'failed';

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" gap={8}>
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <Badge colorPalette="gray" variant="subtle" fontFamily="mono" fontSize="xs">
            {item._id}
          </Badge>
        </HStack>

        <VStack align="stretch" gap={1}>
          <Heading as="h1" size="xl">
            Feedback detail
          </Heading>
          <Text color="fg.muted">Raw text and classification snapshot.</Text>
        </VStack>

        <Card.Root variant="subtle">
          <Card.Header>
            <Card.Title>Raw text</Card.Title>
          </Card.Header>
          <Card.Body>
            <Text whiteSpace="pre-wrap">{item.rawText}</Text>
          </Card.Body>
        </Card.Root>

        <Card.Root variant="subtle" borderColor={failed ? 'red.emphasized' : undefined}>
          <Card.Header>
            <Card.Title>Classification</Card.Title>
          </Card.Header>
          <Card.Body>
            <Stack gap={4}>
              <HStack flexWrap="wrap" gap={2}>
                {item.classificationStatus ? (
                  <Badge colorPalette={failed ? 'red' : 'green'} variant="subtle">
                    {item.classificationStatus}
                  </Badge>
                ) : null}
                {item.sentiment ? (
                  <Badge colorPalette={sentimentPalette(item.sentiment)} variant="subtle">
                    {item.sentiment}
                  </Badge>
                ) : null}
                {item.featureArea ? (
                  <Badge variant="subtle" textTransform="capitalize">
                    {item.featureArea}
                  </Badge>
                ) : null}
                {item.urgency ? (
                  <Badge variant="subtle" textTransform="capitalize">
                    {item.urgency}
                  </Badge>
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
              {item.classificationRaw !== undefined && item.classificationRaw !== null ? (
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

        {failed ? (
          <Alert.Root status="error" variant="subtle">
            <Alert.Title>Classification error</Alert.Title>
            <Alert.Description whiteSpace="pre-wrap">
              {item.classificationError ?? 'No error details recorded.'}
            </Alert.Description>
          </Alert.Root>
        ) : null}

        <Card.Root variant="subtle">
          <Card.Header>
            <Card.Title>Source &amp; metadata</Card.Title>
          </Card.Header>
          <Card.Body>
            <Stack gap={2}>
              <Text>
                <Text as="span" color="fg.muted">
                  Source:{' '}
                </Text>
                <Text as="span" textTransform="capitalize">
                  {item.source.replace(/_/g, ' ')}
                </Text>
              </Text>
              {item.sourceMetadata?.externalMessageId ? (
                <Text>
                  <Text as="span" color="fg.muted">
                    External message ID:{' '}
                  </Text>
                  <Text as="span" fontFamily="mono">
                    {item.sourceMetadata.externalMessageId}
                  </Text>
                </Text>
              ) : null}
              {item.sourceMetadata?.channel ? (
                <Text>
                  <Text as="span" color="fg.muted">
                    Channel:{' '}
                  </Text>
                  {item.sourceMetadata.channel}
                </Text>
              ) : null}
              {item.sourceMetadata?.userDisplayName ? (
                <Text>
                  <Text as="span" color="fg.muted">
                    User:{' '}
                  </Text>
                  {item.sourceMetadata.userDisplayName}
                </Text>
              ) : null}
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
      </VStack>
    </Container>
  );
}
