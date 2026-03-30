'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getSandboxedHomePageSrcdoc } from './SandboxedHomePageSrcdoc';
import { useCurrentUser } from '../common/withUser';

const styles = defineStyles('SandboxedHomePage', (theme: ThemeType) => ({
  root: {
    // The parent grid column is `minmax(0, min-content)`, so percentage-based
    // widths collapse to 0. Use a fixed width matching the site's content column.
    width: 760,
    maxWidth: 'calc(100vw - 16px)',
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
      maxWidth: '100vw',
    },
    position: 'relative',
  },
  iframe: {
    width: '100%',
    border: 'none',
    // Height is set dynamically via postMessage from the iframe content
    minHeight: 500,
  },
}));

// CSP for the sandboxed iframe: allow scripts + eval (for Babel), styles,
// connections only to our own GraphQL endpoint, images from our CDN.
const IFRAME_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
  "style-src 'unsafe-inline'",
  "connect-src 'self'",
  "img-src https://res.cloudinary.com",
  "font-src 'none'",
].join('; ');

interface RpcRequest {
  type: 'rpc-request';
  id: number;
  method: string;
  params: Record<string, unknown>;
}

function isRpcRequest(data: unknown): data is RpcRequest {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return obj.type === 'rpc-request' && typeof obj.id === 'number' && typeof obj.method === 'string';
}

const SandboxedHomePage = () => {
  const classes = useStyles(styles);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentUser = useCurrentUser();

  const handleRpc = useCallback(async (method: string, params: Record<string, unknown>): Promise<unknown> => {
    switch (method) {
      case 'getReadStatuses': {
        if (!currentUser) return {};
        const postIds = params.postIds;
        if (!Array.isArray(postIds)) return {};
        // For now, return empty read statuses — this will be wired up to the
        // real read status system via a server query later
        const statuses: Record<string, boolean> = {};
        for (const id of postIds) {
          statuses[id] = false;
        }
        return statuses;
      }
      default:
        throw new Error(`Unknown RPC method: ${method}`);
    }
  }, [currentUser]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;

      // Handle iframe content height updates
      if (event.data?.type === 'resize' && typeof event.data.height === 'number') {
        if (iframeRef.current) {
          iframeRef.current.style.height = `${event.data.height}px`;
        }
        return;
      }

      if (!isRpcRequest(event.data)) return;

      const { id, method, params } = event.data;
      handleRpc(method, params ?? {}).then(
        (result) => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'rpc-response', id, result },
            '*'
          );
        },
        (err) => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'rpc-response', id, error: err instanceof Error ? err.message : String(err) },
            '*'
          );
        }
      );
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleRpc]);

  const srcdoc = getSandboxedHomePageSrcdoc();

  return (
    <div className={classes.root}>
      {/* The `csp` attribute is not in React's type definitions but is a valid
         HTML attribute for iframe CSP Embedded Enforcement (Chrome 61+).
         We apply it via ref as a workaround for the missing type. */}
      <iframe
        ref={(el) => {
          iframeRef.current = el;
          if (el) {
            el.setAttribute('csp', IFRAME_CSP);
          }
        }}
        className={classes.iframe}
        sandbox="allow-scripts"
        srcDoc={srcdoc}
      />
    </div>
  );
};

export default registerComponent('SandboxedHomePage', SandboxedHomePage, {});
