'use client';
// EXPERIMENT (experiment/iframe-layout-ronny-exp3): what a "Start below widget" block (WidgetClearNode) shows in the
// editor: a dashed line under the widget saying so, and a ✕ that removes it.
import React from 'react';
import { $getNodeByKey, type NodeKey } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('WidgetClearMarker', (theme: ThemeType) => ({
  // Hangs from the zero-height block into the gap above the next one, so the editor's layout stays the post's.
  marker: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderTop: theme.palette.greyBorder('1px', 0.25).replace('solid', 'dashed'),
    paddingTop: 2,
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    lineHeight: '13px',
    color: theme.palette.grey[500],
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  remove: {
    padding: '0 4px',
    border: 'none',
    borderRadius: 3,
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.grey[200],
      color: theme.palette.text.normal,
    },
  },
}));

export function WidgetClearMarker({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const classes = useStyles(styles);
  return <span className={classes.marker} contentEditable={false} data-testid="widget-clear-marker">
    <span>↓ Starts below the widget</span>
    <button
      type="button"
      className={classes.remove}
      title="Back beside the widget (or Backspace at the start of the text below)"
      aria-label="Back beside the widget"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => editor.update(() => $getNodeByKey(nodeKey)?.remove())}
    >✕</button>
  </span>;
}

