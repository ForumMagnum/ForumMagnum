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
    backgroundColor: theme.palette.greyAlpha(0.2),
  },
  viewport: {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: '12px 12px 12px 152px',
    boxSizing: 'border-box',
    height: 'var(--search-viewport-height, 100dvh)',
    top: 'var(--search-viewport-top, 0px)',
    [theme.breakpoints.down('sm')]: {
      padding: 'max(8px, env(safe-area-inset-top)) 8px 8px',
      alignItems: 'stretch',
    },
  },
  // Keep the results box anchored at the right; the timeline unfolds above it.
  frame: {
    position: 'relative',
    isolation: 'isolate',
    width: '100%',
    maxWidth: 600,
    transition: 'max-width 320ms cubic-bezier(0.2, 0, 0, 1)',
    '&:has(button[aria-label="Filter results"][aria-expanded="true"])': {maxWidth: 1200},
    '@media (prefers-reduced-motion: reduce)': {transition: 'none'},
    marginTop: 128,
    height: 'calc(100% - 128px)',
    [theme.breakpoints.down('sm')]: {marginTop: 0, height: '100%'},
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    '& $timeframe:has([aria-label="Timeframe"]:not([inert])) + $dialogFrame $dialog': {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
  },
  timeframe: {
    position: 'absolute',
    bottom: '100%', left: 0, right: 0,
    maxHeight: 128,
    display: 'grid',
    gridTemplateRows: '0fr',
    flexShrink: 0,
    opacity: 0,
    transition: 'grid-template-rows 320ms cubic-bezier(0.2, 0, 0, 1), opacity 200ms ease-out',
    '&:has([aria-label="Timeframe"]:not([inert]))': {gridTemplateRows: '1fr', opacity: 1},

    '@media (prefers-reduced-motion: reduce)': {transition: 'none'},
  },
  timeframeContent: {
    minHeight: 0, overflow: 'hidden',
    '& > section': {maxHeight: 128, boxSizing: 'border-box'},
  },
  filterTabSlot: {
    position: 'absolute', left: 0, right: 0, top: 0, zIndex: -1,
    [theme.breakpoints.down('sm')]: {
      '& button': {
        '&:hover, &:focus-visible': {transform: 'none'},
      },
    },
    '@media (prefers-reduced-motion: reduce)': {transition: 'none'},
  },
  dialogFrame: {position: 'relative', flex: 1, minHeight: 0, display: 'flex'},
  dialog: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.normal,
    boxShadow: `0 8px 40px ${theme.palette.boxShadowColor(0.3)}`,
    [theme.breakpoints.down('sm')]: {
      borderRadius: '6px 6px 0 0',
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

/** Fits above the mobile keyboard without resizing the backdrop during zoom. */
const SearchModal = ({onClose}: {onClose: () => void}) => {
  const classes = useStyles(styles);
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [filterTabSlot, setFilterTabSlot] = useState<HTMLDivElement | null>(null);
  const [timeframeSlot, setTimeframeSlot] = useState<HTMLDivElement | null>(null);
  const [previousFocus] = useState(() => document.activeElement);

  useEffect(() => {
    const root = document.documentElement;
    const previousScrollbarGutter = root.style.scrollbarGutter;
    const previousOverflow = document.body.style.overflow;
    // Reserve existing scrollbar space before locking scroll, without adding
    // space on short pages or overriding a gutter that already reserves it.
    if (window.innerWidth > root.clientWidth && !getComputedStyle(root).scrollbarGutter?.includes('stable')) {
      root.style.scrollbarGutter = 'stable';
    }
    document.body.style.overflow = 'hidden';
    frameRef.current?.querySelector<HTMLInputElement>('input[aria-label="Search"]')?.focus({preventScroll: true});
    const viewport = window.visualViewport;
    const updateViewport = () => {
      if (!viewport) return;
      // Pinch zoom shrinks and pans the visual viewport without changing the
      // layout viewport. Keep the dialog in that layout so zoom can magnify it.
      if (viewport.scale !== 1) {
        viewportRef.current?.style.removeProperty('--search-viewport-height');
        viewportRef.current?.style.removeProperty('--search-viewport-top');
        return;
      }
      viewportRef.current?.style.setProperty('--search-viewport-height', `${viewport.height}px`);
      viewportRef.current?.style.setProperty('--search-viewport-top', `${viewport.offsetTop}px`);
    };
    updateViewport();
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);
    return () => {
      document.body.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousScrollbarGutter;
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({preventScroll: true});
    };
  }, [previousFocus]);

  return createPortal(<div className={classes.backdrop} onClick={event => {
    if (event.target === event.currentTarget || event.target === viewportRef.current) onClose();
  }} onKeyDown={event => {
    if (event.key === 'Escape' && !event.defaultPrevented && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
  }}>
    <div ref={viewportRef} className={classes.viewport}>
      <div ref={frameRef} className={classes.frame} role="dialog" aria-modal="true" aria-label="Search" onKeyDown={containSearchFocus}>
        <div className={classes.timeframe}>
          <div ref={setTimeframeSlot} className={classes.timeframeContent} />
        </div>
        <div className={classes.dialogFrame}>
          <div ref={setFilterTabSlot} className={classes.filterTabSlot} />
          <div className={classes.dialog}>
            <SearchPage presentation="modal" onClose={onClose} timeframeSlot={timeframeSlot} filterTabSlot={filterTabSlot} />
          </div>
        </div>
      </div>
    </div>
  </div>, document.body);
};

export default SearchModal;
