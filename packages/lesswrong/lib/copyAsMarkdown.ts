import moment from "moment";
import { postGetPageUrl } from "./collections/posts/helpers";
import { commentGetPageUrlFromIds } from "./collections/comments/helpers";
import { userGetProfileUrlFromSlug } from "./collections/users/helpers";

/**
 * Renders posts and comments as self-contained markdown documents, for copying
 * into an LLM. A comment is rendered with the post it's on and its ancestor
 * comments attached, so that the LLM has the context the comment was written
 * in.
 */

const UNKNOWN_AUTHOR = "[unknown author]";

/**
 * The unrolled parent chain of `CommentsMarkdownCopyWithParents` has a
 * differently-shaped type at every level. This is the recursive type it
 * approximates, so the chain can be walked with a loop.
 */
interface CommentWithAncestors extends CommentsMarkdownCopy {
  parentComment?: CommentWithAncestors | null
}

const formatTimestamp = (timestamp: Date | string | null | undefined): string | null => {
  if (!timestamp) return null;
  const parsed = moment.utc(timestamp);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm [UTC]") : null;
};

const authorName = (user: {displayName: string | null} | null | undefined): string =>
  user?.displayName ?? UNKNOWN_AUTHOR;

const formatAuthorLink = (user: {slug: string | null, displayName: string | null} | null): string => {
  if (!user?.slug) return authorName(user);
  return `[${authorName(user)}](${userGetProfileUrlFromSlug(user.slug, true)})`;
};

const formatAuthors = (post: PostsMarkdownCopy): string => {
  const authors = [post.user, ...(post.coauthors ?? [])].filter((user) => !!user);
  return authors.length ? authors.map(formatAuthorLink).join(", ") : UNKNOWN_AUTHOR;
};

/** Blank-line-separates sections, dropping any that came out empty. */
const joinSections = (sections: (string | null | undefined)[]): string =>
  sections.filter((section) => !!section?.trim()).join("\n\n");

export const postToMarkdown = (post: PostsMarkdownCopy): string => {
  const postedAt = formatTimestamp(post.postedAt);
  const metadata = [
    `- **Author:** ${formatAuthors(post)}`,
    postedAt && `- **Posted:** ${postedAt}`,
    `- **URL:** ${postGetPageUrl(post, true)}`,
    post.url && `- **Linkpost for:** ${post.url}`,
  ].filter((line) => !!line);

  return joinSections([
    `# ${post.title}`,
    metadata.join("\n"),
    post.contents?.markdown,
  ]);
};

const commentUrl = (comment: CommentsMarkdownCopy, postSlug: string | null | undefined): string =>
  commentGetPageUrlFromIds({
    postId: comment.postId,
    postSlug,
    commentId: comment._id,
    isAbsolute: true,
  });

const commentToMarkdownWithoutContext = (
  comment: CommentsMarkdownCopy,
  post: PostsMarkdownCopy | null | undefined,
  heading: string,
): string => {
  const postedAt = formatTimestamp(comment.postedAt);
  const metadata = [
    `- **Author:** ${formatAuthorLink(comment.user)}`,
    postedAt && `- **Posted:** ${postedAt}`,
    comment.postId && `- **URL:** ${commentUrl(comment, post?.slug)}`,
  ].filter((line) => !!line);

  return joinSections([
    heading,
    metadata.join("\n"),
    comment.contents?.markdown,
  ]);
};

/** Walks the parent chain, returning ancestors oldest-first. */
const getAncestorsChronologically = (comment: CommentWithAncestors): CommentsMarkdownCopy[] => {
  const ancestors: CommentsMarkdownCopy[] = [];
  let current = comment.parentComment;
  while (current) {
    ancestors.unshift(current);
    current = current.parentComment;
  }
  return ancestors;
};

export const commentToMarkdown = (comment: CommentsMarkdownCopyWithParents): string => {
  const post = comment.post;
  const ancestors = getAncestorsChronologically(comment);

  const heading = post
    ? `# Comment by ${authorName(comment.user)} on "${post.title}"`
    : `# Comment by ${authorName(comment.user)}`;
  const sections = [commentToMarkdownWithoutContext(comment, post, heading)];

  if (post || ancestors.length) {
    sections.push("Parent post and comments:");
  }

  if (post) {
    sections.push(`<parentPost>\n${postToMarkdown(post)}\n</parentPost>`);
  }

  if (ancestors.length) {
    const renderedAncestors = ancestors.map((ancestor, index) =>
      commentToMarkdownWithoutContext(
        ancestor,
        post,
        `## Parent comment ${index} by ${authorName(ancestor.user)}`,
      ),
    );
    sections.push(`<parentComments>\n${renderedAncestors.join("\n\n")}\n</parentComments>`);
  }

  return joinSections(sections);
};
