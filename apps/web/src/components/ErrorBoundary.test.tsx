import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '../test/renderWithProviders';
import { ErrorBoundary } from './ErrorBoundary';

function Boom({ shouldThrow }: { shouldThrow: boolean }): React.ReactElement {
  if (shouldThrow) throw new Error('render exploded');
  return <p>all good</p>;
}

/** React rethrows caught errors, and jsdom reports them as uncaught. */
const swallow = (event: ErrorEvent) => event.preventDefault();

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.addEventListener('error', swallow);
});

afterEach(() => {
  window.removeEventListener('error', swallow);
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('shows a fallback with the error message instead of a blank page', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('render exploded')).toBeInTheDocument();
  });

  it('recovers when the user retries and the child no longer throws', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('all good')).toBeInTheDocument();
  });
});
