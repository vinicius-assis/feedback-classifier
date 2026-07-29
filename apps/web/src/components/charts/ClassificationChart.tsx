import { Card, HStack, Skeleton, Text } from '@chakra-ui/react';
import { BarList, type BarListData, useChart } from '@chakra-ui/charts';
import { useMemo } from 'react';

import { bucketCounts, type BucketChartProps } from '../../lib/buckets';

export function ClassificationChart({ buckets, isLoading }: BucketChartProps) {
  const counts = useMemo(() => bucketCounts(buckets), [buckets]);

  const successCount = counts.get('success') ?? 0;
  const failedCount = counts.get('failed') ?? 0;

  const chart = useChart<BarListData>({
    sort: { by: 'value', direction: 'desc' },
    data: [
      { name: 'Success', value: successCount },
      { name: 'Failed', value: failedCount },
    ],
    series: [{ name: 'name', color: 'green.subtle' }],
  });

  const total = successCount + failedCount;
  const getPercent = (v: number) => (total === 0 ? '0%' : `${((v / total) * 100).toFixed(0)}%`);

  if (isLoading) {
    return (
      <Card.Root variant="outline" h="full" display="flex" flexDir="column">
        <Card.Header flexShrink={0}>
          <Card.Title>Classification health</Card.Title>
        </Card.Header>
        <Card.Body flex="1" display="flex" flexDir="column" justifyContent="flex-end">
          <Skeleton height="120px" borderRadius="md" />
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root
      variant="outline"
      h="full"
      display="flex"
      flexDir="column"
      transition="box-shadow 0.2s ease"
      _hover={{ boxShadow: 'md' }}
    >
      <Card.Header pb={2} gap={1} flexShrink={0}>
        <Card.Title>Classification health</Card.Title>
        <Text fontSize="sm" color="fg.muted" fontWeight="normal">
          Success vs failed runs
        </Text>
      </Card.Header>
      <Card.Body flex="1" pt={0} display="flex" flexDir="column" justifyContent="flex-end" gap={4}>
        <HStack justify="flex-end">
          <Text fontSize="xs" color="fg.muted">
            {total.toLocaleString()} total
          </Text>
        </HStack>
        <BarList.Root chart={chart}>
          <BarList.Content>
            <BarList.Label title="Status" flex="1">
              <BarList.Bar />
            </BarList.Label>
            <BarList.Label title="Count" minW="20" titleAlignment="end">
              <BarList.Value valueFormatter={(v) => `${v.toLocaleString()} · ${getPercent(v)}`} />
            </BarList.Label>
          </BarList.Content>
        </BarList.Root>
      </Card.Body>
    </Card.Root>
  );
}
