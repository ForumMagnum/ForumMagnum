'use client';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {injectResizeScript} from '@/components/lexical/embeds/IframeWidgetEmbed/iframeResizeScript';

const MIN_HEIGHT = 50;
const MAX_HEIGHT = 5000;
const DEFAULT_HEIGHT = 400;

function clampHeight(h: number): number {
  return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(h)));
}

export function WrappedIframeWidget({attribs}: {attribs: Record<string, any>}) {
  const srcdoc = attribs.srcdoc ?? attribs.srcDoc ?? '';
  const contentHeightAttr = attribs['data-content-height'];
  const initialHeight = contentHeightAttr ? parseInt(contentHeightAttr, 10) : DEFAULT_HEIGHT;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number>(isNaN(initialHeight) ? DEFAULT_HEIGHT : initialHeight);

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
      style={{width: '100%', height, border: '1px solid #ccc', borderRadius: 4}}
      ref={iframeRef}
    />
  );
}
