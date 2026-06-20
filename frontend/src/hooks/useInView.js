import { useEffect, useRef, useState } from 'react';

/**
 * useInView — fires once when the observed element scrolls into the
 * viewport, then disconnects. Used to drive the .reveal CSS classes
 * defined in index.css.
 *
 * @param {Object} options
 * @param {number} options.threshold   fraction of the element visible before triggering (0–1)
 * @param {string} options.rootMargin  shrinks/grows the trigger zone, e.g. '-60px' fires a bit later
 * @param {boolean} options.once       if false, toggles inView both ways (re-animates on re-scroll)
 */
export const useInView = ({ threshold = 0.15, rootMargin = '0px 0px -60px 0px', once = true } = {}) => {
  const ref = useRef(null);
  const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [inView, setInView] = useState(isReduced);

  useEffect(() => {
    if (isReduced) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once, isReduced]);

  return [ref, inView];
};

export default useInView;
