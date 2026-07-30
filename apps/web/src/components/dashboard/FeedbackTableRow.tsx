import { Button, Table, Text } from '@chakra-ui/react';

import { formatDate, humanizeSource, truncateText } from '../../lib/format';
import type { FeedbackItem } from '@feedback-classifier/shared';
import { TrashIcon } from '../icons';
import { StatusBadge } from '../StatusBadge';

type FeedbackTableRowProps = {
  item: FeedbackItem;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function FeedbackTableRow({ item, onOpen, onDelete, isDeleting }: FeedbackTableRowProps) {
  const failed = item.classificationStatus === 'failed';
  return (
    <Table.Row
      cursor="pointer"
      onClick={() => onOpen(item._id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item._id);
        }
      }}
      tabIndex={0}
      bg={failed ? 'red.subtle' : undefined}
      _hover={{ bg: failed ? 'red.muted' : 'bg.subtle' }}
    >
      <Table.Cell whiteSpace="nowrap">{formatDate(item.createdAt)}</Table.Cell>
      <Table.Cell maxW="sm">
        <Text lineClamp={2}>{truncateText(item.rawText, 120)}</Text>
      </Table.Cell>
      <Table.Cell textTransform="capitalize">{humanizeSource(item.source)}</Table.Cell>
      <Table.Cell textTransform="capitalize">{item.sentiment ?? '—'}</Table.Cell>
      <Table.Cell textTransform="capitalize">{item.featureArea ?? '—'}</Table.Cell>
      <Table.Cell textTransform="capitalize">{item.urgency ?? '—'}</Table.Cell>
      <Table.Cell>
        {item.classificationStatus ? (
          <StatusBadge colorPalette={failed ? 'red' : 'green'}>
            {item.classificationStatus}
          </StatusBadge>
        ) : (
          '—'
        )}
      </Table.Cell>
      <Table.Cell onClick={(e) => e.stopPropagation()}>
        <Button
          size="xs"
          variant="ghost"
          colorPalette="red"
          aria-label="Remove feedback"
          loading={isDeleting}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item._id);
          }}
        >
          <TrashIcon />
        </Button>
      </Table.Cell>
    </Table.Row>
  );
}
