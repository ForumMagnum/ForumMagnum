import schema from "@/lib/collections/rejectionAppeals/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";
import { escapeHtml } from "@/lib/utils/sanitize";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getDocumentId, makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { insertAndReturnDocument, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { updatePost } from "@/server/collections/posts/mutations";
import { updateComment } from "@/server/collections/comments/mutations";
import { sendMessageAs } from "@/server/utils/teamInbox";
import { getAdminTeamAccount } from "@/server/utils/adminTeamAccount";
import { updateConversation } from "@/server/collections/conversations/mutations";
import { APPEAL_REASONS } from "@/lib/collections/rejectionAppeals/appealReasons";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { commentGetPageUrlFromDB } from "@/lib/collections/comments/helpers";
import { makeAbsolute } from "@/lib/vulcan-lib/utils";
import gql from "graphql-tag";

interface AppealTarget {
  postId?: string | null;
  commentId?: string | null;
}

async function getAppealedDocument({ postId, commentId }: AppealTarget, context: ResolverContext): Promise<DbPost | DbComment | null> {
  if (postId && !commentId) {
    return await context.loaders.Posts.load(postId);
  }
  if (commentId && !postId) {
    return await context.loaders.Comments.load(commentId);
  }
  return null;
}

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

async function newCheck(user: DbUser | null, document: CreateRejectionAppealDataInput | null, context: ResolverContext) {
  if (!user || !document) return false;
  const appealedDocument = await getAppealedDocument(document, context);
  // Appeals are made from the rejection DM thread, so content without one can't be appealed
  if (!appealedDocument?.rejected || !appealedDocument.rejectionConversationId || !userOwns(user, appealedDocument)) return false;

  const existingAppeal = await context.RejectionAppeals.findOne(
    document.postId ? { postId: document.postId } : { commentId: document.commentId }
  );
  return !existingAppeal;
}

function editCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

export async function createRejectionAppeal({ data }: CreateRejectionAppealInput, context: ResolverContext) {
  const { currentUser } = context;
  if (!currentUser) throw new Error("You must be logged in to request a rejection review");

  const appealedDocument = await getAppealedDocument(data, context);
  if (!appealedDocument) throw new Error("Content to review not found");

  // The reasons are recognized from the rejection message, so there may be none
  const reasons = APPEAL_REASONS.filter(reason => data.reasonIds.includes(reason.id));
  if (reasons.length !== data.reasonIds.length) {
    throw new Error("Invalid rejection reasons");
  }

  const html = getAppealSummaryHtml({
    contentLinkHtml: await getAppealedContentLinkHtml(data, context),
    explanation: data.explanation,
  });
  const conversationId = appealedDocument.rejectionConversationId;
  if (!conversationId) throw new Error("Only content with a rejection message can be reviewed");

  const appeal = await insertAndReturnDocument({
    userId: currentUser._id,
    postId: data.postId ?? null,
    commentId: data.commentId ?? null,
    conversationId,
    explanation: data.explanation,
    reasonIds: data.reasonIds,
    acknowledgedMisunderstandings: data.acknowledgedMisunderstandings,
    status: "open",
    resolvedByUserId: null,
    resolvedAt: null,
  }, 'RejectionAppeals', context);

  // Posted after the appeal exists, so that this message doesn't get the
  // automated appeal-link reply that a first reply to a rejection gets.
  await sendMessageAs({ author: currentUser, conversationId, html, noEmail: false, context });

  return appeal;
}

export async function updateRejectionAppeal({ selector, data }: { data: UpdateRejectionAppealDataInput | Partial<DbRejectionAppeal>; selector: SelectorInput }, context: ResolverContext) {
  const { currentUser, RejectionAppeals, loaders } = context;
  const _id = getDocumentId(selector);
  const oldAppeal = await loaders.RejectionAppeals.load(_id);
  const statusChanged = !!data.status && data.status !== oldAppeal.status;

  const updatedAppeal = await updateAndReturnDocument({
    ...data,
    ...(statusChanged && { resolvedByUserId: currentUser?._id ?? null, resolvedAt: new Date() }),
  }, RejectionAppeals, { _id }, context);

  if (statusChanged && updatedAppeal.status === "approved") {
    const unrejected = { rejected: false, rejectedReason: null };
    if (updatedAppeal.postId) {
      await updatePost({ data: unrejected, selector: { _id: updatedAppeal.postId } }, context);
    } else if (updatedAppeal.commentId) {
      await updateComment({ data: unrejected, selector: { _id: updatedAppeal.commentId } }, context);
    }
  }

  if (statusChanged && (updatedAppeal.status === "approved" || updatedAppeal.status === "denied")) {
    // Tell the user the outcome in the rejection thread; resolving the appeal also handles the thread
    const teamAccount = await getAdminTeamAccount(context);
    if (teamAccount) {
      await sendMessageAs({
        author: teamAccount,
        conversationId: updatedAppeal.conversationId,
        html: getAppealResolvedHtml(updatedAppeal.status, updatedAppeal.postId ? "post" : "comment"),
        noEmail: false,
        context,
      });
    }
    await updateConversation({
      data: { awaitingModeratorReply: false },
      selector: { _id: updatedAppeal.conversationId },
    }, context);
  }

  return updatedAppeal;
}

export const createRejectionAppealGqlMutation = makeGqlCreateMutation('RejectionAppeals', createRejectionAppeal, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'RejectionAppeals', rawResult, context),
});

export const updateRejectionAppealGqlMutation = makeGqlUpdateMutation('RejectionAppeals', updateRejectionAppeal, {
  editCheck,
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
