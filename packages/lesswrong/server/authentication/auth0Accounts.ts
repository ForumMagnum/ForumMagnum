import { Profile } from "passport-auth0";
import Users from "../../lib/vulcan-users";
import { slugify, Utils } from "../../lib/vulcan-lib/utils";
import { updateMutator } from "../vulcan-lib/mutators";

export async function mergeAccountWithAuth0(user: DbUser, profile: Profile) {
  delete profile._json
  return await updateMutator({
    collection: Users,
    documentId: user._id,
    // Annoying that typescript is concerned - `services` is a valid property
    // that's currently set to any
    set: {'services.auth0': profile} as any
    // TODO: Soon we should delete passwords when we do this
  })
}

export async function userFromAuth0Profile(profile: Profile): Promise<Partial<DbUser>> {
  // Already have the raw version, and the structured content. No need to store the json.
  delete profile._json
  return {
    email: profile.emails?.[0].value,
    services: {
      auth0: profile
    },
    username: await Utils.getUnusedSlugByCollectionName("Users", slugify(profile.displayName)),
    displayName: profile.displayName,
    // emailSubscribedToCurated: true
  }
}
