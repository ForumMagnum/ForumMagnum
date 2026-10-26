'use client';
// EXPERIMENT (branch experiment/iframe-layout-ronny): try out author layout options on a post page.
// ?textWidth=normal|wide|wider sets the post's text width; for the demo it's remembered per reader.
// A real version would read an author-chosen field on the post instead.
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { POST_TEXT_WIDTHS, PostTextWidth, TEXT_TRACK_EXTRA } from './constants';

const TEXT_WIDTH_PARAM = 'textWidth';
const TEXT_WIDTH_STORAGE_KEY = 'lwLayoutLabTextWidth';

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
    alignItems: 'center',
    gap: 4,
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
}));

function isPostTextWidth(value: string | null): value is PostTextWidth {
  return !!value && Object.hasOwn(POST_TEXT_WIDTHS, value);
}

/** The URL first (so a link can show a particular width), then this reader's last choice. */
function readTextWidth(): PostTextWidth {
  const fromUrl = new URLSearchParams(window.location.search).get(TEXT_WIDTH_PARAM);
  if (isPostTextWidth(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(TEXT_WIDTH_STORAGE_KEY);
    if (isPostTextWidth(stored)) return stored;
  } catch {}
  return 'normal';
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

export function LayoutLab() {
  const classes = useStyles(styles);
  const [mounted, setMounted] = useState(false);
  const [textWidth, setTextWidthState] = useState<PostTextWidth>('normal');

  useEffect(() => {
    setMounted(true);
    setTextWidthState(readTextWidth());
    return clearTextWidth;
  }, []);

  useEffect(() => {
    if (mounted) applyTextWidth(textWidth);
  }, [mounted, textWidth]);

  const setTextWidth = useCallback((width: PostTextWidth) => {
    setTextWidthState(width);
    try {
      window.localStorage.setItem(TEXT_WIDTH_STORAGE_KEY, width);
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set(TEXT_WIDTH_PARAM, width);
    window.history.replaceState(window.history.state, '', url.toString());
  }, []);

  if (!mounted) return null;
  return createPortal(
    <div className={classes.lab}>
      <span className={classes.label}>Text width</span>
      {TEXT_WIDTH_OPTIONS.map(option => <button
        key={option.width}
        onClick={() => setTextWidth(option.width)}
        className={classNames(classes.button, { [classes.buttonActive]: option.width === textWidth })}
      >{option.label}</button>)}
    </div>,
    document.body,
  );
}
