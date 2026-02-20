'use client';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {injectResizeScript} from '@/components/lexical/embeds/IframeWidgetEmbed/iframeResizeScript';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const MIN_HEIGHT = 50;
const MAX_HEIGHT = 5000;
const DEFAULT_HEIGHT = 400;

const styles = defineStyles('WrappedIframeWidget', () => ({
  iframe: {
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: 4,
  },
}));

function clampHeight(h: number): number {
  return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(h)));
}

export function WrappedIframeWidget({attribs}: {attribs: Record<string, any>}) {
  const classes = useStyles(styles);
  const srcdoc = attribs.srcdoc ?? attribs.srcDoc ?? '';

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

  const srcDocWithResize = injectResizeScript(srcdoc);

  return (
    <iframe
      srcDoc={srcDocWithResize}
      sandbox="allow-scripts"
      title={attribs.title ?? 'Embedded widget'}
      data-lexical-iframe-widget="true"
      className={classes.iframe}
      style={{height}}
      ref={iframeRef}
    />
  );
}
