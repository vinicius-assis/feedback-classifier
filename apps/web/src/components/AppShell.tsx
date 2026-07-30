import { Box, Container, Spinner } from '@chakra-ui/react';
import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { ErrorBoundary } from './ErrorBoundary';
import { Navbar } from './Navbar';

/** Shown while a route chunk is in flight. */
function RouteFallback() {
  return (
    <Container maxW="7xl" py={16} display="flex" justifyContent="center">
      <Spinner size="lg" color="brand.solid" aria-label="Loading page" />
    </Container>
  );
}

export function AppShell() {
  const location = useLocation();

  return (
    <Box minH="100vh">
      <Navbar />
      <Box as="main">
        {/* Scoped to the page so a crash keeps the navbar usable; the key
            clears the error once the user navigates elsewhere. */}
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </Box>
    </Box>
  );
}
