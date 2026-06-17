import { useEffect, useState } from 'react';

/** True only after `active` stays true for `delayMs`. Hides immediately when `active` is false. */
export function useDelayedTrue(active: boolean, delayMs: number): boolean {
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setDelayed(true), delayMs);
    return () => {
      clearTimeout(timer);
      setDelayed(false);
    };
  }, [active, delayMs]);

  return active && delayed;
}
