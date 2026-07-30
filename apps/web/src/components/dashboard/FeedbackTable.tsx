import { Skeleton, Table, Text } from '@chakra-ui/react';

import type { FeedbackItem } from '@feedback-classifier/shared';
import { FeedbackTableRow } from './FeedbackTableRow';

const COLUMNS = [
  'Date',
  'Text',
  'Source',
  'Sentiment',
  'Feature area',
  'Urgency',
  'Status',
] as const;

/** Columns above plus the actions column. */
const COLUMN_COUNT = COLUMNS.length + 1;
const SKELETON_ROWS = 5;

type FeedbackTableProps = {
  items: FeedbackItem[] | undefined;
  isLoading: boolean;
  /** Id of the row whose delete is in flight, if any. */
  deletingId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

export function FeedbackTable({
  items,
  isLoading,
  deletingId,
  onOpen,
  onDelete,
}: FeedbackTableProps) {
  return (
    <Table.ScrollArea borderWidth="1px" rounded="md">
      <Table.Root size="sm" striped interactive>
        <Table.Header>
          <Table.Row>
            {COLUMNS.map((column) => (
              <Table.ColumnHeader key={column}>{column}</Table.ColumnHeader>
            ))}
            <Table.ColumnHeader w="1%">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading
            ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <Table.Row key={i}>
                  {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                    <Table.Cell key={j}>
                      <Skeleton height="4" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            : null}

          {!isLoading && items && items.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={COLUMN_COUNT}>
                <Text color="fg.muted" py={4} textAlign="center">
                  No feedback matches these filters.
                </Text>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {!isLoading && items
            ? items.map((item) => (
                <FeedbackTableRow
                  key={item._id}
                  item={item}
                  onOpen={onOpen}
                  onDelete={onDelete}
                  isDeleting={deletingId === item._id}
                />
              ))
            : null}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
