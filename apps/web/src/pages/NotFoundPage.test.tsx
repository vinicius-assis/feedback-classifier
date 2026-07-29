import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../test/renderWithProviders';
import { NotFoundPage } from './NotFoundPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('NotFoundPage', () => {
  it('tells the user the URL matched nothing', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('offers a way back to the dashboard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotFoundPage />);

    await user.click(screen.getByRole('button', { name: 'Back to dashboard' }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
