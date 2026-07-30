import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test/renderWithProviders';

/**
 * Every route is behind `React.lazy`, so these also assert that the Suspense
 * boundary in `AppShell` resolves each chunk instead of leaving the fallback up.
 */
describe('App routing', () => {
  it('lands on the dashboard at /', async () => {
    renderWithProviders(<App />, { route: '/' });

    expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
  });

  it.each([
    ['/ingest', 'Ingest feedback'],
    ['/ingest/bulk', 'Bulk ingest'],
    ['/ingest/file', 'Import from file'],
  ])('resolves the lazy chunk for %s', async (route, heading) => {
    renderWithProviders(<App />, { route });

    expect(await screen.findByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
  });

  it('shows the not-found page for an unknown route', async () => {
    renderWithProviders(<App />, { route: '/nope' });

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });

  it('keeps the navbar mounted around the lazy outlet', async () => {
    renderWithProviders(<App />, { route: '/ingest' });

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Ingest feedback', level: 1 })).toBeVisible();
  });
});
