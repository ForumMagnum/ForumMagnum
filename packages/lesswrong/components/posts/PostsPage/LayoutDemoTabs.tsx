'use client';
// EXPERIMENT (branch experiment/iframe-layout-ronny): the layout demo's two tabs, the post as readers
// see it and the editor with the same post, shown in the demo's bottom bar.
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): the Experiment 2 editor and, on this branch, the demo post pass
// WIDGET_DRAG_EDITOR_PATH as editorPath. The first editor keeps the default. Experiment 2's own Post tab
// (postPath WIDGET_DRAG_DEMO_PATH) shows the edits made in its Editor tab, which a Reset button clears.
import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { LAYOUT_DEMO_PATH, WIDGET_DRAG_DEMO_PATH } from './constants';
import { clearEdits, editsSaved } from './widgetDragEdits';

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
  reset: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: 5,
    background: 'transparent',
    color: theme.palette.grey[700],
    cursor: 'pointer',
    font: 'inherit',
    '&:hover': {
      background: theme.palette.grey[200],
    },
  },
}));

export const WIDGET_DRAG_EDITOR_PATH = `${WIDGET_DRAG_DEMO_PATH}/editor`;

export function LayoutDemoTabs({ active, editorPath = `${LAYOUT_DEMO_PATH}/editor`, postPath = `${LAYOUT_DEMO_PATH}?textWidth=normal` }: {
  active: 'post' | 'editor',
  editorPath?: string,
  postPath?: string,
}) {
  const classes = useStyles(styles);
  // Experiment 2: the editor's last change may still be on its way to storage (the editor batches its
  // changes), so the Post tab waits for it.
  const toPost = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (active !== 'editor' || postPath !== WIDGET_DRAG_DEMO_PATH || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    void editsSaved().then(() => { window.location.href = postPath; });
  };
  return <span className={classes.tabs}>
    <a href={postPath} onClick={toPost} className={classNames(classes.tab, active === 'post' && classes.active)}>Post</a>
    <a href={editorPath} className={classNames(classes.tab, active === 'editor' && classes.active)}>Editor</a>
  </span>;
}

/** EXPERIMENT (experiment/iframe-layout-ronny-exp2): puts Experiment 2's post back as it was. */
export function ResetWidgetDragEdits() {
  const classes = useStyles(styles);
  const reset = () => {
    if (!window.confirm('Put the demo post back as it was? Your edits in this browser will be lost.')) return;
    clearEdits();
    window.location.reload();
  };
  return <button type="button" className={classes.reset} onClick={reset} data-testid="widget-drag-reset">Reset</button>;
}

export function LayoutDemoEditorBar({ editorPath, note = 'Normal text width (682)' }: {
  editorPath?: string,
  note?: string,
}) {
  const classes = useStyles(styles);
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): data-lw-bottom-bar (Experiment 2 only): the widget
  // drag controls keep their chips and their auto-scroll zone above this bar.
  const widgetDrag = editorPath === WIDGET_DRAG_EDITOR_PATH;
  return <div className={classes.bar} data-lw-bottom-bar={widgetDrag ? '' : undefined}>
    <LayoutDemoTabs active="editor" editorPath={editorPath} postPath={widgetDrag ? WIDGET_DRAG_DEMO_PATH : undefined}/>
    <span className={classes.barNote}>{note}</span>
    {widgetDrag && <ResetWidgetDragEdits/>}
  </div>;
}
