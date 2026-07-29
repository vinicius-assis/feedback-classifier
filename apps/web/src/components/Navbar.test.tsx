import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '../test/renderWithProviders';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  it('renders the main navigation links', () => {
    renderWithProviders(<Navbar />, { route: '/dashboard' });

    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Ingest')).toBeInTheDocument();
    expect(screen.getByText('Bulk Ingest')).toBeInTheDocument();
    expect(screen.getByText('Import file')).toBeInTheDocument();
  });

  it('points each link at its route', () => {
    renderWithProviders(<Navbar />, { route: '/dashboard' });

    expect(screen.getByText('Bulk Ingest').closest('a')).toHaveAttribute('href', '/ingest/bulk');
    expect(screen.getByText('Import file').closest('a')).toHaveAttribute('href', '/ingest/file');
  });

  it('exposes a color-mode toggle with an accessible label', () => {
    renderWithProviders(<Navbar />, { route: '/dashboard' });

    expect(screen.getByRole('button', { name: /Switch to (light|dark) mode/ })).toBeInTheDocument();
  });

  it('does not link to the removed integrations page', () => {
    renderWithProviders(<Navbar />, { route: '/dashboard' });

    expect(screen.queryByText('Integrations')).not.toBeInTheDocument();
  });
});
