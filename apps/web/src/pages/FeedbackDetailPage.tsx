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
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useFeedbackItem, useReclassifyFeedback } from '../hooks/useFeedback';
import { ApiError } from '../lib/api';
import { toaster } from '../lib/toaster';
import type { Sentiment, Urgency } from '../lib/types';

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

function IconCopy() {
  return (
    <Box as="span" display="inline-flex" flexShrink={0} lineHeight="0" aria-hidden>
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </Box>
  );
}

function IconCheck() {
  return (
    <Box as="span" display="inline-flex" flexShrink={0} lineHeight="0" aria-hidden>
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </Box>
  );
}

function IconReclassify() {
  return (
    <Box as="span" display="inline-flex" flexShrink={0} lineHeight="0" aria-hidden>
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 3" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 21" />
        <path d="M3 21v-5h5" />
      </svg>
    </Box>
  );
}

export function FeedbackDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam?.trim() ?? '';
  const navigate = useNavigate();
  const query = useFeedbackItem(id);
  const reclassifyMutation = useReclassifyFeedback(id);
  const [copied, setCopied] = useState(false);

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

  const itemId = item._id;
  function copyId() {
    navigator.clipboard.writeText(itemId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" gap={8}>
        <HStack justify="space-between" flexWrap="wrap" gap={4} align="flex-start" w="100%">
          <Button variant="ghost" onClick={() => navigate(-1)} flexShrink={0}>
            ← Back
          </Button>
          <HStack
            role="group"
            align="stretch"
            w="max-content"
            maxW="100%"
            gap={0}
            borderRadius="l2"
            borderWidth="1px"
            borderColor="border.subtle"
            boxShadow="xs"
            bg="bg.subtle"
            overflow="visible"
            isolation="isolate"
          >
            <Button
              type="button"
              size="sm"
              colorPalette="brand"
              variant="surface"
              borderRadius="0"
              borderLeftRadius="l2"
              borderRightRadius="0"
              px={3}
              h="auto"
              minH="9"
              minW="0"
              flexShrink={0}
              alignSelf="stretch"
              gap={2}
              loading={reclassifyMutation.isPending}
              onClick={() =>
                reclassifyMutation.mutate(undefined, {
                  onSuccess: () => {
                    toaster.create({
                      type: 'success',
                      title: 'Reclassified successfully',
                    });
                  },
                  onError: (err) => {
                    toaster.create({
                      type: 'error',
                      title: 'Reclassification failed',
                      description: err instanceof Error ? err.message : 'Unknown error',
                    });
                  },
                })
              }
            >
              <IconReclassify />
              Reclassify
            </Button>
            <Box alignSelf="stretch" w="1px" flexShrink={0} bg="border.subtle" my={0} />
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              alignSelf="stretch"
              minH="9"
              minW={0}
              w="max-content"
              maxW="100%"
              flexShrink={1}
              px={3.5}
              py={1.5}
              cursor="pointer"
              bg="bg.muted"
              borderRightRadius="l2"
              _hover={{ bg: 'bg.emphasized' }}
              transition="background 0.15s ease"
              onClick={copyId}
              title="Copy ID"
            >
              <Text
                as="span"
                fontFamily="mono"
                fontSize="xs"
                fontWeight="medium"
                letterSpacing="0.04em"
                lineHeight="tall"
                textTransform="uppercase"
                color={copied ? 'green.fg' : 'fg'}
                userSelect="all"
                whiteSpace="normal"
                wordBreak="break-all"
                transition="color 0.15s ease"
              >
                {copied ? 'Copied!' : item._id}
              </Text>
              <Box
                as="span"
                display="inline-flex"
                flexShrink={0}
                fontSize="xs"
                color={copied ? 'green.fg' : 'fg.muted'}
                transition="color 0.15s ease"
              >
                {copied ? <IconCheck /> : <IconCopy />}
              </Box>
            </Box>
          </HStack>
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
              <HStack flexWrap="wrap" gap={2} align="center" rowGap={2}>
                {item.classificationStatus ? (
                  <Badge
                    colorPalette={failed ? 'red' : 'green'}
                    variant="subtle"
                    textTransform="uppercase"
                    fontSize="xs"
                    letterSpacing="wide"
                  >
                    {item.classificationStatus}
                  </Badge>
                ) : null}
                {item.sentiment ? (
                  <Badge
                    colorPalette={sentimentPalette(item.sentiment)}
                    variant="subtle"
                    textTransform="uppercase"
                    fontSize="xs"
                    letterSpacing="wide"
                  >
                    {item.sentiment}
                  </Badge>
                ) : null}
                {item.featureArea ? (
                  <Badge
                    colorPalette="purple"
                    variant="subtle"
                    textTransform="uppercase"
                    fontSize="xs"
                    letterSpacing="wide"
                  >
                    {item.featureArea}
                  </Badge>
                ) : null}
                {item.urgency ? (
                  <Badge
                    colorPalette={urgencyPalette(item.urgency)}
                    variant="subtle"
                    textTransform="uppercase"
                    fontSize="xs"
                    letterSpacing="wide"
                  >
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
