import React, { Suspense } from 'react';
import { headers } from 'next/headers';
import { captureException } from '@/lib/sentryWrapper';
import {
  verifyHocuspocusWebhookSecret,
  readYjsState,
} from '@/server/hocuspocus/hocuspocusCallbacks';
import { Revisions } from '@/server/collections/revisions/collection';
import RestoreProcessor from './RestoreProcessor';

type RestoreResult =
  | { type: 'error'; message: string }
  | {
      type: 'restore';
      postId: string;
      html: string;
      existingYjsStateBase64: string | null;
    };

/**
 * Processes the incoming restore request: verifies auth, loads the revision
 * and existing Yjs state from the database, and returns the data needed
 * for the client component to perform the Yjs conversion.
 */
async function processRestoreRequest(headersList: Headers): Promise<RestoreResult> {
  const authHeader = headersList.get('authorization');
  const secret = authHeader?.replace('Bearer ', '');
  if (!secret) {
    return { type: 'error', message: 'Unauthorized: missing authorization header' };
  }

  if (!verifyHocuspocusWebhookSecret(secret)) {
    return { type: 'error', message: 'Unauthorized: invalid secret' };
  }

  const postId = headersList.get('x-post-id');
  const revisionId = headersList.get('x-revision-id');

  if (!postId || !revisionId) {
    return { type: 'error', message: 'Bad request: missing x-post-id or x-revision-id headers' };
  }

  // Load the revision
  const revision = await Revisions.findOne({ _id: revisionId });
  if (!revision) {
    return { type: 'error', message: `Revision not found: ${revisionId}` };
  }
  if (revision.documentId !== postId) {
    return { type: 'error', message: 'Revision does not belong to this post' };
  }
  if (!revision.originalContents) {
    return { type: 'error', message: 'Revision has no originalContents' };
  }

  const html = revision.originalContents.data;

  // Load the existing Yjs state from the YjsDocuments table
  const documentName = `post-${postId}`;
  const existingYjsState = await readYjsState(documentName);
  const existingYjsStateBase64 = existingYjsState
    ? Buffer.from(existingYjsState).toString('base64')
    : null;

  return {
    type: 'restore',
    postId,
    html,
    existingYjsStateBase64,
  };
}

/**
 * Internal page handler for restoring collaborative Lexical documents.
 *
 * This exists as a Next.js page (rather than being called directly from
 * server code) because the Yjs↔HTML conversion requires importing
 * PlaygroundNodes, which transitively imports React hooks and CSS files
 * that can only be resolved in a client-component context. The same
 * architectural constraint applies to the Hocuspocus webhook handler
 * (app/hocuspocusWebhook/).
 *
 * The GraphQL revertPostToRevision mutation performs permission checks
 * and then makes an HTTP GET request to this page, passing postId and
 * revisionId in headers. This server component reads the revision and
 * existing Yjs state from the database and passes them to the client
 * component, which performs the Yjs conversion during SSR.
 *
 * Authentication uses the same HOCUSPOCUS_WEBHOOK_SECRET as the
 * webhook handler — only internal ForumMagnum code has this secret.
 */
export default async function LexicalRestorePage() {
  const headersList = await headers();

  let result: RestoreResult;
  try {
    result = await processRestoreRequest(headersList);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[LexicalRestore] Error processing restore request:', error);
    captureException(error);
    result = { type: 'error', message: 'Internal error' };
  }

  if (result.type === 'error') {
    return <div>{result.message}</div>;
  }

  return (
    <Suspense fallback={<div>processing</div>}>
      <RestoreProcessor
        postId={result.postId}
        html={result.html}
        existingYjsStateBase64={result.existingYjsStateBase64}
      />
    </Suspense>
  );
}
