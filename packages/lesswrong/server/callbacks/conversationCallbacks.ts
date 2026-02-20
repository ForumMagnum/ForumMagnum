import { UpdateCallbackProperties } from '../mutationCallbacks';
import { getAdminTeamAccount } from '../utils/adminTeamAccount';
import { createNotifications } from '../notificationCallbacksHelpers';
import difference from 'lodash/difference';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';
import { createMessage } from '../collections/messages/mutations';

export async function sendUserLeavingConversationNotication({newDocument, oldDocument, context}: UpdateCallbackProperties<'Conversations'>) {
  const { Messages, Users } = context;

  const usersWhoLeft = (oldDocument?.participantIds ?? [])
    .filter(id => !newDocument.participantIds?.includes(id))
  if (usersWhoLeft.length === 0) return;
  const adminAccount = await getAdminTeamAccount(context);
  if (!adminAccount) {
    // Something has gone horribly wrong
    throw new Error("Could not find admin account");
  }
  for (const userId of usersWhoLeft) {
    const leavingUser = (await Users.findOne(userId));
    const adminAccountContext = computeContextFromUser({ user: adminAccount, isSSR: context.isSSR });

    await createMessage({
      data: {
        userId: adminAccount._id,
        contents: {
          originalContents: {
            type: "html",
            data: `<p>
              User ${leavingUser?.displayName} left the conversation.
            </p>`,
          },
        },
        conversationId: newDocument._id,
        noEmail: true,
      }
    }, adminAccountContext);
  }
}

export async function conversationEditNotification(
  conversation: DbConversation,
  oldConversation: DbConversation,
  currentUser: DbUser | null,
  context: ResolverContext,
) {
  const { Messages } = context;

  // Filter out the new participant if the user added themselves (which can
  // happen with mods)
  const newParticipantIds = difference(
    conversation.participantIds || [],
    oldConversation.participantIds || [],
  ).filter((id) => id !== currentUser?._id);

  if (newParticipantIds.length) {
    // Notify newly added users of the most recent message
    const mostRecentMessage = await Messages.findOne({conversationId: conversation._id}, {sort: {createdAt: -1}});
    if (mostRecentMessage) // don't notify if there are no messages, they will still be notified when they receive the first message
      await createNotifications({userIds: newParticipantIds, notificationType: 'newMessage', documentType: 'message', documentId: mostRecentMessage._id, noEmail: mostRecentMessage.noEmail});
  }
}
