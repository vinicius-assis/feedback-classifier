import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';

/** Bordered panel wrapping the forms on the ingest pages. */
export function FormCard({ children }: { children: ReactNode }) {
  return (
    <Box maxW="2xl" borderWidth="1px" borderColor="border" borderRadius="lg" bg="bg.subtle" p={6}>
      {children}
    </Box>
  );
}
