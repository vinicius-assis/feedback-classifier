import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';

/**
 * Inline SVG icons, all stroke-based on `currentColor` so they inherit the
 * button or text color around them. They were duplicated inside the pages that
 * used them; keeping them here stops the same glyph from drifting apart.
 */

type GlyphProps = {
  size?: string;
  strokeWidth?: string;
  children: ReactNode;
};

/** Bare glyph — the caller controls layout. */
function Glyph({ size = '1em', strokeWidth = '2', children }: GlyphProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Glyph in an inline-flex span, for icons sitting next to text in a flex row. */
function InlineGlyph(props: GlyphProps) {
  return (
    <Box as="span" display="inline-flex" flexShrink={0} lineHeight="0" aria-hidden>
      <Glyph {...props} />
    </Box>
  );
}

export function TrashIcon() {
  return (
    <Glyph size="1.1em">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Glyph>
  );
}

export function SunIcon() {
  return (
    <Glyph size="1.15em">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Glyph>
  );
}

export function MoonIcon() {
  return (
    <Glyph size="1.15em">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Glyph>
  );
}

export function CopyIcon() {
  return (
    <InlineGlyph>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </InlineGlyph>
  );
}

export function CheckIcon() {
  return (
    <InlineGlyph strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </InlineGlyph>
  );
}

export function ReclassifyIcon() {
  return (
    <InlineGlyph>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 3" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 21" />
      <path d="M3 21v-5h5" />
    </InlineGlyph>
  );
}
