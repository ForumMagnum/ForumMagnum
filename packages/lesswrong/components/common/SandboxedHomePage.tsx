'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getSandboxedHomePageSrcdoc, wrapBodyInSrcdoc } from './SandboxedHomePageSrcdoc';
import { useCurrentUser } from '../common/withUser';
import { useHomeDesignChat } from './HomeDesignChatContext';
import { useLocation } from '@/lib/routeUtil';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import HomeDesignChatPanel from './HomeDesignChatPanel';
import DeferRender from './DeferRender';

const homePageDesignByPublicIdQuery = gql(`
  query HomePageDesignByPublicId($publicId: String!) {
    homePageDesignByPublicId(publicId: $publicId) {
      _id
      publicId
      html
      title
    }
  }
`);

const styles = defineStyles('SandboxedHomePage', (theme: ThemeType) => ({
  root: {
    width: '100%',
    position: 'relative',
  },
  iframe: {
    width: '100%',
    border: 'none',
    // Height is set dynamically via postMessage from the iframe content
    minHeight: 500,
  },
  customizeButton: {
    position: 'fixed',
    bottom: 24,
    right: 80,
    zIndex: theme.zIndexes.lwPopper - 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    background: '#5f9b65',
    color: '#fff',
    border: 'none',
    borderRadius: 24,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    '&:hover': {
      background: '#4e8a54',
    },
  },
}));

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
  const { isOpen, setIsOpen, customSrcdoc } = useHomeDesignChat();
  const { query } = useLocation();
  const themePublicId = query.theme as string | undefined;

  const { data: themeData } = useQuery(homePageDesignByPublicIdQuery, {
    variables: { publicId: themePublicId! },
    skip: !themePublicId,
  });

  const handleRpc = useCallback(async (method: string, params: Record<string, unknown>): Promise<unknown> => {
    switch (method) {
      case 'getReadStatuses': {
        if (!currentUser) return {};
        const postIds = params.postIds;
        if (!Array.isArray(postIds)) return {};
        // TODO: Wire up to real read status queries
        const statuses: Record<string, boolean> = {};
        for (const id of postIds) {
          statuses[id] = false;
        }
        return statuses;
      }
      case 'getVoteStatuses': {
        if (!currentUser) return {};
        // TODO: Wire up to real vote status queries
        return {};
      }
      case 'castVote': {
        if (!currentUser) throw new Error('Must be logged in to vote');
        // TODO: Wire up to real vote mutation
        // params: { documentId: string, collectionName: string, voteType: string }
        return { success: false, error: 'Voting not yet implemented' };
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

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const themeHtml = themeData?.homePageDesignByPublicId?.html;
  const themeSrcdoc = themeHtml ? wrapBodyInSrcdoc(themeHtml, { origin }) : null;
  const defaultSrcdoc = getSandboxedHomePageSrcdoc({ origin });
  const srcdoc = customSrcdoc ?? themeSrcdoc ?? defaultSrcdoc;

  return (
    <DeferRender ssr={false}>
      <div className={classes.root}>
        <iframe
          ref={iframeRef}
          className={classes.iframe}
          sandbox="allow-scripts allow-top-navigation-by-user-activation"
          srcDoc={srcdoc}
        />
      </div>
      {!isOpen && (
        <button
          className={classes.customizeButton}
          onClick={() => setIsOpen(true)}
        >
          ✨ Customize
        </button>
      )}
      <HomeDesignChatPanel />
    </DeferRender>
  );
};

export default SandboxedHomePage;
