import schema from "@/lib/collections/rejectionAppeals/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";
import { escapeHtml } from "@/lib/utils/sanitize";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getDocumentId, makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { insertAndReturnDocument, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { updatePost } from "@/server/collections/posts/mutations";
import { updateComment } from "@/server/collections/comments/mutations";
import { sendMessageAs, startTeamInboxConversation } from "@/server/utils/teamInbox";
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

async function newCheck(user: DbUser | null, document: CreateRejectionAppealDataInput | null, context: ResolverContext) {
  if (!user || !document) return false;
  const appealedDocument = await getAppealedDocument(document, context);
  if (!appealedDocument?.rejected || !userOwns(user, appealedDocument)) return false;

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
  if (!currentUser) throw new Error("You must be logged in to appeal a rejection");

  const appealedDocument = await getAppealedDocument(data, context);
  if (!appealedDocument) throw new Error("Appealed content not found");

  const html = explanationToHtml(data.explanation);
  let conversationId = appealedDocument.rejectionConversationId;
  if (conversationId) {
    await sendMessageAs({ author: currentUser, conversationId, html, noEmail: false, context });
  } else {
    const conversation = await startTeamInboxConversation({
      recipientId: currentUser._id,
      author: currentUser,
      title: data.postId ? "Appeal of rejected post" : "Appeal of rejected comment",
      html,
      noEmail: false,
      context,
    });
    conversationId = conversation._id;
  }

  return await insertAndReturnDocument({
    userId: currentUser._id,
    postId: data.postId ?? null,
    commentId: data.commentId ?? null,
    conversationId,
    explanation: data.explanation,
    status: "open",
    resolvedByUserId: null,
    resolvedAt: null,
  }, 'RejectionAppeals', context);
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
