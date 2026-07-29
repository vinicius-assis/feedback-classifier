import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { API_BASE, makeFeedbackItem } from '../test/fixtures';
import { renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';
import { toaster } from '../lib/toaster';
import { IngestBulkPage } from './IngestBulkPage';
import { IngestPage } from './IngestPage';

/** The toaster is a module singleton; spying is the only way to read it. */
let createToast: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  createToast = vi.spyOn(toaster, 'create').mockReturnValue('id');
});

function lastToast() {
  const calls = createToast.mock.calls;
  return calls[calls.length - 1]?.[0] as
    | { type?: string; title?: string; description?: string }
    | undefined;
}

describe('IngestPage', () => {
  it('lets native validation block a fully empty submission', async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.post(`${API_BASE}/feedback`, () => {
        called = true;
        return HttpResponse.json(makeFeedbackItem(), { status: 201 });
      }),
    );

    renderWithProviders(<IngestPage />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeRequired();

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    // The field is `required`, so the browser stops the submit event before
    // the handler runs — hence no API call and no in-app toast either.
    expect(called).toBe(false);
    expect(createToast).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only text in the handler', async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.post(`${API_BASE}/feedback`, () => {
        called = true;
        return HttpResponse.json(makeFeedbackItem(), { status: 201 });
      }),
    );

    renderWithProviders(<IngestPage />);

    // Non-empty for the browser, empty once trimmed: this is the case the
    // JS guard actually catches.
    await user.type(screen.getByRole('textbox'), '    ');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(lastToast()).toMatchObject({
      type: 'error',
      description: 'Please enter feedback text.',
    });
    expect(called).toBe(false);
  });

  it('trims the text, submits it and clears the field', async () => {
    const user = userEvent.setup();
    let body: { rawText?: string; source?: string } | undefined;
    server.use(
      http.post(`${API_BASE}/feedback`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json(makeFeedbackItem(), { status: 201 });
      }),
    );

    renderWithProviders(<IngestPage />);
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, '  checkout is broken  ');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body).toEqual({ rawText: 'checkout is broken', source: 'web_form' });
    await waitFor(() => expect(textarea).toHaveValue(''));
  });

  it('warns but still confirms the save when classification failed', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_BASE}/feedback`, () =>
        HttpResponse.json(makeFeedbackItem({ classificationStatus: 'failed' }), { status: 201 }),
      ),
    );

    renderWithProviders(<IngestPage />);
    await user.type(screen.getByRole('textbox'), 'anything');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(lastToast()).toMatchObject({
        type: 'warning',
        description: 'Saved · Classification failed',
      }),
    );
  });

  it('surfaces the API error message and keeps the text', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_BASE}/feedback`, () =>
        HttpResponse.json({ message: 'rawText is too long' }, { status: 400 }),
      ),
    );

    renderWithProviders(<IngestPage />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'some feedback');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(lastToast()).toMatchObject({
        type: 'error',
        description: 'rawText is too long',
      }),
    );
    expect(textarea).toHaveValue('some feedback');
  });
});

describe('IngestBulkPage', () => {
  it('rejects a submission with no usable lines', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IngestBulkPage />);

    await user.type(screen.getByRole('textbox'), '   \n  \n');
    await user.click(screen.getByRole('button', { name: 'Submit bulk' }));

    expect(lastToast()).toMatchObject({
      type: 'error',
      description: 'Enter at least one non-empty line of feedback.',
    });
  });

  it('drops blank lines and trims the rest', async () => {
    const user = userEvent.setup();
    let body: { items: { rawText: string }[] } | undefined;
    server.use(
      http.post(`${API_BASE}/feedback/bulk`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json([{ index: 0, status: 'fulfilled', data: makeFeedbackItem() }]);
      }),
    );

    renderWithProviders(<IngestBulkPage />);
    await user.type(screen.getByRole('textbox'), '  first  \n\n   \nsecond\n');
    await user.click(screen.getByRole('button', { name: 'Submit bulk' }));

    await waitFor(() => expect(body).toBeDefined());
    expect(body?.items).toEqual([{ rawText: 'first' }, { rawText: 'second' }]);
  });

  it('blocks more than 20 lines before hitting the API', async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.post(`${API_BASE}/feedback/bulk`, () => {
        called = true;
        return HttpResponse.json([]);
      }),
    );

    renderWithProviders(<IngestBulkPage />);
    const lines = Array.from({ length: 21 }, (_, i) => `line ${i}`).join('\n');
    await user.type(screen.getByRole('textbox'), lines);
    await user.click(screen.getByRole('button', { name: 'Submit bulk' }));

    expect(lastToast()).toMatchObject({ type: 'error', title: 'Too many items' });
    expect(called).toBe(false);
  });

  it('reports mixed results and keeps the text when some items were rejected', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_BASE}/feedback/bulk`, () =>
        HttpResponse.json([
          { index: 0, status: 'fulfilled', data: makeFeedbackItem() },
          { index: 1, status: 'rejected', error: 'too long' },
        ]),
      ),
    );

    renderWithProviders(<IngestBulkPage />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'a\nb');
    await user.click(screen.getByRole('button', { name: 'Submit bulk' }));

    await waitFor(() =>
      expect(lastToast()).toMatchObject({
        type: 'error',
        title: 'Bulk ingest complete with issues',
        description: '1 saved · 1 rejected',
      }),
    );
    expect(textarea).toHaveValue('a\nb');
  });

  it('warns when everything saved but a classification failed', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_BASE}/feedback/bulk`, () =>
        HttpResponse.json([
          {
            index: 0,
            status: 'fulfilled',
            data: makeFeedbackItem({ classificationStatus: 'failed' }),
          },
        ]),
      ),
    );

    renderWithProviders(<IngestBulkPage />);
    await user.type(screen.getByRole('textbox'), 'a');
    await user.click(screen.getByRole('button', { name: 'Submit bulk' }));

    await waitFor(() =>
      expect(lastToast()).toMatchObject({
        type: 'warning',
        description: '1 saved · 1 classification failure',
      }),
    );
  });

  it('clears the textarea when every item succeeded', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IngestBulkPage />);
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'all good');
    await user.click(screen.getByRole('button', { name: 'Submit bulk' }));

    await waitFor(() => expect(textarea).toHaveValue(''));
  });
});
