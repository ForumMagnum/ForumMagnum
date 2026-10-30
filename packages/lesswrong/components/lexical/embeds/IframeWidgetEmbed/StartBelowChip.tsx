'use client';
// EXPERIMENT (experiment/iframe-layout-ronny-exp3): the chip that offers "Start below widget" for the block the
// caret is in, while that block starts beside a widget (see widgetClear.ts). It sits in the margin left of the
// column, level with the block's top.
import React, { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { WIDGET_LAYOUT_EVENT } from '@/components/contents/widgetSliverGuard';
import { $startBelow, startBelowSpot } from './widgetClear';

const styles = defineStyles('StartBelowChip', (theme: ThemeType) => ({
  chip: {
    position: 'absolute',
    zIndex: 5,
    transform: 'translateX(-100%)',
    padding: '2px 8px',
    border: theme.palette.greyBorder('1px', 0.2),
    borderRadius: 10,
    background: theme.palette.panelBackground.default,
    color: theme.palette.grey[600],
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: '16px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
    },
  },
}));

export function StartBelowChip({ anchorElem }: { anchorElem: HTMLElement }) {
  const [editor] = useLexicalComposerContext();
  const classes = useStyles(styles);
  const [spot, setSpot] = useState<ReturnType<typeof startBelowSpot>>(null);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setSpot(startBelowSpot(editor, anchorElem)));
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
  if (!spot) return null;
  return <button
    type="button"
    className={classes.chip}
    style={{ top: spot.top, left: spot.left }}
    title="Start this below the widget, at every window width"
    data-testid="widget-start-below"
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => editor.update(() => $startBelow(spot.key))}
  >↓ Below widget</button>;
}
