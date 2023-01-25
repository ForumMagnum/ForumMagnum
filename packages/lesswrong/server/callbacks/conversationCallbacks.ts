import Users from '../../lib/vulcan-users';
import { getCollectionHooks } from '../mutationCallbacks';
import { updateMutator } from '../vulcan-lib';

/** The max # of users an unapproved account is allowed to DM before being flagged */
const MAX_ALLOWED_CONTACTS_BEFORE_FLAG = 2;
/** The max # of users an unapproved account is allowed to DM */
const MAX_ALLOWED_CONTACTS_BEFORE_BLOCK = 9;

/**
 * Before a user has been fully approved, keep track of how many users they've
 * messaged.[1] If they've messaged more than N, flag them for review. If
 * they've messaged more than M, block them from messaging anyone else.
 *
 * In the case where a user should be blocked, this will throw an error, so
 * we should make sure to handle that on the frontend.
 *
 * [1] Strictly speaking, this is the number of users with whom they've created
 * a conversation.
 */
async function flagUserOnManyDMs({
  currentConversation,
  oldConversation,
  currentUser
}: {
  currentConversation: Partial<DbConversation>,
  oldConversation?: DbConversation,
  currentUser: DbUser|null
}): Promise<Partial<DbConversation>> {
  if (!currentUser) {
    throw new Error("You can't create a conversation without being logged in");
  }
  if (currentUser.reviewedByUserId && !currentUser.snoozedUntilContentCount) {
    return currentConversation;
  }
  // if the participants didn't change, we can ignore it
  if (!currentConversation.participantIds) {
    return currentConversation;
  }

  // Old conversation *should* be completely redundant with
  // currentUser.usersContactedBeforeReview, but we will try to be robust to
  // the case where it's not
  const allUsersEverContacted = [...(new Set([...currentConversation.participantIds, ...(oldConversation?.participantIds ?? []), ...(currentUser.usersContactedBeforeReview ?? [])]))].filter(id => id !== currentUser._id)
  if (allUsersEverContacted.length > MAX_ALLOWED_CONTACTS_BEFORE_FLAG) {
    // Flag the user
    void updateMutator({
      collection: Users,
      documentId: currentUser._id,
      set: {
        needsReview: true,
        usersContactedBeforeReview: allUsersEverContacted,
      },
      validate: false,
    });
  } else {
    // Always update the numUsersContacted field, for denormalization
    void updateMutator({
      collection: Users,
      documentId: currentUser._id,
      set: {
        usersContactedBeforeReview: allUsersEverContacted,
      },
      validate: false,
    });
  }
  
  if (allUsersEverContacted.length > MAX_ALLOWED_CONTACTS_BEFORE_BLOCK) {
    throw new Error(`You cannot message more than ${MAX_ALLOWED_CONTACTS_BEFORE_BLOCK} users before your account has been reviewed. Please contact us if you'd like to message more people.`)
  }
  
  return currentConversation;
}

getCollectionHooks("Conversations").createBefore.add(async function flagUserOnManyDMsCreate(document, properties) {
  return flagUserOnManyDMs({currentConversation: document, currentUser: properties.currentUser});
});

getCollectionHooks("Conversations").updateBefore.add(async function flagUserOnManyDMsCreate(document, properties) {
  return flagUserOnManyDMs({currentConversation: document, oldConversation: properties.oldDocument, currentUser: properties.currentUser});
});
