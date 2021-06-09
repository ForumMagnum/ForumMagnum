import { Profile } from "passport-auth0";
import Users from "../../lib/vulcan-users";
import { slugify, Utils } from "../../lib/vulcan-lib/utils";
import { updateMutator } from "../vulcan-lib/mutators";

export async function mergeAccountWithAuth0(user: DbUser, profile: Profile) {
  return await updateMutator({
    collection: Users,
    documentId: user._id,
    // Annoying that typescript is concerned - `services` is a valid property
    // that's currently set to any
    set: {'services.auth0': profile} as any,
    // Normal updates are not supposed to update services
    validate: false
    // TODO: Soon we should delete passwords, and maybe(?) resume tokens when we do this
  })
}

export async function userFromAuth0Profile(profile: Profile): Promise<Partial<DbUser>> {
  const email = profile.emails?.[0].value
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
    username: await Utils.getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
    displayName: profile.displayName,
  }
}
