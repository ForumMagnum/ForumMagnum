import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import type { AiDigestEmailComment, AiDigestEmailPost } from "@/lib/generated/gql-codegen/graphql";
import { aiDigestPresentation } from "./aiDigestPresentation";
import { truncate } from "@/lib/editor/ellipsize";
import { htmlToTextDefault } from "@/lib/htmlToText";

/** Collapses runs of whitespace (including newlines) to single spaces and trims the ends. */
export function collapseAiDigestWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function truncateAiDigestText(text: string, maxLength: number): string {
  const normalizedText = collapseAiDigestWhitespace(text);
  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  const initialSlice = normalizedText.slice(0, maxLength - 1);
  const lastCompleteWord = initialSlice.replace(/\s+\S*$/, "");
  return `${lastCompleteWord || initialSlice}…`;
}

interface AiDigestPreview {
  html: string;
  /** The plaintext of `html`, so callers can count the words already shown. */
  text: string;
}

/**
 * Trim a cleaned post preview to a placement's html budget. Truncation is
 * html-aware, so the result closes any tags it opened.
 */
export function buildAiDigestPreview(
  previewHtml: string,
  maxHtmlLength: number,
): AiDigestPreview {
  const html = truncate(previewHtml, maxHtmlLength, "characters", "…", false);
  return { html, text: htmlToTextDefault(html) };
}

export function countAiDigestWords(text: string): number {
  const normalizedText = collapseAiDigestWhitespace(text);
  return normalizedText ? normalizedText.split(" ").length : 0;
}

const AI_DIGEST_MAX_BYLINE_AUTHORS = 3;

interface AiDigestBylineAuthor {
  displayName: string;
}

/**
 * Comma-separated author byline, capped at AI_DIGEST_MAX_BYLINE_AUTHORS names
 * with "et al." standing in for the rest. Emails are static HTML, so this is a
 * count-based cap rather than the width-measuring TruncatedAuthorsList used on
 * post lists.
 */
export function formatAiDigestPostAuthors(post: {
  user: AiDigestBylineAuthor | null;
  coauthors: AiDigestBylineAuthor[] | null;
}): string {
  const authors = [post.user, ...(post.coauthors ?? [])].flatMap((author) =>
    author?.displayName ? [author.displayName] : [],
  );
  const displayed = authors.slice(0, AI_DIGEST_MAX_BYLINE_AUTHORS).join(", ");
  return authors.length > AI_DIGEST_MAX_BYLINE_AUTHORS ? `${displayed} et al.` : displayed;
}

export function formatAiDigestDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

interface AiDigestThreadCommentFields {
  _id: string;
  parentCommentId: string | null;
  postedAt: string;
}

export interface AiDigestThreadCandidate<T extends AiDigestThreadCommentFields> {
  comment: T;
}

export interface AiDigestThreadNode<T extends AiDigestThreadCommentFields> {
  comment: T;
  replies: AiDigestThreadNode<T>[];
}

function compareThreadCandidatesByDate<T extends AiDigestThreadCommentFields>(
  firstCandidate: AiDigestThreadCandidate<T>,
  secondCandidate: AiDigestThreadCandidate<T>,
): number {
  return new Date(firstCandidate.comment.postedAt).getTime()
    - new Date(secondCandidate.comment.postedAt).getTime();
}

/**
 * Arrange selected thread comments into a reply tree under the given root
 * comment. Comments whose parent isn't part of the selection have nowhere to
 * attach and are dropped.
 */
export function buildAiDigestThreadTree<T extends AiDigestThreadCommentFields>(
  parentCommentId: string,
  comments: AiDigestThreadCandidate<T>[],
): AiDigestThreadNode<T>[] {
  const directReplies = comments
    .filter(({ comment }) => comment.parentCommentId === parentCommentId)
    .sort(compareThreadCandidatesByDate);
  const remainingComments = comments.filter(
    ({ comment }) => comment.parentCommentId !== parentCommentId,
  );
  return directReplies.map(({ comment }) => ({
    comment,
    replies: buildAiDigestThreadTree(comment._id, remainingComments),
  }));
}

export interface DigestContentLookup {
  postsById: Map<string, AiDigestEmailPost>;
  commentsById: Map<string, AiDigestEmailComment>;
}

export function itemKey(item: AiDigestItem): string {
  return `${item.documentRef.documentType}:${item.documentRef.documentId}`;
}

export function postReadMoreLabel(post: AiDigestEmailPost, displayedExcerpt: string): string {
  const wordCount = post.contents?.wordCount;
  if (!wordCount) {
    return "Read more";
  }
  const remainingWordCount = Math.max(0, wordCount - countAiDigestWords(displayedExcerpt));
  if (!remainingWordCount) {
    return "Read more";
  }
  const wordLabel = remainingWordCount === 1 ? "word" : "words";
  return `Read more (${remainingWordCount.toLocaleString("en-US")} ${wordLabel})`;
}

export function getCommentUrl(comment: AiDigestEmailComment): string {
  return commentGetPageUrlFromIds({
    postId: comment.post?._id,
    postSlug: comment.post?.slug,
    tagSlug: comment.tag?.slug,
    tagCommentType: comment.tagCommentType,
    commentId: comment._id,
  });
}

interface ThreadTitle {
  // Rendered lighter than the subject it introduces, when there is one.
  prefix: string | null;
  subject: string;
}

export function threadTitle(comment: AiDigestEmailComment): ThreadTitle {
  if (comment.shortform) {
    const author = comment.user?.displayName ?? "A LessWrong reader";
    return { prefix: null, subject: `${author}’s quick take` };
  }
  if (comment.post) {
    return { prefix: "Comments on", subject: `“${comment.post.title}”` };
  }
  if (comment.tag) {
    return { prefix: "Comments on", subject: comment.tag.name };
  }
  return { prefix: null, subject: "Comments" };
}

export function discussionCommentMaxLength(
  commentId: string,
  anchorCommentId: string,
  contextCommentIds: string[],
): number {
  if (commentId === anchorCommentId) {
    return aiDigestPresentation.excerptCharacters.discussionRoot;
  }
  return contextCommentIds.includes(commentId)
    ? aiDigestPresentation.excerptCharacters.discussionContext
    : aiDigestPresentation.excerptCharacters.discussionReply;
}

export function aiDigestContentIds(spec: AiDigestSpec) {
  const items = spec.sections.flatMap((section) => section.items);
  const postIds = items.flatMap((item) =>
    item.documentRef.documentType === "post" ? [item.documentRef.documentId] : [],
  );
  const commentIds = items.flatMap((item) => [
    ...(item.documentRef.documentType === "post" ? [] : [item.documentRef.documentId]),
    ...(item.contextComments ?? []).map(({ commentId }) => commentId),
    ...(item.threadComments ?? []).map(({ commentId }) => commentId),
  ]);

  return { postIds, commentIds };
}

export function aiDigestDiscussionThread(
  item: AiDigestItem,
  comment: AiDigestEmailComment,
  content: DigestContentLookup,
) {
  const candidateThreadComments = (item.threadComments ?? []).flatMap(({ commentId }) => {
    const threadComment = content.commentsById.get(commentId);
    return threadComment ? [{ comment: threadComment }] : [];
  });
  const contextCommentSpecs = item.contextComments ?? [];
  const contextComments = contextCommentSpecs.flatMap(({ commentId }) => {
    const contextComment = content.commentsById.get(commentId);
    return contextComment ? [{ comment: contextComment }] : [];
  });
  const hasCompleteContext = contextCommentSpecs.length > 0
    && contextComments.length === contextCommentSpecs.length;
  const rootComment = hasCompleteContext ? contextComments[0].comment : comment;
  const descendantComments = hasCompleteContext
    ? [
      ...contextComments.slice(1),
      { comment },
      ...candidateThreadComments,
    ]
    : candidateThreadComments;
  const threadReplies = buildAiDigestThreadTree(rootComment._id, descendantComments);
  const contextCommentIds = hasCompleteContext
    ? contextCommentSpecs.map(({ commentId }) => commentId)
    : [];
  return { rootComment, threadReplies, contextCommentIds };
}
