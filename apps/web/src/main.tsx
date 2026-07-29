import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ColorModeProvider } from './components/ui/color-mode';
import { AppToaster } from './lib/AppToaster';
import { system } from './theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Feedback data changes on user action, not continuously, so avoid
      // refetching both the list and the stats on every window focus.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: { retry: 0 },
  },
});

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <ColorModeProvider defaultTheme="dark" storageKey="feedback-classifier-theme">
          <AppToaster />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ColorModeProvider>
      </ChakraProvider>
    </QueryClientProvider>
  </StrictMode>,
);
