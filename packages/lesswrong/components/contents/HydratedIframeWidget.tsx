'use client';
import React, { Suspense, createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { injectResizeScript, clampIframeHeight, IFRAME_DEFAULT_HEIGHT } from '@/components/lexical/embeds/IframeWidgetEmbed/iframeResizeScript';
import classNames from 'classnames';
import { alignOf, parseIframeWidgetLayout, shouldWrapWidget } from './iframeWidgetLayout';
import { alignFloatBottom, alignedParagraph, clearFloatBottom } from './bottomAlign';

/** Width of the text column the widget sits in, kept current as the window or text width changes. */
function useColumnWidth(iframeRef: React.RefObject<HTMLIFrameElement | null>, enabled: boolean): number | null {
  const [columnWidth, setColumnWidth] = useState<number | null>(null);
  useEffect(() => {
    const column = iframeRef.current?.closest('.iframe-widget')?.parentElement;
    if (!enabled || !column) return;
    const measure = () => setColumnWidth(column.clientWidth);
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
  center: {
    display: 'block',
    margin: '16px auto',
  },
  floatLeft: {
    float: 'left',
    clear: 'left',
    margin: '6px 32px 16px 0',
  },
  floatRight: {
    float: 'right',
    clear: 'right',
    margin: '6px 0 16px 32px',
  },
  // On phones there's no room to wrap text, so every widget goes back to full width.
  narrowScreenFullWidth: {
    [theme.breakpoints.down('xs')]: {
      float: 'none',
      width: '100% !important',
      margin: '16px 0',
    },
  },
  '@global': {
    // A new section starts below any floated widget instead of wrapping beside it. The widget is
    // rendered inside the post's `.iframe-widget` div, so match the headings after that div.
    [[
      '.iframe-widget:has(> .lwFloatedWidget) ~ h1',
      '.iframe-widget:has(> .lwFloatedWidget) ~ h2',
    ].join(', ')]: {
      clear: 'both',
    },
  },
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
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => alignFloatBottom(iframe, alignedParagraph(container), 6));
    });
    observer.observe(paragraph);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [bottom, height, columnWidth]);

  return (
    <iframe
      srcDoc={injectResizeScript(srcdoc)}
      sandbox="allow-scripts"
      scrolling="no"
      title={title ?? 'Embedded widget'}
      data-lexical-iframe-widget="true"
      className={classNames(classes.iframe, layout.position !== 'inline' && classes.narrowScreenFullWidth, {
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
