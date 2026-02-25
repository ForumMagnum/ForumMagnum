import React, { Suspense } from 'react';
import { headers } from 'next/headers';
import { captureException } from '@/lib/sentryWrapper';
import {
  verifyHocuspocusWebhookSecret,
  readYjsState,
  handleCommentAdded,
} from '@/server/hocuspocus/hocuspocusCallbacks';
import WebhookProcessor from './WebhookProcessor';
import { assertRouteAttributes } from '@/lib/routeChecks/assertRouteAttributes';

type WebhookResult =
  | { type: 'error'; message: string }
  | { type: 'ok' }
  | { type: 'document'; documentName: string; yjsStateBase64: string };

/**
 * Processes the incoming webhook request headers and performs any server-side
 * work (DB reads, comment handling). Returns a result object that the render
 * function converts to JSX — separated out so we can wrap the async work in
 * try/catch without putting JSX inside the catch block.
 */
async function processWebhookRequest(headersList: Headers): Promise<WebhookResult> {
  const authHeader = headersList.get('authorization');
  const secret = authHeader?.replace('Bearer ', '');
  if (!secret) {
    return { type: 'error', message: 'Unauthorized: missing authorization header' };
  }

  if (!verifyHocuspocusWebhookSecret(secret)) {
    return { type: 'error', message: 'Unauthorized: invalid secret' };
  }

  const event = headersList.get('x-hocuspocus-event');
  const documentName = headersList.get('x-hocuspocus-document');

  if (!event || !documentName) {
    return { type: 'error', message: 'Bad request: missing event or documentName headers' };
  }

  switch (event) {
    case 'document.updated': {
      const yjsState = await readYjsState(documentName);
      if (!yjsState) {
        // eslint-disable-next-line no-console
        console.warn(`[HocuspocusWebhook] No YjsDocument found for ${documentName}`);
        return { type: 'error', message: 'Document not found' };
      }
      const yjsStateBase64 = Buffer.from(yjsState).toString('base64');
      return { type: 'document', documentName, yjsStateBase64 };
    }

    case 'comment.added': {
      const authorId = headersList.get('x-hocuspocus-comment-author-id');
      const content = headersList.get('x-hocuspocus-comment-content');
      const threadId = headersList.get('x-hocuspocus-comment-thread-id');
      const commentersStr = headersList.get('x-hocuspocus-comment-commenters') ?? '';

      if (!authorId || !content || !threadId) {
        return { type: 'error', message: 'Bad request: missing comment data headers' };
      }

      await handleCommentAdded(documentName, {
        authorId,
        content,
        threadId,
        commentersInThread: commentersStr ? commentersStr.split(',') : [],
      });

      return { type: 'ok' };
    }

    default:
      return { type: 'error', message: `Unknown event: ${event}` };
  }
}

assertRouteAttributes("/hocuspocusWebhook", {
  whiteBackground: false,
  hasLinkPreview: false,
  hasPingbacks: false,
  hasLeftNavigationColumn: false,
  hasMarkdownVersion: false,
});

/**
 * Hocuspocus webhook handler, implemented as a Next.js page rather than a
 * Route Handler.
 *
 * This is necessary because the Yjs→HTML conversion requires importing
 * PlaygroundNodes, which transitively imports many React dependencies
 * that can't be statically imported from a Route Handler. By using a page,
 * the conversion runs inside a client component during SSR, where "use client"
 * imports work normally.
 *
 * The Hocuspocus server sends GET requests with event data in headers
 * (not query params, to avoid logging sensitive information).
 *
 * For document.updated events, the server component reads the Yjs state from
 * the database and passes it to the client component, which converts it to
 * HTML and saves a revision.
 *
 * For comment.added events, no Yjs conversion is needed, so the server
 * component handles them directly.
 */
export default async function HocuspocusWebhookPage() {
  const headersList = await headers();

  let result: WebhookResult;
  try {
    result = await processWebhookRequest(headersList);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[HocuspocusWebhook] Error processing webhook:', error);
    captureException(error);
    result = { type: 'error', message: 'Internal error' };
  }

  if (result.type === 'error') {
    return <div>{result.message}</div>;
  }

  if (result.type === 'ok') {
    return <div>ok</div>;
  }

  return (
    <Suspense fallback={<div>processing</div>}>
      <WebhookProcessor
        documentName={result.documentName}
        yjsStateBase64={result.yjsStateBase64}
      />
    </Suspense>
  );
}
