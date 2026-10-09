import { userOwns } from "@/lib/vulcan-users/permissions";
import { getReasonIdsMatchingRejection } from "@/lib/collections/rejectionAppeals/appealReasons";

export interface AppealTarget {
  postId?: string | null;
  commentId?: string | null;
}

export async function getRejectionReview({ postId, commentId }: AppealTarget, context: ResolverContext) {
  const { currentUser, Posts, Comments, RejectionAppeals, ModerationTemplates } = context;
  if (!currentUser) throw new Error("Please log in to request a rejection review.");
  if (!!postId === !!commentId) throw new Error("Choose one post or comment to review.");

  const post = postId ? await Posts.findOne(postId) : null;
  const comment = commentId ? await Comments.findOne(commentId) : null;
  const document = post ?? comment;
  if (!document || !userOwns(currentUser, document)) {
    throw new Error("We couldn't find your post or comment from this link.");
  }

  const appeal = await RejectionAppeals.findOne(postId ? { postId } : { commentId });
  const unavailableReason = appeal ? null
    : !document.rejected ? "This content is not rejected."
    : !document.rejectionConversationId ? "This rejection does not have a review thread. Please contact the moderators."
    : null;
  const templates = await ModerationTemplates.find({ collectionName: "Rejections", deleted: false }).fetch();
  const reasonIds = appeal?.reasonIds ?? getReasonIdsMatchingRejection(document.rejectedReason, templates);
  return { post, comment, appeal, reasonIds, unavailableReason };
}
