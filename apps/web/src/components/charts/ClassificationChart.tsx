import { HStack, Text } from '@chakra-ui/react';
import { BarList, type BarListData, useChart } from '@chakra-ui/charts';
import { useMemo } from 'react';

import { bucketCounts, type BucketChartProps } from '../../lib/buckets';
import { CLASSIFICATION_STATUS_DIMENSION } from '../../lib/domain';
import { ChartCard } from './ChartCard';

export function ClassificationChart({ buckets, isLoading }: BucketChartProps) {
  const counts = useMemo(() => bucketCounts(buckets), [buckets]);

  const data = useMemo(
    () =>
      CLASSIFICATION_STATUS_DIMENSION.map(({ key, label }) => ({
        name: label,
        value: counts.get(key) ?? 0,
      })),
    [counts],
  );

  const chart = useChart<BarListData>({
    sort: { by: 'value', direction: 'desc' },
    data,
    series: [{ name: 'name', color: 'green.subtle' }],
  });

  const total = data.reduce((acc, d) => acc + d.value, 0);
  const getPercent = (v: number) => (total === 0 ? '0%' : `${((v / total) * 100).toFixed(0)}%`);

  return (
    <ChartCard
      title="Classification health"
      description="Success vs failed runs"
      isLoading={isLoading}
      skeletonHeight="120px"
      bodyProps={{
        display: 'flex',
        flexDir: 'column',
        justifyContent: 'flex-end',
        gap: 4,
      }}
    >
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
    </ChartCard>
  );
}
