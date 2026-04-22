import { Card, HStack, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import { useMemo } from 'react';
import { Label, Pie, PieChart, Sector, Tooltip } from 'recharts';

import type { Sentiment } from '../../lib/types';

const SENTIMENT_ORDER: Sentiment[] = ['positive', 'neutral', 'negative', 'unknown'];
const SENTIMENT_COLORS: Record<Sentiment, string> = {
  positive: 'green.solid',
  neutral: 'blue.solid',
  negative: 'red.solid',
  unknown: 'gray.solid',
};
const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  unknown: 'Unknown',
};

type Props = {
  buckets: { _id: string | null; count: number }[] | undefined;
  isLoading: boolean;
};

export function SentimentChart({ buckets, isLoading }: Props) {
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
      SENTIMENT_ORDER.map((key) => ({
        name: SENTIMENT_LABELS[key],
        value: counts.get(key) ?? 0,
        color: SENTIMENT_COLORS[key],
      })),
    [counts],
  );

  const chart = useChart({ data });
  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (isLoading) {
    return (
      <Card.Root variant="outline" h="full" display="flex" flexDir="column">
        <Card.Header flexShrink={0}>
          <Card.Title>By sentiment</Card.Title>
        </Card.Header>
        <Card.Body flex="1" display="flex" flexDir="column" justifyContent="flex-end">
          <Skeleton height="280px" borderRadius="md" />
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
      <Card.Header pb={1} gap={1} flexShrink={0}>
        <Card.Title>By sentiment</Card.Title>
        <Text fontSize="sm" color="fg.muted" fontWeight="normal">
          Tone distribution across feedback
        </Text>
      </Card.Header>
      <Card.Body
        flex="1"
        pt={0}
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="flex-end"
        gap={4}
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
                <Sector {...props} fill={chart.color(props.payload!.color)} stroke="none" />
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
      </Card.Body>
    </Card.Root>
  );
}
