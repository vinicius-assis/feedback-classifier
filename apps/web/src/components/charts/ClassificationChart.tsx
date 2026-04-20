import { Card, HStack, Skeleton, Text } from '@chakra-ui/react';
import { BarList, type BarListData, useChart } from '@chakra-ui/charts';
import { useMemo } from 'react';

type Props = {
  buckets: { _id: string | null; count: number }[] | undefined;
  isLoading: boolean;
};

export function ClassificationChart({ buckets, isLoading }: Props) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    if (!buckets) return m;
    for (const b of buckets) {
      m.set(String(b._id ?? 'unknown'), b.count);
    }
    return m;
  }, [buckets]);

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
      <Card.Root variant="outline" h="full">
        <Card.Header>
          <Card.Title>Classification health</Card.Title>
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
        <Card.Title>Classification health</Card.Title>
        <Text fontSize="sm" color="fg.muted" fontWeight="normal">
          Success vs failed runs
        </Text>
      </Card.Header>
      <Card.Body pt={0} display="flex" flexDir="column" justifyContent="center" gap={4}>
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
