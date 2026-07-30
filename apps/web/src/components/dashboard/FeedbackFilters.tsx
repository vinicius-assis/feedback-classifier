import { Button, Heading, HStack, SimpleGrid, Stack } from '@chakra-ui/react';

import {
  CLASSIFICATION_STATUS_OPTIONS,
  FEATURE_AREA_OPTIONS,
  SENTIMENT_OPTIONS,
  SOURCE_OPTIONS,
  URGENCY_OPTIONS,
} from '../../lib/domain';
import { humanizeSource } from '../../lib/format';
import type { FeedbackFilters as Filters } from '@feedback-classifier/shared';
import { SelectFilter } from './SelectFilter';

type FeedbackFiltersProps = {
  filters: Filters;
  onChange: (key: Exclude<keyof Filters, 'page' | 'limit'>, value: string) => void;
  onReset: () => void;
};

export function FeedbackFilters({ filters, onChange, onReset }: FeedbackFiltersProps) {
  return (
    <Stack gap={4}>
      <Heading size="md">Filters</Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} gap={4}>
        <SelectFilter
          label="Sentiment"
          options={SENTIMENT_OPTIONS}
          value={filters.sentiment ?? ''}
          onChange={(value) => onChange('sentiment', value)}
        />
        <SelectFilter
          label="Feature area"
          options={FEATURE_AREA_OPTIONS}
          value={filters.featureArea ?? ''}
          onChange={(value) => onChange('featureArea', value)}
        />
        <SelectFilter
          label="Urgency"
          options={URGENCY_OPTIONS}
          value={filters.urgency ?? ''}
          onChange={(value) => onChange('urgency', value)}
        />
        <SelectFilter
          label="Source"
          options={SOURCE_OPTIONS}
          value={filters.source ?? ''}
          onChange={(value) => onChange('source', value)}
          formatOption={humanizeSource}
        />
        <SelectFilter
          label="Classification status"
          options={CLASSIFICATION_STATUS_OPTIONS}
          value={filters.classificationStatus ?? ''}
          onChange={(value) => onChange('classificationStatus', value)}
        />
      </SimpleGrid>

      <HStack justify="flex-end">
        <Button size="sm" variant="outline" onClick={onReset}>
          Reset filters
        </Button>
      </HStack>
    </Stack>
  );
}
