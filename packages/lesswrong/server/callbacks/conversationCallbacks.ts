import Messages from '../../lib/collections/messages/collection';
import { ModeratorActions } from '../../lib/collections/moderatorActions';
import { FLAGGED_FOR_N_DMS, MAX_ALLOWED_CONTACTS_BEFORE_BLOCK, MAX_ALLOWED_CONTACTS_BEFORE_FLAG } from '../../lib/collections/moderatorActions/schema';
import { loggerConstructor } from '../../lib/utils/logging';
import Users from '../../lib/vulcan-users';
import { getCollectionHooks } from '../mutationCallbacks';
import { createMutator, updateMutator } from '../vulcan-lib';
import { getAdminTeamAccount } from './commentCallbacks';

/**
 * Before a user has been fully approved, keep track of the number of users
 * they've started a conversation with. If they've messaged more than N, flag
 * them for review. If they've messaged more than M, block them from messaging
 * anyone else.
 *
 * In the case where a user should be blocked, this will throw an error, so we
 * should make sure to handle that on the frontend.
 */
async function flagOrBlockUserOnManyDMs({
  currentConversation,
  oldConversation,
  currentUser,
  context,
}: {
  currentConversation: Partial<DbConversation>,
  oldConversation?: DbConversation,
  currentUser: DbUser|null,
  context: ResolverContext,
}): Promise<Partial<DbConversation>> {
  const logger = loggerConstructor('callbacks-conversations');
  logger('flagOrBlockUserOnManyDMs()')
  if (!currentUser) {
    throw new Error("You can't create a conversation without being logged in");
  }
  if (currentUser.reviewedByUserId && !currentUser.snoozedUntilContentCount) {
    logger('User has been fully approved, ignoring')
    return currentConversation;
  }
  // if the participants didn't change, we can ignore it
  if (!currentConversation.participantIds) {
    logger('No change to participantIds, ignoring')
    return currentConversation;
  }

  // Old conversation *should* be completely redundant with
  // currentUser.usersContactedBeforeReview, but we will try to be robust to
  // the case where it's not
  logger('previous usersContactedBeforeReview', currentUser.usersContactedBeforeReview)
  const allUsersEverContacted = [...(new Set([
    ...currentConversation.participantIds,
    ...(oldConversation?.participantIds ?? []),
    ...(currentUser.usersContactedBeforeReview ?? [])
  ]))].filter(id => id !== currentUser._id)
  logger(
    'new allUsersEverContacted', allUsersEverContacted,
    '(length: ', allUsersEverContacted.length, ')'
  )
  if (allUsersEverContacted.length > MAX_ALLOWED_CONTACTS_BEFORE_FLAG && !currentUser.reviewedAt) {
    // Flag users that have sent N+ DMs if they've never been reviewed
    logger('Flagging user')
    void createMutator({
      collection: ModeratorActions,
      context,
      currentUser: null,
      validate: false,
      document: {
        userId: currentUser._id,
        type: FLAGGED_FOR_N_DMS,
      },
    });
  }
  // Always update the numUsersContacted field, for denormalization
  void updateMutator({
    collection: Users,
    documentId: currentUser._id,
    set: {
      usersContactedBeforeReview: allUsersEverContacted,
    },
    validate: false,
  });
  
  if (allUsersEverContacted.length > MAX_ALLOWED_CONTACTS_BEFORE_BLOCK) {
    logger('Blocking user')
    throw new Error(`You cannot message more than ${MAX_ALLOWED_CONTACTS_BEFORE_BLOCK} users before your account has been reviewed. Please contact us if you'd like to message more people.`)
  }
  
  logger('flagOrBlockUserOnManyDMs() return')
  return currentConversation;
}

getCollectionHooks("Conversations").createBefore.add(async function flagUserOnManyDMsCreate(document, properties) {
  return flagOrBlockUserOnManyDMs({currentConversation: document, currentUser: properties.currentUser, context: properties.context});
});

getCollectionHooks("Conversations").updateBefore.add(async function flagUserOnManyDMsCreate(data, properties) {
  return flagOrBlockUserOnManyDMs({currentConversation: data, oldConversation: properties.oldDocument, currentUser: properties.currentUser, context: properties.context});
});

getCollectionHooks("Conversations").updateAsync.add(async function leavingNotication({newDocument, oldDocument}) {
  const usersWhoLeft = (oldDocument?.participantIds ?? [])
    .filter(id => !newDocument.participantIds?.includes(id))
  if (usersWhoLeft.length === 0) return;
  const adminAccount = await getAdminTeamAccount();
  if (!adminAccount) {
    // Something has gone horribly wrong
    throw new Error("Could not find admin account");
  }
  for (const userId of usersWhoLeft) {
    const leavingUser = (await Users.findOne(userId));
    await createMutator({
      collection: Messages,
      document: {
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
      },
      currentUser: adminAccount,
      validate: false,
    })
  }
})
