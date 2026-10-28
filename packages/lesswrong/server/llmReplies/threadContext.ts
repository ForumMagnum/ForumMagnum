import uniq from "lodash/uniq";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { siteUrlSetting, type ForumTypeString } from "@/lib/instanceSettings";
import { combineUrls } from "@/lib/vulcan-lib/utils";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { getCommentAncestorIds } from "@/server/utils/commentTreeUtils";
import { getLatestContentsRevision } from "@/server/collections/revisions/helpers";
import { commentIsPubliclyVisible } from "@/server/permissions/accessFilters";
import { loadLlmContextImages, type LlmContextImage } from "@/server/languageModels/llmContextImages";
import { cheerioParse } from "@/server/utils/htmlUtil";

const MAX_CONTEXT_IMAGES = 20;

interface ThreadContext {
  contextMessage: string,
  contextImages: LlmContextImage[],
}

interface ThreadCommentSection {
  markdown: string,
  imageUrls: string[],
}

export async function buildThreadContext(post: DbPost, triggerComment: DbComment, context: ResolverContext): Promise<ThreadContext> {
  const { forumType } = context;
  const [postAuthor, postRevision] = await Promise.all([
    loadUser(post.userId, context),
    getLatestContentsRevision(post, context),
  ]);
  if (post.contents_latest && !postRevision) {
    throw new Error(`Revision ${post.contents_latest} of post ${post._id} doesn't exist`);
  }
  const postUrl = combineUrls(siteUrlSetting.get(forumType), postGetPageUrl(post));
  const postHtml = postRevision?.html ?? "";

  const ancestorIds = (await getCommentAncestorIds(triggerComment)).reverse();
  const ancestors = await Promise.all(ancestorIds.map((commentId) => loadComment(commentId, context)));
  const ancestorSections = await Promise.all(ancestors.map((comment) => formatThreadComment(comment, context)));
  const commentSections = [...ancestorSections, await formatThreadComment(triggerComment, context, "the comment that mentioned you")];

  const sectionImageUrls = [getImageUrls(postHtml), ...commentSections.map(({ imageUrls }) => imageUrls)];
  const imageUrls = uniq(sectionImageUrls.flat());
  const imageUrlsByPriority = uniq([...sectionImageUrls].reverse().flat());
  const includedImageUrls = new Set(imageUrlsByPriority.slice(0, MAX_CONTEXT_IMAGES));
  const contextImages = await loadLlmContextImages(imageUrls.filter((url) => includedImageUrls.has(url)));
  const imageCapNote = imageUrls.length > MAX_CONTEXT_IMAGES
    ? [`${contextImages.length} of the ${imageUrls.length} images in the post and thread are attached below.`]
    : [];

  const contextMessage = [
    `# Post: ${post.title}`,
    `By ${formatAuthor(postAuthor, forumType)}, ${formatDate(post.postedAt)}. ${postUrl}`,
    "",
    htmlToMarkdown(postHtml),
    "",
    "# Thread",
    ...commentSections.map(({ markdown }) => markdown),
    ...imageCapNote,
  ].join("\n");
  return { contextMessage, contextImages };
}

async function formatThreadComment(comment: DbComment, context: ResolverContext, label?: string): Promise<ThreadCommentSection> {
  if (!(await commentIsPubliclyVisible(comment, context))) {
    return { markdown: "## [comment not publicly visible]\n", imageUrls: [] };
  }
  const author = await loadUser(comment.userId, context);
  const heading = `## ${formatAuthor(author, context.forumType)}, ${formatDate(comment.postedAt)}, ${comment.baseScore} karma`;
  const html = comment.contents?.html ?? "";
  const markdown = [
    label ? `${heading}: ${label}` : heading,
    htmlToMarkdown(html),
    "",
  ].join("\n");
  return { markdown, imageUrls: getImageUrls(html) };
}

function getImageUrls(html: string): string[] {
  const $ = cheerioParse(html);
  return $("img").toArray()
    .flatMap((img) => $(img).attr("src") ?? [])
    .filter((src) => /^https?:\/\//i.test(src));
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
