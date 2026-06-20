import { useInView } from '../hooks/useInView';
/**
 * Reveal — wraps any block and animates it in once it scrolls into view.
 *
 * Usage:
 *   <Reveal>...</Reveal>                             fade + slide up (default)
 *   <Reveal variant="pop" delay={120}>...</Reveal>    pop/scale in, staggered
 *   <Reveal variant="left">...</Reveal>               slide in from the left
 *
 * For a staggered grid/list, pass delay={i * 70} inside a .map() — each
 * item will reveal slightly after the one before it.
 *
 * variant: 'up' | 'down' | 'left' | 'right' | 'pop' | 'fade'
 */
const Reveal = ({
  children,
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  duration = 700,
  once = true,
  className = '',
  style = {},
  ...rest
}) => {
  const [ref, inView] = useInView({ once });
  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${variant}${inView ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: `${duration}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
};
export default Reveal;