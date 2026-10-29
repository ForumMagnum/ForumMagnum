'use client';
// EXPERIMENT (branch experiment/iframe-layout-ronny): a public editor with the AI Futures demo post in
// it, for trying widget placement (full width, or a partial-width widget the text wraps around).
// Nothing is saved. The editor is LessWrong's own, in its local (non-collaborative) mode, at the
// normal 682px text width.
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): with `widgetDrag` (the Experiment 2 page), widgets
// are placed by dragging them and pulling their edges (see IframeWidgetDragContext), and the edits are
// kept in this browser for the Post tab (see widgetDragEdits).
// EXPERIMENT (experiment/iframe-layout-ronny-exp3): with `blocksDemo` (Experiment 3's pages), the same,
// with that demo post's own stored edits and Experiment 3's bar.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from '@/components/common/ContentStyles';
import LexicalEditor from '@/components/editor/LexicalEditor';
import { IframeWidgetDragContext } from '@/components/lexical/embeds/IframeWidgetEmbed/widgetDragContext';
import { CENTRAL_COLUMN_WIDTH, LAYOUT_DEMO_PATH } from './constants';
import { LayoutDemoEditorBar, WIDGET_DRAG_EDITOR_PATH, WidgetBlocksDemoBar } from './LayoutDemoTabs';
import { WIDGET_DRAG_STORAGE_KEY, clearEdits, demoFingerprint, loadEdits, markEditsUnsaved, saveEdits } from './widgetDragEdits';
import { WIDGET_BLOCKS_DEMOS, type WidgetBlocksDemoId } from './widgetBlocksDemo';

const styles = defineStyles('LayoutDemoEditor', (theme: ThemeType) => ({
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the same text column as the post page at every
  // window width, so a widget wraps in the editor exactly when it wraps for readers. The post page's
  // column is its container less 112px from 600px windows up (the side columns' room) and less 10px
  // below 600 (measured by experiments/iframe-layout/content-blocks/columns-check.mjs).
  root: {
    width: 'calc(100% - 112px)',
    maxWidth: CENTRAL_COLUMN_WIDTH,
    margin: '0 auto',
    padding: '32px 0 160px',
    [theme.breakpoints.down('xs')]: {
      width: 'calc(100% - 10px)',
      padding: '20px 0 120px',
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

/** Marks each change of the post as not yet saved, until the editor's batched change reaches saveEdits. */
function UnsavedEditsPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, prevEditorState }) => {
    if (!prevEditorState.isEmpty() && dirtyElements.size + dirtyLeaves.size > 0) markEditsUnsaved();
  }), [editor]);
  return null;
}

export function LayoutDemoEditor({ title, initialHtml, widgetDrag: widgetDragProp = false, blocksDemo }: {
  title: string,
  initialHtml: string,
  /** EXPERIMENT (experiment/iframe-layout-ronny-exp2): place widgets by dragging (Experiment 2). */
  widgetDrag?: boolean,
  /** EXPERIMENT (experiment/iframe-layout-ronny-exp3): which of Experiment 3's demo posts this is. */
  blocksDemo?: WidgetBlocksDemoId,
}) {
  const classes = useStyles(styles);
  const widgetDrag = widgetDragProp || !!blocksDemo;
  const storageKey = blocksDemo ? WIDGET_BLOCKS_DEMOS[blocksDemo].storageKey : WIDGET_DRAG_STORAGE_KEY;
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the editor always opens on the original post, so the
  // Post tab shows the original too until something is edited here (see widgetDragEdits.ts). The one
  // exception is for test harnesses (content-blocks/width-sweep.mjs --specimen, tools/proto-render.mjs):
  // with ?specimen in the URL it opens on the HTML they stored as this tab's edits. (Decided on the
  // client: the editor only renders there anyway.)
  const base = useMemo(() => demoFingerprint(initialHtml), [initialHtml]);
  const [startHtml, setStartHtml] = useState<string | null>(widgetDrag ? null : initialHtml);
  useEffect(() => {
    if (!widgetDrag) return;
    const specimen = new URLSearchParams(window.location.search).has('specimen') ? loadEdits(base, storageKey) : null;
    if (!specimen) clearEdits(storageKey);
    setStartHtml(specimen ?? initialHtml);
  }, [widgetDrag, base, initialHtml, storageKey]);
  const saveChange = useCallback((html: string) => saveEdits(base, html, storageKey), [base, storageKey]);
  // Loading the post moves the selection to its end, which scrolls the page there. Keep the page at
  // the top while it loads, until the reader scrolls or clicks themselves. (Pressing a widget's grip
  // sends no mousedown, so pointerdown counts too, caught before the grip stops it.)
  useEffect(() => {
    let readerMoved = false;
    const markReader = () => { readerMoved = true; };
    const holdTop = () => { if (!readerMoved && window.scrollY > 0) window.scrollTo(0, 0); };
    const readerEvents = ['wheel', 'touchstart', 'keydown', 'mousedown', 'pointerdown'] as const;
    readerEvents.forEach(e => window.addEventListener(e, markReader, { passive: true, capture: true }));
    window.addEventListener('scroll', holdTop);
    const stop = setTimeout(cleanup, 6000);
    function cleanup() {
      readerEvents.forEach(e => window.removeEventListener(e, markReader, { capture: true }));
      window.removeEventListener('scroll', holdTop);
    }
    return () => { clearTimeout(stop); cleanup(); };
  }, []);
  return <div className={classes.root} data-lw-widget-drag={widgetDrag ? '' : undefined}>
    {widgetDrag
      ? <div className={classes.note}>
        <b>Demo editor.</b> Drag the tab on a widget's top edge to move it. Drag sideways to switch sides.
        Pull a widget's edge to resize it; pull a full-width widget's edge inward to wrap text around it.
        Your edits show on the Post tab. The editor always opens on the original post.
      </div>
      : <div className={classes.note}>
        <b>Demo editor, nothing is saved.</b> Hover a widget to see its placement bar: <b>Full width</b>,
        or <b>Left</b>/<b>Right</b> with a width. Text wraps around a left or right widget when there's
        room for about 40 characters beside it. The button on the widget's top right shows its code.
      </div>}
    <h1 className={classes.title}>{title}</h1>
    <ContentStyles contentType="post">
      <IframeWidgetDragContext.Provider value={widgetDrag}>
        {startHtml !== null && <LexicalEditor
          data={startHtml}
          onChange={widgetDrag ? saveChange : undefined}
          commentEditor={false}
          placeholder="Write something..."
          keepFocusOnLoad
        >
          {widgetDrag && <UnsavedEditsPlugin/>}
        </LexicalEditor>}
      </IframeWidgetDragContext.Provider>
    </ContentStyles>
    {blocksDemo
      ? <WidgetBlocksDemoBar demo={blocksDemo} active="editor"/>
      : widgetDrag
      ? <LayoutDemoEditorBar editorPath={WIDGET_DRAG_EDITOR_PATH} note="Experiment 2: drag to place"/>
      : <LayoutDemoEditorBar editorPath={`${LAYOUT_DEMO_PATH}/editor`}/>}
  </div>;
}
