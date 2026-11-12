import React, { useLayoutEffect, useRef } from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('AnimatedExpansion', () => ({
  root: {
    display: 'flow-root',
  },
  content: {
    // Keep child margins inside the measured height.
    display: 'flow-root',
  },
}));

/** Animate expansion, including content that arrives asynchronously after opening. */
const AnimatedExpansion = ({ expanded, duration=100, children }: {
  expanded: boolean,
  duration?: number,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousHeightRef = useRef<number|null>(null);
  const animationRef = useRef<Animation|null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateHeight = () => {
      const height = content.getBoundingClientRect().height;
      const previousHeight = previousHeightRef.current;
      if (height === previousHeight) return;

      const fromHeight = animationRef.current?.playState === 'running'
        ? root.getBoundingClientRect().height
        : previousHeight;
      animationRef.current?.cancel();
      animationRef.current = null;
      previousHeightRef.current = height;

      if (expanded && previousHeight !== null && height > previousHeight && fromHeight !== null && !reducedMotion.matches) {
        animationRef.current = root.animate([
          { height: `${fromHeight}px`, overflow: 'clip' },
          { height: `${height}px`, overflow: 'clip' },
        ], { duration: 200, easing: 'ease-out' });
      }
    };

    updateHeight();
    // Observe the natural content height, so the animation itself cannot trigger a resize loop.
    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    return () => {
      observer.disconnect();
      animationRef.current?.cancel();
      animationRef.current = null;
    };
  }, [expanded]);

  return <div ref={rootRef} className={classes.root}>
    <div ref={contentRef} className={classes.content}>{children}</div>
  </div>;
};

export default AnimatedExpansion;
