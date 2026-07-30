import { Card, HStack, Skeleton, Text } from '@chakra-ui/react';
import type { ComponentProps, ReactNode } from 'react';

import { useCountUp } from '../../hooks/useCountUp';

function AnimatedCount({ value, ...textProps }: { value: number } & ComponentProps<typeof Text>) {
  const animated = useCountUp(value);
  return <Text {...textProps}>{animated.toLocaleString()}</Text>;
}

type StatCardProps = {
  title: string;
  value: number;
  isLoading: boolean;
  /** Color token for the number itself, e.g. `green.fg`. */
  valueColor?: string;
  borderColor?: string;
  /** Draws the brand-colored rule across the top of the card. */
  accent?: boolean;
  /** Rendered next to the number, e.g. the `/ 3` of a ratio. */
  suffix?: ReactNode;
};

/** One KPI tile on the dashboard: label, animated count, loading skeleton. */
export function StatCard({
  title,
  value,
  isLoading,
  valueColor,
  borderColor,
  accent = false,
  suffix,
}: StatCardProps) {
  return (
    <Card.Root
      variant="outline"
      overflow={accent ? 'hidden' : undefined}
      position={accent ? 'relative' : undefined}
      borderColor={borderColor}
      transition="box-shadow 0.2s ease, border-color 0.2s ease"
      _hover={{ boxShadow: 'md' }}
      _before={
        accent
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              bg: 'brand.solid',
              opacity: 0.85,
            }
          : undefined
      }
    >
      <Card.Header pb={1}>
        <Card.Title fontSize="sm" fontWeight="medium" color="fg.muted">
          {title}
        </Card.Title>
      </Card.Header>
      <Card.Body pt={0}>
        {isLoading ? (
          <Skeleton height="12" maxW="120px" />
        ) : (
          <HStack gap={2} align="baseline">
            <AnimatedCount
              value={value}
              fontSize="4xl"
              fontWeight="bold"
              color={valueColor}
              letterSpacing="-0.03em"
              lineHeight="1"
            />
            {suffix ? (
              <Text fontSize="sm" color="fg.muted">
                {suffix}
              </Text>
            ) : null}
          </HStack>
        )}
      </Card.Body>
    </Card.Root>
  );
}
