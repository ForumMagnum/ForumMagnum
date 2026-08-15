import { updatePost } from '@/server/collections/posts/mutations';
import { updateComment } from '@/server/collections/comments/mutations';
import { updateUser } from '@/server/collections/users/mutations';
import { createConversation } from '@/server/collections/conversations/mutations';
import { createMessage } from '@/server/collections/messages/mutations';
import { createModeratorAction } from '@/server/collections/moderatorActions/mutations';
import { VOTING_DISABLED } from '@/lib/collections/moderatorActions/constants';
import { getSignatureWithNote } from '@/lib/collections/users/helpers';
import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { getEarliestUnreviewedItem } from './queue';
import type { NextItemResponse, QueueItem, ReviewCollectionName } from '../lib/types';

/**
 * SimpleMod reviews content strictly earliest-first, so hotkey races must not
 * be able to approve/reject a later item while an earlier one is still
 * undecided. Actions for a given moderated user are serialized through a
 * per-user promise chain, and the earliest-item check runs inside the critical
 * section. This is sufficient for a single-instance internal tool; a
 * multi-instance deployment would need pg_advisory_xact_lock around the
 * check-and-write instead.
 */
const userLocks = new Map<string, Promise<unknown>>();

export async function withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const previous = userLocks.get(userId) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  const tail = run.then(() => {}, () => {});
  userLocks.set(userId, tail);
  try {
    return await run;
  } finally {
    if (userLocks.get(userId) === tail) {
      userLocks.delete(userId);
    }
  }
}

export class EarliestItemConflictError extends Error {
  currentEarliest: QueueItem | null;

  constructor(currentEarliest: QueueItem | null) {
    super('Not the earliest unreviewed item for this user');
    this.currentEarliest = currentEarliest;
  }
}

/**
 * Prepends a signed note without read-modify-write: FM callbacks (rejection
 * moderator actions, DM logging) append to sunshineNotes from background tasks
 * that run concurrently with our writes, so a findOne-then-set here would race
 * them and silently drop audit entries.
 */
async function appendSunshineNote(moderator: DbUser, userId: string, text: string): Promise<void> {
  const db = getSqlClientOrThrow();
  await db.none(`
    UPDATE "Users"
    SET "sunshineNotes" = $(note) || COALESCE("sunshineNotes", '')
    WHERE "_id" = $(userId)
  `, { note: getSignatureWithNote(moderator.displayName ?? moderator._id, text), userId });
}

interface ItemActionArgs {
  userId: string;
  collectionName: ReviewCollectionName;
  documentId: string;
}

async function assertIsEarliestItem({ userId, collectionName, documentId }: ItemActionArgs): Promise<void> {
  const { item } = await getEarliestUnreviewedItem(userId);
  if (!item || item.collectionName !== collectionName || item.documentId !== documentId) {
    throw new EarliestItemConflictError(item);
  }
}

async function loadOwnedDocument(context: ResolverContext, { userId, collectionName, documentId }: ItemActionArgs): Promise<DbPost | DbComment> {
  const document = collectionName === 'Posts'
    ? await context.Posts.findOne(documentId)
    : await context.Comments.findOne(documentId);
  if (!document) {
    throw new Error(`Invalid ${collectionName} ID`);
  }
  if (document.userId !== userId) {
    throw new Error(`${collectionName} document does not belong to user`);
  }
  return document;
}

function itemDescription(collectionName: ReviewCollectionName, document: DbPost | DbComment): string {
  if (collectionName === 'Posts') {
    return `post "${(document as DbPost).title}"`;
  }
  return `comment ${document._id}`;
}

/**
 * Once every current item has been individually decided, the user leaves the
 * queue without a user-level approval: reviewedByUserId stays null so future
 * content is still created unreviewed. reviewedAt is set unconditionally
 * (matching approveUserCurrentContentOnly) so their next submission triggers
 * an "unreviewed content" action rather than a "first post" one.
 */
async function dequeueIfNoItemsRemain(context: ResolverContext, moderator: DbUser, userId: string): Promise<NextItemResponse> {
  const { item, remainingCount } = await getEarliestUnreviewedItem(userId);
  if (item) {
    return { nextItem: item, remainingCount };
  }
  const user = await context.Users.findOne(userId);
  if (user?.needsReview) {
    await updateUser({
      data: {
        needsReview: false,
        reviewedByUserId: null,
        reviewedAt: new Date(),
        sunshineFlagged: false,
        snoozedUntilContentCount: null,
      },
      selector: { _id: userId },
    }, context);
    await appendSunshineNote(moderator, userId, 'SimpleMod: reviewed all current content individually');
  }
  return { nextItem: null, remainingCount: 0 };
}

export async function approveItem(context: ResolverContext, moderator: DbUser, args: ItemActionArgs): Promise<NextItemResponse> {
  return withUserLock(args.userId, async () => {
    await assertIsEarliestItem(args);
    const document = await loadOwnedDocument(context, args);
    const data = { reviewedByUserId: moderator._id, authorIsUnreviewed: false };
    if (args.collectionName === 'Posts') {
      await updatePost({ data, selector: { _id: args.documentId } }, context);
    } else {
      await updateComment({ data, selector: { _id: args.documentId } }, context);
    }
    await appendSunshineNote(moderator, args.userId, `SimpleMod: approved ${itemDescription(args.collectionName, document)}`);
    return dequeueIfNoItemsRemain(context, moderator, args.userId);
  });
}

export async function rejectItem(context: ResolverContext, moderator: DbUser, args: ItemActionArgs & { rejectedReason: string }): Promise<NextItemResponse> {
  return withUserLock(args.userId, async () => {
    await assertIsEarliestItem(args);
    await loadOwnedDocument(context, args);
    const data = { rejected: true, rejectedReason: args.rejectedReason };
    if (args.collectionName === 'Posts') {
      await updatePost({ data, selector: { _id: args.documentId } }, context);
    } else {
      await updateComment({ data, selector: { _id: args.documentId } }, context);
    }
    return dequeueIfNoItemsRemain(context, moderator, args.userId);
  });
}

export async function sendModeratorDm(context: ResolverContext, moderator: DbUser, { userId, title, messageHtml }: {
  userId: string;
  title: string;
  messageHtml: string;
}): Promise<void> {
  const conversation = await createConversation({
    data: {
      participantIds: [userId, moderator._id],
      title,
      moderator: true,
    },
  }, context);
  await createMessage({
    data: {
      userId: moderator._id,
      contents: {
        originalContents: {
          type: 'html',
          data: messageHtml,
        },
      },
      conversationId: conversation._id,
      noEmail: false,
    },
  }, context);
}

export async function approveItemAndDm(context: ResolverContext, moderator: DbUser, args: ItemActionArgs & { messageHtml: string }): Promise<NextItemResponse> {
  const result = await approveItem(context, moderator, args);
  await sendModeratorDm(context, moderator, {
    userId: args.userId,
    title: 'A note from the moderation team',
    messageHtml: args.messageHtml,
  });
  await appendSunshineNote(moderator, args.userId, 'SimpleMod: sent DM about approved content');
  return result;
}

export async function skipUser(context: ResolverContext, moderator: DbUser, userId: string): Promise<void> {
  return withUserLock(userId, async () => {
    const user = await context.Users.findOne(userId);
    if (!user) {
      throw new Error('Invalid user ID');
    }
    if (!user.needsReview) {
      return;
    }
    await updateUser({
      data: {
        needsReview: false,
        reviewedByUserId: null,
        reviewedAt: user.reviewedAt ? new Date() : null,
      },
      selector: { _id: userId },
    }, context);
    await appendSunshineNote(moderator, userId, 'SimpleMod: removed from review queue');
  });
}

export async function approveUser(context: ResolverContext, moderator: DbUser, userId: string): Promise<void> {
  return withUserLock(userId, async () => {
    const user = await context.Users.findOne(userId);
    if (!user) {
      throw new Error('Invalid user ID');
    }
    await updateUser({
      data: {
        sunshineFlagged: false,
        reviewedByUserId: moderator._id,
        reviewedAt: new Date(),
        needsReview: false,
        snoozedUntilContentCount: null,
      },
      selector: { _id: userId },
    }, context);
    await appendSunshineNote(moderator, userId, 'SimpleMod: approved user');
  });
}

export async function offboardUser(context: ResolverContext, moderator: DbUser, { userId, rejections, removePermissions, messageHtml }: {
  userId: string;
  rejections: { collectionName: ReviewCollectionName; documentId: string; rejectedReason: string }[];
  removePermissions: boolean;
  messageHtml?: string;
}): Promise<void> {
  return withUserLock(userId, async () => {
    const user = await context.Users.findOne(userId);
    if (!user) {
      throw new Error('Invalid user ID');
    }
    for (const rejection of rejections) {
      await loadOwnedDocument(context, { userId, ...rejection });
      const data = { rejected: true, rejectedReason: rejection.rejectedReason };
      if (rejection.collectionName === 'Posts') {
        await updatePost({ data, selector: { _id: rejection.documentId } }, context);
      } else {
        await updateComment({ data, selector: { _id: rejection.documentId } }, context);
      }
    }

    await updateUser({
      data: {
        ...(removePermissions ? {
          postingDisabled: true,
          allCommentingDisabled: true,
          conversationsDisabled: true,
        } : {}),
        needsReview: false,
        reviewedByUserId: null,
        reviewedAt: user.reviewedAt ? new Date() : null,
      },
      selector: { _id: userId },
    }, context);
    await appendSunshineNote(moderator, userId, removePermissions
      ? 'SimpleMod: offboarded (disabled posting, commenting, and messaging)'
      : 'SimpleMod: removed from review queue (offboard review)');

    if (removePermissions) {
      await createModeratorAction({
        data: {
          userId,
          type: VOTING_DISABLED,
          endedAt: null,
        },
      }, context);
    }

    if (messageHtml) {
      await sendModeratorDm(context, moderator, {
        userId,
        title: removePermissions ? 'Your posting permissions have been restricted' : 'A note from the moderation team',
        messageHtml,
      });
    }
  });
}
