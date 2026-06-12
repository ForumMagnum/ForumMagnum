'use client';

import { useEffect, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { Doc, Array as YArray, Map as YMap } from 'yjs';
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider';
import { captureException } from '@/lib/sentryWrapper';
import { fetchHocuspocusToken, getCollabCommentsDocumentName } from '../lexical/collaboration';
import { readThreadFromYMap, type Thread } from '../lexical/commenting';

const INITIAL_AUTH_RETRY_DELAY_MS = 5_000;
const MAX_AUTH_RETRY_DELAY_MS = 60_000;

function readThreadsFromCommentsDoc(doc: Doc): Thread[] {
  const commentsArray = doc.get('comments', YArray<unknown>);
  const threads: Thread[] = [];
  for (let i = 0; i < commentsArray.length; i++) {
    const entry = commentsArray.get(i);
    if (!(entry instanceof YMap) || entry.get('type') !== 'thread') continue;
    threads.push(readThreadFromYMap(entry));
  }
  return threads;
}

/**
 * Open one live subscription to a research document's comments subdoc on the
 * given shared socket, reporting a fresh thread snapshot on every change.
 * Returns a cleanup function.
 *
 * A provider whose token fetch or authentication fails is detached by
 * Hocuspocus without retry, so failures are retried here with capped
 * exponential backoff.
 */
function subscribeToCommentsDocThreads({
  socket,
  documentId,
  getToken,
  onThreadsChange,
}: {
  socket: HocuspocusProviderWebsocket
  documentId: string
  getToken: () => Promise<string>
  onThreadsChange: (threads: Thread[]) => void
}): () => void {
  const doc = new Doc();
  let destroyed = false;
  let retryTimer: NodeJS.Timeout | null = null;
  let retryDelayMs = INITIAL_AUTH_RETRY_DELAY_MS;
  let hasCapturedFailure = false;

  const provider = new HocuspocusProvider({
    websocketProvider: socket,
    name: getCollabCommentsDocumentName('ResearchDocuments', documentId),
    document: doc,
    token: getToken,
    onAuthenticated: () => {
      retryDelayMs = INITIAL_AUTH_RETRY_DELAY_MS;
    },
    onAuthenticationFailed: ({ reason }) => {
      if (destroyed) return;
      // eslint-disable-next-line no-console
      console.error(`[useProjectCommentThreads] Authentication failed for document ${documentId}: ${reason}`);
      if (!hasCapturedFailure) {
        hasCapturedFailure = true;
        captureException(new Error(`Comments subscription authentication failed for research document ${documentId}: ${reason}`));
      }
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (!destroyed) {
          void provider.connect();
        }
      }, retryDelayMs);
      retryDelayMs = Math.min(retryDelayMs * 2, MAX_AUTH_RETRY_DELAY_MS);
    },
  });

  const commentsArray = doc.get('comments', YArray<unknown>);
  const handleChange = () => onThreadsChange(readThreadsFromCommentsDoc(doc));
  commentsArray.observeDeep(handleChange);

  return () => {
    destroyed = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
    }
    commentsArray.unobserveDeep(handleChange);
    provider.destroy();
    doc.destroy();
  };
}

/**
 * Live thread snapshots for a set of research documents' comment subdocs.
 *
 * Subscribes to every listed document's `/comments` Yjs subdocument over a
 * single multiplexed WebSocket (one `HocuspocusProviderWebsocket`, one
 * provider per document), reconciling incrementally as the id list changes:
 * subscriptions are created for added documents and destroyed for removed
 * ones, while unchanged documents' connections (and the socket) stay up.
 *
 * Connecting to documents that have never been commented on is deliberate
 * and cheap — read-only connections don't create a persisted row, and it's
 * what makes a document's *first* comment show up live; filtering to
 * "documents that already have comments" would silently miss those.
 *
 * Read-only: this maps Y state to plain `Thread` objects and never writes.
 */
export function useProjectCommentThreads(documentIds: string[]): ReadonlyMap<string, Thread[]> {
  const apolloClient = useApolloClient();
  const [threadsByDocument, setThreadsByDocument] = useState<ReadonlyMap<string, Thread[]>>(new Map());
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());
  const socketRef = useRef<HocuspocusProviderWebsocket | null>(null);

  // Joined key keeps the effect stable across re-renders that pass a fresh
  // array with the same contents.
  const documentIdsKey = documentIds.join(',');

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_HOCUSPOCUS_URL;
    if (!wsUrl) return;
    const targetIds = new Set(documentIdsKey ? documentIdsKey.split(',') : []);
    const subscriptions = subscriptionsRef.current;

    const removedIds = [...subscriptions.keys()].filter((documentId) => !targetIds.has(documentId));
    for (const documentId of removedIds) {
      subscriptions.get(documentId)?.();
      subscriptions.delete(documentId);
    }
    if (removedIds.length > 0) {
      setThreadsByDocument((prev) => {
        const next = new Map(prev);
        for (const documentId of removedIds) {
          next.delete(documentId);
        }
        return next;
      });
    }

    for (const documentId of targetIds) {
      if (subscriptions.has(documentId)) continue;
      if (!socketRef.current) {
        socketRef.current = new HocuspocusProviderWebsocket({ url: wsUrl });
      }
      subscriptions.set(documentId, subscribeToCommentsDocThreads({
        socket: socketRef.current,
        documentId,
        getToken: () => fetchHocuspocusToken(apolloClient, 'ResearchDocuments', documentId, null),
        onThreadsChange: (threads) => {
          setThreadsByDocument((prev) => {
            const next = new Map(prev);
            next.set(documentId, threads);
            return next;
          });
        },
      }));
    }
  }, [documentIdsKey, apolloClient]);

  useEffect(() => {
    const subscriptions = subscriptionsRef.current;
    return () => {
      for (const cleanup of subscriptions.values()) {
        cleanup();
      }
      subscriptions.clear();
      socketRef.current?.destroy();
      socketRef.current = null;
    };
  }, []);

  return threadsByDocument;
}
