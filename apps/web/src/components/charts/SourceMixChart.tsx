import { Box, Card, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';

import type { FeedbackSource } from '../../lib/types';

const SOURCE_ORDER: FeedbackSource[] = ['web_form', 'web_bulk', 'web_file', 'slack_like'];
const SOURCE_LABELS: Record<FeedbackSource, string> = {
  web_form: 'Web form',
  web_bulk: 'Bulk import',
  web_file: 'File import',
  slack_like: 'Slack',
};
/** Chakra semantic tokens for segment + legend swatches */
const SOURCE_COLOR_TOKENS: Record<FeedbackSource, string> = {
  web_form: 'brand.solid',
  web_bulk: 'teal.solid',
  web_file: 'cyan.solid',
  slack_like: 'purple.solid',
};

type Props = {
  buckets: { _id: string | null; count: number }[] | undefined;
  isLoading: boolean;
};

export function SourceMixChart({ buckets, isLoading }: Props) {
  const rows = useMemo(() => {
    const m = new Map<string, number>();
    if (!buckets) return [];
    for (const b of buckets) {
      m.set(String(b._id ?? 'unknown'), b.count);
    }
    return SOURCE_ORDER.map((key) => ({
      key,
      label: SOURCE_LABELS[key],
      value: m.get(key) ?? 0,
      colorToken: SOURCE_COLOR_TOKENS[key],
    }));
  }, [buckets]);

  const total = useMemo(() => rows.reduce((acc, r) => acc + r.value, 0), [rows]);

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
      <Card.Root variant="outline" h="full">
        <Card.Header>
          <Card.Title>Source mix</Card.Title>
        </Card.Header>
        <Card.Body>
          <Skeleton height="120px" borderRadius="md" />
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root
      variant="outline"
      h="full"
      transition="box-shadow 0.2s ease"
      _hover={{ boxShadow: 'md' }}
    >
      <Card.Header pb={2} gap={1}>
        <Card.Title>Source mix</Card.Title>
        <Text fontSize="sm" color="fg.muted" fontWeight="normal">
          Items per ingestion channel
        </Text>
      </Card.Header>
      <Card.Body pt={0} display="flex" flexDir="column" justifyContent="center" gap={4}>
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
