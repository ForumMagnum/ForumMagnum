import { FLAGGED_FOR_N_DMS, getMaxAllowedContactsBeforeBlock, MAX_ALLOWED_CONTACTS_BEFORE_FLAG } from "@/lib/collections/moderatorActions/constants";
import { loggerConstructor } from "@/lib/utils/logging";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { createModeratorAction } from "@/server/collections/moderatorActions/mutations";
import { updateUser } from "@/server/collections/users/mutations";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";

type ConversationForDmModeration = {
  participantIds?: string[] | null;
  moderator?: boolean | null;
};

type FlagOrBlockUserOnManyDMsArgs = {
  conversation: ConversationForDmModeration | null | undefined;
  currentUser: DbUser | null;
  context: ResolverContext;
};

type ComputeUpdatedContactsArgs = {
  participantIds: string[];
  currentUserId: string;
  previousContacts: string[];
};

const logger = loggerConstructor("callbacks-conversations");

export function computeUpdatedUsersContactedBeforeReview({
  participantIds,
  currentUserId,
  previousContacts,
}: ComputeUpdatedContactsArgs): string[] | null {
  const otherParticipantIds = filterNonnull(
    participantIds.filter((id) => id !== currentUserId)
  );
  if (!otherParticipantIds.length) {
    return null;
  }

  const contactSet = new Set([...previousContacts, ...otherParticipantIds]);

  if (contactSet.size === previousContacts.length) {
    return null;
  }

  return [...contactSet];
}

/**
 * Before a user has been fully approved, keep track of the number of users
 * they've started a conversation with. If they've messaged more than N, flag
 * them for review. If they've messaged more than M, block them from messaging
 * anyone else.
 *
 * This helper should be called whenever a user successfully sends a DM (ie.
 * from the message creation flow) so that conversations with zero messages do
 * not increment the counter.
 */
export async function flagOrBlockUserOnManyDMs({
  conversation,
  currentUser,
  context,
}: FlagOrBlockUserOnManyDMsArgs): Promise<void> {
  logger("flagOrBlockUserOnManyDMs()");

  if (!currentUser) {
    throw new Error("You can't send a message without being logged in");
  }

  if (conversation?.moderator) {
    logger("Moderator conversation, ignoring");
    return;
  }

  if (currentUser.reviewedByUserId && !currentUser.snoozedUntilContentCount) {
    logger("User has been fully approved, ignoring");
    return;
  }

  const participantIds = conversation?.participantIds ?? [];
  const previousContacts = currentUser.usersContactedBeforeReview ?? [];
  const allUsersEverContacted = computeUpdatedUsersContactedBeforeReview({
    participantIds,
    currentUserId: currentUser._id,
    previousContacts,
  });

  if (!allUsersEverContacted) {
    logger("No new contacts added, ignoring");
    return;
  }
  logger(
    "new allUsersEverContacted",
    allUsersEverContacted,
    "(length: ",
    allUsersEverContacted.length,
    ")"
  );

  if (allUsersEverContacted.length > MAX_ALLOWED_CONTACTS_BEFORE_FLAG && !currentUser.reviewedAt) {
    logger("Flagging user");
    backgroundTask(
      createModeratorAction(
        {
          data: {
            userId: currentUser._id,
            type: FLAGGED_FOR_N_DMS,
          },
        },
        context
      )
    );
  }

  backgroundTask(
    updateUser(
      {
        data: {
          usersContactedBeforeReview: allUsersEverContacted,
        },
        selector: { _id: currentUser._id },
      },
      createAnonymousContext()
    )
  );

  if (allUsersEverContacted.length > getMaxAllowedContactsBeforeBlock() && !currentUser.reviewedAt) {
    logger("Blocking user");
    throw new Error(
      `You cannot message more than ${getMaxAllowedContactsBeforeBlock()} users before your account has been reviewed. Please contact us if you'd like to message more people.`
    );
  }

  logger("flagOrBlockUserOnManyDMs() return");
}
