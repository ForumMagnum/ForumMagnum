import { FLAGGED_FOR_N_DMS, MAX_ALLOWED_CONTACTS_BEFORE_BLOCK, MAX_ALLOWED_CONTACTS_BEFORE_FLAG } from "@/lib/collections/moderatorActions/constants";
import { loggerConstructor } from '../../lib/utils/logging';
import { UpdateCallbackProperties } from '../mutationCallbacks';
import { getAdminTeamAccount } from '../utils/adminTeamAccount';
import { createNotifications } from '../notificationCallbacksHelpers';
import difference from 'lodash/difference';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { createModeratorAction } from '../collections/moderatorActions/mutations';
import { computeContextFromUser } from '../vulcan-lib/apollo-server/context';
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { createMessage } from '../collections/messages/mutations';
import { updateUser } from '../collections/users/mutations';

/**
 * Before a user has been fully approved, keep track of the number of users
 * they've started a conversation with. If they've messaged more than N, flag
 * them for review. If they've messaged more than M, block them from messaging
 * anyone else.
 *
 * In the case where a user should be blocked, this will throw an error, so we
 * should make sure to handle that on the frontend.
 */
export async function flagOrBlockUserOnManyDMs({
  currentConversation,
  oldConversation,
  currentUser,
  context,
}: {
  currentConversation: CreateConversationDataInput | UpdateConversationDataInput,
  oldConversation?: DbConversation,
  currentUser: DbUser|null,
  context: ResolverContext,
}): Promise<void> {
  const { ModeratorActions, Users } = context;
  const logger = loggerConstructor('callbacks-conversations');
  logger('flagOrBlockUserOnManyDMs()')
  if (!currentUser) {
    throw new Error("You can't create a conversation without being logged in");
  }
  if (currentUser.reviewedByUserId && !currentUser.snoozedUntilContentCount) {
    logger('User has been fully approved, ignoring')
    return;
  }
  // if the participants didn't change, we can ignore it
  if (!currentConversation.participantIds) {
    logger('No change to participantIds, ignoring')
    return;
  }

  // Old conversation *should* be completely redundant with
  // currentUser.usersContactedBeforeReview, but we will try to be robust to
  // the case where it's not
  logger('previous usersContactedBeforeReview', currentUser.usersContactedBeforeReview)
  const allUsersEverContacted = filterNonnull([...(new Set([
    ...currentConversation.participantIds,
    ...(oldConversation?.participantIds ?? []),
    ...(currentUser.usersContactedBeforeReview ?? [])
  ]))].filter(id => id !== currentUser._id))
  logger(
    'new allUsersEverContacted', allUsersEverContacted,
    '(length: ', allUsersEverContacted.length, ')'
  )
  if (allUsersEverContacted.length > MAX_ALLOWED_CONTACTS_BEFORE_FLAG && !currentUser.reviewedAt) {
    // Flag users that have sent N+ DMs if they've never been reviewed
    logger('Flagging user')
    void createModeratorAction({
      data: {
        userId: currentUser._id,
        type: FLAGGED_FOR_N_DMS,
      },
    }, context);
  }
  
  // Always update the numUsersContacted field, for denormalization
  void updateUser({
    data: {
      usersContactedBeforeReview: allUsersEverContacted,
    },
    selector: { _id: currentUser._id }
  }, createAnonymousContext());
  
  if (allUsersEverContacted.length > MAX_ALLOWED_CONTACTS_BEFORE_BLOCK && !currentUser.reviewedAt) {
    logger('Blocking user')
    throw new Error(`You cannot message more than ${MAX_ALLOWED_CONTACTS_BEFORE_BLOCK} users before your account has been reviewed. Please contact us if you'd like to message more people.`)
  }
  
  logger('flagOrBlockUserOnManyDMs() return')
}

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
    const adminAccountContext = await computeContextFromUser({ user: adminAccount, req: context.req, isSSR: context.isSSR });

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
