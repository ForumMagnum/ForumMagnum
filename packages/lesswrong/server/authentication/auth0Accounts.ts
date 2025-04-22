import { Profile } from "passport-auth0";
import { getUnusedSlugByCollectionName } from "../utils/slugUtil";
import { slugify } from "@/lib/utils/slugify";

export const auth0ProfilePath = "services.auth0";

export const idFromAuth0Profile = (profile: Profile) => profile.id;

export async function userFromAuth0Profile(profile: Profile): Promise<Partial<DbInsertion<DbUser>>> {
  const email = profile.emails?.[0].value
  const displayNameMatchesEmail = email === profile.displayName
  const displayName = displayNameMatchesEmail ?
    `new_user_${Math.floor(Math.random() * 10e9)}` :
    profile.displayName
  return {
    email,
    emails: email ?
      [{
        address: email,
        verified: !!profile._json.email_verified
      }] :
      undefined,
    services: {
      auth0: profile
    },
    username: await getUnusedSlugByCollectionName("Users", slugify(displayName)),
    displayName: displayName,
    usernameUnset: true
  }
}
