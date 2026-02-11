'use client';

import React, { use, useMemo } from 'react';
import { isServer } from '@/lib/executionEnvironment';
import {
  yjsBinaryToHtml,
  replaceYjsDocumentContent,
  htmlToYjsBinary,
  computeStateVector,
} from '../hocuspocusWebhook/yjsToHtml';

interface RestoreProcessorProps {
  postId: string;
  /** HTML from the target revision's originalContents.data. */
  html: string;
  /** Base64-encoded current Yjs state from YjsDocuments, or null if none exists. */
  existingYjsStateBase64: string | null;
}

/**
 * Performs the Lexical collaborative document restore during SSR.
 *
 * Steps:
 *   1. If there's an existing Yjs state, convert it to HTML and save as a
 *      revision (preserving unsaved edits before the restore).
 *   2. Compute the new Yjs state by building on top of the current state
 *      (replaceYjsDocumentContent) or creating a fresh one from HTML.
 *   3. Write the new state to YjsDocuments and notify Hocuspocus.
 */
async function processRestore({
  postId,
  html,
  existingYjsStateBase64,
}: RestoreProcessorProps): Promise<string> {
  if (!isServer) {
    return 'skipped (client)';
  }

  // Dynamic imports of server-only modules — resolved at runtime during SSR,
  // bypassing the @/server/* → stub alias that applies to static imports in
  // client bundles.
  const {
    saveOrUpdateLexicalRevision,
    writeYjsStateAndNotify,
  } = await import('@/server/hocuspocus/hocuspocusCallbacks');

  const existingState = existingYjsStateBase64
    ? new Uint8Array(Buffer.from(existingYjsStateBase64, 'base64'))
    : null;

  // Step 1: Save the current state as a revision before replacing it, so
  // no unsaved edits are lost (analogous to pushRevisionToCkEditor
  // saving unsaved changes first).
  if (existingState) {
    const currentHtml = await yjsBinaryToHtml(existingState);
    await saveOrUpdateLexicalRevision(postId, currentHtml);
  }

  // Step 2: Compute the new Yjs state by building on top of the current
  // state. We must add NEW delete+insert operations (not apply an older
  // snapshot) because Y.applyUpdate is a CRDT merge — purely additive.
  let newState: Uint8Array | null;

  if (existingState) {
    // Replace the document content in the existing Y.Doc, preserving
    // the comments YArray (comment thread data survives as orphaned
    // entries; comment anchors / MarkNodes are lost in the HTML round-trip).
    newState = await replaceYjsDocumentContent(existingState, html);
  } else {
    // No existing Yjs document — create a fresh one from HTML.
    newState = await htmlToYjsBinary(html);
  }

  if (!newState) {
    return 'error: content replacement failed (see server logs for diagnostics)';
  }

  const stateVector = computeStateVector(newState);

  // Step 3: Write the new state to YjsDocuments and notify Hocuspocus.
  await writeYjsStateAndNotify(postId, newState, stateVector);

  return 'ok';
}

/**
 * Inner component that calls use() on the promise. When this suspends,
 * only this component re-renders — not the parent that holds the useMemo.
 */
function RestoreProcessorAsync({ resultPromise }: { resultPromise: Promise<string> }) {
  const result = use(resultPromise);
  return <div>{result}</div>;
}

/**
 * Client component that performs the Lexical collaborative document restore
 * during SSR.
 *
 * Split into two components (this one + RestoreProcessorAsync) so that when
 * use() suspends, only the inner component re-renders and the useMemo in
 * this component is not re-evaluated. Same pattern as WebhookProcessor.
 */
export default function RestoreProcessor(props: RestoreProcessorProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resultPromise = useMemo(() => processRestore(props), [
    props.postId,
    props.html,
    props.existingYjsStateBase64,
  ]);
  return <RestoreProcessorAsync resultPromise={resultPromise} />;
}
