import { userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";
import { getReasonIdsMatchingRejection } from "@/lib/collections/rejectionAppeals/appealReasons";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";
import { isTeamInboxConversation, sendMessageAs } from "@/server/utils/teamInbox";
import { getAdminTeamAccount, getAdminTeamAccountId } from "@/server/utils/adminTeamAccount";

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

function getAppealLinkReplyHtml(appealUrl: string) {
  return `<p>Thanks for your message. If you'd like us to take a second look at this rejection, please use our <a href="${appealUrl}">rejection review form</a>. We aim to complete reviews within 72 hours. If you have a question about a separate matter, please use Intercom (bottom right button on LessWrong pages) or email team@lesswrong.com</p>`;
}

async function getUnappealedRejectedContent(conversationId: string, userId: string, context: ResolverContext) {
  const { Posts, Comments, RejectionAppeals } = context;
  const selector = { userId, rejected: true, rejectionConversationId: conversationId };
  const post = await Posts.findOne(selector, undefined, { _id: 1 });
  const comment = post ? null : await Comments.findOne(selector, undefined, { _id: 1 });
  const target = post ? { postId: post._id } : comment ? { commentId: comment._id } : null;
  if (!target || await RejectionAppeals.findOne(target)) {
    return null;
  }
  return target;
}

/**
 * When a user first replies to a rejection message, reply from the team
 * account with a link to the appeal page for the rejected content.
 */
export async function sendAppealLinkReplyIfFirstReply(message: DbMessage, context: ResolverContext) {
  const { Messages, loaders } = context;
  const conversation = await loaders.Conversations.load(message.conversationId);
  if (!conversation || !await isTeamInboxConversation(conversation, context)) return;

  const sender = await loaders.Users.load(message.userId);
  if (userIsAdminOrMod(sender) || message.userId === await getAdminTeamAccountId(context)) return;

  const senderMessageCount = await Messages.find({ conversationId: conversation._id, userId: message.userId }).count();
  if (senderMessageCount > 1) return;

  const target = await getUnappealedRejectedContent(conversation._id, message.userId, context);
  const teamAccount = await getAdminTeamAccount(context);
  if (!target || !teamAccount) return;

  const appealPath = 'postId' in target ? `/rejection-review?postId=${target.postId}` : `/rejection-review?commentId=${target.commentId}`;
  await sendMessageAs({
    author: teamAccount,
    conversationId: conversation._id,
    html: getAppealLinkReplyHtml(makeAbsolute(appealPath, context)),
    noEmail: false,
    context,
  });
}
