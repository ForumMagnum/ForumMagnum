'use client';
// EXPERIMENT (branch experiment/scrollytelling-ronny): scroll-driven "scrollytelling" widgets.
// A widget whose HTML contains <meta name="lw-scrolly"> is pinned on screen from where it
// appears in the post until the end of the post body, and is told which section the reader
// is in via postMessage({type: 'lw-scrolly', heading, index, progress, count}).
// The layout is switchable for comparison with ?scrolly=right|margin|top|inline.
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { injectResizeScript } from '@/components/lexical/embeds/IframeWidgetEmbed/iframeResizeScript';

export const SCROLLY_META_RE = /<meta[^>]+name=["']lw-scrolly["']/i;

type ScrollyMode = 'right' | 'margin' | 'top' | 'inline';

interface ScrollyModeOption {
  mode: ScrollyMode,
  label: string,
  hint: string,
}

const MODES: ScrollyModeOption[] = [
  { mode: 'right', label: 'Right panel', hint: 'AI 2027 style: text moves left, panel takes the right side' },
  { mode: 'margin', label: 'Over margin', hint: 'Text stays put; panel floats over the side-comment margin' },
  { mode: 'top', label: 'Top strip', hint: 'Panel pinned above the text column; text scrolls under it' },
  { mode: 'inline', label: 'Inline', hint: 'Today: a normal widget in the flow of the post' },
];

// How the panel relates to the margin items (footnotes, side comments) behind it.
type ScrollyBackdrop = 'clear' | 'notes';

interface ScrollyBackdropOption {
  backdrop: ScrollyBackdrop,
  label: string,
  hint: string,
}

const BACKDROPS: ScrollyBackdropOption[] = [
  { backdrop: 'clear', label: 'Clear', hint: 'Fully transparent; footnotes and side comments show through, and clicks pass through to them' },
  { backdrop: 'notes', label: 'Notes on top', hint: 'Footnotes and side comments float above the figure as cards' },
];

const HEADER_HEIGHT = 64;
const MAX_PANEL_WIDTH = 640;
const INLINE_HEIGHT = 720;
// The reading line: a heading counts as "current" once it scrolls above this fraction of the viewport.
const READING_LINE = 0.35;
const MODE_STORAGE_KEY = 'lwScrollyMode';
const BACKDROP_STORAGE_KEY = 'lwScrollyBackdrop';

const styles = defineStyles('ScrollyIframeWidget', (theme: ThemeType) => ({
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
  },
  inline: {
    height: INLINE_HEIGHT,
    margin: '16px 0',
  },
  panel: {
    position: 'fixed',
    zIndex: 10,
    transition: 'opacity 250ms ease, translate 200ms ease',
    overflow: 'hidden',
    background: 'var(--lw-scrolly-page-bg)',
  },
  panelClear: {
    background: 'transparent',
    // Let clicks reach the side comments and footnotes underneath.
    pointerEvents: 'none',
  },
  panelHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  panelMargin: {
    borderRadius: 8,
    boxShadow: `0 1px 12px ${theme.palette.boxShadowColor(0.12)}`,
  },
  panelTop: {
    boxShadow: `0 6px 12px -6px ${theme.palette.boxShadowColor(0.25)}`,
  },
  switcher: {
    position: 'fixed',
    left: '50%',
    bottom: 16,
    transform: 'translateX(-50%)',
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: 4,
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.12),
    borderRadius: 8,
    boxShadow: `0 2px 8px ${theme.palette.boxShadowColor(0.08)}`,
    ...theme.typography.body2,
    fontSize: 12,
  },
  switcherRow: {
    display: 'flex',
    gap: 4,
  },
  switcherLabel: {
    padding: 6,
    color: theme.palette.grey[600],
  },
  switcherButton: {
    padding: '6px 10px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: theme.palette.text.normal,
  },
  switcherButtonActive: {
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
  },
  '@global': {
    '#postBody': {
      transition: 'transform 300ms ease',
    },
    'html[data-lw-scrolly="right"] #postBody': {
      transform: 'translateX(calc(-1 * var(--lw-scrolly-shift, 0px)))',
    },
    // Margin items vs. the panel. Matching on class prefixes because JSS names are generated;
    // a real version would do this through props, not selectors.
    'html[data-lw-scrolly="right"] [class*="FixedPositionToC"]': {
      opacity: 0,
      pointerEvents: 'none',
    },
    // 'Notes on top': lift the margin column above the panel and give each item a card.
    'html[data-lw-scrolly-backdrop="notes"] [class*="SideItems-sidebar"]': {
      zIndex: 11,
    },
    'html[data-lw-scrolly-backdrop="notes"] [class*="SideItems-sideItem"]': {
      background: 'var(--lw-scrolly-page-bg)',
      borderRadius: 6,
      padding: '6px 8px',
      marginLeft: -8,
      boxShadow: `0 2px 10px ${theme.palette.boxShadowColor(0.18)}`,
    },
    // When the site header slides away, let the panel use that space.
    'body:has(.headroom--unpinned) .lwScrollyPanel': {
      translate: `0 -${HEADER_HEIGHT - 12}px`,
    },
    'body:has(.headroom--unpinned) .lwScrollyPanel.lwScrollyTop': {
      translate: `0 -${HEADER_HEIGHT}px`,
    },
  },
}));

/** A setting from the URL first (so links can pin a variant), then this reader's last choice. */
function readSetting(urlParam: string, storageKey: string): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get(urlParam);
  if (fromUrl) return fromUrl;
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeSetting(urlParam: string, storageKey: string, value: string) {
  try {
    window.localStorage.setItem(storageKey, value);
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set(urlParam, value);
  window.history.replaceState(window.history.state, '', url.toString());
}

function readMode(): ScrollyMode {
  const value = readSetting('scrolly', MODE_STORAGE_KEY);
  return MODES.find(m => m.mode === value)?.mode ?? 'right';
}

function readBackdrop(): ScrollyBackdrop {
  const value = readSetting('scrollyBackdrop', BACKDROP_STORAGE_KEY);
  return BACKDROPS.find(b => b.backdrop === value)?.backdrop ?? 'clear';
}

/** The color actually painted behind the post text, so the panel and widget can match it (and follow dark mode). */
function getPageBackground(): string {
  for (let el: HTMLElement | null = document.getElementById('postBody'); el; el = el.parentElement) {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg;
  }
  return getComputedStyle(document.body).backgroundColor || '#fff';
}

interface PanelBox {
  left: number,
  top: number,
  width: number,
  height: number,
  visible: boolean,
  shift: number,
}

function sameBox(a: PanelBox | null, b: PanelBox): boolean {
  return !!a && a.left === b.left && a.top === b.top && a.width === b.width
    && a.height === b.height && a.visible === b.visible && a.shift === b.shift;
}

/** Where the panel goes for a given mode, from the position of the text column before any shift. */
function computeBox(mode: ScrollyMode, column: DOMRect, active: boolean): PanelBox {
  const vw = window.innerWidth, vh = window.innerHeight;
  const top = HEADER_HEIGHT + 12, height = vh - top - 16;
  if (mode === 'top') {
    return { left: column.left, top: HEADER_HEIGHT, width: column.width, height: Math.min(380, vh * 0.42), visible: active, shift: 0 };
  }
  if (mode === 'margin') {
    const left = column.right + 24;
    return { left, top, width: Math.min(MAX_PANEL_WIDTH, Math.max(220, vw - left - 16)), height, visible: active, shift: 0 };
  }
  // 'right': slide the text column left until a ~520px panel fits beside it.
  const want = Math.min(560, Math.max(380, vw * 0.36));
  const free = vw - column.right - 24 - 16;
  const shift = active ? Math.max(0, Math.min(column.left - 24, want - free)) : 0;
  const left = column.right - shift + 32;
  return { left, top, width: Math.min(MAX_PANEL_WIDTH, vw - left - 16), height, visible: active, shift };
}

function getScrollyRoot(anchor: HTMLElement): Element | null {
  return anchor.closest('.instapaper_body') ?? anchor.parentElement;
}

/** The section the reader is in: the last heading (after the widget) above the reading line, and how far through it they are. */
function computeReadingPosition(anchor: HTMLElement, root: Element) {
  const line = window.innerHeight * READING_LINE;
  const headings = Array.from(root.querySelectorAll('h1, h2, h3'))
    .filter(h => anchor.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING);
  let index = -1;
  headings.forEach((h, i) => {
    if (h.getBoundingClientRect().top < line) index = i;
  });
  let progress = 0;
  if (index >= 0) {
    const start = headings[index].getBoundingClientRect().top;
    const end = index + 1 < headings.length
      ? headings[index + 1].getBoundingClientRect().top
      : root.getBoundingClientRect().bottom;
    progress = Math.max(0, Math.min(0.999, (line - start) / Math.max(1, end - start)));
  }
  const heading = index >= 0 ? headings[index].textContent?.trim() ?? '' : '';
  return { type: 'lw-scrolly', heading, index, progress, count: headings.length };
}

function setPageScrollyState(mode: ScrollyMode | '', backdrop: ScrollyBackdrop | '', shift: number) {
  document.documentElement.style.setProperty('--lw-scrolly-shift', `${shift}px`);
  document.documentElement.dataset.lwScrolly = mode;
  document.documentElement.dataset.lwScrollyBackdrop = backdrop;
}

export function ScrollyIframeWidget({ srcdoc, title }: { srcdoc: string, title?: string }) {
  const classes = useStyles(styles);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastSent = useRef<string>('');
  const shiftRef = useRef(0);
  const [mode, setModeState] = useState<ScrollyMode>('right');
  const [backdrop, setBackdropState] = useState<ScrollyBackdrop>('clear');
  const [box, setBox] = useState<PanelBox | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setModeState(readMode());
    setBackdropState(readBackdrop());
    document.documentElement.style.setProperty('--lw-scrolly-page-bg', getPageBackground());
  }, []);

  const setMode = useCallback((m: ScrollyMode) => {
    setModeState(m);
    writeSetting('scrolly', MODE_STORAGE_KEY, m);
  }, []);

  const setBackdrop = useCallback((b: ScrollyBackdrop) => {
    setBackdropState(b);
    writeSetting('scrollyBackdrop', BACKDROP_STORAGE_KEY, b);
  }, []);

  const sendTheme = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'lw-scrolly-theme', background: getPageBackground() }, '*');
  }, []);

  const sendState = useCallback((force: boolean) => {
    const anchor = anchorRef.current;
    const root = anchor && getScrollyRoot(anchor);
    if (!anchor || !root) return;
    const msg = computeReadingPosition(anchor, root);
    const key = JSON.stringify(msg);
    if (!force && key === lastSent.current) return;
    lastSent.current = key;
    iframeRef.current?.contentWindow?.postMessage(msg, '*');
  }, []);

  const relayout = useCallback(() => {
    const anchor = anchorRef.current;
    const root = anchor && getScrollyRoot(anchor);
    const column = document.getElementById('postBody') ?? root;
    if (!anchor || !root || !column) return;
    const vh = window.innerHeight;
    // Show the panel from where the author placed the widget to the end of the post body.
    const active = anchor.getBoundingClientRect().top < vh * 0.6 && root.getBoundingClientRect().bottom > vh * 0.4;
    const colRect = column.getBoundingClientRect();
    const unshifted = new DOMRect(colRect.left + shiftRef.current, colRect.top, colRect.width, colRect.height);
    const next = computeBox(mode, unshifted, active);
    shiftRef.current = next.shift;
    // The backdrop only matters where the panel covers the margin column.
    const coversMargin = mode === 'right' || mode === 'margin';
    setPageScrollyState(active ? mode : '', active && coversMargin ? backdrop : '', next.shift);
    setBox(prev => sameBox(prev, next) ? prev : next);
    sendState(false);
  }, [mode, backdrop, sendState]);

  useLayoutEffect(() => {
    if (!mounted) return;
    shiftRef.current = 0;
    setPageScrollyState('', '', 0);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => mode === 'inline' ? sendState(false) : relayout());
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
      setPageScrollyState('', '', 0);
    };
  }, [mounted, mode, relayout, sendState]);

  const iframe = <iframe
    srcDoc={injectResizeScript(srcdoc)}
    sandbox="allow-scripts"
    title={title ?? 'Scrollytelling panel'}
    ref={iframeRef}
    onLoad={() => {
      sendTheme();
      sendState(true);
    }}
    className={classes.iframe}
  />

  let panel: React.ReactNode = null;
  if (mode === 'inline') {
    panel = <div className={classes.inline}>{iframe}</div>;
  } else if (mounted && box) {
    panel = createPortal(
      <div
        className={classNames('lwScrollyPanel', classes.panel, {
          lwScrollyTop: mode === 'top',
          [classes.panelHidden]: !box.visible,
          [classes.panelMargin]: mode === 'margin' && backdrop !== 'clear',
          [classes.panelTop]: mode === 'top',
          [classes.panelClear]: mode !== 'top' && backdrop === 'clear',
        })}
        // Position is recomputed on every scroll frame, so it can't live in a stylesheet.
        style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
      >{iframe}</div>,
      document.body,
    );
  }

  return <>
    {/* Marks where the scrollytelling starts in the text. */}
    <div ref={anchorRef} data-lw-scrolly-anchor="true" />
    {panel}
    {mounted && createPortal(
      <ScrollyModeSwitcher mode={mode} setMode={setMode} backdrop={backdrop} setBackdrop={setBackdrop} />,
      document.body,
    )}
  </>;
}

function ScrollyModeSwitcher({ mode, setMode, backdrop, setBackdrop }: {
  mode: ScrollyMode,
  setMode: (m: ScrollyMode) => void,
  backdrop: ScrollyBackdrop,
  setBackdrop: (b: ScrollyBackdrop) => void,
}) {
  const classes = useStyles(styles);
  const showBackdrops = mode === 'right' || mode === 'margin';
  return <div className={classes.switcher}>
    {showBackdrops && <div className={classes.switcherRow}>
      <span className={classes.switcherLabel}>Panel</span>
      {BACKDROPS.map(b => <button
        key={b.backdrop}
        title={b.hint}
        onClick={() => setBackdrop(b.backdrop)}
        className={classNames(classes.switcherButton, { [classes.switcherButtonActive]: b.backdrop === backdrop })}
      >{b.label}</button>)}
    </div>}
    <div className={classes.switcherRow}>
      <span className={classes.switcherLabel}>Scrolly layout</span>
      {MODES.map(m => <button
        key={m.mode}
        title={m.hint}
        onClick={() => setMode(m.mode)}
        className={classNames(classes.switcherButton, { [classes.switcherButtonActive]: m.mode === mode })}
      >{m.label}</button>)}
    </div>
  </div>;
}
