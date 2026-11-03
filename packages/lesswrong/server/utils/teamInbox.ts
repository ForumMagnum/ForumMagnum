import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { createConversation } from "@/server/collections/conversations/mutations";
import { createMessage } from "@/server/collections/messages/mutations";
import { getAdminTeamAccount, getAdminTeamAccountId } from "./adminTeamAccount";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { loadByIds } from "@/lib/loaders";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";

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

/**
 * Moderators follow moderator conversations in the supermod Inbox, so they
 * aren't sent message notifications for them. A moderator conversation with
 * only moderators in it never reaches the Inbox, so it notifies as usual.
 */
export async function filterMessageNotificationRecipients(conversation: DbConversation, recipientIds: string[], context: ResolverContext): Promise<string[]> {
  if (!conversation.moderator) {
    return recipientIds;
  }
  const participants = await loadByIds(context, "Users", conversation.participantIds);
  const moderatorIds = new Set(filterNonnull(participants).filter(user => userIsAdminOrMod(user)).map(user => user._id));
  if (conversation.participantIds.every(id => moderatorIds.has(id))) {
    return recipientIds;
  }
  return recipientIds.filter(id => !moderatorIds.has(id));
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
