import { Box, Text } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

import { toaster } from '../../lib/toaster';
import { CheckIcon, CopyIcon } from '../icons';

const FLASH_MS = 1500;

/** Click-to-copy identifier that flashes "Copied!" for a moment afterwards. */
export function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  // Without this, navigating away mid-flash sets state on an unmounted tree.
  useEffect(
    () => () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    },
    [],
  );

  function copyId() {
    navigator.clipboard
      .writeText(id)
      .then(() => {
        setCopied(true);
        if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
        copiedTimer.current = window.setTimeout(() => setCopied(false), FLASH_MS);
      })
      .catch(() => {
        // Denied permission or an insecure context: tell the user instead of
        // leaving a silent unhandled rejection.
        toaster.create({
          type: 'error',
          title: 'Could not copy the ID',
          description: 'Copy it manually from the field.',
        });
      });
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      alignSelf="stretch"
      minH="9"
      minW={0}
      w="max-content"
      maxW="100%"
      flexShrink={1}
      px={3.5}
      py={1.5}
      cursor="pointer"
      bg="bg.muted"
      borderRightRadius="l2"
      _hover={{ bg: 'bg.emphasized' }}
      transition="background 0.15s ease"
      onClick={copyId}
      title="Copy ID"
    >
      <Text
        as="span"
        fontFamily="mono"
        fontSize="xs"
        fontWeight="medium"
        letterSpacing="0.04em"
        lineHeight="tall"
        textTransform="uppercase"
        color={copied ? 'green.fg' : 'fg'}
        userSelect="all"
        whiteSpace="normal"
        wordBreak="break-all"
        transition="color 0.15s ease"
      >
        {copied ? 'Copied!' : id}
      </Text>
      <Box
        as="span"
        display="inline-flex"
        flexShrink={0}
        fontSize="xs"
        color={copied ? 'green.fg' : 'fg.muted'}
        transition="color 0.15s ease"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Box>
    </Box>
  );
}
