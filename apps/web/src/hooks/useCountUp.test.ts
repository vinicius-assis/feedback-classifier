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

  it('restarts from zero when the target changes (known bug, see Phase 2)', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 700), {
      initialProps: { target: 10 },
    });

    advanceTo(0);
    advanceTo(700);
    expect(result.current).toBe(10);

    rerender({ target: 20 });
    advanceTo(0);

    // Should hold at 10 and ease up to 20; instead it drops back to 0, which is
    // what makes the dashboard KPIs flicker on every stats refetch.
    expect(result.current).toBe(0);
  });
});
