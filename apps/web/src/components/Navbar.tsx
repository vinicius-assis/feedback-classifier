import { Box, Button, Container, HStack, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';

import { useColorMode } from './ui/use-color-mode';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ingest', label: 'Ingest' },
  { to: '/ingest/bulk', label: 'Bulk Ingest' },
  { to: '/ingest/file', label: 'Import file' },
  /*{ to: '/integrations', label: 'Integrations' },*/
] as const;

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.15em"
      height="1.15em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.15em"
      height="1.15em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

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
