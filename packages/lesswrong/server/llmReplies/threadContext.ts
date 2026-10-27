import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { siteUrlSetting, type ForumTypeString } from "@/lib/instanceSettings";
import { combineUrls } from "@/lib/vulcan-lib/utils";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { getCommentAncestorIds } from "@/server/utils/commentTreeUtils";
import { getLatestContentsRevision } from "@/server/collections/revisions/helpers";
import { commentIsPubliclyVisible } from "@/server/permissions/accessFilters";

export async function buildThreadContextMessage(post: DbPost, triggerComment: DbComment, context: ResolverContext): Promise<string> {
  const { forumType } = context;
  const [postAuthor, postRevision] = await Promise.all([
    loadUser(post.userId, context),
    getLatestContentsRevision(post, context),
  ]);
  if (post.contents_latest && !postRevision) {
    throw new Error(`Revision ${post.contents_latest} of post ${post._id} doesn't exist`);
  }
  const postUrl = combineUrls(siteUrlSetting.get(forumType), postGetPageUrl(post));

  const ancestorIds = (await getCommentAncestorIds(triggerComment)).reverse();
  const ancestors = await Promise.all(ancestorIds.map((commentId) => loadComment(commentId, context)));
  const ancestorSections = await Promise.all(ancestors.map((comment) => formatThreadComment(comment, context)));

  return [
    `# Post: ${post.title}`,
    `By ${formatAuthor(postAuthor, forumType)}, ${formatDate(post.postedAt)}. ${postUrl}`,
    "",
    htmlToMarkdown(postRevision?.html ?? ""),
    "",
    "# Thread",
    ...ancestorSections,
    await formatThreadComment(triggerComment, context, "the comment that mentioned you"),
  ].join("\n");
}

async function formatThreadComment(comment: DbComment, context: ResolverContext, label?: string): Promise<string> {
  if (!(await commentIsPubliclyVisible(comment, context))) {
    return "## [comment not publicly visible]\n";
  }
  const author = await loadUser(comment.userId, context);
  const heading = `## ${formatAuthor(author, context.forumType)}, ${formatDate(comment.postedAt)}, ${comment.baseScore} karma`;
  return [
    label ? `${heading}: ${label}` : heading,
    htmlToMarkdown(comment.contents?.html ?? ""),
    "",
  ].join("\n");
}

async function loadComment(commentId: string, context: ResolverContext): Promise<DbComment> {
  const comment = await context.loaders.Comments.load(commentId);
  if (!comment) {
    throw new Error(`Comment ${commentId} in the thread doesn't exist`);
  }
  return comment;
}

async function loadUser(userId: string, context: ResolverContext): Promise<DbUser> {
  const user = await context.loaders.Users.load(userId);
  if (!user) {
    throw new Error(`User ${userId} doesn't exist`);
  }
  return user;
}

function formatAuthor(user: DbUser, forumType: ForumTypeString): string {
  return `${userGetDisplayName(user, forumType)} (user slug: ${user.slug})`;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
