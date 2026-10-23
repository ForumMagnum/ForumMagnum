import * as fs from "node:fs";
import * as path from "node:path";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { siteUrlSetting, type ForumTypeString } from "@/lib/instanceSettings";
import { combineUrls } from "@/lib/vulcan-lib/utils";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { getCommentAncestorIds } from "@/server/utils/commentTreeUtils";
import { getLatestContentsRevision } from "@/server/collections/revisions/helpers";
import { commentIsPubliclyVisible } from "@/server/languageModels/publicVisibility";

// Shipped with the build via `outputFileTracingIncludes` in next.config.ts
const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "packages/lesswrong/server/llmReplies/systemPrompt.md");

/** The system prompt every model gets for comment replies. Each run stores the text it used. */
export function readLlmReplySystemPrompt(): string {
  return fs.readFileSync(SYSTEM_PROMPT_PATH, "utf8");
}

/**
 * The message a model is given up front: the post, then the chain of comments
 * from the top of the thread down to the comment that mentioned it.
 */
export async function buildThreadContextMessage(post: DbPost, triggerComment: DbComment, context: ResolverContext): Promise<string> {
  const { forumType, loaders } = context;
  const [postAuthor, postRevision] = await Promise.all([
    loaders.Users.load(post.userId),
    getLatestContentsRevision(post, context),
  ]);
  const postUrl = combineUrls(siteUrlSetting.get(forumType), postGetPageUrl(post));

  // getCommentAncestorIds returns the parent first; the thread reads top-down
  const ancestorIds = (await getCommentAncestorIds(triggerComment)).reverse();
  const ancestors = await Promise.all(ancestorIds.map((commentId) => loaders.Comments.load(commentId)));
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

async function formatThreadComment(comment: DbComment | null, context: ResolverContext, label?: string): Promise<string> {
  if (!comment || !(await commentIsPubliclyVisible(comment, context))) {
    return "## [comment not publicly visible]\n";
  }
  const author = await context.loaders.Users.load(comment.userId);
  const heading = `## ${formatAuthor(author, context.forumType)}, ${formatDate(comment.postedAt)}, ${comment.baseScore} karma`;
  return [
    label ? `${heading}: ${label}` : heading,
    htmlToMarkdown(comment.contents?.html ?? ""),
    "",
  ].join("\n");
}

/** Includes the slug, which the model needs to search one author's writing */
function formatAuthor(user: DbUser | null, forumType: ForumTypeString): string {
  return user ? `${userGetDisplayName(user, forumType)} (user slug: ${user.slug})` : "[unknown user]";
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
