'use client';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { injectResizeScript } from '@/components/lexical/embeds/IframeWidgetEmbed/iframeResizeScript';

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

const MIN_HEIGHT = 50;
const MAX_HEIGHT = 5000;
const DEFAULT_HEIGHT = 400;

const styles = defineStyles('HydratedIframeWidget', () => ({
  fallback: {
    width: '100%',
    height: 400,
  },
  iframe: {
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
}));

function clampHeight(height: number): number {
  return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(height)));
}

function InlineIframeWidget({ srcdoc, title }: {
  srcdoc: string,
  title?: string,
}) {
  const classes = useStyles(styles);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number>(DEFAULT_HEIGHT);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.source !== iframeRef.current?.contentWindow) {
      return;
    }
    if (event.data?.type !== 'iframe-widget-resize') {
      return;
    }
    setHeight(clampHeight(event.data.height));
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return (
    <iframe
      srcDoc={injectResizeScript(srcdoc)}
      sandbox="allow-scripts"
      title={title ?? 'Embedded widget'}
      data-lexical-iframe-widget="true"
      className={classes.iframe}
      style={{height}}
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
