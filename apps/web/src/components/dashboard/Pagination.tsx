import { Button, HStack, Text } from '@chakra-ui/react';

type PaginationProps = {
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function Pagination({ page, totalPages, isLoading, onPrev, onNext }: PaginationProps) {
  return (
    <HStack gap={2}>
      <Button size="sm" variant="outline" onClick={onPrev} disabled={page <= 1 || isLoading}>
        Previous
      </Button>
      <Text fontSize="sm" color="fg.muted">
        Page {page} of {totalPages}
      </Text>
      <Button
        size="sm"
        variant="outline"
        onClick={onNext}
        disabled={page >= totalPages || isLoading}
      >
        Next
      </Button>
    </HStack>
  );
}
