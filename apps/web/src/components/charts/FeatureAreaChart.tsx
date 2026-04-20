import { Card, Skeleton, Text } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import { useMemo } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from 'recharts';

import type { FeatureArea } from '../../lib/types';

const FEATURE_ORDER: FeatureArea[] = [
  'onboarding',
  'payments',
  'reporting',
  'performance',
  'security',
  'integrations',
  'other',
  'unknown',
];

function formatLabel(key: string) {
  const words = key.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

type Props = {
  buckets: { _id: string | null; count: number }[] | undefined;
  isLoading: boolean;
};

export function FeatureAreaChart({ buckets, isLoading }: Props) {
  const data = useMemo(() => {
    const m = new Map<string, number>();
    if (!buckets) return [];
    for (const b of buckets) {
      m.set(String(b._id ?? 'unknown'), b.count);
    }
    return FEATURE_ORDER.map((key) => ({
      area: formatLabel(key),
      count: m.get(key) ?? 0,
    }));
  }, [buckets]);

  const chart = useChart({
    data,
    series: [{ name: 'count', color: 'brand.solid' }],
  });

  if (isLoading) {
    return (
      <Card.Root variant="outline" h="full">
        <Card.Header>
          <Card.Title>By feature area</Card.Title>
        </Card.Header>
        <Card.Body>
          <Skeleton height="320px" borderRadius="md" />
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
        <Card.Title>By feature area</Card.Title>
        <Text fontSize="sm" color="fg.muted" fontWeight="normal">
          Feedback volume per product area
        </Text>
      </Card.Header>
      <Card.Body pt={0} display="flex" alignItems="center" justifyContent="center">
        <Chart.Root w="full" maxH="xs" chart={chart}>
          <RadarChart data={chart.data} responsive>
            <PolarGrid stroke={chart.color('border')} />
            <PolarAngleAxis dataKey={chart.key('area')} tickLine={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<Chart.Tooltip />} />
            {chart.series.map((item) => (
              <Radar
                key={item.name}
                animationDuration={600}
                animationEasing="ease-out"
                name={item.name}
                dataKey={chart.key(item.name)}
                stroke={chart.color(item.color)}
                fill={chart.color(item.color)}
                fillOpacity={0.25}
                dot={{ fill: chart.color(item.color), fillOpacity: 1, r: 3 }}
              />
            ))}
          </RadarChart>
        </Chart.Root>
      </Card.Body>
    </Card.Root>
  );
}
