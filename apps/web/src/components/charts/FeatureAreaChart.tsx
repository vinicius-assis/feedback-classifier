import { Chart, useChart } from '@chakra-ui/charts';
import { useMemo } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from 'recharts';

import { bucketCounts, type BucketChartProps } from '../../lib/buckets';
import { FEATURE_AREA_DIMENSION } from '../../lib/domain';
import { ChartCard } from './ChartCard';

export function FeatureAreaChart({ buckets, isLoading }: BucketChartProps) {
  const data = useMemo(() => {
    if (!buckets) return [];
    const counts = bucketCounts(buckets);
    return FEATURE_AREA_DIMENSION.map(({ key, label }) => ({
      area: label,
      count: counts.get(key) ?? 0,
    }));
  }, [buckets]);

  const chart = useChart({
    data,
    series: [{ name: 'count', color: 'brand.solid' }],
  });

  return (
    <ChartCard
      title="By feature area"
      description="Feedback volume per product area"
      isLoading={isLoading}
      skeletonHeight="320px"
      bodyProps={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
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
    </ChartCard>
  );
}
