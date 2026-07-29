import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCountUp } from './useCountUp';

let frames: FrameRequestCallback[] = [];
let nextId = 0;

/** Runs every pending frame with `timestamp`, mimicking the browser's rAF loop. */
function advanceTo(timestamp: number) {
  const pending = frames;
  frames = [];
  act(() => {
    for (const frame of pending) frame(timestamp);
  });
}

beforeEach(() => {
  frames = [];
  nextId = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    frames.push(cb);
    return ++nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useCountUp', () => {
  it('starts at zero before the first frame', () => {
    const { result } = renderHook(() => useCountUp(100));
    expect(result.current).toBe(0);
  });

  it('reaches the target once the duration elapses', () => {
    const { result } = renderHook(() => useCountUp(100, 700));

    advanceTo(0);
    advanceTo(700);

    expect(result.current).toBe(100);
  });

  it('eases out, so it is past the halfway mark at half the duration', () => {
    const { result } = renderHook(() => useCountUp(100, 700));

    advanceTo(0);
    advanceTo(350);

    // ease-out cubic at t=0.5 → 1 - 0.5³ = 0.875
    expect(result.current).toBe(88);
  });

  it('short-circuits to zero when the target is zero', () => {
    const { result } = renderHook(() => useCountUp(0));
    expect(result.current).toBe(0);
    expect(frames).toHaveLength(0);
  });

  it('never overshoots past the duration', () => {
    const { result } = renderHook(() => useCountUp(42, 700));

    advanceTo(0);
    advanceTo(5000);

    expect(result.current).toBe(42);
  });

  it('cancels the pending frame on unmount', () => {
    const { unmount } = renderHook(() => useCountUp(100));
    advanceTo(0);
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('animates from the current value when the target changes', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 700), {
      initialProps: { target: 10 },
    });

    advanceTo(0);
    advanceTo(700);
    expect(result.current).toBe(10);

    rerender({ target: 20 });
    advanceTo(0);

    // Holds at 10 rather than dropping to 0: this is what stops the dashboard
    // KPIs from flickering on every stats refetch.
    expect(result.current).toBe(10);

    advanceTo(700);
    expect(result.current).toBe(20);
  });

  it('does not re-animate when the target is unchanged', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 700), {
      initialProps: { target: 42 },
    });

    advanceTo(0);
    advanceTo(700);
    expect(result.current).toBe(42);

    rerender({ target: 42 });
    expect(frames).toHaveLength(0);
    expect(result.current).toBe(42);
  });

  it('drops straight to zero when the data empties out', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 700), {
      initialProps: { target: 15 },
    });

    advanceTo(0);
    advanceTo(700);
    expect(result.current).toBe(15);

    rerender({ target: 0 });
    expect(result.current).toBe(0);
  });
});
