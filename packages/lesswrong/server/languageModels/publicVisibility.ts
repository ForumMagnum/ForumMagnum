import { commentIsNotPublicForAnyReason } from "@/lib/collections/comments/helpers";
import { postIsPublic } from "@/lib/collections/posts/helpers";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";

/**
 * What our models write is public, so a model may only see content that a
 * logged-out visitor could see. Everything a model reads from our database (as
 * opposed to through the public Markdown API, which is already served to
 * logged-out visitors) must pass these checks.
 */
export async function postIsPubliclyVisible(post: DbPost, context: ResolverContext): Promise<boolean> {
  if (!postIsPublic(post) || post.rejected) {
    return false;
  }
  const anonymousContext = createAnonymousContext({ forumType: context.forumType });
  return !!(await accessFilterSingle(null, "Posts", post, anonymousContext));
}

/** Only comments on posts can be publicly visible here; wiki/tag comments aren't supported yet */
export async function commentIsPubliclyVisible(comment: DbComment, context: ResolverContext): Promise<boolean> {
  if (commentIsNotPublicForAnyReason(comment, context.forumType) || !comment.postId) {
    return false;
  }
  const post = await context.loaders.Posts.load(comment.postId);
  return !!post && await postIsPubliclyVisible(post, context);
}
