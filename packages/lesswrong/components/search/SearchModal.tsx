import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import SearchPage from './SearchPage';

const styles = defineStyles('SearchModal', (theme: ThemeType) => ({
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: theme.zIndexes.modal,
    backgroundColor: theme.palette.greyAlpha(0.35),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 12,
    boxSizing: 'border-box',
    height: 'var(--search-viewport-height, 100dvh)',
    top: 'var(--search-viewport-top, 0px)',
    [theme.breakpoints.down('sm')]: {
      padding: 'max(8px, env(safe-area-inset-top)) 0 0',
      alignItems: 'stretch',
    },
  },
  // The frame is the modal's screen-anchored box. The timeline always keeps
  // its place above the dialog box, so opening or closing it moves nothing.
  // While the timeline shows, the dialog box's top corners meet it squarely.
  frame: {
    width: '100%',
    maxWidth: 1200,
    height: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    '& $timeframe:has([aria-label="Timeframe"]:not([inert])) + $dialog': {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
  },
  timeframe: {
    display: 'contents',
  },
  dialog: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.normal,
    boxShadow: `0 8px 40px ${theme.palette.boxShadowColor(0.3)}`,
    [theme.breakpoints.down('sm')]: {
      borderRadius: '12px 12px 0 0',
    },
  },
}));

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';

function isSearchControlVisible(element: HTMLElement): boolean {
  for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
    const style = getComputedStyle(ancestor);
    if (ancestor.hidden || style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}

function containSearchFocus(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Tab' || event.defaultPrevented) return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector))
    .filter(isSearchControlVisible);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

/** Uses the visual viewport so the mobile keyboard cannot cover the results. */
const SearchModal = ({onClose}: {onClose: () => void}) => {
  const classes = useStyles(styles);
  const backdropRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [timeframeSlot, setTimeframeSlot] = useState<HTMLDivElement | null>(null);
  const [previousFocus] = useState(() => document.activeElement);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    frameRef.current?.querySelector<HTMLInputElement>('input[aria-label="Search"]')?.focus({preventScroll: true});
    const viewport = window.visualViewport;
    const updateViewport = () => {
      if (!viewport) return;
      backdropRef.current?.style.setProperty('--search-viewport-height', `${viewport.height}px`);
      backdropRef.current?.style.setProperty('--search-viewport-top', `${viewport.offsetTop}px`);
    };
    updateViewport();
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);
    return () => {
      document.body.style.overflow = previousOverflow;
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({preventScroll: true});
    };
  }, [previousFocus]);

  return createPortal(<div ref={backdropRef} className={classes.backdrop} onClick={event => {
    if (event.target === event.currentTarget) onClose();
  }} onKeyDown={event => {
    if (event.key === 'Escape' && !event.defaultPrevented && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  }}>
    <div ref={frameRef} className={classes.frame} role="dialog" aria-modal="true" aria-label="Search" onKeyDown={containSearchFocus}>
      <div ref={setTimeframeSlot} className={classes.timeframe} />
      <div className={classes.dialog}>
        <SearchPage presentation="modal" onClose={onClose} timeframeSlot={timeframeSlot} />
      </div>
    </div>
  </div>, document.body);
};

export default SearchModal;
