import { Box, Button, Container, HStack, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';

import { MoonIcon, SunIcon } from './icons';
import { useColorMode } from './ui/use-color-mode';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ingest', label: 'Ingest' },
  { to: '/ingest/bulk', label: 'Bulk Ingest' },
  { to: '/ingest/file', label: 'Import file' },
  /*{ to: '/integrations', label: 'Integrations' },*/
] as const;

export function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode !== 'light';

  return (
    <Box as="header" borderBottomWidth="1px" borderColor="border.subtle" bg="bg.subtle">
      <Container maxW="7xl" py={3}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <NavLink to="/dashboard" end>
            {({ isActive }) => (
              <Text
                fontWeight="semibold"
                fontSize="lg"
                color={isActive ? 'fg' : 'fg.muted'}
                _hover={{ color: 'fg' }}
              >
                Feedback Classifier
              </Text>
            )}
          </NavLink>

          <HStack gap={3} align="center" flexWrap="wrap">
            <HStack as="nav" gap={1} flexWrap="wrap" aria-label="Main">
              {LINKS.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === '/dashboard' || to === '/ingest'}>
                  {({ isActive }) => (
                    <Box
                      as="span"
                      display="inline-block"
                      px={3}
                      py={2}
                      borderRadius="md"
                      fontSize="sm"
                      fontWeight="medium"
                      color={isActive ? 'fg' : 'fg.muted'}
                      bg={isActive ? 'bg.emphasized' : 'transparent'}
                      _hover={{ color: 'fg', bg: 'bg.muted' }}
                      transition="background 0.15s ease, color 0.15s ease"
                    >
                      {label}
                    </Box>
                  )}
                </NavLink>
              ))}
            </HStack>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleColorMode}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </Button>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
}
