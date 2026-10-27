'use client';
// EXPERIMENT (branch experiment/iframe-layout-ronny): try out author layout options on a post page.
// ?textWidth=normal|wide|wider sets the post's text width; for the demo it's remembered per reader.
// A real version would read an author-chosen field on the post instead.
// As the window narrows, the table of contents gives way first, then the sidenote margin, and only
// then does the text column shrink. (LessWrong today hides the margin below 1280px and the table
// of contents below 960px, whatever the text width.)
// ?layoutUi=off hides this switcher and Next's dev badge, for screen recordings (the scrollytelling
// demo's ?scrollyUi=off works too).
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import {
  MAX_COLUMN_WIDTH, POST_TEXT_WIDTHS, PostTextWidth, RIGHT_COLUMN_WIDTH_WITH_SIDENOTES,
  RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES, TEXT_TRACK_EXTRA,
} from './constants';
import { LayoutLabColumns, setLayoutLabColumns } from './layoutLabColumns';

const TEXT_WIDTH_PARAM = 'textWidth';
const TEXT_WIDTH_STORAGE_KEY = 'lwLayoutLabTextWidth';
const RECORDING_PARAMS = ['layoutUi', 'scrollyUi'];

// Room the side columns need beside the text track: the table of contents (200px at least, plus
// its 35px gap) and the sidenote margin (300px plus a 10px gap). PAGE_SLACK covers the page edges.
const TOC_SPACE = 235;
const MARGIN_SPACE = RIGHT_COLUMN_WIDTH_WITH_SIDENOTES + 10;
const PAGE_SLACK = 100;
// Below this LessWrong's own phone layout takes over.
const PHONE_WIDTH = 600;

interface TextWidthOption {
  width: PostTextWidth,
  label: string,
}

const TEXT_WIDTH_OPTIONS: TextWidthOption[] = [
  { width: 'normal', label: `Normal (${POST_TEXT_WIDTHS.normal})` },
  { width: 'wide', label: `Wide (${POST_TEXT_WIDTHS.wide})` },
  { width: 'wider', label: `Wider (${POST_TEXT_WIDTHS.wider})` },
];

const styles = defineStyles('LayoutLab', (theme: ThemeType) => ({
  lab: {
    position: 'fixed',
    left: '50%',
    bottom: 16,
    transform: 'translateX(-50%)',
    zIndex: 20,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    maxWidth: 'calc(100vw - 16px)',
    padding: 4,
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.12),
    borderRadius: 8,
    boxShadow: `0 2px 8px ${theme.palette.boxShadowColor(0.08)}`,
    ...theme.typography.body2,
    fontSize: 12,
  },
  label: {
    padding: 6,
    color: theme.palette.grey[600],
  },
  button: {
    padding: '6px 10px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: theme.palette.text.normal,
  },
  buttonActive: {
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
  },
  readout: {
    padding: '6px 8px',
    color: theme.palette.grey[600],
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  '@global': {
    // Recording mode: no Next.js dev badge either.
    'html[data-lw-layout-recording] nextjs-portal': {
      display: 'none',
    },
    // The lab's column decisions (see columnsFor), overriding the page's own breakpoints. Class names
    // are hard-coded because these style other components.
    'html[data-lw-toc="hidden"] .MultiToCLayout-tableOfContents': {
      gridTemplateColumns: `0px 0px minmax(16px, 1fr) minmax(min-content, var(--post-text-track, ${MAX_COLUMN_WIDTH}px)) minmax(10px, 30px) min-content minmax(16px, 1fr) !important`,
    },
    'html[data-lw-toc="hidden"] .MultiToCLayout-toc, html[data-lw-toc="hidden"] .MultiToCLayout-tocFooter': {
      display: 'none !important',
    },
    'html[data-lw-margin="shown"] .PostsPage-reserveSpaceForSidenotes': {
      width: `${RIGHT_COLUMN_WIDTH_WITH_SIDENOTES}px !important`,
    },
    'html[data-lw-margin="shown"] .FootnotePreview-sidenote': {
      display: 'block !important',
    },
    'html[data-lw-margin="shown"] .FootnotePreview-footnoteMobileIndicator': {
      display: 'none !important',
    },
    'html[data-lw-margin="hidden"] .PostsPage-reserveSpaceForSidenotes': {
      width: `${RIGHT_COLUMN_WIDTH_WITHOUT_SIDENOTES}px !important`,
    },
    'html[data-lw-margin="hidden"] .FootnotePreview-sidenote': {
      display: 'none !important',
    },
    'html[data-lw-margin="hidden"] .FootnotePreview-footnoteMobileIndicator': {
      display: 'inline-block !important',
    },
  },
}));

function isPostTextWidth(value: string | null): value is PostTextWidth {
  return !!value && Object.hasOwn(POST_TEXT_WIDTHS, value);
}

/**
 * The URL first (so a link can show a particular width), then this reader's last choice. A width
 * from the URL is remembered too, so it survives redirects that drop the query (like signing in).
 */
function readTextWidth(): PostTextWidth {
  const fromUrl = new URLSearchParams(window.location.search).get(TEXT_WIDTH_PARAM);
  try {
    if (isPostTextWidth(fromUrl)) {
      window.localStorage.setItem(TEXT_WIDTH_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    const stored = window.localStorage.getItem(TEXT_WIDTH_STORAGE_KEY);
    if (isPostTextWidth(stored)) return stored;
  } catch {}
  return isPostTextWidth(fromUrl) ? fromUrl : 'normal';
}

/** ?layoutUi=off: nothing on screen but the post, for screen recordings. */
function isRecordingMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  return RECORDING_PARAMS.some(param => params.get(param) === 'off');
}

/** The text column and the page grid's text track both read these (see PostsPage and MultiToCLayout). */
function applyTextWidth(width: PostTextWidth) {
  const text = POST_TEXT_WIDTHS[width];
  document.documentElement.style.setProperty('--post-text-width', `${text}px`);
  document.documentElement.style.setProperty('--post-text-track', `${text + TEXT_TRACK_EXTRA}px`);
}

function clearTextWidth() {
  document.documentElement.style.removeProperty('--post-text-width');
  document.documentElement.style.removeProperty('--post-text-track');
}

/** Which side columns fit beside the text: the table of contents goes first, then the margin. */
function columnsFor(viewport: number, width: PostTextWidth): LayoutLabColumns | null {
  if (viewport < PHONE_WIDTH) return null;
  const track = POST_TEXT_WIDTHS[width] + TEXT_TRACK_EXTRA;
  if (viewport >= track + TOC_SPACE + MARGIN_SPACE + PAGE_SLACK) return { toc: true, margin: true };
  if (viewport >= track + MARGIN_SPACE + PAGE_SLACK) return { toc: false, margin: true };
  return { toc: false, margin: false };
}

function applyColumns(columns: LayoutLabColumns | null) {
  const root = document.documentElement;
  if (columns) {
    root.dataset.lwToc = columns.toc ? 'shown' : 'hidden';
    root.dataset.lwMargin = columns.margin ? 'shown' : 'hidden';
  } else {
    delete root.dataset.lwToc;
    delete root.dataset.lwMargin;
  }
  setLayoutLabColumns(columns);
}

function useViewportWidth(enabled: boolean): number {
  const [viewport, setViewport] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const measure = () => setViewport(document.documentElement.clientWidth);
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, [enabled]);
  return viewport;
}

export function LayoutLab() {
  const classes = useStyles(styles);
  const [mounted, setMounted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [textWidth, setTextWidthState] = useState<PostTextWidth>('normal');
  const viewport = useViewportWidth(mounted);
  const columns = mounted ? columnsFor(viewport, textWidth) : null;

  useEffect(() => {
    setMounted(true);
    setTextWidthState(readTextWidth());
    if (isRecordingMode()) {
      setRecording(true);
      document.documentElement.dataset.lwLayoutRecording = 'true';
    }
    return () => {
      clearTextWidth();
      applyColumns(null);
      delete document.documentElement.dataset.lwLayoutRecording;
    };
  }, []);

  useEffect(() => {
    if (mounted) applyTextWidth(textWidth);
  }, [mounted, textWidth]);

  useEffect(() => {
    if (mounted) applyColumns(columns);
  }, [mounted, columns?.toc, columns?.margin]); // eslint-disable-line react-hooks/exhaustive-deps

  const setTextWidth = useCallback((width: PostTextWidth) => {
    setTextWidthState(width);
    try {
      window.localStorage.setItem(TEXT_WIDTH_STORAGE_KEY, width);
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set(TEXT_WIDTH_PARAM, width);
    window.history.replaceState(window.history.state, '', url.toString());
  }, []);

  if (!mounted || recording) return null;
  return createPortal(
    <div className={classes.lab}>
      <span className={classes.label}>Text width</span>
      {TEXT_WIDTH_OPTIONS.map(option => <button
        key={option.width}
        onClick={() => setTextWidth(option.width)}
        className={classNames(classes.button, { [classes.buttonActive]: option.width === textWidth })}
      >{option.label}</button>)}
      <span className={classes.readout}>
        {viewport}px window · contents {columns?.toc ? 'shown' : 'hidden'} · margin {columns?.margin ? 'shown' : 'hidden'}
      </span>
    </div>,
    document.body,
  );
}
