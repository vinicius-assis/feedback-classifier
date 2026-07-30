import { Card, Skeleton, Text } from '@chakra-ui/react';
import type { ComponentProps, ReactNode } from 'react';

type ChartCardProps = {
  title: string;
  description: string;
  isLoading: boolean;
  /** Height of the placeholder shown in place of the chart while stats load. */
  skeletonHeight: string;
  /** Layout overrides for `Card.Body` — each chart centers its content differently. */
  bodyProps?: ComponentProps<typeof Card.Body>;
  children: ReactNode;
};

/**
 * The shell every dashboard chart shares: outlined card, title + description
 * header, and the loading skeleton. Only the chart itself differs.
 */
export function ChartCard({
  title,
  description,
  isLoading,
  skeletonHeight,
  bodyProps,
  children,
}: ChartCardProps) {
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
        <Card.Title>{title}</Card.Title>
        <Text fontSize="sm" color="fg.muted" fontWeight="normal">
          {description}
        </Text>
      </Card.Header>
      {isLoading ? (
        <Card.Body flex="1" pt={0} display="flex" flexDir="column" justifyContent="flex-end">
          <Skeleton height={skeletonHeight} borderRadius="md" />
        </Card.Body>
      ) : (
        <Card.Body flex="1" pt={0} {...bodyProps}>
          {children}
        </Card.Body>
      )}
    </Card.Root>
  );
}
