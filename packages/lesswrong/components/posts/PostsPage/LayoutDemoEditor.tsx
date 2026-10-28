'use client';
// EXPERIMENT (branch experiment/iframe-layout-ronny): a public editor with the AI Futures demo post in
// it, for trying widget placement (full width, or a partial-width widget the text wraps around).
// Nothing is saved. The editor is LessWrong's own, in its local (non-collaborative) mode, at the
// normal 682px text width.
import React, { useEffect } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from '@/components/common/ContentStyles';
import LexicalEditor from '@/components/editor/LexicalEditor';
import { CENTRAL_COLUMN_WIDTH } from './constants';

const styles = defineStyles('LayoutDemoEditor', (theme: ThemeType) => ({
  root: {
    maxWidth: CENTRAL_COLUMN_WIDTH,
    margin: '0 auto',
    padding: '32px 0 160px',
    [theme.breakpoints.down('xs')]: {
      padding: '20px 16px 120px',
    },
  },
  note: {
    ...theme.typography.body2,
    fontSize: 14,
    lineHeight: 1.45,
    color: theme.palette.grey[700],
    background: theme.palette.grey[100],
    borderRadius: 6,
    padding: '10px 14px',
    marginBottom: 28,
  },
  title: {
    ...theme.typography.display3,
    ...theme.typography.postStyle,
    margin: '0 0 24px',
  },
}));

export function LayoutDemoEditor({ title, initialHtml }: {
  title: string,
  initialHtml: string,
}) {
  const classes = useStyles(styles);
  // Loading the post moves the selection to its end, which scrolls the page there. Keep the page at
  // the top while it loads, until the reader scrolls or clicks themselves.
  useEffect(() => {
    let readerMoved = false;
    const markReader = () => { readerMoved = true; };
    const holdTop = () => { if (!readerMoved && window.scrollY > 0) window.scrollTo(0, 0); };
    const readerEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;
    readerEvents.forEach(e => window.addEventListener(e, markReader, { passive: true }));
    window.addEventListener('scroll', holdTop);
    const stop = setTimeout(cleanup, 6000);
    function cleanup() {
      readerEvents.forEach(e => window.removeEventListener(e, markReader));
      window.removeEventListener('scroll', holdTop);
    }
    return () => { clearTimeout(stop); cleanup(); };
  }, []);
  return <div className={classes.root}>
    <div className={classes.note}>
      <b>Demo editor, nothing is saved.</b> Hover a widget to see its placement bar: <b>Full width</b>,
      or <b>Left</b>/<b>Right</b> with a width. Text wraps around a left or right widget when there's
      room for about 50 characters beside it. The button on the widget's top right shows its code.
    </div>
    <h1 className={classes.title}>{title}</h1>
    <ContentStyles contentType="post">
      <LexicalEditor data={initialHtml} commentEditor={false} placeholder="Write something..." keepFocusOnLoad />
    </ContentStyles>
  </div>;
}
