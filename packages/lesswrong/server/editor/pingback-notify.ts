import difference from 'lodash/difference';
import { createNotifications } from '../notificationCallbacksHelpers';
import { isBeingUndrafted } from './utils';
import type { LinkedDocumentRef } from '@/lib/collections/notifications/pingbackNotificationContext';

/**
 * A post or comment which links to other posts/comments, in the shape that the
 * editable-field callbacks have available. Fields other than `_id` are optional
 * because this is also passed documents from collections which don't have them.
 */
export interface LinkingDocumentPartial {
  _id: string
  postId?: string | null
  parentCommentId?: string | null
  draft?: boolean | null
  deleted?: boolean | null
  deletedDraft?: boolean | null
  rejected?: boolean | null
  pingbacks?: {
    Posts?: string[]
    Comments?: string[]
  }
}

/**
 * Users below this karma threshold don't generate link notifications, so that
 * spammers can't use links to get in front of authors. (Mirrors the karma
 * threshold on @-mentions.)
 */
const MIN_KARMA_FOR_LINK_NOTIFICATIONS = 1;

/**
 * The most linked-to documents a single edit will notify about. Prevents a
 * link-stuffed document from notifying an unbounded number of authors.
 */
const MAX_LINKED_DOCUMENTS_NOTIFIED = 20;

function canNotifyAboutLinks(currentUser: DbUser) {
  if (currentUser.isAdmin) return true;
  if (currentUser.conversationsDisabled) return false;
  return (currentUser.karma ?? 0) >= MIN_KARMA_FOR_LINK_NOTIFICATIONS;
}

/**
 * Whether a document is visible enough for links inside it to be worth
 * notifying about. Drafts are excluded here and notified about when they're
 * published instead; comments are only as visible as the post they're on.
 */
async function isPubliclyVisible(
  collectionName: 'Posts' | 'Comments',
  document: LinkingDocumentPartial,
  context: ResolverContext,
) {
  if (document.draft || document.deleted || document.deletedDraft || document.rejected) {
    return false;
  }
  if (collectionName === 'Comments' && document.postId) {
    const post = await context.Posts.findOne({ _id: document.postId }, undefined, { _id: 1, draft: 1, deletedDraft: 1, rejected: 1 });
    return !!post && !post.draft && !post.deletedDraft && !post.rejected;
  }
  return true;
}

function getLinkedIds(document: LinkingDocumentPartial | undefined, collectionName: 'Posts' | 'Comments') {
  return document?.pingbacks?.[collectionName] ?? [];
}

/**
 * Whether a link is part of the conversation the linking document is already
 * in: the document itself, the post a comment is on, or the comment it replies
 * to. Authors are already notified about those through comment/reply
 * notifications, so links to them don't warrant a pingback notification.
 */
function isLinkToOwnThread(document: LinkingDocumentPartial, { documentType, documentId }: LinkedDocumentRef) {
  if (documentId === document._id) return true;
  if (documentType === 'post' && documentId === document.postId) return true;
  return documentType === 'comment' && documentId === document.parentCommentId;
}

export function getNewlyLinkedDocuments(
  document: LinkingDocumentPartial,
  oldDocument: LinkingDocumentPartial | undefined,
): LinkedDocumentRef[] {
  // When a draft is published, none of its links have been notified about yet,
  // so treat all of them as new.
  const notifyAboutAllLinks = !oldDocument || isBeingUndrafted(oldDocument, document);

  const newlyLinked = (collectionName: 'Posts' | 'Comments') => {
    const linkedIds = getLinkedIds(document, collectionName);
    return notifyAboutAllLinks ? linkedIds : difference(linkedIds, getLinkedIds(oldDocument, collectionName));
  };

  return [
    ...newlyLinked('Posts').map((documentId): LinkedDocumentRef => ({ documentType: 'post', documentId })),
    ...newlyLinked('Comments').map((documentId): LinkedDocumentRef => ({ documentType: 'comment', documentId })),
  ]
    .filter(linkedDocument => !isLinkToOwnThread(document, linkedDocument))
    .slice(0, MAX_LINKED_DOCUMENTS_NOTIFIED);
}

/**
 * Map each linked-to document to the users who should hear about it: the
 * author, plus coauthors in the case of posts. Documents which have been
 * deleted, and the author of the linking document themselves, are skipped.
 */
async function getRecipientsByLinkedDocument(
  linkedDocuments: LinkedDocumentRef[],
  authorId: string,
  context: ResolverContext,
): Promise<Map<string, LinkedDocumentRef[]>> {
  const { Posts, Comments } = context;
  const postIds = linkedDocuments.filter(({ documentType }) => documentType === 'post').map(({ documentId }) => documentId);
  const commentIds = linkedDocuments.filter(({ documentType }) => documentType === 'comment').map(({ documentId }) => documentId);

  const [posts, comments] = await Promise.all([
    postIds.length
      ? Posts.find({ _id: { $in: postIds } }, undefined, { _id: 1, userId: 1, coauthorUserIds: 1, deletedDraft: 1, rejected: 1 }).fetch()
      : [],
    commentIds.length
      ? Comments.find({ _id: { $in: commentIds } }, undefined, { _id: 1, userId: 1, deleted: 1, rejected: 1 }).fetch()
      : [],
  ]);

  const recipientsByDocumentId = new Map<string, string[]>();
  for (const post of posts) {
    if (post.deletedDraft || post.rejected) continue;
    recipientsByDocumentId.set(post._id, [post.userId, ...(post.coauthorUserIds ?? [])]);
  }
  for (const comment of comments) {
    if (comment.deleted || comment.rejected) continue;
    if (comment.userId) recipientsByDocumentId.set(comment._id, [comment.userId]);
  }

  const linkedDocumentsByRecipient = new Map<string, LinkedDocumentRef[]>();
  for (const linkedDocument of linkedDocuments) {
    for (const recipientId of recipientsByDocumentId.get(linkedDocument.documentId) ?? []) {
      if (recipientId === authorId) continue;
      const existing = linkedDocumentsByRecipient.get(recipientId);
      if (existing) {
        existing.push(linkedDocument);
      } else {
        linkedDocumentsByRecipient.set(recipientId, [linkedDocument]);
      }
    }
  }
  return linkedDocumentsByRecipient;
}

/**
 * Notify the authors of posts/comments which a newly created or edited post or
 * comment links to. One notification is sent per author, listing everything of
 * theirs that the linking document newly links to.
 */
export async function notifyUsersAboutLinksToTheirContent(
  currentUser: DbUser,
  collectionName: CollectionNameString,
  document: LinkingDocumentPartial,
  oldDocument: LinkingDocumentPartial | undefined,
  context: ResolverContext,
) {
  if (collectionName !== 'Posts' && collectionName !== 'Comments') return;
  if (!canNotifyAboutLinks(currentUser)) return;

  const linkedDocuments = getNewlyLinkedDocuments(document, oldDocument);
  if (!linkedDocuments.length) return;
  if (!await isPubliclyVisible(collectionName, document, context)) return;

  const linkedDocumentsByRecipient = await getRecipientsByLinkedDocument(linkedDocuments, currentUser._id, context);

  await Promise.all([...linkedDocumentsByRecipient].map(([userId, recipientLinkedDocuments]) => createNotifications({
    userIds: [userId],
    notificationType: 'newPingback',
    documentType: collectionName === 'Posts' ? 'post' : 'comment',
    documentId: document._id,
    extraData: { linkedDocuments: recipientLinkedDocuments },
    context,
  })));
}
