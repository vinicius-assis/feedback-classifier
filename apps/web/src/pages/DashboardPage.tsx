import {
  Button,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ClassificationChart } from '../components/charts/ClassificationChart';
import { FeatureAreaChart } from '../components/charts/FeatureAreaChart';
import { SentimentChart } from '../components/charts/SentimentChart';
import { SourceMixChart } from '../components/charts/SourceMixChart';
import { UrgencyChart } from '../components/charts/UrgencyChart';
import { FeedbackFilters } from '../components/dashboard/FeedbackFilters';
import { FeedbackTable } from '../components/dashboard/FeedbackTable';
import { Pagination } from '../components/dashboard/Pagination';
import { StatCard } from '../components/dashboard/StatCard';
import { DeleteFeedbackDialog } from '../components/DeleteFeedbackDialog';
import { ErrorAlert } from '../components/ErrorAlert';
import { useDeleteFeedback, useFeedbackList } from '../hooks/useFeedback';
import { useFeedbackFilters } from '../hooks/useFeedbackFilters';
import { useFeedbackStats } from '../hooks/useFeedbackStats';
import { bucketCounts } from '../lib/buckets';
import { SOURCE_OPTIONS } from '../lib/domain';

export function DashboardPage() {
  const navigate = useNavigate();
  const { filters, setFilter, setPage, resetFilters } = useFeedbackFilters();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const statsQuery = useFeedbackStats();
  const listQuery = useFeedbackList(filters);
  const deleteFeedback = useDeleteFeedback();

  const stats = statsQuery.data;

  const classificationCounts = useMemo(
    () => (stats ? bucketCounts(stats.byClassificationStatus) : new Map<string, number>()),
    [stats],
  );

  const totalCount = stats?.total?.[0]?.count ?? 0;
  const successCount = classificationCounts.get('success') ?? 0;
  const failedCount = classificationCounts.get('failed') ?? 0;
  const activeSourceChannels = useMemo(() => {
    if (!stats?.bySource) return 0;
    return stats.bySource.filter((b) => (b.count ?? 0) > 0).length;
  }, [stats]);

  const list = listQuery.data;
  const totalItems = list?.total ?? 0;
  const limit = filters.limit ?? 20;
  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return (
    <Container maxW="7xl" py={{ base: 6, md: 10 }}>
      <VStack align="stretch" gap={{ base: 8, md: 10 }}>
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={6}>
          <VStack align="stretch" gap={2} maxW="2xl">
            <Heading as="h1" size="2xl" fontWeight="semibold" letterSpacing="-0.02em">
              Dashboard
            </Heading>
            <Text color="fg.muted" fontSize="md" lineHeight="tall">
              Live feedback intelligence — volume, classification health, and trends at a glance.
            </Text>
          </VStack>
          <HStack gap={2} flexShrink={0}>
            <Button colorPalette="brand" onClick={() => navigate('/ingest')}>
              + Add feedback
            </Button>
            <Button variant="outline" onClick={() => navigate('/ingest/bulk')}>
              Bulk import
            </Button>
          </HStack>
        </HStack>

        {statsQuery.isError ? (
          <ErrorAlert
            title="Could not load stats"
            description="Check the API connection and try again."
          />
        ) : null}

        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4}>
          <StatCard
            title="Total feedback"
            value={totalCount}
            isLoading={statsQuery.isLoading}
            accent
          />
          <StatCard
            title="Classified (success)"
            value={successCount}
            isLoading={statsQuery.isLoading}
            valueColor="green.fg"
          />
          <StatCard
            title="Classification failed"
            value={failedCount}
            isLoading={statsQuery.isLoading}
            valueColor={failedCount > 0 ? 'red.fg' : 'fg'}
            borderColor={failedCount > 0 ? 'red.emphasized' : undefined}
          />
          <StatCard
            title="Active source channels"
            value={activeSourceChannels}
            isLoading={statsQuery.isLoading}
            suffix={`/ ${SOURCE_OPTIONS.length}`}
          />
        </SimpleGrid>

        <VStack align="stretch" gap={4}>
          <Heading
            size="sm"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            Insights
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} alignItems="stretch">
            <SentimentChart buckets={stats?.bySentiment} isLoading={statsQuery.isLoading} />
            <UrgencyChart buckets={stats?.byUrgency} isLoading={statsQuery.isLoading} />
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, lg: 3 }} gap={4} alignItems="stretch">
            <FeatureAreaChart buckets={stats?.byFeatureArea} isLoading={statsQuery.isLoading} />
            <ClassificationChart
              buckets={stats?.byClassificationStatus}
              isLoading={statsQuery.isLoading}
            />
            <SourceMixChart buckets={stats?.bySource} isLoading={statsQuery.isLoading} />
          </SimpleGrid>
        </VStack>

        <FeedbackFilters filters={filters} onChange={setFilter} onReset={resetFilters} />

        {listQuery.isError ? (
          <ErrorAlert
            title="Could not load feedback list"
            description="Check the API connection and try again."
          />
        ) : null}

        <Stack gap={3}>
          <HStack justify="space-between" flexWrap="wrap" gap={3}>
            <Heading size="md">Feedback</Heading>
            <Pagination
              page={page}
              totalPages={totalPages}
              isLoading={listQuery.isLoading}
              onPrev={() => setPage(Math.max(1, page - 1))}
              onNext={() => setPage(Math.min(totalPages, page + 1))}
            />
          </HStack>

          <FeedbackTable
            items={list?.data}
            isLoading={listQuery.isLoading}
            deletingId={deleteFeedback.isPending ? (deleteFeedback.variables ?? null) : null}
            onOpen={(id) => navigate(`/feedback/${id}`)}
            onDelete={(id) => setPendingDeleteId(id)}
          />
        </Stack>
      </VStack>

      <DeleteFeedbackDialog
        isOpen={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return;
          deleteFeedback.mutate(pendingDeleteId, {
            onSuccess: () => setPendingDeleteId(null),
            onError: () => setPendingDeleteId(null),
          });
        }}
        isDeleting={deleteFeedback.isPending}
      />
    </Container>
  );
}
