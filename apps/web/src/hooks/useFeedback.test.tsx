import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { API_BASE, makeFeedbackItem, makeListResult } from '../test/fixtures';
import { createTestQueryClient } from '../test/renderWithProviders';
import { server } from '../test/server';
import {
  useDeleteFeedback,
  useFeedbackItem,
  useFeedbackList,
  useReclassifyFeedback,
} from './useFeedback';

/** Keeps observer-less cache entries alive long enough to assert on them. */
const CACHE_TTL = 60_000;

function wrapper(client = createTestQueryClient()) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

describe('useFeedbackList', () => {
  it('sends only the filters that are set', async () => {
    let url = '';
    server.use(
      http.get(`${API_BASE}/feedback`, ({ request }) => {
        url = request.url;
        return HttpResponse.json(makeListResult());
      }),
    );

    const { Wrapper } = wrapper();
    const { result } = renderHook(
      () => useFeedbackList({ page: 2, limit: 20, sentiment: 'negative' }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const params = new URL(url).searchParams;
    expect(params.get('page')).toBe('2');
    expect(params.get('limit')).toBe('20');
    expect(params.get('sentiment')).toBe('negative');
    expect(params.has('urgency')).toBe(false);
    expect(params.has('source')).toBe(false);
  });

  it('refetches when the filters change', async () => {
    let calls = 0;
    server.use(
      http.get(`${API_BASE}/feedback`, () => {
        calls += 1;
        return HttpResponse.json(makeListResult());
      }),
    );

    const { Wrapper } = wrapper();
    const { result, rerender } = renderHook(
      ({ urgency }: { urgency?: 'high' | 'low' }) => useFeedbackList({ page: 1, urgency }),
      { wrapper: Wrapper, initialProps: {} as { urgency?: 'high' | 'low' } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calls).toBe(1);

    rerender({ urgency: 'high' });
    await waitFor(() => expect(calls).toBe(2));
  });

  it('surfaces an API failure', async () => {
    server.use(
      http.get(`${API_BASE}/feedback`, () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    );

    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useFeedbackList({ page: 1 }), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useFeedbackItem', () => {
  it('stays disabled while the id is empty', () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useFeedbackItem(''), { wrapper: Wrapper });

    // React Query v5: a disabled query is pending but never fetching.
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
  });

  it('fetches the item once an id is given', async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useFeedbackItem('abc123'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?._id).toBe('abc123');
  });

  it('percent-encodes the id in the path', async () => {
    let path = '';
    server.use(
      http.get(`${API_BASE}/feedback/:id`, ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json(makeFeedbackItem());
      }),
    );

    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useFeedbackItem('a/b'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(path).toContain('a%2Fb');
  });
});

describe('useDeleteFeedback', () => {
  it('invalidates every feedback query on success', async () => {
    const { Wrapper, client } = wrapper(createTestQueryClient(CACHE_TTL));
    client.setQueryData(['feedback', 'list', {}], makeListResult());
    client.setQueryData(['unrelated'], { keep: true });

    const { result } = renderHook(() => useDeleteFeedback(), { wrapper: Wrapper });
    result.current.mutate('abc123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getQueryState(['feedback', 'list', {}])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['unrelated'])?.isInvalidated).toBe(false);
  });

  it('reports failures instead of swallowing them', async () => {
    server.use(
      http.delete(`${API_BASE}/feedback/:id`, () =>
        HttpResponse.json({ message: 'nope' }, { status: 500 }),
      ),
    );

    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useDeleteFeedback(), { wrapper: Wrapper });
    result.current.mutate('abc123');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useReclassifyFeedback', () => {
  it('writes the fresh item into the detail cache and invalidates the list', async () => {
    const { Wrapper, client } = wrapper(createTestQueryClient(CACHE_TTL));
    client.setQueryData(['feedback', 'list', {}], makeListResult());

    server.use(
      http.post(`${API_BASE}/feedback/:id/reclassify`, () =>
        HttpResponse.json(makeFeedbackItem({ _id: 'abc123', sentiment: 'positive' })),
      ),
    );

    const { result } = renderHook(() => useReclassifyFeedback('abc123'), { wrapper: Wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.getQueryData(['feedback', 'detail', 'abc123'])).toMatchObject({
      _id: 'abc123',
      sentiment: 'positive',
    });
    expect(client.getQueryState(['feedback', 'list', {}])?.isInvalidated).toBe(true);
  });
});
