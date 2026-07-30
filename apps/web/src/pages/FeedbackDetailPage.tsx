import {
  Box,
  Button,
  Card,
  Container,
  Heading,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';

import { ErrorAlert } from '../components/ErrorAlert';
import { ClassificationCard } from '../components/feedback-detail/ClassificationCard';
import { CopyableId } from '../components/feedback-detail/CopyableId';
import { SourceMetadataCard } from '../components/feedback-detail/SourceMetadataCard';
import { ReclassifyIcon } from '../components/icons';
import { useFeedbackItem, useReclassifyFeedback } from '../hooks/useFeedback';
import { ApiError } from '../lib/api';
import { toaster } from '../lib/toaster';

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" alignSelf="flex-start" onClick={onClick} flexShrink={0}>
      ← Back
    </Button>
  );
}

export function FeedbackDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam?.trim() ?? '';
  const navigate = useNavigate();
  const query = useFeedbackItem(id);
  const reclassifyMutation = useReclassifyFeedback(id);

  if (!id) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack align="stretch" gap={4}>
          <BackButton onClick={() => navigate('/dashboard')} />
          <ErrorAlert
            title="Invalid feedback ID"
            description="The URL does not include a valid item id."
          />
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
          <BackButton onClick={() => navigate('/dashboard')} />
          <ErrorAlert
            title={is404 ? 'Item not found.' : 'Failed to load feedback item.'}
            description={!is404 && err instanceof Error ? err.message : undefined}
          />
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
        <HStack justify="space-between" flexWrap="wrap" gap={4} align="flex-start" w="100%">
          <BackButton onClick={() => navigate(-1)} />
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
              <ReclassifyIcon />
              Reclassify
            </Button>
            <Box alignSelf="stretch" w="1px" flexShrink={0} bg="border.subtle" my={0} />
            <CopyableId id={item._id} />
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

        <ClassificationCard item={item} />

        {failed ? (
          <ErrorAlert
            title="Classification error"
            description={item.classificationError ?? 'No error details recorded.'}
            preserveWhitespace
          />
        ) : null}

        <SourceMetadataCard item={item} />
      </VStack>
    </Container>
  );
}
