import { Card, Skeleton, Text } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Rectangle, Tooltip, XAxis, YAxis } from 'recharts';

import type { Urgency } from '../../lib/types';

const URGENCY_ORDER: Urgency[] = ['low', 'medium', 'high', 'unknown'];
const URGENCY_COLORS: Record<Urgency, string> = {
  low: 'green.solid',
  medium: 'yellow.solid',
  high: 'red.solid',
  unknown: 'gray.solid',
};
const URGENCY_LABELS: Record<Urgency, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  unknown: 'Unknown',
};

type Props = {
  buckets: { _id: string | null; count: number }[] | undefined;
  isLoading: boolean;
};

export function UrgencyChart({ buckets, isLoading }: Props) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    if (!buckets) return m;
    for (const b of buckets) {
      m.set(String(b._id ?? 'unknown'), b.count);
    }
    return m;
  }, [buckets]);

  const data = useMemo(
    () =>
      URGENCY_ORDER.map((key) => ({
        label: URGENCY_LABELS[key],
        count: counts.get(key) ?? 0,
        color: URGENCY_COLORS[key],
      })),
    [counts],
  );

  const chart = useChart({
    data,
    series: [{ name: 'count', color: 'teal.solid' }],
  });

  if (isLoading) {
    return (
      <Card.Root variant="outline" h="full">
        <Card.Header>
          <Card.Title>By urgency</Card.Title>
        </Card.Header>
        <Card.Body>
          <Skeleton height="240px" borderRadius="md" />
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
      <Card.Header pb={1} gap={1}>
        <Card.Title>By urgency</Card.Title>
        <Text fontSize="sm" color="fg.muted" fontWeight="normal">
          Priority signal from classification
        </Text>
      </Card.Header>
      <Card.Body pt={0}>
        <Chart.Root maxH="sm" chart={chart}>
          <BarChart data={chart.data} barCategoryGap="28%" responsive>
            <CartesianGrid stroke={chart.color('border.muted')} vertical={false} />
            <XAxis axisLine={false} tickLine={false} dataKey={chart.key('label')} />
            <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: chart.color('bg.muted') }}
              animationDuration={100}
              content={<Chart.Tooltip />}
            />
            <Bar
              animationDuration={600}
              animationEasing="ease-out"
              dataKey={chart.key('count')}
              radius={[6, 6, 0, 0]}
              shape={(props) => {
                const payload = props.payload as { color?: string } | undefined;
                return <Rectangle {...props} fill={chart.color(payload?.color ?? 'gray.solid')} />;
              }}
            />
          </BarChart>
        </Chart.Root>
      </Card.Body>
    </Card.Root>
  );
}
