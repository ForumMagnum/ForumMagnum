'use client';
import React, { Suspense, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { injectResizeScript, clampIframeHeight, IFRAME_DEFAULT_HEIGHT } from '@/components/lexical/embeds/IframeWidgetEmbed/iframeResizeScript';
import classNames from 'classnames';
import { parseIframeWidgetLayout } from './iframeWidgetLayout';

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
  const floated = layout.position === 'left' || layout.position === 'right';
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
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

  return (
    <iframe
      srcDoc={injectResizeScript(srcdoc)}
      sandbox="allow-scripts"
      scrolling="no"
      title={title ?? 'Embedded widget'}
      data-lexical-iframe-widget="true"
      className={classNames(classes.iframe, layout.position !== 'inline' && classes.narrowScreenFullWidth, {
        [classes.center]: layout.position === 'center',
        [classes.floatLeft]: layout.position === 'left',
        [classes.floatRight]: layout.position === 'right',
        lwFloatedWidget: floated,
      })}
      style={{height, width: layout.width ?? undefined}}
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

export function HydratedIframeWidget({ widgetId, attribs }: {
  widgetId: string,
  attribs: Record<string, any>,
}) {
  const classes = useStyles(styles);
  return (
    <Suspense fallback={<div className={classes.fallback} />}>
      <HydratedIframeWidgetInner widgetId={widgetId} attribs={attribs} />
    </Suspense>
  );
}
