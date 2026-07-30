import { HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import { useMemo } from 'react';
import { Label, Pie, PieChart, Sector, Tooltip } from 'recharts';

import { bucketCounts, type BucketChartProps } from '../../lib/buckets';
import { SENTIMENT_DIMENSION } from '../../lib/domain';
import { ChartCard } from './ChartCard';

export function SentimentChart({ buckets, isLoading }: BucketChartProps) {
  const counts = useMemo(() => bucketCounts(buckets), [buckets]);

  const data = useMemo(
    () =>
      SENTIMENT_DIMENSION.map(({ key, label, colorToken }) => ({
        name: label,
        value: counts.get(key) ?? 0,
        color: colorToken,
      })),
    [counts],
  );

  const chart = useChart({ data });
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <ChartCard
      title="By sentiment"
      description="Tone distribution across feedback"
      isLoading={isLoading}
      skeletonHeight="280px"
      bodyProps={{
        display: 'flex',
        flexDir: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
      }}
    >
      <Chart.Root boxSize="200px" chart={chart} mx="auto">
        <PieChart responsive>
          <Tooltip cursor={false} animationDuration={100} content={<Chart.Tooltip hideLabel />} />
          <Pie
            innerRadius={62}
            outerRadius={90}
            animationDuration={600}
            animationEasing="ease-out"
            data={chart.data}
            dataKey={chart.key('value')}
            nameKey="name"
            paddingAngle={2}
            cornerRadius={4}
            shape={(props) => (
              <Sector
                {...props}
                fill={chart.color(props.payload?.color ?? 'gray.solid')}
                stroke="none"
              />
            )}
          >
            <Label
              content={({ viewBox }) => (
                <Chart.RadialText
                  viewBox={viewBox}
                  title={total.toLocaleString()}
                  description="total"
                  fontSize="1.6rem"
                />
              )}
            />
          </Pie>
        </PieChart>
      </Chart.Root>
      <SimpleGrid columns={2} gap={2} w="full">
        {data.map((d) => (
          <HStack key={d.name} gap={2}>
            <Text
              as="span"
              display="inline-block"
              w="10px"
              h="10px"
              borderRadius="sm"
              flexShrink={0}
              style={{ background: chart.color(d.color) }}
            />
            <Text fontSize="xs" color="fg.muted" flex="1">
              {d.name}
            </Text>
            <Text fontSize="xs" fontWeight="semibold">
              {d.value}
            </Text>
          </HStack>
        ))}
      </SimpleGrid>
    </ChartCard>
  );
}
