'use client';
// EXPERIMENT (branch experiment/iframe-layout-ronny): the layout demo's tabs, shown in the demo's bottom
// bar: the post as readers see it, the editor with the same post, and (claude-v1) writing a new draft with
// Claude.
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { LAYOUT_DEMO_PATH } from './constants';

const styles = defineStyles('LayoutDemoTabs', (theme: ThemeType) => ({
  tabs: {
    display: 'inline-flex',
    gap: 2,
    padding: 2,
    marginRight: 4,
    borderRadius: 7,
    background: theme.palette.grey[200],
  },
  tab: {
    padding: '5px 12px',
    borderRadius: 5,
    color: theme.palette.text.normal,
    fontWeight: 500,
    '&:hover': {
      opacity: 1,
      background: theme.palette.grey[300],
    },
  },
  active: {
    background: theme.palette.panelBackground.default,
    boxShadow: `0 1px 2px ${theme.palette.boxShadowColor(0.12)}`,
    '&:hover': {
      background: theme.palette.panelBackground.default,
    },
  },
  // The editor page's own bottom bar (the post page puts the tabs in LayoutLab's bar).
  bar: {
    position: 'fixed',
    left: '50%',
    bottom: 16,
    transform: 'translateX(-50%)',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
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
  barNote: {
    padding: '6px 8px',
    color: theme.palette.grey[600],
  },
}));

type LayoutDemoTab = 'post' | 'editor' | 'write';

const WRITER_DRAFT_STORAGE_KEY = 'lwLayoutDemoWriterDraft';

/** The write page remembers its draft, so the Write tab returns to it instead of starting a new one. */
export function rememberWriterDraft(path: string) {
  try {
    window.localStorage.setItem(WRITER_DRAFT_STORAGE_KEY, path);
  } catch {}
}

function useWriterHref(): string {
  const [href, setHref] = useState(`${LAYOUT_DEMO_PATH}/write`);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WRITER_DRAFT_STORAGE_KEY);
      if (stored?.startsWith(`${LAYOUT_DEMO_PATH}/write?`)) setHref(stored);
    } catch {}
  }, []);
  return href;
}

export function LayoutDemoTabs({ active }: { active: LayoutDemoTab }) {
  const classes = useStyles(styles);
  const writerHref = useWriterHref();
  return <span className={classes.tabs}>
    <a href={`${LAYOUT_DEMO_PATH}?textWidth=normal`} className={classNames(classes.tab, active === 'post' && classes.active)}>Post</a>
    <a href={`${LAYOUT_DEMO_PATH}/editor`} className={classNames(classes.tab, active === 'editor' && classes.active)}>Editor</a>
    <a href={writerHref} className={classNames(classes.tab, active === 'write' && classes.active)}>Write with Claude</a>
  </span>;
}

export function LayoutDemoBar({ active, note }: { active: LayoutDemoTab, note: string }) {
  const classes = useStyles(styles);
  return <div className={classes.bar}>
    <LayoutDemoTabs active={active}/>
    <span className={classes.barNote}>{note}</span>
  </div>;
}

export function LayoutDemoEditorBar() {
  return <LayoutDemoBar active="editor" note="Normal text width (682)" />;
}
