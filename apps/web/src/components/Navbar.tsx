import { Box, HStack, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ingest', label: 'Ingest' },
  { to: '/ingest/bulk', label: 'Bulk Ingest' },
] as const;

export function Navbar() {
  return (
    <Box
      as="header"
      borderBottomWidth="1px"
      borderColor="border.subtle"
      bg="bg.subtle"
      px={{ base: 4, md: 6 }}
      py={3}
    >
      <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <NavLink to="/dashboard" end>
          {({ isActive }) => (
            <Text
              fontWeight="semibold"
              fontSize="lg"
              color={isActive ? 'fg' : 'fg.muted'}
              _hover={{ color: 'fg' }}
            >
              Ledn Feedback
            </Text>
          )}
        </NavLink>

        <HStack as="nav" gap={1} flexWrap="wrap" aria-label="Main">
          {LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/dashboard'}>
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
      </HStack>
    </Box>
  );
}
