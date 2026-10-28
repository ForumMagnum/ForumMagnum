'use client';
// EXPERIMENT (branch experiment/iframe-layout-ronny): the layout demo's two tabs, the post as readers
// see it and the editor with the same post, shown in the demo's bottom bar.
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): the Experiment 2 editor and, on this branch, the demo post pass
// WIDGET_DRAG_EDITOR_PATH as editorPath. The first editor keeps the default.
import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { LAYOUT_DEMO_PATH, WIDGET_DRAG_DEMO_PATH } from './constants';

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

export const WIDGET_DRAG_EDITOR_PATH = `${WIDGET_DRAG_DEMO_PATH}/editor`;

export function LayoutDemoTabs({ active, editorPath = `${LAYOUT_DEMO_PATH}/editor` }: {
  active: 'post' | 'editor',
  editorPath?: string,
}) {
  const classes = useStyles(styles);
  return <span className={classes.tabs}>
    <a href={`${LAYOUT_DEMO_PATH}?textWidth=normal`} className={classNames(classes.tab, active === 'post' && classes.active)}>Post</a>
    <a href={editorPath} className={classNames(classes.tab, active === 'editor' && classes.active)}>Editor</a>
  </span>;
}

export function LayoutDemoEditorBar({ editorPath, note = 'Normal text width (682)' }: {
  editorPath?: string,
  note?: string,
}) {
  const classes = useStyles(styles);
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): data-lw-bottom-bar (Experiment 2 only): the widget
  // drag controls keep their chips and their auto-scroll zone above this bar.
  return <div className={classes.bar} data-lw-bottom-bar={editorPath === WIDGET_DRAG_EDITOR_PATH ? '' : undefined}>
    <LayoutDemoTabs active="editor" editorPath={editorPath}/>
    <span className={classes.barNote}>{note}</span>
  </div>;
}
