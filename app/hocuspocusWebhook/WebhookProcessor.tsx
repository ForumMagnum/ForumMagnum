'use client';

import React, { use, useMemo } from 'react';
import { isServer } from '@/lib/executionEnvironment';
import { yjsBinaryToHtml } from './yjsToHtml';

interface WebhookProcessorProps {
  documentName: string;
  /** Base64-encoded Yjs binary state, read from the DB by the server component. */
  yjsStateBase64: string;
}

/**
 * Converts the Yjs state to HTML and saves (or updates) a revision.
 *
 * This runs during SSR only. Server-side modules (@/server/*) are loaded via
 * dynamic import to bypass the static stub mechanism — the same pattern used
 * by ApolloWrapper to access ResolverContext during SSR.
 */
async function processDocumentUpdate({ documentName, yjsStateBase64 }: WebhookProcessorProps): Promise<string> {
  if (!isServer) {
    return 'skipped (client)';
  }

  // Dynamic imports of server-only modules — resolved at runtime during SSR,
  // bypassing the @/server/* → stub alias that applies to static imports in
  // client bundles.
  const {
    saveOrUpdateLexicalRevision,
    documentNameToPostId,
  } = await import('@/server/hocuspocus/hocuspocusCallbacks');

  const yjsState = new Uint8Array(Buffer.from(yjsStateBase64, 'base64'));
  const html = yjsBinaryToHtml(yjsState);
  const postId = documentNameToPostId(documentName);

  await saveOrUpdateLexicalRevision(postId, html, yjsState);

  return 'ok';
}

/**
 * Inner component that calls use() on the promise. When this suspends,
 * only this component re-renders — not the parent that holds the useMemo.
 */
function WebhookProcessorAsync({ resultPromise }: { resultPromise: Promise<string> }) {
  const result = use(resultPromise);
  return <div>{result}</div>;
}

/**
 * Client component that performs the Yjs→HTML conversion and revision save
 * during SSR.
 *
 * Split into two components (this one + WebhookProcessorAsync) so that when
 * use() suspends, only the inner component re-renders and the useMemo in this
 * component is not re-evaluated. This is the same pattern as ApolloWrapperServer.
 */
export default function WebhookProcessor(props: WebhookProcessorProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resultPromise = useMemo(() => processDocumentUpdate(props), [
    props.documentName,
    props.yjsStateBase64,
  ]);
  return <WebhookProcessorAsync resultPromise={resultPromise} />;
}
