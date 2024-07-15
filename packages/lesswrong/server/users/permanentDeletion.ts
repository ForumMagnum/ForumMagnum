import Users from "@/lib/collections/users/collection";
import { addCronJob } from "../cronUtil";
import { getUserEmail } from "@/lib/collections/users/helpers";
import { Globals, createAdminContext, deleteMutator, updateMutator } from "../vulcan-lib";
import { getAdminTeamAccount } from "../callbacks/commentCallbacks";
import { loggerConstructor } from "@/lib/utils/logging";
import { mailchimpAPIKeySetting } from "../serverSettings";
import { mailchimpEAForumListIdSetting, mailchimpForumDigestListIdSetting } from "@/lib/publicSettings";
import md5 from "md5";
import { captureException } from "@sentry/core";
import { auth0RemoveAssociationAndTryDeleteUser } from "../authentication/auth0";

/**
 * Permanently delete a user from a Mailchimp list. Note
 * that this means they can't sign back up using the API, only with the mailchimp
 * signup form, so this should only be used if a user requests to permanently
 * delete their data.
 *
 * See here for discussion of the api/sign-up restriction: https://stackoverflow.com/questions/52198510/mailchimp-resubscribe-a-deleted-member-causes-the-api-to-return-a-400-bad-reques
 */
const permanentlyDeleteFromMailchimpList = async ({
  listId,
  emailHash,
  user,
  logger
}: {
  listId: string;
  emailHash: string;
  user: DbUser;
  logger: ReturnType<typeof loggerConstructor>;
}) => {
  const mailchimpAPIKey = mailchimpAPIKeySetting.get();

  try {
    const response = await fetch(
      `https://us8.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}/actions/delete-permanent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `API_KEY ${mailchimpAPIKey}`,
        },
      }
    );

    if (!response.ok) {
      const json = await response.json();
      if (json.status !== 404) { // 404 just means they weren't subscribed to begin with
        // eslint-disable-next-line no-console
        console.error(
          `Failed to permanently delete user ${user.displayName} from Mailchimp list ${listId}. Response: `,
          json
        );
      }
    } else {
      logger(`Permanently deleted user with display name "${user.displayName}" from Mailchimp list ${listId}`);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    captureException(e);
  }
};

async function permanentlyDeleteUser(user: DbUser) {
  const logger = loggerConstructor(`permanentlyDeleteUsers`);
  const adminContext = createAdminContext();
  const adminTeamAccount = await getAdminTeamAccount();
  if (!adminTeamAccount) throw new Error("Couldn't find admin team account");

  // Precaution: Ensure the soft-deleting callbacks have run (unsubscribing from mailchimp, reindexing elasticsearch content)
  await updateMutator({
    collection: Users,
    documentId: user._id,
    set: { deleted: true },
    validate: false,
    context: adminContext,
    currentUser: adminContext.currentUser,
  })
  // Wait until async callbacks finish. This is overcautious, as there should be no need for the callbacks to refetch the user object
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Remove from mailchimp lists
  const mailchimpForumDigestListId = mailchimpForumDigestListIdSetting.get();
  const mailchimpEAForumListId = mailchimpEAForumListIdSetting.get();

  const listIdsToDeleteFrom = [mailchimpEAForumListId, mailchimpForumDigestListId].filter(v => v) as string[]

  const email = getUserEmail(user);
  if (email) {
    const emailHash = md5(email.toLowerCase());

    for (const listId of listIdsToDeleteFrom) {
      await permanentlyDeleteFromMailchimpList({ listId, emailHash, user, logger });
    }
  }

  // Delete in auth0 to the extent possible
  const deletedFromAuth0 = await auth0RemoveAssociationAndTryDeleteUser(user);
  logger(`Removed association with Auth0 for user with display name "${user.displayName}". The user was${deletedFromAuth0 ? "" : " not"} deleted from Auth0`)

  // Permanently delete from the forum itself
  await deleteMutator({
    collection: Users,
    documentId: user._id,
    validate: false,
    currentUser: adminTeamAccount,
    context: adminContext
  })
  logger(`Permanently deleted user with display name "${user.displayName}" from the forum database`)
}

/**
 * Permanently delete a user from the forum, this is sufficient to comply with GDPR deletion
 * requests if their forum account and associated services is the only data we have for them
 */
async function permanentlyDeleteUserById(userId: string) {
  const user = await Users.findOne({_id: userId})

  if (!user) {
    // eslint-disable-next-line no-console
    console.log(`User with _id "${userId}" not found`)
    return
  }

  await permanentlyDeleteUser(user)
}

Globals.permanentlyDeleteUserById = permanentlyDeleteUserById
