import { useEffect, useState } from 'react';
/**
 * ScrollProgress — thin amber→teal bar that fills as the user scrolls
 * down a given container. Pass the scrollable element's ref (the <main>
 * in DashboardLayout); falls back to window scroll if no target is given.
 */
const ScrollProgress = ({ targetRef }) => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const el = targetRef?.current || window;
    const getMetrics = () => {
      if (el === window) {
        const scrollTop = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return { scrollTop, max };
      }
      return { scrollTop: el.scrollTop, max: el.scrollHeight - el.clientHeight };
    };
    const onScroll = () => {
      const { scrollTop, max } = getMetrics();
      setPct(max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetRef]);
  return (
    <div className="scroll-progress-track">
      <div className="scroll-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
};
export default ScrollProgress;