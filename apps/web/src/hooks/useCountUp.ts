import { useEffect, useRef, useState } from 'react';

/**
 * Animates the displayed number toward `target` over `duration` ms using an
 * ease-out curve. Each run starts from whatever is currently on screen, so a
 * refetch that nudges the value does not replay the count from zero.
 */
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  /** Mirrors `value` so the effect can read it without depending on it. */
  const valueRef = useRef(0);

  useEffect(() => {
    const commit = (next: number) => {
      valueRef.current = next;
      setValue(next);
    };

    if (target === valueRef.current) {
      return;
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    if (target === 0) {
      commit(0);
      return;
    }

    fromRef.current = valueRef.current;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      commit(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        commit(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}
