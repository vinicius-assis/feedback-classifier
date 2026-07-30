import { Badge } from '@chakra-ui/react';
import type { ReactNode } from 'react';

type StatusBadgeProps = {
  colorPalette: string;
  children: ReactNode;
};

/** Uppercase pill used for every classification attribute across the app. */
export function StatusBadge({ colorPalette, children }: StatusBadgeProps) {
  return (
    <Badge
      colorPalette={colorPalette}
      variant="subtle"
      textTransform="uppercase"
      fontSize="xs"
      letterSpacing="wide"
    >
      {children}
    </Badge>
  );
}
