import { Posts } from '@/server/collections/posts/collection';
import Revisions from '@/server/collections/revisions/collection';
import Users from '../../server/collections/users/collection';
import { createNotifications } from '@/server/notificationCallbacksHelpers';
import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import { createRevision } from '@/server/collections/revisions/mutations';
import { buildRevisionWithUser } from '../editor/conversionUtils';
import { getLatestRev, getNextVersion, getPrecedingRev, htmlToChangeMetrics } from '../editor/utils';
import { constantTimeCompare } from '../../lib/helpers';
import isEqual from 'lodash/isEqual';
import moment from 'moment';
import YjsDocuments from '@/server/collections/yjsDocuments/collection';

// Time interval such that, when autosaving, we will update an existing
// rev instead of create a new rev if it's within this amount of time ago.
// In milliseconds.
const AUTOSAVE_MAX_INTERVAL = 10 * 60 * 1000;

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
  const documentId = documentNameToPostId(documentName);
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
async function saveLexicalDocumentRevision(userId: string, postId: string, html: string): Promise<void> {
  const context = createAdminContext();
  const fieldName = 'contents';
  const { user, isAdmin } = await getUserForSavedPost(postId, userId);
  const previousRev = await getLatestRev(postId, fieldName, context);

  const newOriginalContents = {
    data: html,
    type: 'lexical' as const,
  };

  if (!previousRev || !isEqual(newOriginalContents, previousRev.originalContents)) {
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
 * Save or update a revision for a collaboratively-edited document.
 * If a recent autosave revision exists, update it in-place to avoid
 * creating excessive revisions during active editing. Otherwise create
 * a new revision.
 *
 * Equivalent of the CKEditor `saveOrUpdateDocumentRevision`.
 */
export async function saveOrUpdateLexicalRevision(postId: string, html: string): Promise<void> {
  const context = createAdminContext();
  const fieldName = 'contents';
  const previousRev = await getLatestRev(postId, fieldName, context);

  const lastEditedAt = previousRev
    ? moment(previousRev.autosaveTimeoutStart || previousRev.editedAt).toDate().getTime()
    : 0;
  const timeSinceLastEdit = Date.now() - lastEditedAt;

  if (
    previousRev &&
    previousRev.draft &&
    timeSinceLastEdit < AUTOSAVE_MAX_INTERVAL &&
    previousRev.commitMessage === COLLAB_AUTOSAVE_COMMIT_MESSAGE
  ) {
    // Get the revision prior to the one being replaced, for computing change metrics
    const precedingRev = await getPrecedingRev(previousRev, context);

    // eslint-disable-next-line no-console
    console.log(`[HocuspocusWebhook] Updating existing rev ${previousRev._id}`);
    await Revisions.rawUpdateOne(
      { _id: previousRev._id },
      {
        $set: {
          editedAt: new Date(),
          autosaveTimeoutStart: previousRev.autosaveTimeoutStart || previousRev.editedAt,
          originalContents: { data: html, type: 'lexical' },
          changeMetrics: htmlToChangeMetrics(precedingRev?.html || '', html),
        },
      },
    );
  } else {
    const post = await Posts.findOne(postId);
    const userId = post!.userId;
    await saveLexicalDocumentRevision(userId, postId, html);
  }
}

export interface HocuspocusCommentData {
  authorId: string;
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
      commentHtml: comment.content,
      linkSharingKey: post.linkSharingKey,
    },
  });
}
