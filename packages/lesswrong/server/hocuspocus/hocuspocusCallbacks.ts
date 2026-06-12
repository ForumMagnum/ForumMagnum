import { Posts } from '@/server/collections/posts/collection';
import ResearchDocuments from '@/server/collections/researchDocuments/collection';
import Revisions from '@/server/collections/revisions/collection';
import Users from '../../server/collections/users/collection';
import { createNotifications } from '@/server/notificationCallbacksHelpers';
import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import { createRevision } from '@/server/collections/revisions/mutations';
import { buildRevisionWithUser } from '../editor/conversionUtils';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';
import { constantTimeCompare } from '../../lib/helpers';
import { escapeHtml } from '@/lib/utils/sanitize';
import isEqual from 'lodash/isEqual';
import YjsDocuments from '@/server/collections/yjsDocuments/collection';
import { captureException } from '@/lib/sentryWrapper';
import { backgroundTask } from '@/server/utils/backgroundTask';
import { generateDocumentTitle } from '@/server/research/titleGeneration';

const COLLAB_AUTOSAVE_COMMIT_MESSAGE = 'Collaborative editor autosave';

// Must be kept in sync with the equivalent table in the (separately deployed)
// Hocuspocus server's documentNames.ts.
const COLLAB_DOCUMENT_NAME_PREFIXES: ReadonlyArray<{ prefix: string; collectionName: string }> = [
  { prefix: 'post-', collectionName: 'Posts' },
  { prefix: 'research-doc-', collectionName: 'ResearchDocuments' },
];

// The documentId is the full path after the prefix, including any "/subDoc"
// suffix, matching how the Hocuspocus server keys YjsDocuments rows.
export function parseHocuspocusDocumentName(documentName: string): { collectionName: string; documentId: string } {
  for (const { prefix, collectionName } of COLLAB_DOCUMENT_NAME_PREFIXES) {
    if (documentName.startsWith(prefix)) {
      const documentId = documentName.slice(prefix.length);
      if (documentId) {
        return { collectionName, documentId };
      }
    }
  }
  throw new Error(`Invalid document name: ${documentName}`);
}

export function buildHocuspocusDocumentName(collectionName: string, documentId: string): string {
  for (const entry of COLLAB_DOCUMENT_NAME_PREFIXES) {
    if (entry.collectionName === collectionName) {
      return `${entry.prefix}${documentId}`;
    }
  }
  throw new Error(`buildHocuspocusDocumentName: unsupported collection ${collectionName}`);
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
  const { collectionName, documentId } = parseHocuspocusDocumentName(documentName);
  const yjsDocument = await YjsDocuments.findOne({ collectionName, documentId });
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
 * Save a new revision for a collaboratively-edited Posts document, attributed
 * to a specific user. Called by saveOrUpdateLexicalRevision when creating a
 * fresh revision (as opposed to updating an existing autosave in-place).
 *
 * Only invoked for the Posts collection; other collections (e.g.
 * ResearchDocuments) don't currently snapshot revisions through this path.
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
 * Save a new revision for a collaboratively-edited Posts document.
 * Always creates a new revision (no in-place update of previous
 * autosaves) so that every snapshot has its own yjsState and can
 * be restored independently.
 *
 * Other collections (ResearchDocuments) don't snapshot revisions through this
 * path today; the caller should switch on collectionName before invoking.
 *
 * Deduplication is handled inside saveLexicalDocumentRevision: if
 * the HTML content hasn't changed since the last revision, no new
 * revision is created.
 */
export async function saveOrUpdateLexicalRevision(
  collectionName: string,
  documentId: string,
  html: string,
  yjsStateBase64: string,
): Promise<void> {
  if (collectionName === 'ResearchDocuments') {
    backgroundTask(maybeGenerateResearchDocumentTitle(documentId, html));
    return;
  }
  if (collectionName !== 'Posts') {
    throw new Error(`saveOrUpdateLexicalRevision: unsupported collection ${collectionName}`);
  }
  const post = await Posts.findOne(documentId);
  if (!post) {
    throw new Error(`saveOrUpdateLexicalRevision: no Posts document ${documentId}`);
  }
  await saveLexicalDocumentRevision(post.userId, documentId, html, yjsStateBase64);
}

// Generate a title via Haiku only while the doc still has a null title — once
// a title is set (auto or user-edited), later autosaves short-circuit here.
async function maybeGenerateResearchDocumentTitle(documentId: string, html: string): Promise<void> {
  try {
    const doc = await ResearchDocuments.findOne({ _id: documentId }, undefined, { _id: 1, title: 1 });
    if (!doc || doc.title !== null) return;
    const title = await generateDocumentTitle(html);
    if (!title) return;
    // title: null in the selector — avoids clobbering a title the user set
    // between our read and the Haiku response landing.
    await ResearchDocuments.rawUpdateOne(
      { _id: documentId, title: null },
      { $set: { title } },
    );
  } catch (err) {
    captureException(err);
    // eslint-disable-next-line no-console
    console.error('[research] maybeGenerateResearchDocumentTitle failed', documentId, err);
  }
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
  collectionName: string,
  documentId: string,
  revisionId: string,
): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[Hocuspocus] Restoring revision ${revisionId} for ${collectionName} ${documentId}`);

  // Load the revision and check that it has a stored Yjs state
  const revision = await Revisions.findOne({ _id: revisionId });
  if (!revision) {
    throw new Error(`[Hocuspocus] Revision not found: ${revisionId}`);
  }
  if (revision.documentId !== documentId) {
    throw new Error(`[Hocuspocus] Revision ${revisionId} does not belong to ${collectionName} ${documentId}`);
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
  await resetHocuspocusDocument(buildHocuspocusDocumentName(collectionName, documentId), yjsState);

  // eslint-disable-next-line no-console
  console.log(`[Hocuspocus] Restore completed for ${collectionName} ${documentId}`);
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
 * Notifies the document's stakeholders (for Posts: author, coauthors, and
 * other thread commenters; for ResearchDocuments: document and project
 * owners plus other thread commenters).
 *
 * Equivalent of CKEditor's `comment.added` webhook event.
 */
export async function handleCommentAdded(
  documentName: string,
  comment: HocuspocusCommentData,
): Promise<void> {
  const { collectionName, documentId } = parseHocuspocusDocumentName(documentName);
  if (collectionName === 'ResearchDocuments') {
    // comment.added fires on the comments subdocument, named
    // "research-doc-{id}/comments"; the owning document id is the segment
    // before the slash.
    await handleResearchDocumentCommentAdded(documentId.split('/')[0], comment);
    return;
  }
  if (collectionName !== 'Posts') {
    // eslint-disable-next-line no-console
    console.log(`[HocuspocusWebhook] Ignoring comment.added for unsupported collection ${documentName}`);
    return;
  }
  // comment.added fires on the comments subdocument, named "post-{id}/comments";
  // the owning post id is the segment before the slash.
  const postId = documentId.split('/')[0];

  // eslint-disable-next-line no-console
  console.log(`[HocuspocusWebhook] Comment added on ${documentName} by ${comment.authorId}`);

  const post = await Posts.findOne({ _id: postId });
  if (!post) {
    throw new Error(`Couldn't find post for Hocuspocus comment notification: ${postId}`);
  }

  // Notify the main author, coauthors, and everyone who's commented in the
  // thread. Then filter out the person who wrote the comment.
  const usersToNotify = [
    ...new Set(
      [post.userId, ...(post.coauthorUserIds ?? []), ...comment.commentersInThread].filter(
        (u) => !!u && u !== comment.authorId,
      ),
    ),
  ];

  // eslint-disable-next-line no-console
  console.log(`[HocuspocusWebhook] Notifying users: ${JSON.stringify(usersToNotify)}`);

  await createNotifications({
    userIds: usersToNotify,
    notificationType: 'newCommentOnDraft',
    documentType: 'post',
    documentId: postId,
    extraData: {
      senderUserID: comment.authorId,
      senderDisplayName: comment.authorName,
      // The Yjs comment body is plain text, but extraData.commentHtml is
      // rendered as HTML downstream (notification email/hover) — escape it
      // so collaborator-controlled text can't inject markup.
      commentHtml: escapeHtml(comment.content),
      linkSharingKey: post.linkSharingKey,
    },
  });
}

/**
 * ResearchDocuments branch of handleCommentAdded: notifies the document
 * owner, the project owner, and other commenters in the thread. Agent
 * comments use the conversation id as authorId, which never matches a user
 * id, so agents are naturally excluded from the recipient list (and from
 * being treated as the suppressed "own comment" author when a user
 * comments).
 */
async function handleResearchDocumentCommentAdded(
  researchDocumentId: string,
  comment: HocuspocusCommentData,
): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[HocuspocusWebhook] Comment added on research document ${researchDocumentId} by ${comment.authorId}`);

  const document = await ResearchDocuments.findOne({ _id: researchDocumentId });
  if (!document) {
    throw new Error(`Couldn't find research document for Hocuspocus comment notification: ${researchDocumentId}`);
  }
  const context = createAdminContext();
  const project = await context.ResearchProjects.findOne({ _id: document.projectId });

  const candidateUserIds = [
    document.userId,
    project?.userId,
    ...comment.commentersInThread,
  ].filter((u): u is string => !!u && u !== comment.authorId);
  // Thread commenter ids can be agent conversation ids or anonymous client
  // ids; only notify ones that resolve to real users.
  const users = await Users.find(
    { _id: { $in: [...new Set(candidateUserIds)] } },
    {},
    { _id: 1 },
  ).fetch();
  const usersToNotify = users.map((u) => u._id);
  if (usersToNotify.length === 0) return;

  await createNotifications({
    userIds: usersToNotify,
    notificationType: 'newCommentOnResearchDoc',
    documentType: 'researchDocument',
    documentId: researchDocumentId,
    extraData: {
      senderUserID: comment.authorId,
      senderDisplayName: comment.authorName,
      commentHtml: escapeHtml(comment.content),
      projectId: document.projectId,
    },
    // Onsite-only at the product's current stage: emails in response to
    // agent/collaborator comments aren't justified yet.
    noEmail: true,
    context,
  });
}
