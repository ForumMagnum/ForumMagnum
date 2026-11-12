import type { ForumTypeString } from "@/lib/instanceSettings";
import { GitHubUserProfile } from '@/lib/auth/githubOAuth';
import { Users } from '../collections/users/collection';
import { createUser, updateUser } from '../collections/users/mutations';
import { usersFindAllByEmail } from '../commonQueries';
import { getUnusedSlugByCollectionName } from '../utils/slugUtil';
import { slugify } from '@/lib/utils/slugify';
import { createAnonymousContext } from '../vulcan-lib/createContexts';
import { ConflictingAccountsError, OAuthLoginResult, otherUserHasEmail } from './conflictingAccountsError';

export async function getOrCreateGitHubUser(profile: GitHubUserProfile, forumType: ForumTypeString): Promise<OAuthLoginResult> {
  // GitHub IDs are stored as strings in the database (even though they're numbers)
  const githubId = profile.id.toString();
  
  // First, try to find user by GitHub ID
  const user = await Users.findOne({ 'services.github.id': githubId });

  if (user) {
    // Sync email if changed
    if (profile.email && user.email !== profile.email) {
      if (await otherUserHasEmail(profile.email, user._id)) {
        // Another account already has this email, so we can't sync it. Let
        // the login go through without changing the email, and warn the user.
        // eslint-disable-next-line no-console
        console.warn(`Not syncing GitHub email ${profile.email} to user ${user._id}: another user already has that email`);
        return { user, conflictingAccounts: true };
      }
      const updatedUser = await updateUser({
        selector: { _id: user._id },
        data: {
          email: profile.email,
          emails: [{
            address: profile.email,
            verified: true
          }]
        }
      }, createAnonymousContext({ forumType }));
      
      return { user: updatedUser, conflictingAccounts: false };
    }
    
    return { user, conflictingAccounts: false };
  }
  
  // If we didn't find them by their GitHub Id, check if there exists a user with this email
  if (profile.email) {
    const matchingUsers = await usersFindAllByEmail(profile.email);
    
    if (matchingUsers.length > 1) {
      throw new ConflictingAccountsError(`Multiple existing users found with email ${profile.email}`);
    }
    
    if (matchingUsers.length === 1) {
      const matchingUser = matchingUsers[0];
      // Store the full profile but with ID as string for backwards compatibility
      const githubProfile = {
        ...profile,
        id: githubId
      };
      
      const servicePath: string = 'services.github';
      const updatedUser = await updateUser({
        data: { [servicePath]: githubProfile },
        selector: { _id: matchingUser._id },
      }, createAnonymousContext({ forumType }));
      
      return { user: updatedUser, conflictingAccounts: false };
    }
  }
  
  // Create username from GitHub username or display name
  const displayName = profile.login || profile.name || 'github_user';
  const username = await getUnusedSlugByCollectionName('Users', slugify(displayName));
  
  // Store profile with string ID for backwards compatibility
  const githubProfile = {
    ...profile,
    id: githubId
  };
  
  const services = { github: githubProfile };
  const emails = profile.email
    ? [{ address: profile.email, verified: true }]
    : [];
  
  const newUser = await createUser({
    data: {
      email: profile.email,
      username,
      displayName: displayName,
      emailSubscribedToCurated: true,
      ...{ services, emails },
    }
  }, createAnonymousContext({ forumType }));
  
  return { user: newUser, conflictingAccounts: false };
}
