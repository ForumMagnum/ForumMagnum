import { GoogleUserProfile } from '@/lib/auth/googleOAuth';
import { Users } from '../collections/users/collection';
import { createUser, updateUser } from '../collections/users/mutations';
import { usersFindAllByEmail } from '../commonQueries';
import { getUnusedSlugByCollectionName } from '../utils/slugUtil';
import { slugify } from '@/lib/utils/slugify';
import { createAnonymousContext } from '../vulcan-lib/createContexts';

export async function getOrCreateGoogleUser(profile: GoogleUserProfile): Promise<DbUser> {
  // First, try to find user by Google ID
  const user = await Users.findOne({ 'services.google.id': profile.id });

  if (user) {
    // Sync email if changed
    if (profile.email && user.email !== profile.email) {
      const updatedUser = await updateUser({
        selector: { _id: user._id },
        data: {
          email: profile.email,
          emails: [{
            address: profile.email,
            verified: profile.verified_email
          }]
        }
      }, createAnonymousContext());
      
      return updatedUser;
    }
    
    return user;
  }
  
  // If we didn't find them by their Google Id, check if there exists a user with this email
  if (profile.email) {
    const matchingUsers = await usersFindAllByEmail(profile.email);
    
    if (matchingUsers.length > 1) {
      throw new Error(`Multiple existing users found with email ${profile.email}`);
    }
    
    if (matchingUsers.length === 1) {
      const matchingUser = matchingUsers[0];
      // We do a bit of type erasure because `updateUser` only wants to accept top-level fields,
      // even though we can update nested fields.
      const servicePath: string = 'services.google';
      const updatedUser = await updateUser({
        data: { [servicePath]: profile },
        selector: { _id: matchingUser._id },
      }, createAnonymousContext());
      
      return updatedUser;
    }

    // If there's no matching user by email, continue on to create a new user
  }
  
  const username = await getUnusedSlugByCollectionName('Users', slugify(profile.name));
  const services = { google: profile };
  const emails = profile.email
    ? [{ address: profile.email, verified: profile.verified_email }]
    : [];
  
  const newUser = await createUser({
    data: {
      email: profile.email,
      username,
      displayName: profile.name,
      emailSubscribedToCurated: true,
      // These two are spread into the object because this gets around
      // typescript complaining that they don't exist on `CreateUserInput`,
      // which is true, but we need to create them anyways.
      // However, unlike casting the entire `data` object to `AnyBecauseHard`,
      // this preserves type-checking for the rest of the field assignments.
      ...{ services, emails },
    }
  }, createAnonymousContext());
  
  return newUser;
}
