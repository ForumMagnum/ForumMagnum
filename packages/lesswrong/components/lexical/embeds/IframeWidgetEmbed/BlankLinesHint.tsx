'use client';
// EXPERIMENT (experiment/iframe-layout-ronny-exp3): "Use ↓ Below widget to move text below a widget" on blank lines
// beside a widget (see blankLineHints in widgetClear.ts). It sits in the first blank line, like a placeholder; only
// its button takes the pointer, which swaps the blank lines for "Start below widget".
import React, { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { WIDGET_LAYOUT_EVENT } from '@/components/contents/widgetSliverGuard';
import { $replaceBlankLines, blankLineHints, type BlankLineHint } from './widgetClear';

const styles = defineStyles('BlankLinesHint', (theme: ThemeType) => ({
  hint: {
    position: 'absolute',
    zIndex: 4,
    paddingTop: 6,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: '18px',
    color: theme.palette.grey[500],
    pointerEvents: 'none',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  button: {
    pointerEvents: 'auto',
    margin: 0,
    padding: '0 6px',
    border: theme.palette.greyBorder('1px', 0.2),
    borderRadius: 9,
    background: theme.palette.panelBackground.default,
    color: theme.palette.grey[700],
    font: 'inherit',
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
    },
  },
}));

export function BlankLinesHint({ anchorElem }: { anchorElem: HTMLElement }) {
  const [editor] = useLexicalComposerContext();
  const classes = useStyles(styles);
  const [hints, setHints] = useState<BlankLineHint[]>([]);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setHints(blankLineHints(editor, anchorElem)));
    };
    measure();
    const root = editor.getRootElement();
    const unregister = editor.registerUpdateListener(measure);
    window.addEventListener('scroll', measure, { capture: true, passive: true });
    window.addEventListener('resize', measure);
    root?.addEventListener(WIDGET_LAYOUT_EVENT, measure);
    return () => {
      cancelAnimationFrame(frame);
      unregister();
      window.removeEventListener('scroll', measure, { capture: true });
      window.removeEventListener('resize', measure);
      root?.removeEventListener(WIDGET_LAYOUT_EVENT, measure);
    };
  }, [editor, anchorElem]);
  return <>{hints.map(hint => <div
    key={hint.keys[0]}
    className={classes.hint}
    style={{ top: hint.top, left: hint.left, maxWidth: hint.width }}
    data-testid="widget-blank-lines-hint"
  >
    Use{' '}<button
      type="button"
      className={classes.button}
      title="Start the text after these blank lines below the widget, at every window width"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => editor.update(() => $replaceBlankLines(editor, hint.keys, hint.nextKey))}
    >↓ Below widget</button>{' '}to move text below a widget
  </div>)}</>;
}
