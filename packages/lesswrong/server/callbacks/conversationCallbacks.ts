import Users from '../../lib/vulcan-users';
import { getCollectionHooks } from '../mutationCallbacks';
import { updateMutator } from '../vulcan-lib';

/** The max # of users an unapproved account is allowed to DM before being flagged */
const MAX_ALLOWED_CONTACTS_BEFORE_FLAG = 3;
/** The max # of users an unapproved account is allowed to DM */
const MAX_ALLOWED_CONTACTS_BEFORE_BLOCK = 1;

/** TODO; */
async function flagUserOnManyDMs({currentConversation, oldConversation, currentUser}: {currentConversation: Partial<DbConversation>, oldConversation?: DbConversation, currentUser: DbUser|null}) {
  console.log('🚀 ~ file: conversationCallbacks.ts:12 ~ flagUserOnManyDMs ~ currentUser', currentUser)
  if (!currentUser) {
    throw new Error("You can't create a conversation without being logged in");
  }
  if (currentUser.reviewedByUserId && !currentUser.snoozedUntilContentCount) return;
  // if the participants didn't change, we can ignore it
  if (!currentConversation.participantIds) return

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
}

getCollectionHooks("Conversations").createBefore.add(async function flagUserOnManyDMsCreate(document, properties) {
  await flagUserOnManyDMs({currentConversation: document, currentUser: properties.currentUser});
});

getCollectionHooks("Conversations").updateBefore.add(async function flagUserOnManyDMsCreate(document, properties) {
  await flagUserOnManyDMs({currentConversation: document, oldConversation: properties.oldDocument, currentUser: properties.currentUser});
});

// /** TODO; */
// async function blockUsersDMOnManyDMs(currentConversation: DbConversation) {
//   const suspects =
