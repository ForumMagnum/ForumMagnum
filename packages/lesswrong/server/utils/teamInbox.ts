import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { createConversation } from "@/server/collections/conversations/mutations";
import { createMessage } from "@/server/collections/messages/mutations";
import { getAdminTeamAccount, getAdminTeamAccountId } from "./adminTeamAccount";

/**
 * Team inbox conversations are moderator conversations between a user and the
 * admin team account. Individual moderators write messages in them without
 * becoming participants, so replies reach the shared moderation inbox rather
 * than any one moderator's personal inbox.
 */
export async function isTeamInboxConversation(conversation: DbConversation, context: ResolverContext): Promise<boolean> {
  if (!conversation.moderator) {
    return false;
  }
  const teamAccountId = await getAdminTeamAccountId(context);
  return !!teamAccountId && conversation.participantIds.includes(teamAccountId);
}

export async function sendMessageAs({ author, conversationId, html, noEmail, context }: {
  author: DbUser,
  conversationId: string,
  html: string,
  noEmail: boolean,
  context: ResolverContext,
}) {
  const authorContext = computeContextFromUser({ user: author, isSSR: context.isSSR, forumType: context.forumType });
  return await createMessage({
    data: {
      userId: author._id,
      conversationId,
      contents: {
        originalContents: {
          type: "html",
          data: html,
        },
      },
      noEmail,
    },
  }, authorContext);
}

export async function startTeamInboxConversation({ recipientId, author, title, html, noEmail, context }: {
  recipientId: string,
  author: DbUser | null,
  title: string,
  html: string,
  noEmail: boolean,
  context: ResolverContext,
}): Promise<DbConversation> {
  const teamAccount = await getAdminTeamAccount(context);
  if (!teamAccount) {
    throw new Error("Couldn't find the admin team account for a team inbox conversation");
  }
  const teamAccountContext = computeContextFromUser({ user: teamAccount, isSSR: context.isSSR, forumType: context.forumType });
  const conversation = await createConversation({
    data: {
      participantIds: [recipientId, teamAccount._id],
      title,
      moderator: true,
    },
  }, teamAccountContext);

  await sendMessageAs({ author: author ?? teamAccount, conversationId: conversation._id, html, noEmail, context });

  return conversation;
}
