import React, { useLayoutEffect, useRef, useState } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("SlidingPages", () => ({
  root: {
    position: "relative",
    scrollMarginTop: "calc(var(--header-height, 0px) + 16px)",
  },
  outgoingPage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // Only shown by its slide-out animation, so that it can't flash back into
    // place between that animation finishing and the page being unmounted.
    visibility: "hidden",
  },
}));

interface DisplayedPages {
  current: number,
  outgoing: number | null,
}

const slideOptions: KeyframeAnimationOptions = { duration: 250, easing: 'ease-in-out' };

const withoutOutgoingPage = (outgoing: number) => (displayed: DisplayedPages): DisplayedPages =>
  displayed.outgoing === outgoing ? { ...displayed, outgoing: null } : displayed;

const scrollToTopIfAboveViewport = (root: HTMLElement, behavior: ScrollBehavior) => {
  const topOfVisibleArea = parseFloat(getComputedStyle(root).scrollMarginTop);
  if (root.getBoundingClientRect().top < topOfVisibleArea) {
    root.scrollIntoView({ block: 'start', behavior });
  }
};

const SlidingPages = ({ page, renderPage }: {
  page: number,
  renderPage: (page: number) => React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const [displayed, setDisplayed] = useState<DisplayedPages>({ current: page, outgoing: null });
  const rootRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef<HTMLDivElement>(null);
  const outgoingPageRef = useRef<HTMLDivElement>(null);

  if (displayed.current !== page) {
    setDisplayed({ current: page, outgoing: displayed.current });
  }

  const { current, outgoing } = displayed;

  useLayoutEffect(() => {
    if (outgoing === null) return;

    const root = rootRef.current;
    const currentPage = currentPageRef.current;
    const outgoingPage = outgoingPageRef.current;
    if (!root || !currentPage || !outgoingPage) {
      throw new Error("SlidingPages is changing pages without its page elements mounted");
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scrollToTopIfAboveViewport(root, 'auto');
      setDisplayed(withoutOutgoingPage(outgoing));
      return;
    }
    scrollToTopIfAboveViewport(root, 'smooth');

    const slideDistance = current > outgoing ? 100 : -100;
    const outgoingHeight = outgoingPage.getBoundingClientRect().height;
    const currentHeight = currentPage.getBoundingClientRect().height;

    const outgoingSlide = outgoingPage.animate([
      { transform: 'translateX(0)', visibility: 'visible' },
      { transform: `translateX(${-slideDistance}%)`, visibility: 'visible' },
    ], slideOptions);
    const animations = [
      outgoingSlide,
      currentPage.animate([
        { transform: `translateX(${slideDistance}%)` },
        { transform: 'translateX(0)' },
      ], slideOptions),
      // Clipping only for the duration of the slide leaves things that hang
      // outside the pages' box (like post actions menus) visible the rest of the time
      root.animate([
        { height: `${outgoingHeight}px`, overflow: 'clip' },
        { height: `${currentHeight}px`, overflow: 'clip' },
      ], slideOptions),
    ];
    outgoingSlide.onfinish = () => setDisplayed(withoutOutgoingPage(outgoing));

    return () => animations.forEach(animation => animation.cancel());
  }, [current, outgoing]);

  return <div ref={rootRef} className={classes.root}>
    {outgoing !== null && <div key={outgoing} ref={outgoingPageRef} className={classes.outgoingPage} inert>
      {renderPage(outgoing)}
    </div>}
    <div key={current} ref={currentPageRef}>
      {renderPage(current)}
    </div>
  </div>;
};

export default SlidingPages;
