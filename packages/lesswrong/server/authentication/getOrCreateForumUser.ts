import type { Profile } from "passport";
import type { VerifyCallback } from "passport-oauth2";
import { captureException } from "@sentry/core";
import { userFindOneByEmail, usersFindAllByEmail } from "../commonQueries";
import Users from "../../server/collections/users/collection";
import { promisify } from "util";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { updateUser, createUser } from "../collections/users/mutations";

export type IdFromProfile<P extends Profile> = (profile: P) => string | number;

export type UserDataFromProfile<P extends Profile> = (profile: P) => Promise<Partial<DbUser>>;

/**
 * If the user's email has been updated by their OAuth provider, change their
 * email to match their OAuth provider's given email
 */
const syncOAuthUser = async (user: DbUser, profile: Profile): Promise<DbUser> => {
  if (!profile.emails || !profile.emails.length) {
    return user
  }

  // I'm unable to find documenation of how to interpret the emails object. It's
  // plausible we should always set the users email to the first one, but it
  // could be that the ordering doesn't matter, in which case we'd want to avoid
  // spuriously updating the user's email based on whichever one happened to be
  // first. But if their email is entirely missing, we should update it to be
  // one given by their OAuth provider. Probably their OAuth provider will only
  // ever report one email, in which case this is over-thought.
  const profileEmails = profile.emails.map(emailObj => emailObj.value);
  if (user.email && !profileEmails.includes(user.email)) {
    // Attempt to update the email field on the account to match the OAuth-provided
    // email. This will fail if the user has both an OAuth and a non-OAuth account
    // with the same email.
    const preexistingAccountWithEmail = await userFindOneByEmail(profileEmails[0]);
    if (!preexistingAccountWithEmail) {
      const updatedUserResponse = await updateUser({
        data: {
          email: profileEmails[0],
          // Will overwrite other past emails which we don't actually want to support
          emails: [{address: profileEmails[0], verified: true}],
        } as UpdateUserDataInput,
        selector: { _id: user._id }
      }, createAnonymousContext(), true);
      return updatedUserResponse;
    }
  }
  return user;
}

export const getOrCreateForumUser = async <P extends Profile>(
  profilePath: string,
  profile: P,
  getIdFromProfile: IdFromProfile<P>,
  getUserDataFromProfile: UserDataFromProfile<P>,
  callback: VerifyCallback,
) => {
  try {
    const profileId = getIdFromProfile(profile);
    // Probably impossible
    if (!profileId) {
      throw new Error('OAuth profile does not have a profile ID');
    }
    // TODO: We use a string representation of the profileId because LessWrong has
    // Github IDs stored as strings but we receive them as numbers.
    // The query builder can't yet handle that case correctly.
    let user = await Users.findOne({[`${profilePath}.id`]: `${profileId}`});
    if (!user) {
      const email = profile.emails?.[0]?.value;

      // Don't enforce having an email. Facebook OAuth accounts don't necessarily
      // have an email address associated (or visible to us).
      //
      // If an email *is* provided, the OAuth provider verified it, and we should
      // be able to trust that.
      if (email) {
        // Collation here means we're using the case-insensitive index
        const matchingUsers = await usersFindAllByEmail(email);
        if (matchingUsers.length > 1) {
          throw new Error(`Multiple existing users found with email ${email}, please contact support`);
        }
        const user = matchingUsers[0];
        if (user) {
          const userUpdated = await updateUser({ data: {[profilePath]: profile}, selector: { _id: user._id } }, createAnonymousContext(), true);
          // const userUpdated = await mergeAccount(profilePath, user, profile);
          if (user.banned && new Date(user.banned) > new Date()) {
            return callback(new Error("banned"));
          }
          return callback(null, userUpdated);
        }
      }

      const userCreated = await createUser({ data: await getUserDataFromProfile(profile) }, createAnonymousContext(), true);
      return callback(null, userCreated);
    }
    user = await syncOAuthUser(user, profile)
    if (user.banned && new Date(user.banned) > new Date()) {
      return callback(new Error("banned"))
    }
    return callback(null, user);
  } catch (err) {
    captureException(err);
    return callback(err);
  }
}

export const getOrCreateForumUserAsync = promisify(getOrCreateForumUser);
