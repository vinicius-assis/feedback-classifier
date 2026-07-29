import { Box, Card, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';

import { bucketCounts, type BucketChartProps } from '../../lib/buckets';

/** Core sources shown in the chart; `slack_like` and any other API values roll into "Other". */
type ChartSourceKey = 'web_form' | 'web_bulk' | 'web_file';

const SOURCE_ORDER: ChartSourceKey[] = ['web_form', 'web_bulk', 'web_file'];
const SOURCE_LABELS: Record<ChartSourceKey, string> = {
  web_form: 'Web form',
  web_bulk: 'Bulk import',
  web_file: 'File import',
  // slack_like: 'Slack', // Slack — hidden in web app
};
/** Chakra semantic tokens for segment + legend swatches */
const SOURCE_COLOR_TOKENS: Record<ChartSourceKey, string> = {
  web_form: 'brand.solid',
  web_bulk: 'teal.solid',
  web_file: 'cyan.solid',
  // slack_like: 'purple.solid',
};

type ChartRow = {
  key: ChartSourceKey | 'other';
  label: string;
  value: number;
  colorToken: string;
};

export function SourceMixChart({ buckets, isLoading }: BucketChartProps) {
  const { rows, total } = useMemo(() => {
    if (!buckets) return { rows: [] as ChartRow[], total: 0 };
    const m = bucketCounts(buckets);
    const fullTotal = [...m.values()].reduce((acc, v) => acc + v, 0);

    const coreRows: ChartRow[] = SOURCE_ORDER.map((key) => ({
      key,
      label: SOURCE_LABELS[key],
      value: m.get(key) ?? 0,
      colorToken: SOURCE_COLOR_TOKENS[key],
    }));
    const coreSum = coreRows.reduce((acc, r) => acc + r.value, 0);
    const other = Math.max(0, fullTotal - coreSum);

    const out: ChartRow[] = [...coreRows];
    if (other > 0) {
      out.push({
        key: 'other',
        label: 'Other',
        value: other,
        colorToken: 'gray.solid',
      });
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

  if (isLoading) {
    return (
      <Card.Root variant="outline" h="full" display="flex" flexDir="column">
        <Card.Header flexShrink={0}>
          <Card.Title>Source mix</Card.Title>
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
        <Card.Title>Source mix</Card.Title>
        <Text fontSize="sm" color="fg.muted" fontWeight="normal">
          Items per ingestion channel
        </Text>
      </Card.Header>
      <Card.Body flex="1" pt={0} display="flex" flexDir="column" justifyContent="flex-end" gap={4}>
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
      </Card.Body>
    </Card.Root>
  );
}
