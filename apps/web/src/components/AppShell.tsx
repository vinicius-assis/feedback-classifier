import { Box } from '@chakra-ui/react';
import { Outlet, useLocation } from 'react-router-dom';

import { ErrorBoundary } from './ErrorBoundary';
import { Navbar } from './Navbar';

export function AppShell() {
  const location = useLocation();

  return (
    <Box minH="100vh">
      <Navbar />
      <Box as="main">
        {/* Scoped to the page so a crash keeps the navbar usable; the key
            clears the error once the user navigates elsewhere. */}
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </Box>
    </Box>
  );
}
