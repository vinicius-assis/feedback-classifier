import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { API_BASE, makeFeedbackItem, makeListResult } from '../test/fixtures';
import { createTestQueryClient } from '../test/renderWithProviders';
import { server } from '../test/server';
import { useIngestBulk, useIngestFeedback, useIngestFile } from './useIngest';

const CACHE_TTL = 60_000;

function wrapper(client = createTestQueryClient(CACHE_TTL)) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

describe('useIngestFeedback', () => {
  it('posts the raw text with its source', async () => {
    let body: unknown;
    server.use(
      http.post(`${API_BASE}/feedback`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeFeedbackItem(), { status: 201 });
      }),
    );

    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useIngestFeedback(), { wrapper: Wrapper });
    result.current.mutate({ rawText: 'too slow', source: 'web_form' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body).toEqual({ rawText: 'too slow', source: 'web_form' });
  });

  it('invalidates the feedback cache after ingesting', async () => {
    const { Wrapper, client } = wrapper();
    client.setQueryData(['feedback', 'list', {}], makeListResult());

    const { result } = renderHook(() => useIngestFeedback(), { wrapper: Wrapper });
    result.current.mutate({ rawText: 'hi' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryState(['feedback', 'list', {}])?.isInvalidated).toBe(true);
  });

  it('surfaces a validation error from the API', async () => {
    server.use(
      http.post(`${API_BASE}/feedback`, () =>
        HttpResponse.json({ message: 'rawText is too long' }, { status: 400 }),
      ),
    );

    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useIngestFeedback(), { wrapper: Wrapper });
    result.current.mutate({ rawText: 'x' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('rawText is too long');
  });
});

describe('useIngestBulk', () => {
  it('posts every item in one request', async () => {
    let body: { items: { rawText: string }[] } | undefined;
    server.use(
      http.post(`${API_BASE}/feedback/bulk`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json([{ index: 0, status: 'fulfilled', data: makeFeedbackItem() }]);
      }),
    );

    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useIngestBulk(), { wrapper: Wrapper });
    result.current.mutate({ items: [{ rawText: 'a' }, { rawText: 'b' }] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(body?.items).toHaveLength(2);
  });

  it('resolves with per-item results, including rejections', async () => {
    server.use(
      http.post(`${API_BASE}/feedback/bulk`, () =>
        HttpResponse.json([
          { index: 0, status: 'fulfilled', data: makeFeedbackItem() },
          { index: 1, status: 'rejected', error: 'too long' },
        ]),
      ),
    );

    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useIngestBulk(), { wrapper: Wrapper });
    result.current.mutate({ items: [{ rawText: 'a' }, { rawText: 'b' }] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[1]).toMatchObject({ status: 'rejected', error: 'too long' });
  });
});

describe('useIngestFile', () => {
  it('uploads the file as multipart under the "file" field', async () => {
    // `request.formData()` blows up under jsdom, so assert on the raw body.
    // Note: undici does not carry the jsdom File's name or contents through
    // serialization, so only the field name and MIME type are assertable here.
    let contentType: string | null = null;
    let body = '';
    server.use(
      http.post(`${API_BASE}/feedback/import`, async ({ request }) => {
        contentType = request.headers.get('content-type');
        body = await request.text();
        return HttpResponse.json({ total: 1, fulfilled: 1, failed: 0, skipped: 0, errors: [] });
      }),
    );

    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useIngestFile(), { wrapper: Wrapper });
    result.current.mutate(new File(['feedback'], 'rows.csv', { type: 'text/csv' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(contentType).toContain('multipart/form-data');
    expect(body).toContain('name="file"');
    expect(body).toContain('Content-Type: text/csv');
  });

  it('returns the per-row import report', async () => {
    server.use(
      http.post(`${API_BASE}/feedback/import`, () =>
        HttpResponse.json({
          total: 3,
          fulfilled: 1,
          failed: 1,
          skipped: 1,
          errors: [{ row: 2, message: 'empty' }],
        }),
      ),
    );

    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useIngestFile(), { wrapper: Wrapper });
    result.current.mutate(new File(['a'], 'rows.csv', { type: 'text/csv' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ fulfilled: 1, failed: 1, skipped: 1 });
    expect(result.current.data?.errors).toEqual([{ row: 2, message: 'empty' }]);
  });
});
