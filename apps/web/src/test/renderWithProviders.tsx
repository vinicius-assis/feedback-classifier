import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { system } from '../theme';

/**
 * Retries off so error-path assertions resolve on the first failed response.
 * `gcTime` defaults to 0 for isolation; tests that assert on cache contents
 * must raise it, otherwise entries without an observer are collected first.
 */
export function createTestQueryClient(gcTime = 0): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

type Options = Omit<RenderOptions, 'wrapper'> & {
  route?: string;
  queryClient?: QueryClient;
};

export function renderWithProviders(
  ui: ReactElement,
  options: Options = {},
): RenderResult & { queryClient: QueryClient } {
  const { route = '/', queryClient = createTestQueryClient(), ...rest } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </ChakraProvider>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...rest }) };
}
