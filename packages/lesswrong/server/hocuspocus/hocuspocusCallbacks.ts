import { Posts } from '@/server/collections/posts/collection';
import Revisions from '@/server/collections/revisions/collection';
import Users from '../../server/collections/users/collection';
import { createNotifications } from '@/server/notificationCallbacksHelpers';
import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import { createRevision } from '@/server/collections/revisions/mutations';
import { buildRevisionWithUser } from '../editor/conversionUtils';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';
import { constantTimeCompare } from '../../lib/helpers';
import isEqual from 'lodash/isEqual';
import YjsDocuments from '@/server/collections/yjsDocuments/collection';
import { captureException } from '@/lib/sentryWrapper';

const COLLAB_AUTOSAVE_COMMIT_MESSAGE = 'Collaborative editor autosave';

/**
 * Extracts the post ID from a Hocuspocus document name.
 * Document names follow the pattern "post-{postId}" or "post-{postId}/{subDocId}".
 */
export function documentNameToPostId(documentName: string): string {
  const match = documentName.match(/^post-([a-zA-Z0-9]+)/);
  if (!match) {
    throw new Error(`Invalid document name: ${documentName}`);
  }
  return match[1];
}

/**
 * Converts a Hocuspocus document name to the YjsDocuments documentId format.
 * Examples:
 *   - "post-abc" -> "abc"
 *   - "post-abc/comments" -> "abc/comments"
 */
function documentNameToDocumentId(documentName: string): string {
  if (!documentName.startsWith('post-')) {
    throw new Error(`Invalid document name: ${documentName}`);
  }
  return documentName.slice('post-'.length);
}

/**
 * Verifies the shared secret used to authenticate requests from the
 * Hocuspocus server to the ForumMagnum webhook endpoint.
 */
export function verifyHocuspocusWebhookSecret(providedSecret: string): boolean {
  const expectedSecret = process.env.HOCUSPOCUS_WEBHOOK_SECRET;
  if (!expectedSecret) {
    // eslint-disable-next-line no-console
    console.error('[HocuspocusWebhook] HOCUSPOCUS_WEBHOOK_SECRET is not configured');
    return false;
  }
  return constantTimeCompare({ correctValue: expectedSecret, unknownValue: providedSecret });
}

/**
 * Reads the current Yjs state for a document from the YjsDocuments table.
 * Returns null if the document doesn't exist.
 */
export async function readYjsState(documentName: string): Promise<Uint8Array | null> {
  const documentId = documentNameToDocumentId(documentName);
  const yjsDocument = await YjsDocuments.findOne({ documentId });
  if (!yjsDocument) return null;
  return new Uint8Array(yjsDocument.yjsState);
}

/**
 * When saving a collaborative editor post, the "user ID" from the Hocuspocus
 * context might be from a link-sharing user who isn't logged in. In that case
 * we attribute the revision to the original post author, but mark it as
 * non-admin to prevent privilege escalation in HTML sanitization.
 */
async function getUserForSavedPost(postId: string, userId: string): Promise<{
  user: DbUser;
  isAdmin: boolean;
}> {
  const originalUser = await Users.findOne(userId);
  if (originalUser) {
    return { user: originalUser, isAdmin: originalUser.isAdmin };
  }

  const post = await Posts.findOne(postId);
  if (!post) {
    throw new Error(`Invalid postId in getUserForSavedPost: ${postId}`);
  }
  const primaryAuthorUser = await Users.findOne(post.userId);
  if (!primaryAuthorUser) {
    throw new Error(`Invalid post.userId in getUserForSavedPost: ${post.userId}`);
  }
  return {
    user: primaryAuthorUser,
    isAdmin: false,
  };
}

/**
 * Save a new revision for a collaboratively-edited document, attributed to
 * a specific user. Called by saveOrUpdateLexicalRevision when creating a
 * fresh revision (as opposed to updating an existing autosave in-place).
 */
async function saveLexicalDocumentRevision(
  userId: string,
  postId: string,
  html: string,
  yjsStateBase64: string,
): Promise<void> {
  const context = createAdminContext();
  const fieldName = 'contents';
  const { user, isAdmin } = await getUserForSavedPost(postId, userId);
  const previousRev = await getLatestRev(postId, fieldName, context);

  const newOriginalContents = {
    data: html,
    type: 'lexical' as const,
    yjsState: yjsStateBase64,
  };

  // Compare only data+type for deduplication (yjsState changes even when
  // text content is identical due to CRDT metadata)
  const prevContentsForComparison = previousRev?.originalContents
    ? { data: previousRev.originalContents.data, type: previousRev.originalContents.type }
    : null;
  const newContentsForComparison = { data: html, type: 'lexical' as const };

  if (!prevContentsForComparison || !isEqual(newContentsForComparison, prevContentsForComparison)) {
    const newRevision: Partial<DbRevision> = {
      ...(await buildRevisionWithUser({
        originalContents: newOriginalContents,
        user,
        isAdmin,
        context,
      })),
      documentId: postId,
      fieldName,
      collectionName: 'Posts',
      version: getNextVersion(previousRev, 'patch', true),
      draft: true,
      updateType: 'patch',
      commitMessage: COLLAB_AUTOSAVE_COMMIT_MESSAGE,
      changeMetrics: htmlToChangeMetrics(previousRev?.html || '', html),
    };

    await createRevision({ data: newRevision }, context);
  }
}

/**
 * Save a new revision for a collaboratively-edited document.
 * Always creates a new revision (no in-place update of previous
 * autosaves) so that every snapshot has its own yjsState and can
 * be restored independently.
 *
 * Deduplication is handled inside saveLexicalDocumentRevision: if
 * the HTML content hasn't changed since the last revision, no new
 * revision is created.
 */
export async function saveOrUpdateLexicalRevision(
  postId: string,
  html: string,
  yjsStateBase64: string,
): Promise<void> {
  const post = await Posts.findOne(postId);
  const userId = post!.userId;
  await saveLexicalDocumentRevision(userId, postId, html, yjsStateBase64);
}

/**
 * Derives the HTTP URL for the Hocuspocus admin endpoint from the
 * WebSocket URL (HOCUSPOCUS_URL env var). The WebSocket URL is typically
 * ws://host:port or wss://host:port; we convert to http:// or https://.
 */
function getHocuspocusHttpUrl(): string | null {
  const wsUrl = process.env.HOCUSPOCUS_URL;
  if (!wsUrl) return null;
  return wsUrl.replace(/^ws(s?):\/\//, 'http$1://');
}

/**
 * Sends a reset-document request to the Hocuspocus admin endpoint.
 * The endpoint does a destructive replacement: it closes all connections,
 * unloads the in-memory Y.Doc, then writes the new Yjs state to the
 * database. When clients auto-reconnect, Hocuspocus loads the new state
 * from the database.
 */
export async function resetHocuspocusDocument(documentName: string, newState: Uint8Array): Promise<void> {
  const httpUrl = getHocuspocusHttpUrl();
  const secret = process.env.HOCUSPOCUS_WEBHOOK_SECRET;
  if (!httpUrl || !secret) {
    // eslint-disable-next-line no-console
    console.error('[Hocuspocus] Skipping document reset: Hocuspocus not configured');
    captureException(new Error('[Hocuspocus] Skipping document reset: Hocuspocus not configured'));
    return;
  }

  const base64State = Buffer.from(newState).toString('base64');

  try {
    const response = await fetch(`${httpUrl}/admin/reset-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'X-Document-Name': documentName,
        'Content-Type': 'text/plain',
      },
      body: base64State,
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`[Hocuspocus] Document reset failed: ${response.status} ${response.statusText}`);
      captureException(new Error(`[Hocuspocus] Document reset failed: ${response.status} ${response.statusText}`));
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Hocuspocus] Error calling reset-document endpoint:', err);
    captureException(new Error(`[Hocuspocus] Error calling reset-document endpoint: ${err}`));
  }
}


/**
 * Restores a collaborative Lexical document to a previous revision by
 * sending the revision's stored Yjs state to the Hocuspocus server.
 *
 * The Hocuspocus server does a destructive replacement: it closes all
 * connections, unloads the in-memory Y.Doc, and writes the new state to
 * the database. When clients reconnect they get the restored state.
 *
 * This function is called from the revertPostToRevision GraphQL mutation
 * (which has already performed permission checks).
 */
export async function pushRevisionToLexicalCollab(
  postId: string,
  revisionId: string,
): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[Hocuspocus] Restoring revision ${revisionId} for post ${postId}`);

  // Load the revision and check that it has a stored Yjs state
  const revision = await Revisions.findOne({ _id: revisionId });
  if (!revision) {
    throw new Error(`[Hocuspocus] Revision not found: ${revisionId}`);
  }
  if (revision.documentId !== postId) {
    throw new Error(`[Hocuspocus] Revision ${revisionId} does not belong to post ${postId}`);
  }

  const yjsStateBase64 = revision.originalContents?.yjsState;
  if (!yjsStateBase64) {
    throw new Error(
      `[Hocuspocus] Revision ${revisionId} has no yjsState in originalContents — ` +
      'only revisions created after the Lexical collaborative editor was deployed can be restored'
    );
  }

  const yjsState = new Uint8Array(Buffer.from(yjsStateBase64, 'base64'));

  // Send the Yjs state to the Hocuspocus server, which handles the
  // destructive replacement (evict document + write to DB).
  await resetHocuspocusDocument(`post-${postId}`, yjsState);

  // eslint-disable-next-line no-console
  console.log(`[Hocuspocus] Restore completed for post ${postId}`);
}

export interface HocuspocusCommentData {
  authorId: string;
  authorName?: string;
  content: string;
  threadId: string;
  commentersInThread: string[];
}

/**
 * Handle the "comment added" callback from Hocuspocus.
 * Notifies the post author, coauthors, and other commenters in the thread.
 *
 * Equivalent of CKEditor's `comment.added` webhook event.
 */
export async function handleCommentAdded(
  documentName: string,
  comment: HocuspocusCommentData,
): Promise<void> {
  const postId = documentNameToPostId(documentName);

  // eslint-disable-next-line no-console
  console.log(`[HocuspocusWebhook] Comment added on ${documentName} by ${comment.authorId}`);

  const post = await Posts.findOne({ _id: postId });
  if (!post) {
    throw new Error(`Couldn't find post for Hocuspocus comment notification: ${postId}`);
  }

  // Notify the main author, coauthors, and everyone who's commented in the
  // thread. Authors and coauthors see "New comments on your draft"; other
  // commenters see "New replies on comments you made on ..." (they don't own
  // the draft, so the old wording was misleading -- see Slack bug report
  // https://lworg.slack.com/archives/CJUN2UAFN/p1775158103466779).
  const authorIdSet = new Set(
    [post.userId, ...(post.coauthorUserIds ?? [])].filter(
      (u): u is string => !!u && u !== comment.authorId,
    ),
  );
  const commenterOnlyIdSet = new Set(
    comment.commentersInThread.filter(
      (u) => !!u && u !== comment.authorId && !authorIdSet.has(u),
    ),
  );
  const authorIds = [...authorIdSet];
  const commenterOnlyIds = [...commenterOnlyIdSet];

  // eslint-disable-next-line no-console
  console.log(
    `[HocuspocusWebhook] Notifying authors: ${JSON.stringify(authorIds)}, other commenters: ${JSON.stringify(commenterOnlyIds)}`,
  );

  const baseExtraData = {
    senderUserID: comment.authorId,
    senderDisplayName: comment.authorName,
    commentHtml: comment.content,
    linkSharingKey: post.linkSharingKey,
  };

  if (authorIds.length) {
    await createNotifications({
      userIds: authorIds,
      notificationType: 'newCommentOnDraft',
      documentType: 'post',
      documentId: postId,
      extraData: { ...baseExtraData, isRecipientAuthor: true },
    });
  }
  if (commenterOnlyIds.length) {
    await createNotifications({
      userIds: commenterOnlyIds,
      notificationType: 'newCommentOnDraft',
      documentType: 'post',
      documentId: postId,
      extraData: { ...baseExtraData, isRecipientAuthor: false },
    });
  }
}
