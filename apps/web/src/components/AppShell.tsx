import { Box } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';

import { Navbar } from './Navbar';

export function AppShell() {
  return (
    <Box minH="100vh">
      <Navbar />
      <Box as="main">
        <Outlet />
      </Box>
    </Box>
  );
}
