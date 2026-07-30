import { Heading, Stack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  /** Lead paragraph. Accepts nodes because the ingest pages inline links and code. */
  description?: ReactNode;
  /** Smaller line under the description, used for cross-links between pages. */
  footnote?: ReactNode;
};

export function PageHeader({ title, description, footnote }: PageHeaderProps) {
  return (
    <Stack gap={1}>
      <Heading as="h1" size="xl">
        {title}
      </Heading>
      {description ? <Text color="fg.muted">{description}</Text> : null}
      {footnote ? (
        <Text color="fg.muted" fontSize="sm">
          {footnote}
        </Text>
      ) : null}
    </Stack>
  );
}
