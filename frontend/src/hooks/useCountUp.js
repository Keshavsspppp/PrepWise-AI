import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp — animates a number from `start` to `end` using
 * requestAnimationFrame with an ease-out curve. Pass `trigger={inView}`
 * to only start counting once a card has scrolled into view.
 */
export const useCountUp = (end, { duration = 900, start = 0, decimals = 0, trigger = true } = {}) => {
  const [value, setValue] = useState(start);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!trigger || end == null || Number.isNaN(Number(end))) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(Number(end));
      return;
    }

    const from = start;
    const to = Number(end);
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setValue(from + (to - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, trigger, duration, start]);

  return decimals ? value.toFixed(decimals) : Math.round(value);
};

export default useCountUp;
