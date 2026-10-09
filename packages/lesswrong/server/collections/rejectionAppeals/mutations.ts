import schema from "@/lib/collections/rejectionAppeals/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { escapeHtml } from "@/lib/utils/sanitize";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getDocumentId, makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { insertAndReturnDocument, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { updatePost } from "@/server/collections/posts/mutations";
import { updateComment } from "@/server/collections/comments/mutations";
import { sendMessageAs } from "@/server/utils/teamInbox";
import { getAdminTeamAccount } from "@/server/utils/adminTeamAccount";
import { updateConversation } from "@/server/collections/conversations/mutations";
import { createHash } from "crypto";
import { isPostgresUniqueViolation } from "@/server/utils/postgresErrors";
import { getRejectionReview, type AppealTarget } from "./helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { commentGetPageUrlFromDB } from "@/lib/collections/comments/helpers";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";
import gql from "graphql-tag";

function explanationToHtml(explanation: string) {
  return explanation
    .split(/\n\s*\n/)
    .map(paragraph => `<p>${escapeHtml(paragraph.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

async function getAppealedContentLinkHtml({ postId, commentId }: AppealTarget, context: ResolverContext) {
  if (postId) {
    const post = await context.loaders.Posts.load(postId);
    return `post, <a href="${makeAbsolute(postGetPageUrl(post), context)}">${escapeHtml(post.title)}</a>`;
  }
  if (commentId) {
    const comment = await context.loaders.Comments.load(commentId);
    return `<a href="${makeAbsolute(await commentGetPageUrlFromDB(comment, context), context)}">comment</a>`;
  }
  return "content";
}

function getAppealResolvedHtml(status: "approved" | "denied", contentType: "post" | "comment") {
  if (status === "approved") {
    return [
      `<p>Good news: we've reviewed the rejection of your ${contentType} and reversed it. Thanks for taking the time to explain.</p>`,
      `<p>Your ${contentType} is now back in the queue for new users' content, and a moderator will review it shortly.</p>`,
    ].join("");
  }
  return [
    `<p>We've reviewed the rejection of your ${contentType}, and we're keeping the original decision. We know this is disappointing, and we appreciate you taking the time to explain your view.</p>`,
    `<p>If a moderator has anything to add, they'll reply here. A rejection isn't a ban, and you're welcome to submit something new later.</p>`,
  ].join("");
}

function getAppealSummaryHtml({ contentLinkHtml, explanation }: {
  contentLinkHtml: string,
  explanation: string,
}) {
  return [
    `<p><strong>Rejection review requested</strong> for my ${contentLinkHtml}.</p>`,
    `<p><strong>Why I think the rejection was a mistake:</strong></p>`,
    explanationToHtml(explanation),
  ].join("");
}

async function sendAppealMessage(appeal: DbRejectionAppeal, kind: "submission" | "outcome", author: DbUser, html: string, context: ResolverContext) {
  const messageId = createHash("sha256").update(`rejection-appeal:${appeal._id}:${kind}`).digest("hex").slice(0, 27);
  if (await context.Messages.findOne(messageId)) return;
  try {
    await sendMessageAs({ author, conversationId: appeal.conversationId, html, noEmail: false, context, messageId });
  } catch (error) {
    if (!isPostgresUniqueViolation(error) || !await context.Messages.findOne(messageId)) throw error;
  }
}

export async function createRejectionAppeal({ data }: CreateRejectionAppealInput, context: ResolverContext) {
  const { currentUser, RejectionAppeals } = context;
  if (!currentUser) throw new Error("You must be logged in to request a rejection review");
  const review = await getRejectionReview(data, context);
  if (review.unavailableReason) throw new Error(review.unavailableReason);
  const document = review.post ?? review.comment;
  if (!document?.rejectionConversationId) throw new Error("Only content with a rejection message can be reviewed");
  const explanation = data.explanation.trim();
  if (!explanation) throw new Error("Please explain why you think the rejection was a mistake");

  let appeal = review.appeal;
  if (!appeal) {
    try {
      appeal = await insertAndReturnDocument({
        userId: currentUser._id,
        postId: review.post?._id ?? null,
        commentId: review.comment?._id ?? null,
        conversationId: document.rejectionConversationId,
        explanation,
        reasonIds: review.reasonIds,
        acknowledgedMisunderstandings: review.reasonIds.length > 0 && data.acknowledgedMisunderstandings,
        status: "open",
        resolvedByUserId: null,
        resolvedAt: null,
      }, 'RejectionAppeals', context);
    } catch (error) {
      if (!isPostgresUniqueViolation(error)) throw error;
      appeal = await RejectionAppeals.findOne(data.postId ? { postId: data.postId } : { commentId: data.commentId });
      if (!appeal) throw error;
    }
  }

  await sendAppealMessage(appeal, "submission", currentUser, getAppealSummaryHtml({
    contentLinkHtml: await getAppealedContentLinkHtml(appeal, context),
    explanation: appeal.explanation,
  }), context);
  return appeal;
}

export async function updateRejectionAppeal({ selector, data }: UpdateRejectionAppealInput, context: ResolverContext) {
  const { currentUser, RejectionAppeals } = context;
  if (!currentUser || !userIsAdminOrMod(currentUser)) throw new Error("Only moderators can resolve a review");
  const { status } = data;
  if (status !== "approved" && status !== "denied") throw new Error("Choose whether to approve or deny the review");
  const _id = getDocumentId(selector);
  const teamAccount = await getAdminTeamAccount(context);
  if (!teamAccount) throw new Error("Couldn't find the admin team account");

  // Claim the decision once; resolvedAt records completion so failed work remains in the queue and can be retried.
  await RejectionAppeals.rawUpdateOne({ _id, status: "open" }, { $set: { status, resolvedByUserId: currentUser._id } });
  const appeal = await RejectionAppeals.findOne(_id);
  if (!appeal) throw new Error("Review not found");
  if (appeal.status !== status) throw new Error("Another moderator has already chosen a different outcome. Reload this conversation.");
  if (appeal.resolvedAt) return appeal;

  if (status === "approved") {
    const unrejected = { rejected: false, rejectedReason: null };
    if (appeal.postId) {
      await updatePost({ data: unrejected, selector: { _id: appeal.postId } }, context);
    } else if (appeal.commentId) {
      await updateComment({ data: unrejected, selector: { _id: appeal.commentId } }, context);
    }
  }
  await sendAppealMessage(appeal, "outcome", teamAccount,
    getAppealResolvedHtml(status, appeal.postId ? "post" : "comment"), context);
  await updateConversation({ data: { awaitingModeratorReply: false }, selector: { _id: appeal.conversationId } }, context);
  return await updateAndReturnDocument({ resolvedAt: new Date() }, RejectionAppeals, { _id }, context);
}

export const createRejectionAppealGqlMutation = makeGqlCreateMutation('RejectionAppeals', createRejectionAppeal, {
  newCheck: user => !!user,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'RejectionAppeals', rawResult, context),
});

export const updateRejectionAppealGqlMutation = makeGqlUpdateMutation('RejectionAppeals', updateRejectionAppeal, {
  editCheck: userIsAdminOrMod,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'RejectionAppeals', rawResult, context),
});

export const graphqlRejectionAppealTypeDefs = gql`
  input CreateRejectionAppealDataInput ${ getCreatableGraphQLFields(schema) }

  input CreateRejectionAppealInput {
    data: CreateRejectionAppealDataInput!
  }

  input UpdateRejectionAppealDataInput ${ getUpdatableGraphQLFields(schema) }

  input UpdateRejectionAppealInput {
    selector: SelectorInput!
    data: UpdateRejectionAppealDataInput!
  }

  type RejectionAppealOutput {
    data: RejectionAppeal
  }

  extend type Mutation {
    createRejectionAppeal(data: CreateRejectionAppealDataInput!): RejectionAppealOutput
    updateRejectionAppeal(selector: SelectorInput!, data: UpdateRejectionAppealDataInput!): RejectionAppealOutput
  }
`;
