import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';

import { bucketCounts, type BucketChartProps } from '../../lib/buckets';
import { SOURCE_DIMENSION } from '../../lib/domain';
import { ChartCard } from './ChartCard';

type ChartRow = {
  key: string;
  label: string;
  value: number;
  colorToken: string;
};

export function SourceMixChart({ buckets, isLoading }: BucketChartProps) {
  const { rows, total } = useMemo(() => {
    if (!buckets) return { rows: [] as ChartRow[], total: 0 };
    const counts = bucketCounts(buckets);
    const fullTotal = [...counts.values()].reduce((acc, v) => acc + v, 0);

    const coreRows: ChartRow[] = SOURCE_DIMENSION.map(({ key, label, colorToken }) => ({
      key,
      label,
      value: counts.get(key) ?? 0,
      colorToken,
    }));

    // Anything the web app does not ingest itself (legacy `slack_like` rows,
    // future sources) still has to show up somewhere or the bar would not add up.
    const coreSum = coreRows.reduce((acc, r) => acc + r.value, 0);
    const other = Math.max(0, fullTotal - coreSum);

    const out: ChartRow[] = [...coreRows];
    if (other > 0) {
      out.push({ key: 'other', label: 'Other', value: other, colorToken: 'gray.solid' });
    }
    return { rows: out, total: fullTotal };
  }, [buckets]);

  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    if (isLoading) {
      setAnimated(false);
      return;
    }
    setAnimated(false);
    const id = window.setTimeout(() => setAnimated(true), 0);
    return () => clearTimeout(id);
  }, [isLoading, rows]);

  return (
    <ChartCard
      title="Source mix"
      description="Items per ingestion channel"
      isLoading={isLoading}
      skeletonHeight="120px"
      bodyProps={{
        display: 'flex',
        flexDir: 'column',
        justifyContent: 'flex-end',
        gap: 4,
      }}
    >
      <Box
        w="full"
        h="3"
        borderRadius="full"
        overflow="hidden"
        bg="bg.muted"
        display="flex"
        flexDir="row"
        role="img"
        aria-label="Source mix distribution"
      >
        {total === 0 ? (
          <Box flex="1" bg="border.muted" aria-hidden />
        ) : (
          rows.map((row, index) => {
            const pct = (row.value / total) * 100;
            return (
              <Box
                key={row.key}
                h="full"
                flexShrink={0}
                bg={row.colorToken}
                style={{
                  width: animated ? `${pct}%` : '0%',
                  transition: `width 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 120}ms`,
                }}
                title={`${row.label}: ${row.value.toLocaleString()} (${pct.toFixed(0)}%)`}
              />
            );
          })
        )}
      </Box>

      <VStack align="stretch" gap={2}>
        {rows.map((row) => {
          const pct = total === 0 ? 0 : (row.value / total) * 100;
          return (
            <HStack key={row.key} gap={2} justify="space-between" align="center">
              <HStack gap={2} minW={0} flex="1">
                <Box w="10px" h="10px" borderRadius="sm" flexShrink={0} bg={row.colorToken} />
                <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                  {row.label}
                </Text>
              </HStack>
              <HStack gap={2} flexShrink={0}>
                <Text fontSize="xs" fontWeight="semibold">
                  {row.value.toLocaleString()}
                </Text>
                <Text fontSize="xs" color="fg.muted" minW="10">
                  {total === 0 ? '—' : `${pct.toFixed(0)}%`}
                </Text>
              </HStack>
            </HStack>
          );
        })}
      </VStack>
    </ChartCard>
  );
}
