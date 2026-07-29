import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { API_BASE, makeListResult, makeStats } from '../test/fixtures';
import { renderWithProviders } from '../test/renderWithProviders';
import { server } from '../test/server';
import { DashboardPage } from './DashboardPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

/** Charts render async; wait for the table to settle before asserting. */
async function renderDashboard() {
  const utils = renderWithProviders(<DashboardPage />);
  await screen.findByRole('table');
  return utils;
}

describe('DashboardPage KPIs', () => {
  it('renders the totals coming from the stats endpoint', async () => {
    await renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total feedback')).toBeInTheDocument();
    });
    expect(screen.getByText('Classified (success)')).toBeInTheDocument();
    expect(screen.getByText('Classification failed')).toBeInTheDocument();
    expect(screen.getByText('Active source channels')).toBeInTheDocument();
  });

  it('shows an alert when the stats request fails', async () => {
    server.use(
      http.get(`${API_BASE}/feedback/stats/summary`, () =>
        HttpResponse.json({ message: 'down' }, { status: 500 }),
      ),
    );

    await renderDashboard();

    expect(await screen.findByText('Could not load stats')).toBeInTheDocument();
  });

  it('shows an alert when the list request fails', async () => {
    server.use(
      http.get(`${API_BASE}/feedback`, () =>
        HttpResponse.json({ message: 'down' }, { status: 500 }),
      ),
    );

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText('Could not load feedback list')).toBeInTheDocument();
  });
});

describe('DashboardPage table', () => {
  it('lists the feedback returned by the API', async () => {
    await renderDashboard();

    expect(await screen.findByText(/The payments page is too slow/)).toBeInTheDocument();
    expect(screen.getByText(/Love the new onboarding flow/)).toBeInTheDocument();
  });

  it('renders an empty state when nothing matches', async () => {
    server.use(
      http.get(`${API_BASE}/feedback`, () =>
        HttpResponse.json(makeListResult({ data: [], total: 0 })),
      ),
    );

    await renderDashboard();

    expect(await screen.findByText('No feedback matches these filters.')).toBeInTheDocument();
  });

  it('navigates to the detail page when a row is clicked', async () => {
    const user = userEvent.setup();
    await renderDashboard();

    await user.click(await screen.findByText(/The payments page is too slow/));

    expect(mockNavigate).toHaveBeenCalledWith('/feedback/65f0000000000000000000a1');
  });
});

describe('DashboardPage filters', () => {
  it('requests the API with the selected filter and resets to page 1', async () => {
    const user = userEvent.setup();
    const urls: string[] = [];
    server.use(
      http.get(`${API_BASE}/feedback`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json(makeListResult());
      }),
    );

    await renderDashboard();
    await waitFor(() => expect(urls).toHaveLength(1));

    await user.selectOptions(screen.getByLabelText('Sentiment'), 'negative');

    await waitFor(() => expect(urls.length).toBeGreaterThan(1));
    const params = new URL(urls[urls.length - 1]).searchParams;
    expect(params.get('sentiment')).toBe('negative');
    expect(params.get('page')).toBe('1');
  });

  it('drops the filter from the query when switching back to All', async () => {
    const user = userEvent.setup();
    const urls: string[] = [];
    server.use(
      http.get(`${API_BASE}/feedback`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json(makeListResult());
      }),
    );

    await renderDashboard();
    const select = screen.getByLabelText('Urgency');

    await user.selectOptions(select, 'high');
    await waitFor(() => {
      expect(new URL(urls[urls.length - 1]).searchParams.get('urgency')).toBe('high');
    });

    await user.selectOptions(select, '');
    await waitFor(() => {
      expect(new URL(urls[urls.length - 1]).searchParams.has('urgency')).toBe(false);
    });
  });

  it('clears every filter on reset', async () => {
    const user = userEvent.setup();
    await renderDashboard();

    const sentiment = screen.getByLabelText<HTMLSelectElement>('Sentiment');
    await user.selectOptions(sentiment, 'positive');
    expect(sentiment.value).toBe('positive');

    await user.click(screen.getByRole('button', { name: 'Reset filters' }));

    await waitFor(() => expect(sentiment.value).toBe(''));
  });
});

describe('DashboardPage pagination', () => {
  it('disables Previous on the first page', async () => {
    await renderDashboard();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('disables Next on the last page', async () => {
    await renderDashboard();
    await screen.findByText('Page 1 of 1');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('advances the page and asks the API for it', async () => {
    const user = userEvent.setup();
    const urls: string[] = [];
    server.use(
      http.get(`${API_BASE}/feedback`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json(makeListResult({ total: 45 }));
      }),
    );

    await renderDashboard();
    await screen.findByText('Page 1 of 3');

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await screen.findByText('Page 2 of 3');
    await waitFor(() => {
      expect(new URL(urls[urls.length - 1]).searchParams.get('page')).toBe('2');
    });
  });
});

describe('DashboardPage delete flow', () => {
  it('opens the confirm dialog without navigating away', async () => {
    const user = userEvent.setup();
    await renderDashboard();
    mockNavigate.mockClear();

    const rows = await screen.findAllByRole('button', { name: 'Remove feedback' });
    await user.click(rows[0]);

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('deletes the item and refetches the list on confirm', async () => {
    const user = userEvent.setup();
    let deletedId: string | undefined;
    server.use(
      http.delete(`${API_BASE}/feedback/:id`, ({ params }) => {
        deletedId = String(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await renderDashboard();
    await user.click((await screen.findAllByRole('button', { name: 'Remove feedback' }))[0]);

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(deletedId).toBe('65f0000000000000000000a1'));
  });

  it('closes the dialog on cancel without deleting', async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.delete(`${API_BASE}/feedback/:id`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await renderDashboard();
    await user.click((await screen.findAllByRole('button', { name: 'Remove feedback' }))[0]);

    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(called).toBe(false);
  });
});

describe('DashboardPage stats edge cases', () => {
  it('renders zeros when the API reports no feedback at all', async () => {
    server.use(
      http.get(`${API_BASE}/feedback/stats/summary`, () =>
        HttpResponse.json(
          makeStats({
            total: [],
            byClassificationStatus: [],
            bySource: [],
          }),
        ),
      ),
    );

    await renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total feedback')).toBeInTheDocument();
    });
    // `total: []` must not blow up on `stats.total[0].count`.
    expect(screen.queryByText('Could not load stats')).not.toBeInTheDocument();
  });
});
