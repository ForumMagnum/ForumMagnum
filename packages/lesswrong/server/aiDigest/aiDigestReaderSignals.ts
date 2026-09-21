import Comments from "@/server/collections/comments/collection";
import Posts from "@/server/collections/posts/collection";
import ReadStatuses from "@/server/collections/readStatus/collection";
import Revisions from "@/server/collections/revisions/collection";
import Subscriptions from "@/server/collections/subscriptions/collection";
import UltraFeedEvents from "@/server/collections/ultraFeedEvents/collection";
import Users from "@/server/collections/users/collection";
import Votes from "@/server/collections/votes/collection";
import type { AiDigestThreadCommentRow } from "@/server/repos/CommentsRepo";

/**
 * Per-reader signals (reads, upvotes, see-less feedback, subscriptions,
 * replies) for the documents the AI digest is considering. These are simple
 * keyed lookups over a small ID set, so they are batched collection finds
 * merged in memory rather than SQL.
 */

type UpvoteStrength = "regular" | "strong";

export interface AiDigestCandidateAnnotationRow {
  postId: string;
  isSubscribedToAuthor: boolean;
  isRead: boolean;
  positivePreferenceStrength: UpvoteStrength | null;
  hasActiveSeeLess: boolean;
  recipientAuthored: boolean;
}

export interface AiDigestQuickTakeAnnotationRow {
  commentId: string;
  isSubscribedToAuthor: boolean;
  positivePreferenceStrength: UpvoteStrength | null;
  hasActiveSeeLess: boolean;
  recipientAuthored: boolean;
}

export interface AiDigestThreadCommentAnnotationRow {
  commentId: string;
  authoredByReader: boolean;
  positivePreferenceStrength: UpvoteStrength | null;
  newSinceLastVisit: boolean;
  seenInFeed: boolean;
  hasActiveSeeLess: boolean;
  onReaderAuthoredPost: boolean;
  replyToReaderComment: boolean;
}

export interface AiDigestPostInteractionRow {
  postId: string;
  title: string;
  author: string;
  publicationDate: Date;
  isRead: boolean;
  readAt: Date | null;
  positivePreferenceStrength: UpvoteStrength | null;
  positivePreferenceAt: Date | null;
}

export interface AiDigestQuickTakeInteractionRow {
  commentId: string;
  author: string;
  publicationDate: Date;
  revisionHtml: string;
  positivePreferenceStrength: UpvoteStrength | null;
  positivePreferenceAt: Date | null;
  repliedAt: Date | null;
}

interface ReaderUpvote {
  strength: UpvoteStrength;
  votedAt: Date;
}

interface ReaderReadStatus {
  /** The reader has a read record for the post. */
  isRead: boolean;
  /** The most recent read-status update, read or not. */
  lastUpdated: Date;
  /** When the reader most recently read the post, if they have. */
  readAt: Date | null;
}

/** The reader's live upvote on each document, strongest-most-recent wins. */
async function loadReaderUpvotes(
  userId: string,
  collectionName: "Posts" | "Comments",
  documentIds: string[],
): Promise<Map<string, ReaderUpvote>> {
  const byDocumentId = new Map<string, ReaderUpvote>();
  if (documentIds.length === 0) {
    return byDocumentId;
  }
  const votes = await Votes.find(
    {
      userId,
      collectionName,
      documentId: { $in: documentIds },
      voteType: { $in: ["smallUpvote", "bigUpvote"] },
      cancelled: false,
      isUnvote: false,
    },
    {},
    { documentId: 1, voteType: 1, votedAt: 1 },
  ).fetch();
  for (const vote of votes) {
    const previous = byDocumentId.get(vote.documentId);
    if (!previous || previous.votedAt < vote.votedAt) {
      byDocumentId.set(vote.documentId, {
        strength: vote.voteType === "bigUpvote" ? "strong" : "regular",
        votedAt: vote.votedAt,
      });
    }
  }
  return byDocumentId;
}

async function loadReaderReadStatuses(
  userId: string,
  postIds: string[],
): Promise<Map<string, ReaderReadStatus>> {
  const byPostId = new Map<string, ReaderReadStatus>();
  if (postIds.length === 0) {
    return byPostId;
  }
  const statuses = await ReadStatuses.find(
    { userId, postId: { $in: postIds } },
    {},
    { postId: 1, isRead: 1, lastUpdated: 1 },
  ).fetch();
  for (const status of statuses) {
    if (!status.postId) {
      continue;
    }
    const previous = byPostId.get(status.postId);
    const readAt = status.isRead ? status.lastUpdated : null;
    byPostId.set(status.postId, {
      isRead: (previous?.isRead ?? false) || status.isRead,
      lastUpdated: !previous || previous.lastUpdated < status.lastUpdated
        ? status.lastUpdated
        : previous.lastUpdated,
      readAt: !previous?.readAt || (readAt && previous.readAt < readAt) ? readAt : previous.readAt,
    });
  }
  return byPostId;
}

/** Documents the reader has un-cancelled "see less" feedback on. */
async function loadReaderActiveSeeLess(
  userId: string,
  collectionName: "Posts" | "Comments",
  documentIds: string[],
): Promise<Set<string>> {
  if (documentIds.length === 0) {
    return new Set();
  }
  const events = await UltraFeedEvents.find(
    { userId, collectionName, documentId: { $in: documentIds }, eventType: "seeLess" },
    {},
    { documentId: 1, event: 1 },
  ).fetch();
  return new Set(
    events
      .filter((event) => event.event?.cancelled !== true)
      .map((event) => event.documentId),
  );
}

/** Comments the reader has already viewed or expanded in the feed. */
async function loadReaderSeenInFeed(userId: string, commentIds: string[]): Promise<Set<string>> {
  if (commentIds.length === 0) {
    return new Set();
  }
  const events = await UltraFeedEvents.find(
    {
      userId,
      collectionName: "Comments",
      documentId: { $in: commentIds },
      eventType: { $in: ["viewed", "expanded"] },
    },
    {},
    { documentId: 1 },
  ).fetch();
  return new Set(events.map((event) => event.documentId));
}

export interface AiDigestSubscribedAuthorRow {
  authorId: string;
  authorName: string;
}

async function loadReaderSubscribedAuthorIds(userId: string): Promise<Set<string>> {
  const subscriptions = await Subscriptions.find(
    { userId, collectionName: "Users", state: "subscribed", deleted: false },
    {},
    { documentId: 1 },
  ).fetch();
  return new Set(subscriptions.flatMap((subscription) =>
    subscription.documentId ? [subscription.documentId] : []));
}

const AI_DIGEST_SUBSCRIBED_AUTHOR_LIMIT = 100;

/** Authors the reader follows, by display name. */
export async function loadReaderSubscribedAuthors(userId: string): Promise<AiDigestSubscribedAuthorRow[]> {
  const authorIds = Array.from(await loadReaderSubscribedAuthorIds(userId));
  const displayNamesById = await loadDisplayNamesById(authorIds);
  return authorIds
    .flatMap((authorId) => {
      const authorName = displayNamesById.get(authorId);
      return authorName ? [{ authorId, authorName }] : [];
    })
    .sort((first, second) =>
      first.authorName.localeCompare(second.authorName) || first.authorId.localeCompare(second.authorId))
    .slice(0, AI_DIGEST_SUBSCRIBED_AUTHOR_LIMIT);
}

/** The reader's earliest reply under each of the given comments. */
async function loadReaderReplyTimes(userId: string, commentIds: string[]): Promise<Map<string, Date>> {
  const byCommentId = new Map<string, Date>();
  if (commentIds.length === 0) {
    return byCommentId;
  }
  const targetIds = new Set(commentIds);
  const replies = await Comments.find(
    {
      userId,
      deleted: false,
      rejected: false,
      draft: { $ne: true },
      $or: [
        { topLevelCommentId: { $in: commentIds } },
        { parentCommentId: { $in: commentIds } },
      ],
    },
    {},
    { topLevelCommentId: 1, parentCommentId: 1, postedAt: 1 },
  ).fetch();
  for (const reply of replies) {
    for (const targetId of [reply.topLevelCommentId, reply.parentCommentId]) {
      if (!targetId || !targetIds.has(targetId) || !reply.postedAt) {
        continue;
      }
      const previous = byCommentId.get(targetId);
      if (!previous || reply.postedAt < previous) {
        byCommentId.set(targetId, reply.postedAt);
      }
    }
  }
  return byCommentId;
}

async function loadDisplayNamesById(userIds: Array<string | null | undefined>): Promise<Map<string, string>> {
  const ids = Array.from(new Set(userIds.flatMap((id) => (id ? [id] : []))));
  if (ids.length === 0) {
    return new Map();
  }
  const users = await Users.find({ _id: { $in: ids } }, {}, { displayName: 1 }).fetch();
  return new Map(users.flatMap((user) => (user.displayName ? [[user._id, user.displayName] as const] : [])));
}

/**
 * Plain-text byline for digest prompts: 'Anonymous' when the post hides its
 * author, otherwise the primary author's display name followed by any
 * coauthors in order.
 */
export function aiDigestPostByline(
  post: Pick<DbPost, "hideAuthor" | "userId" | "coauthorUserIds" | "author">,
  displayNamesById: Map<string, string>,
): string {
  if (post.hideAuthor) {
    return "Anonymous";
  }
  const primary = (post.userId && displayNamesById.get(post.userId))
    ?? post.author
    ?? "LessWrong contributor";
  const coauthors = (post.coauthorUserIds ?? []).flatMap((coauthorId) => {
    const name = displayNamesById.get(coauthorId);
    return name ? [name] : [];
  });
  return [primary, ...coauthors].join(", ");
}

function commentAuthorName(
  comment: Pick<DbComment, "userId" | "author">,
  displayNamesById: Map<string, string>,
): string {
  return (comment.userId && displayNamesById.get(comment.userId))
    ?? comment.author
    ?? "LessWrong contributor";
}

export async function annotateAiDigestPostCandidates({
  userId,
  posts,
}: {
  userId: string;
  posts: Array<{ postId: string; hideAuthor: boolean; ownerIds: string[] }>;
}): Promise<AiDigestCandidateAnnotationRow[]> {
  const postIds = posts.map((post) => post.postId);
  const [subscribedAuthorIds, readStatuses, upvotes, seeLess] = await Promise.all([
    loadReaderSubscribedAuthorIds(userId),
    loadReaderReadStatuses(userId, postIds),
    loadReaderUpvotes(userId, "Posts", postIds),
    loadReaderActiveSeeLess(userId, "Posts", postIds),
  ]);
  return posts.map((post) => ({
    postId: post.postId,
    isSubscribedToAuthor: !post.hideAuthor
      && post.ownerIds.some((ownerId) => subscribedAuthorIds.has(ownerId)),
    isRead: readStatuses.get(post.postId)?.isRead ?? false,
    positivePreferenceStrength: upvotes.get(post.postId)?.strength ?? null,
    hasActiveSeeLess: seeLess.has(post.postId),
    recipientAuthored: post.ownerIds.includes(userId),
  }));
}

export async function annotateAiDigestQuickTakes({
  userId,
  quickTakes,
}: {
  userId: string;
  quickTakes: Array<{ commentId: string; authorId: string | null }>;
}): Promise<AiDigestQuickTakeAnnotationRow[]> {
  const commentIds = quickTakes.map((quickTake) => quickTake.commentId);
  const [subscribedAuthorIds, upvotes, seeLess] = await Promise.all([
    loadReaderSubscribedAuthorIds(userId),
    loadReaderUpvotes(userId, "Comments", commentIds),
    loadReaderActiveSeeLess(userId, "Comments", commentIds),
  ]);
  return quickTakes.map((quickTake) => ({
    commentId: quickTake.commentId,
    isSubscribedToAuthor: !!quickTake.authorId && subscribedAuthorIds.has(quickTake.authorId),
    positivePreferenceStrength: upvotes.get(quickTake.commentId)?.strength ?? null,
    hasActiveSeeLess: seeLess.has(quickTake.commentId),
    recipientAuthored: quickTake.authorId === userId,
  }));
}

/**
 * Reader annotations for thread comments: authorship, upvotes, unseen-ness
 * relative to the post's read status, feed viewed/expanded suppression,
 * see-less feedback, and the notification-covered relationships that make a
 * comment ineligible as a thread anchor.
 */
export async function annotateAiDigestThreadComments({
  userId,
  comments,
}: {
  userId: string;
  comments: AiDigestThreadCommentRow[];
}): Promise<AiDigestThreadCommentAnnotationRow[]> {
  const commentIds = comments.map((comment) => comment.commentId);
  const postIds = Array.from(new Set(comments.flatMap((comment) => (comment.postId ? [comment.postId] : []))));
  const parentIds = Array.from(new Set(comments.flatMap((comment) =>
    (comment.parentCommentId ? [comment.parentCommentId] : []))));
  const [upvotes, readStatuses, seenInFeed, seeLess, posts, parents] = await Promise.all([
    loadReaderUpvotes(userId, "Comments", commentIds),
    loadReaderReadStatuses(userId, postIds),
    loadReaderSeenInFeed(userId, commentIds),
    loadReaderActiveSeeLess(userId, "Comments", commentIds),
    postIds.length > 0
      ? Posts.find({ _id: { $in: postIds } }, {}, { userId: 1, coauthorUserIds: 1 }).fetch()
      : Promise.resolve([]),
    parentIds.length > 0
      ? Comments.find({ _id: { $in: parentIds } }, {}, { userId: 1 }).fetch()
      : Promise.resolve([]),
  ]);
  const postsById = new Map(posts.map((post) => [post._id, post]));
  const parentsById = new Map(parents.map((parent) => [parent._id, parent]));
  return comments.map((comment) => {
    const readStatus = comment.postId ? readStatuses.get(comment.postId) : undefined;
    const post = comment.postId ? postsById.get(comment.postId) : undefined;
    const parent = comment.parentCommentId ? parentsById.get(comment.parentCommentId) : undefined;
    return {
      commentId: comment.commentId,
      authoredByReader: comment.authorId === userId,
      positivePreferenceStrength: upvotes.get(comment.commentId)?.strength ?? null,
      newSinceLastVisit: !!readStatus?.isRead && comment.publicationDate > readStatus.lastUpdated,
      seenInFeed: seenInFeed.has(comment.commentId),
      hasActiveSeeLess: seeLess.has(comment.commentId),
      onReaderAuthoredPost: !!post
        && (post.userId === userId || (post.coauthorUserIds ?? []).includes(userId)),
      replyToReaderComment: !!parent && parent.userId === userId,
    };
  });
}

/** How the reader has since interacted with posts recommended in past issues. */
export async function loadAiDigestPostInteractions({
  userId,
  postIds,
}: {
  userId: string;
  postIds: string[];
}): Promise<AiDigestPostInteractionRow[]> {
  if (postIds.length === 0) {
    return [];
  }
  const posts = await Posts.find(
    { _id: { $in: postIds } },
    {},
    { title: 1, hideAuthor: 1, userId: 1, coauthorUserIds: 1, author: 1, postedAt: 1 },
  ).fetch();
  const [displayNamesById, readStatuses, upvotes] = await Promise.all([
    loadDisplayNamesById(posts.flatMap((post) => [post.userId, ...(post.coauthorUserIds ?? [])])),
    loadReaderReadStatuses(userId, postIds),
    loadReaderUpvotes(userId, "Posts", postIds),
  ]);
  return posts.flatMap((post) => {
    if (!post.postedAt) {
      return [];
    }
    const readStatus = readStatuses.get(post._id);
    const upvote = upvotes.get(post._id);
    return [{
      postId: post._id,
      title: post.title,
      author: aiDigestPostByline(post, displayNamesById),
      publicationDate: post.postedAt,
      isRead: readStatus?.isRead ?? false,
      readAt: readStatus?.readAt ?? null,
      positivePreferenceStrength: upvote?.strength ?? null,
      positivePreferenceAt: upvote?.votedAt ?? null,
    }];
  });
}

/** How the reader has since interacted with quick takes recommended in past issues. */
export async function loadAiDigestQuickTakeInteractions({
  userId,
  commentIds,
}: {
  userId: string;
  commentIds: string[];
}): Promise<AiDigestQuickTakeInteractionRow[]> {
  if (commentIds.length === 0) {
    return [];
  }
  const comments = await Comments.find(
    { _id: { $in: commentIds } },
    {},
    { userId: 1, author: 1, postedAt: 1, contents_latest: 1 },
  ).fetch();
  const revisionIds = comments.flatMap((comment) => (comment.contents_latest ? [comment.contents_latest] : []));
  const [revisions, displayNamesById, upvotes, replyTimes] = await Promise.all([
    revisionIds.length > 0
      ? Revisions.find({ _id: { $in: revisionIds } }, {}, { html: 1 }).fetch()
      : Promise.resolve([]),
    loadDisplayNamesById(comments.map((comment) => comment.userId)),
    loadReaderUpvotes(userId, "Comments", commentIds),
    loadReaderReplyTimes(userId, commentIds),
  ]);
  const htmlByRevisionId = new Map(revisions.map((revision) => [revision._id, revision.html ?? ""]));
  return comments.flatMap((comment) => {
    const revisionHtml = comment.contents_latest ? htmlByRevisionId.get(comment.contents_latest) : undefined;
    if (!comment.postedAt || revisionHtml === undefined) {
      return [];
    }
    const upvote = upvotes.get(comment._id);
    return [{
      commentId: comment._id,
      author: commentAuthorName(comment, displayNamesById),
      publicationDate: comment.postedAt,
      revisionHtml,
      positivePreferenceStrength: upvote?.strength ?? null,
      positivePreferenceAt: upvote?.votedAt ?? null,
      repliedAt: replyTimes.get(comment._id) ?? null,
    }];
  });
}
