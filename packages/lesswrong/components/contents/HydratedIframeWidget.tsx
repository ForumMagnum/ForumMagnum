'use client';
import React, { Suspense, createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { injectResizeScript, clampIframeHeight, IFRAME_DEFAULT_HEIGHT } from '@/components/lexical/embeds/IframeWidgetEmbed/iframeResizeScript';
import classNames from 'classnames';
import { alignOf, parseIframeWidgetLayout, shouldWrapWidget } from './iframeWidgetLayout';
import { alignFloatBottom, alignedParagraph, clearFloatBottom } from './bottomAlign';
import { widgetNeighbourGlobals } from './widgetNeighbours';
import { WIDGET_LAYOUT_EVENT, mayRealignAfterGuard, scheduleSliverGuard, widgetContainerWidth } from './widgetSliverGuard';

/** Width of the text column the widget sits in, kept current as the window or text width changes. */
function useColumnWidth(iframeRef: React.RefObject<HTMLIFrameElement | null>, enabled: boolean): number | null {
  const [columnWidth, setColumnWidth] = useState<number | null>(null);
  useEffect(() => {
    const column = iframeRef.current?.closest('.iframe-widget')?.parentElement;
    if (!enabled || !column) return;
    // EXPERIMENT (experiment/iframe-layout-ronny-exp3): a widget inside a quote, list item or other block is
    // sized and wrapped against that block's text (its content box); one in a table cell, a footnote or a
    // column never wraps (see widgetContainerWidth).
    const measure = () => setColumnWidth(widgetContainerWidth(column));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    return () => observer.disconnect();
  }, [iframeRef, enabled]);
  return columnWidth;
}

const iframeWidgetSrcdocQuery = gql(`
  query IframeWidgetSrcdocQuery($widgetId: String!) {
    iframeWidgetSrcdoc(selector: {_id: $widgetId}) {
      result {
        _id
        html
      }
    }
  }
`);

const styles = defineStyles('HydratedIframeWidget', (theme: ThemeType) => ({
  fallback: {
    width: '100%',
    height: IFRAME_DEFAULT_HEIGHT,
  },
  iframe: {
    width: '100%',
    border: 'none',
    borderRadius: 4,
  },
  // EXPERIMENT (experiment/iframe-layout-ronny): author-chosen placement, see iframeWidgetLayout.ts.
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): a centered widget gets a row of its own, below any
  // widget the text wraps around (as a full-width one does).
  center: {
    display: 'block',
    margin: '16px auto',
    clear: 'both',
  },
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): positioned, so a block beside it that makes its own
  // layer (AI content's opacity, an embed's positioned frame) can't paint over it or take its clicks.
  floatLeft: {
    float: 'left',
    clear: 'left',
    margin: '6px 32px 16px 0',
    position: 'relative',
    zIndex: 1,
  },
  floatRight: {
    float: 'right',
    clear: 'right',
    margin: '6px 0 16px 32px',
    position: 'relative',
    zIndex: 1,
  },
  // On phones there's no room to wrap text, so every widget goes back to full width.
  narrowScreenFullWidth: {
    [theme.breakpoints.down('xs')]: {
      float: 'none',
      width: '100% !important',
      margin: '16px 0',
    },
  },
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): how each kind of block behaves next to a floated
  // widget (the same table makes the editor's rules).
  '@global': widgetNeighbourGlobals('post'),
}));

function InlineIframeWidget({ srcdoc, title }: {
  srcdoc: string,
  title?: string,
}) {
  const classes = useStyles(styles);
  const layout = parseIframeWidgetLayout(srcdoc);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const columnWidth = useColumnWidth(iframeRef, layout.position === 'left' || layout.position === 'right');
  const floated = shouldWrapWidget(layout, columnWidth);
  const width = floated || layout.position === 'center' ? layout.width ?? undefined : undefined;
  const [height, setHeight] = useState<number>(IFRAME_DEFAULT_HEIGHT);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.source !== iframeRef.current?.contentWindow) {
      return;
    }
    if (event.data?.type !== 'iframe-widget-resize') {
      return;
    }
    setHeight(clampIframeHeight(event.data.height));
  }, []);

  const requestResize = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'iframe-widget-request-resize' }, '*');
  }, []);

  useLayoutEffect(() => {
    window.addEventListener('message', handleMessage);
    requestResize();
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage, requestResize]);

  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): align=bottom lines the widget up with the end of the
  // paragraph after it, again whenever that paragraph reflows (fonts loading, the window resizing).
  const bottom = floated && alignOf(layout) === 'bottom';
  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (!bottom) {
      clearFloatBottom(iframe);
      return;
    }
    const container = iframe.closest('.iframe-widget') ?? iframe;
    alignFloatBottom(iframe, alignedParagraph(container), 6);
    const paragraph = alignedParagraph(container);
    if (!paragraph) return;
    let frame = 0;
    const realign = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => alignFloatBottom(iframe, alignedParagraph(container), 6));
    };
    const observer = new ResizeObserver(realign);
    observer.observe(paragraph);
    // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the sliver guard moved a block, which can move the
    // paragraph (without changing its size).
    const column = container.parentElement;
    const realignAfterGuard = (event: Event) => {
      if (column && mayRealignAfterGuard(column, event)) realign();
    };
    column?.addEventListener(WIDGET_LAYOUT_EVENT, realignAfterGuard);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      column?.removeEventListener(WIDGET_LAYOUT_EVENT, realignAfterGuard);
    };
  }, [bottom, height, columnWidth]);

  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): boxes that start beside only the widget's last few
  // pixels go below it (widgetSliverGuard), checked again whenever the post's text reflows.
  useLayoutEffect(() => {
    const column = iframeRef.current?.closest('.iframe-widget')?.parentElement;
    if (!floated || !column) return;
    scheduleSliverGuard(column);
    const observer = new ResizeObserver(() => scheduleSliverGuard(column));
    observer.observe(column);
    return () => {
      observer.disconnect();
      scheduleSliverGuard(column);
    };
  }, [floated, height, columnWidth]);

  return (
    <iframe
      srcDoc={injectResizeScript(srcdoc)}
      sandbox="allow-scripts"
      scrolling="no"
      title={title ?? 'Embedded widget'}
      data-lexical-iframe-widget="true"
      data-lw-side={floated ? layout.position : undefined}
      // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the phone override is for centered widgets only. A
      // left/right widget follows the one wrap rule (300px of text beside it) at every width, as in the
      // editor; on a phone no width leaves that much room, so it shows full width there anyway.
      className={classNames(classes.iframe, layout.position === 'center' && classes.narrowScreenFullWidth, {
        [classes.center]: layout.position === 'center',
        [classes.floatLeft]: floated && layout.position === 'left',
        [classes.floatRight]: floated && layout.position === 'right',
        lwFloatedWidget: floated,
      })}
      style={{height, width}}
      onLoad={requestResize}
      ref={iframeRef}
    />
  );
}

function HydratedIframeWidgetInner({ widgetId, attribs }: {
  widgetId: string,
  attribs: Record<string, any>,
}) {
  const { data } = useQuery(iframeWidgetSrcdocQuery, {
    ssr: true,
    variables: { widgetId },
  });

  const srcdoc = data?.iframeWidgetSrcdoc?.result?.html;
  if (!srcdoc) {
    return null;
  }

  return <InlineIframeWidget srcdoc={srcdoc} title={attribs.title} />;
}

/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp2): widgets' HTML by placeholder id, for a post body that
 * isn't saved (Experiment 2's Post tab shows the Editor tab's edits): used instead of fetching it.
 */
export const IframeWidgetSrcdocOverrides = createContext<Record<string, string> | null>(null);

export function HydratedIframeWidget({ widgetId, attribs }: {
  widgetId: string,
  attribs: Record<string, any>,
}) {
  const classes = useStyles(styles);
  const overrides = useContext(IframeWidgetSrcdocOverrides);
  if (overrides && Object.hasOwn(overrides, widgetId)) {
    return <InlineIframeWidget srcdoc={overrides[widgetId]} title={attribs.title} />;
  }
  return (
    <Suspense fallback={<div className={classes.fallback} />}>
      <HydratedIframeWidgetInner widgetId={widgetId} attribs={attribs} />
    </Suspense>
  );
}
