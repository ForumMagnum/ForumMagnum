import { Profile } from "passport-auth0";
import Users from "../../lib/vulcan-users";
import { slugify, Utils } from "../../lib/vulcan-lib/utils";
import { updateMutator } from "../vulcan-lib/mutators";

export async function mergeAccountWithAuth0(user: DbUser, profile: Profile) {
  return await updateMutator({
    collection: Users,
    documentId: user._id,
    // This is the correct way to set a nested property according to Mongo, but
    // it's very hard to get it to type correctly. TS thinks we're setting a
    // completely different field, `services.auth0`, not setting a nested one.
    set: {'services.auth0': profile} as any,
    // Normal updates are not supposed to update services
    validate: false
    // TODO: Soon we should delete passwords, and maybe(?) resume tokens when we do this
  })
}

export async function userFromAuth0Profile(profile: Profile): Promise<Partial<DbUser>> {
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
    username: await Utils.getUnusedSlugByCollectionName("Users", slugify(displayName)),
    displayName: displayName,
    usernameUnset: true
  }
}
