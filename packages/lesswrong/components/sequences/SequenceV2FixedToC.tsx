"use client";
import React, { useEffect, useMemo, useState } from 'react';
import FixedPositionToc from '../posts/TableOfContents/FixedPositionToC';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { ToCSection } from '@/lib/tableOfContents';

const styles = defineStyles("SequenceV2FixedToC", (theme: ThemeType) => ({
  root: {
    position: "fixed",
    left: 0,
    width: 270,
    zIndex: theme.zIndexes.sidebarHoverOver,
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
  hidden: {
    pointerEvents: "none",
  },
  scroller: {
    height: `calc(100vh - var(--header-height))`,
    overflow: "hidden",
  },
}));

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const SequenceV2FixedToC = ({tocSections, title, showAfterAnchor}: {
  tocSections: ToCSection[],
  title: string,
  showAfterAnchor: string,
}) => {
  const classes = useStyles(styles);
  const [scrollY, setScrollY] = useState(0);
  const [triggerY, setTriggerY] = useState<number|null>(null);

  useEffect(() => {
    const updateTrigger = () => {
      const el = document.getElementById(showAfterAnchor);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setTriggerY(rect.top + window.scrollY);
    };
    updateTrigger();
    window.addEventListener("resize", updateTrigger);
    return () => window.removeEventListener("resize", updateTrigger);
  }, [showAfterAnchor]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const slide = useMemo(() => {
    if (triggerY === null) return { visible: false, progress: 0 };
    const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
    const start = triggerY - headerHeight - 24;
    const progress = clamp01((scrollY - start) / 90);
    return { visible: scrollY >= start, progress };
  }, [scrollY, triggerY]);

  const style = useMemo(() => ({
    top: `calc(var(--header-height) + ${(1 - slide.progress) * 24}px)`,
    opacity: slide.progress,
    transform: `translateY(${(1 - slide.progress) * 14}px)`,
    transition: 'opacity .18s ease-out, transform .18s ease-out, top .18s ease-out',
  }), [slide.progress]);

  return <div className={classes.root} style={style}>
    <div className={classes.scroller}>
      <div className={!slide.visible ? classes.hidden : undefined}>
        <FixedPositionToc tocSections={tocSections} title={title} />
      </div>
    </div>
  </div>
};

export default SequenceV2FixedToC;
