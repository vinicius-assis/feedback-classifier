import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { API_BASE } from '../test/fixtures';
import { server } from '../test/server';
import { ApiError, get, post, postForm, postWithStatus, remove, withQuery } from './api';

describe('withQuery', () => {
  it('returns the path untouched when every param is omitted', () => {
    expect(withQuery('/feedback', {})).toBe('/feedback');
  });

  it('drops undefined, null and empty-string values', () => {
    expect(
      withQuery('/feedback', {
        page: 1,
        sentiment: undefined,
        urgency: null,
        source: '',
      }),
    ).toBe('/feedback?page=1');
  });

  it('keeps falsy values that are not empty strings', () => {
    expect(withQuery('/feedback', { page: 0, archived: false })).toBe(
      '/feedback?page=0&archived=false',
    );
  });

  it('appends with & when the path already has a query string', () => {
    expect(withQuery('/feedback?limit=20', { page: 2 })).toBe('/feedback?limit=20&page=2');
  });

  it('encodes values that need escaping', () => {
    expect(withQuery('/feedback', { q: 'a b&c' })).toBe('/feedback?q=a+b%26c');
  });
});

describe('response parsing', () => {
  it('resolves to undefined on 204 No Content', async () => {
    server.use(
      http.delete(`${API_BASE}/feedback/x`, () => new HttpResponse(null, { status: 204 })),
    );
    await expect(remove('/feedback/x')).resolves.toBeUndefined();
  });

  it('resolves to undefined on an empty 200 body', async () => {
    server.use(http.get(`${API_BASE}/empty`, () => new HttpResponse('', { status: 200 })));
    await expect(get('/empty')).resolves.toBeUndefined();
  });

  it('parses a JSON body', async () => {
    server.use(http.get(`${API_BASE}/thing`, () => HttpResponse.json({ ok: true })));
    await expect(get('/thing')).resolves.toEqual({ ok: true });
  });

  it('returns raw text when content-type is not JSON', async () => {
    server.use(
      http.get(
        `${API_BASE}/text`,
        () => new HttpResponse('plain body', { headers: { 'content-type': 'text/plain' } }),
      ),
    );
    await expect(get('/text')).resolves.toBe('plain body');
  });

  it('falls back to raw text when the JSON body is malformed', async () => {
    server.use(
      http.get(
        `${API_BASE}/broken`,
        () => new HttpResponse('{not json', { headers: { 'content-type': 'application/json' } }),
      ),
    );
    await expect(get('/broken')).resolves.toBe('{not json');
  });
});

describe('error handling', () => {
  it('throws ApiError carrying status and body', async () => {
    server.use(
      http.get(`${API_BASE}/nope`, () =>
        HttpResponse.json({ message: 'Item not found' }, { status: 404 }),
      ),
    );

    const error = await get('/nope').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect((error as ApiError).message).toBe('Item not found');
    expect((error as ApiError).body).toEqual({ message: 'Item not found' });
  });

  it('falls back to statusText when the body has no usable message', async () => {
    server.use(
      http.get(`${API_BASE}/boom`, () =>
        HttpResponse.json({ error: 'nope' }, { status: 500, statusText: 'Internal Server Error' }),
      ),
    );

    const error = (await get('/boom').catch((e: unknown) => e)) as ApiError;
    expect(error.message).toBe('Internal Server Error');
  });

  it('ignores a blank message field in the body', async () => {
    server.use(
      http.get(`${API_BASE}/blank`, () =>
        HttpResponse.json({ message: '   ' }, { status: 400, statusText: 'Bad Request' }),
      ),
    );

    const error = (await get('/blank').catch((e: unknown) => e)) as ApiError;
    expect(error.message).toBe('Bad Request');
  });
});

describe('request building', () => {
  it('sets JSON content-type for a POST with a body', async () => {
    let contentType: string | null = null;
    server.use(
      http.post(`${API_BASE}/echo`, async ({ request }) => {
        contentType = request.headers.get('content-type');
        return HttpResponse.json(await request.json());
      }),
    );

    await expect(post('/echo', { rawText: 'hi' })).resolves.toEqual({ rawText: 'hi' });
    expect(contentType).toContain('application/json');
  });

  it('does not force a content-type when the body is FormData', async () => {
    let contentType: string | null = null;
    server.use(
      http.post(`${API_BASE}/upload`, ({ request }) => {
        contentType = request.headers.get('content-type');
        return HttpResponse.json({ ok: true });
      }),
    );

    const formData = new FormData();
    formData.append('file', new File(['a,b'], 'feedback.csv', { type: 'text/csv' }));
    await postForm('/upload', formData);

    // The browser must set the multipart boundary itself.
    expect(contentType).toContain('multipart/form-data');
  });

  it('always requests JSON via the Accept header', async () => {
    let accept: string | null = null;
    server.use(
      http.get(`${API_BASE}/accept`, ({ request }) => {
        accept = request.headers.get('accept');
        return HttpResponse.json({});
      }),
    );

    await get('/accept');
    expect(accept).toBe('application/json');
  });

  it('normalizes a path given without a leading slash', async () => {
    server.use(http.get(`${API_BASE}/feedback`, () => HttpResponse.json({ ok: true })));
    await expect(get('feedback')).resolves.toEqual({ ok: true });
  });

  it('exposes the status code via postWithStatus', async () => {
    server.use(
      http.post(`${API_BASE}/dupe`, () => HttpResponse.json({ _id: 'x' }, { status: 200 })),
    );

    await expect(postWithStatus('/dupe', { text: 'a' })).resolves.toEqual({
      data: { _id: 'x' },
      status: 200,
    });
  });
});
