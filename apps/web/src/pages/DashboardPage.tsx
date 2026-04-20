import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Field,
  Heading,
  HStack,
  NativeSelect,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DeleteFeedbackDialog } from '../components/DeleteFeedbackDialog';
import { useDeleteFeedback, useFeedbackList } from '../hooks/useFeedback';
import { useFeedbackStats } from '../hooks/useFeedbackStats';
import type {
  ClassificationStatus,
  FeatureArea,
  FeedbackFilters,
  FeedbackItem,
  FeedbackSource,
  Sentiment,
  Urgency,
} from '../lib/types';

const DEFAULT_FILTERS: FeedbackFilters = { page: 1, limit: 20 };

const SENTIMENT_OPTIONS: Sentiment[] = ['positive', 'neutral', 'negative', 'unknown'];
const FEATURE_AREA_OPTIONS: FeatureArea[] = [
  'onboarding',
  'payments',
  'reporting',
  'performance',
  'security',
  'integrations',
  'other',
  'unknown',
];
const URGENCY_OPTIONS: Urgency[] = ['low', 'medium', 'high', 'unknown'];
const SOURCE_OPTIONS: FeedbackSource[] = ['web_form', 'web_bulk', 'slack_like'];
const CLASSIFICATION_STATUS_OPTIONS: ClassificationStatus[] = ['success', 'failed'];

function bucketCounts(buckets: { _id: string | null; count: number }[]) {
  const m = new Map<string, number>();
  for (const b of buckets) {
    m.set(String(b._id ?? 'unknown'), b.count);
  }
  return m;
}

function formatLabel(key: string) {
  return key.replace(/_/g, ' ');
}

function truncateText(text: string, max = 72) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatBreakdown({
  title,
  orderedKeys,
  counts,
}: {
  title: string;
  orderedKeys: string[];
  counts: Map<string, number>;
}) {
  return (
    <Card.Root variant="subtle">
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Body>
        <Stack gap={1}>
          {orderedKeys.map((key) => (
            <HStack key={key} justify="space-between" gap={4}>
              <Text textTransform="capitalize" color="fg.muted">
                {formatLabel(key)}
              </Text>
              <Text fontWeight="medium">{counts.get(key) ?? 0}</Text>
            </HStack>
          ))}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.1em"
      height="1.1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function FeedbackTableRow({
  item,
  onOpen,
  onDelete,
  isDeleting,
}: {
  item: FeedbackItem;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const failed = item.classificationStatus === 'failed';
  return (
    <Table.Row
      cursor="pointer"
      onClick={() => onOpen(item._id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item._id);
        }
      }}
      tabIndex={0}
      bg={failed ? 'red.subtle' : undefined}
      _hover={{ bg: failed ? 'red.muted' : 'bg.subtle' }}
    >
      <Table.Cell whiteSpace="nowrap">{formatDate(item.createdAt)}</Table.Cell>
      <Table.Cell maxW="sm">
        <Text lineClamp={2}>{truncateText(item.rawText, 120)}</Text>
      </Table.Cell>
      <Table.Cell textTransform="capitalize">{item.source.replace(/_/g, ' ')}</Table.Cell>
      <Table.Cell textTransform="capitalize">{item.sentiment ?? '—'}</Table.Cell>
      <Table.Cell textTransform="capitalize">{item.featureArea ?? '—'}</Table.Cell>
      <Table.Cell textTransform="capitalize">{item.urgency ?? '—'}</Table.Cell>
      <Table.Cell>
        {item.classificationStatus ? (
          <Badge colorPalette={failed ? 'red' : 'green'} variant="subtle">
            {item.classificationStatus}
          </Badge>
        ) : (
          '—'
        )}
      </Table.Cell>
      <Table.Cell onClick={(e) => e.stopPropagation()}>
        <Button
          size="xs"
          variant="ghost"
          colorPalette="red"
          aria-label="Remove feedback"
          loading={isDeleting}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item._id);
          }}
        >
          <TrashIcon />
        </Button>
      </Table.Cell>
    </Table.Row>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FeedbackFilters>(DEFAULT_FILTERS);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const statsQuery = useFeedbackStats();
  const listQuery = useFeedbackList(filters);
  const deleteFeedback = useDeleteFeedback();

  const stats = statsQuery.data;

  const sentimentCounts = useMemo(
    () => (stats ? bucketCounts(stats.bySentiment) : new Map<string, number>()),
    [stats],
  );
  const urgencyCounts = useMemo(
    () => (stats ? bucketCounts(stats.byUrgency) : new Map<string, number>()),
    [stats],
  );
  const classificationCounts = useMemo(
    () => (stats ? bucketCounts(stats.byClassificationStatus) : new Map<string, number>()),
    [stats],
  );

  const totalCount = stats?.total?.[0]?.count ?? 0;
  const successCount = classificationCounts.get('success') ?? 0;
  const failedCount = classificationCounts.get('failed') ?? 0;

  const list = listQuery.data;
  const totalItems = list?.total ?? 0;
  const limit = filters.limit ?? 20;
  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  const updateFilter = <K extends keyof FeedbackFilters>(
    key: K,
    value: FeedbackFilters[K] | '',
  ) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      [key]: value === '' ? undefined : value,
    }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const goPrev = () => setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }));
  const goNext = () =>
    setFilters((f) => ({
      ...f,
      page: Math.min(totalPages, (f.page ?? 1) + 1),
    }));

  return (
    <Container maxW="7xl" py={8}>
      <VStack align="stretch" gap={8}>
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
          <VStack align="stretch" gap={1}>
            <Heading as="h1" size="xl">
              Dashboard
            </Heading>
            <Text color="fg.muted">Feedback overview, filters, and recent items.</Text>
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
          <Alert.Root status="error" variant="subtle">
            <Alert.Title>Could not load stats</Alert.Title>
            <Alert.Description>Check the API connection and try again.</Alert.Description>
          </Alert.Root>
        ) : null}

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
          <Card.Root variant="subtle">
            <Card.Header>
              <Card.Title>Total feedback</Card.Title>
            </Card.Header>
            <Card.Body>
              {statsQuery.isLoading ? (
                <Skeleton height="10" />
              ) : (
                <Text fontSize="3xl" fontWeight="bold">
                  {totalCount}
                </Text>
              )}
            </Card.Body>
          </Card.Root>

          {statsQuery.isLoading ? (
            <>
              <Skeleton height="140px" borderRadius="l2" />
              <Skeleton height="140px" borderRadius="l2" />
            </>
          ) : (
            <>
              <StatBreakdown
                title="By sentiment"
                orderedKeys={SENTIMENT_OPTIONS}
                counts={sentimentCounts}
              />
              <StatBreakdown
                title="By urgency"
                orderedKeys={URGENCY_OPTIONS}
                counts={urgencyCounts}
              />
            </>
          )}

          <Card.Root variant="subtle" borderColor={failedCount > 0 ? 'red.emphasized' : undefined}>
            <Card.Header>
              <Card.Title>Classification</Card.Title>
            </Card.Header>
            <Card.Body>
              {statsQuery.isLoading ? (
                <Skeleton height="16" />
              ) : (
                <Stack gap={2}>
                  <HStack justify="space-between">
                    <Text color="fg.muted">Success</Text>
                    <Badge colorPalette="green" variant="subtle">
                      {successCount}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="fg.muted">Failed</Text>
                    <Badge colorPalette="red" variant="subtle">
                      {failedCount}
                    </Badge>
                  </HStack>
                </Stack>
              )}
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        <Stack gap={4}>
          <Heading size="md">Filters</Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} gap={4}>
            <Field.Root>
              <Field.Label>Sentiment</Field.Label>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={filters.sentiment ?? ''}
                  onChange={(e) =>
                    updateFilter('sentiment', (e.target.value as Sentiment) || undefined)
                  }
                >
                  <option value="">All</option>
                  {SENTIMENT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Feature area</Field.Label>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={filters.featureArea ?? ''}
                  onChange={(e) =>
                    updateFilter('featureArea', (e.target.value as FeatureArea) || undefined)
                  }
                >
                  <option value="">All</option>
                  {FEATURE_AREA_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Urgency</Field.Label>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={filters.urgency ?? ''}
                  onChange={(e) =>
                    updateFilter('urgency', (e.target.value as Urgency) || undefined)
                  }
                >
                  <option value="">All</option>
                  {URGENCY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Source</Field.Label>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={filters.source ?? ''}
                  onChange={(e) =>
                    updateFilter('source', (e.target.value as FeedbackSource) || undefined)
                  }
                >
                  <option value="">All</option>
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Classification status</Field.Label>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  value={filters.classificationStatus ?? ''}
                  onChange={(e) =>
                    updateFilter(
                      'classificationStatus',
                      (e.target.value as ClassificationStatus) || undefined,
                    )
                  }
                >
                  <option value="">All</option>
                  {CLASSIFICATION_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
          </SimpleGrid>

          <HStack justify="flex-end">
            <Button size="sm" variant="outline" onClick={resetFilters}>
              Reset filters
            </Button>
          </HStack>
        </Stack>

        {listQuery.isError ? (
          <Alert.Root status="error" variant="subtle">
            <Alert.Title>Could not load feedback list</Alert.Title>
            <Alert.Description>Check the API connection and try again.</Alert.Description>
          </Alert.Root>
        ) : null}

        <Stack gap={3}>
          <HStack justify="space-between" flexWrap="wrap" gap={3}>
            <Heading size="md">Feedback</Heading>
            <HStack gap={2}>
              <Button
                size="sm"
                variant="outline"
                onClick={goPrev}
                disabled={page <= 1 || listQuery.isLoading}
              >
                Previous
              </Button>
              <Text fontSize="sm" color="fg.muted">
                Page {page} of {totalPages}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={goNext}
                disabled={page >= totalPages || listQuery.isLoading}
              >
                Next
              </Button>
            </HStack>
          </HStack>

          <Table.ScrollArea borderWidth="1px" rounded="md">
            <Table.Root size="sm" striped interactive>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader>Text</Table.ColumnHeader>
                  <Table.ColumnHeader>Source</Table.ColumnHeader>
                  <Table.ColumnHeader>Sentiment</Table.ColumnHeader>
                  <Table.ColumnHeader>Feature area</Table.ColumnHeader>
                  <Table.ColumnHeader>Urgency</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader w="1%">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {listQuery.isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Table.Row key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <Table.Cell key={j}>
                            <Skeleton height="4" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : null}

                {!listQuery.isLoading && list && list.data.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={8}>
                      <Text color="fg.muted" py={4} textAlign="center">
                        No feedback matches these filters.
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ) : null}

                {!listQuery.isLoading && list
                  ? list.data.map((item) => (
                      <FeedbackTableRow
                        key={item._id}
                        item={item}
                        onOpen={(id) => navigate(`/feedback/${id}`)}
                        onDelete={(id) => setPendingDeleteId(id)}
                        isDeleting={
                          deleteFeedback.isPending &&
                          deleteFeedback.variables === item._id
                        }
                      />
                    ))
                  : null}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
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
