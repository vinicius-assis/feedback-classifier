import { Chart, useChart } from '@chakra-ui/charts';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Rectangle, Tooltip, XAxis, YAxis } from 'recharts';

import { bucketCounts, type BucketChartProps } from '../../lib/buckets';
import { URGENCY_DIMENSION } from '../../lib/domain';
import { ChartCard } from './ChartCard';

export function UrgencyChart({ buckets, isLoading }: BucketChartProps) {
  const counts = useMemo(() => bucketCounts(buckets), [buckets]);

  const data = useMemo(
    () =>
      URGENCY_DIMENSION.map(({ key, label, colorToken }) => ({
        label,
        count: counts.get(key) ?? 0,
        color: colorToken,
      })),
    [counts],
  );

  const chart = useChart({
    data,
    series: [{ name: 'count', color: 'teal.solid' }],
  });

  return (
    <ChartCard
      title="By urgency"
      description="Priority signal from classification"
      isLoading={isLoading}
      skeletonHeight="240px"
    >
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
    </ChartCard>
  );
}
