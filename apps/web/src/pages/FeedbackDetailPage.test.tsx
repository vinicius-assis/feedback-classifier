import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { API_BASE, makeFeedbackItem } from '../test/fixtures';
import { renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';
import { toaster } from '../lib/toaster';
import { FeedbackDetailPage } from './FeedbackDetailPage';

const mockNavigate = vi.fn();
let mockId: string | undefined = 'abc123';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: mockId }),
  };
});

let createToast: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mockId = 'abc123';
  mockNavigate.mockClear();
  createToast = vi.spyOn(toaster, 'create').mockReturnValue('id');
});

describe('FeedbackDetailPage states', () => {
  it('renders an error when the route has no usable id', () => {
    mockId = '   ';
    renderWithProviders(<FeedbackDetailPage />);

    expect(screen.getByText('Invalid feedback ID')).toBeInTheDocument();
  });

  it('renders a not-found message on 404', async () => {
    server.use(
      http.get(`${API_BASE}/feedback/:id`, () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    );

    renderWithProviders(<FeedbackDetailPage />);

    expect(await screen.findByText('Item not found.')).toBeInTheDocument();
  });

  it('renders a generic error with the API message on 500', async () => {
    server.use(
      http.get(`${API_BASE}/feedback/:id`, () =>
        HttpResponse.json({ message: 'database is down' }, { status: 500 }),
      ),
    );

    renderWithProviders(<FeedbackDetailPage />);

    expect(await screen.findByText('Failed to load feedback item.')).toBeInTheDocument();
    expect(screen.getByText('database is down')).toBeInTheDocument();
  });
});

describe('FeedbackDetailPage content', () => {
  it('shows the raw text and the classification badges', async () => {
    renderWithProviders(<FeedbackDetailPage />);

    expect(await screen.findByText('The payments page is too slow')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('negative')).toBeInTheDocument();
    expect(screen.getByText('payments')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('shows the model and prompt version', async () => {
    renderWithProviders(<FeedbackDetailPage />);

    expect(await screen.findByText('Model: gpt-4o-mini')).toBeInTheDocument();
    expect(screen.getByText('Prompt version: v1')).toBeInTheDocument();
  });

  it('surfaces the recorded error when classification failed', async () => {
    server.use(
      http.get(`${API_BASE}/feedback/:id`, () =>
        HttpResponse.json(
          makeFeedbackItem({
            classificationStatus: 'failed',
            classificationError: 'model timed out',
          }),
        ),
      ),
    );

    renderWithProviders(<FeedbackDetailPage />);

    expect(await screen.findByText('Classification error')).toBeInTheDocument();
    expect(screen.getByText('model timed out')).toBeInTheDocument();
  });

  it('falls back when a failed item has no error details', async () => {
    server.use(
      http.get(`${API_BASE}/feedback/:id`, () =>
        HttpResponse.json(
          makeFeedbackItem({ classificationStatus: 'failed', classificationError: undefined }),
        ),
      ),
    );

    renderWithProviders(<FeedbackDetailPage />);

    expect(await screen.findByText('No error details recorded.')).toBeInTheDocument();
  });

  it('renders Slack-like source metadata when present', async () => {
    server.use(
      http.get(`${API_BASE}/feedback/:id`, () =>
        HttpResponse.json(
          makeFeedbackItem({
            source: 'slack_like',
            sourceMetadata: {
              externalMessageId: 'slack-msg-001',
              channel: '#product-feedback',
              userDisplayName: 'alice',
            },
          }),
        ),
      ),
    );

    renderWithProviders(<FeedbackDetailPage />);

    expect(await screen.findByText('slack-msg-001')).toBeInTheDocument();
    expect(screen.getByText('#product-feedback')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('slack like')).toBeInTheDocument();
  });
});

describe('FeedbackDetailPage actions', () => {
  it('goes back in history', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDetailPage />);

    await user.click(await screen.findByRole('button', { name: '← Back' }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('reclassifies and confirms with a toast', async () => {
    const user = userEvent.setup();
    let reclassified = false;
    server.use(
      http.post(`${API_BASE}/feedback/:id/reclassify`, () => {
        reclassified = true;
        return HttpResponse.json(makeFeedbackItem({ sentiment: 'positive' }));
      }),
    );

    renderWithProviders(<FeedbackDetailPage />);
    await user.click(await screen.findByRole('button', { name: /Reclassify/ }));

    await waitFor(() => expect(reclassified).toBe(true));
    await waitFor(() =>
      expect(createToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', title: 'Reclassified successfully' }),
      ),
    );
  });

  it('copies the id and flashes a confirmation', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderWithProviders(<FeedbackDetailPage />);
    await user.click(await screen.findByTitle('Copy ID'));

    expect(writeText).toHaveBeenCalledWith('abc123');
    expect(await screen.findByText('Copied!')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('warns instead of throwing when the clipboard is unavailable', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderWithProviders(<FeedbackDetailPage />);
    await user.click(await screen.findByTitle('Copy ID'));

    await waitFor(() =>
      expect(createToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', title: 'Could not copy the ID' }),
      ),
    );
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('reports a failed reclassification', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_BASE}/feedback/:id/reclassify`, () =>
        HttpResponse.json({ message: 'model unavailable' }, { status: 503 }),
      ),
    );

    renderWithProviders(<FeedbackDetailPage />);
    await user.click(await screen.findByRole('button', { name: /Reclassify/ }));

    await waitFor(() =>
      expect(createToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Reclassification failed',
          description: 'model unavailable',
        }),
      ),
    );
  });
});
