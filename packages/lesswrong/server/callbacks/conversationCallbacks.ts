import Users from '../../lib/vulcan-users';
import { getCollectionHooks } from '../mutationCallbacks';
import { updateMutator } from '../vulcan-lib';

const MAX_ALLOWED_CONTACTS_BEFORE_FLAG = 3;

/** TODO; */
async function flagUserOnManyDMs({currentConversation, oldConversation, currentUser}: {currentConversation: DbConversation, oldConversation?: DbConversation, currentUser: DbUser|null}) {
  console.log('🚀 ~ file: conversationCallbacks.ts:12 ~ flagUserOnManyDMs ~ currentUser', currentUser)
  if (!currentUser) {
    throw new Error("You can't create a conversation without being logged in");
  }
  if (currentUser.reviewedByUserId) return;

  // Old conversation *should* be completely redundant with
  // currentUser.usersContactedBeforeReview, but we will try to be robust to
  // the case where it's not
  const allUsersEverContacted = [...(new Set([...currentConversation.participantIds, ...(oldConversation?.participantIds ?? []), ...(currentUser.usersContactedBeforeReview ?? [])]))].filter(id => id !== currentUser._id)
  if (allUsersEverContacted.length >= MAX_ALLOWED_CONTACTS_BEFORE_FLAG) {
    // Flag the user
    await updateMutator({
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
    await updateMutator({
      collection: Users,
      documentId: currentUser._id,
      set: {
        usersContactedBeforeReview: allUsersEverContacted,
      },
      validate: false,
    });
  }
}

getCollectionHooks("Conversations").createAsync.add(async function flagUserOnManyDMsCreate({document, currentUser}) {
  await flagUserOnManyDMs({currentConversation: document, currentUser});
});

getCollectionHooks("Conversations").updateAsync.add(async function flagUserOnManyDMsCreate({document, oldDocument, currentUser}) {
  await flagUserOnManyDMs({currentConversation: document, oldConversation: oldDocument, currentUser});
});

// /** TODO; */
// async function blockUsersDMOnManyDMs(currentConversation: DbConversation) {
//   const suspects =
