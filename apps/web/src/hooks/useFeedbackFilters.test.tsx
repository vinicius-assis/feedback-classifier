import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useFeedbackFilters } from './useFeedbackFilters';

function setup(initialUrl = '/dashboard') {
  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>;
  }
  return renderHook(() => ({ ...useFeedbackFilters(), search: useLocation().search }), {
    wrapper: Wrapper,
  });
}

describe('useFeedbackFilters reading', () => {
  it('defaults to page 1 with no filters', () => {
    const { result } = setup();

    expect(result.current.filters).toMatchObject({ page: 1, limit: 20 });
    expect(result.current.filters.sentiment).toBeUndefined();
  });

  it('reads valid filters from the query string', () => {
    const { result } = setup('/dashboard?sentiment=negative&urgency=high&page=3');

    expect(result.current.filters).toMatchObject({
      sentiment: 'negative',
      urgency: 'high',
      page: 3,
    });
  });

  it('drops values that are not valid options', () => {
    const { result } = setup('/dashboard?sentiment=bogus&source=slack_like');

    expect(result.current.filters.sentiment).toBeUndefined();
    // `slack_like` is a real API value but not offered by this UI.
    expect(result.current.filters.source).toBeUndefined();
  });

  it('falls back to page 1 for a nonsense page param', () => {
    expect(setup('/dashboard?page=abc').result.current.filters.page).toBe(1);
    expect(setup('/dashboard?page=0').result.current.filters.page).toBe(1);
    expect(setup('/dashboard?page=-2').result.current.filters.page).toBe(1);
  });
});

describe('useFeedbackFilters writing', () => {
  it('puts a chosen filter in the URL', () => {
    const { result } = setup();

    act(() => result.current.setFilter('sentiment', 'positive'));

    expect(result.current.search).toContain('sentiment=positive');
    expect(result.current.filters.sentiment).toBe('positive');
  });

  it('removes the param when the filter is cleared', () => {
    const { result } = setup('/dashboard?sentiment=positive');

    act(() => result.current.setFilter('sentiment', ''));

    expect(result.current.search).not.toContain('sentiment');
    expect(result.current.filters.sentiment).toBeUndefined();
  });

  it('resets pagination whenever a filter changes', () => {
    const { result } = setup('/dashboard?page=4');

    act(() => result.current.setFilter('urgency', 'low'));

    expect(result.current.filters.page).toBe(1);
    expect(result.current.search).not.toContain('page');
  });

  it('keeps page 1 out of the URL', () => {
    const { result } = setup('/dashboard?page=3');

    act(() => result.current.setPage(1));

    expect(result.current.search).not.toContain('page');
    expect(result.current.filters.page).toBe(1);
  });

  it('preserves other filters when paging', () => {
    const { result } = setup('/dashboard?sentiment=negative');

    act(() => result.current.setPage(2));

    expect(result.current.filters).toMatchObject({ sentiment: 'negative', page: 2 });
  });

  it('clears everything on reset', () => {
    const { result } = setup('/dashboard?sentiment=negative&urgency=high&page=5');

    act(() => result.current.resetFilters());

    expect(result.current.search).toBe('');
    expect(result.current.filters).toMatchObject({ page: 1 });
    expect(result.current.filters.sentiment).toBeUndefined();
  });
});
