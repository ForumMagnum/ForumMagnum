import { Profile } from "passport-auth0";
import Users from "../../lib/vulcan-users";
import { slugify, Utils } from "../../lib/vulcan-lib/utils";
import { updateMutator } from "../vulcan-lib/mutators";
import { ManagementClient } from 'auth0'
import { DatabaseServerSetting } from "../databaseSettings";

export const auth0ClientIdSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.appId', null)
export const auth0SecretSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.secret', null)
export const auth0DomainSetting = new DatabaseServerSetting<string | null>('oAuth.auth0.domain', null)

let auth0Client: ManagementClient

/**
 * TODO;
 */
function getAuth0Client() {
  if (auth0Client) return auth0Client
  const auth0ClientId = auth0ClientIdSetting.get()
  const auth0Secret = auth0SecretSetting.get()
  const auth0Domain = auth0DomainSetting.get()
  if (!auth0ClientId || !auth0Secret || !auth0Domain) {
    throw new Error('Cannot create Auth0 management client without required settings')
  }
  auth0Client = new ManagementClient({
    domain: auth0Domain,
    clientId: auth0ClientId,
    clientSecret: auth0Secret
  })
  return auth0Client
}

async function userEmailVerified(profile: Profile) {
  const auth0 = getAuth0Client()
  const auth0User = await auth0.getUser({id: profile.id})
  return auth0User.email_verified
}

// type MergeAccountResult = {
//   error: Error,
//   updatedUser: null
// } | {
//   error: null,
//   updatedUser: DbUser
// }

export async function mergeAccountWithAuth0(user: DbUser, profile: Profile): Promise<DbUser> {
  const verified = await userEmailVerified(profile)
  if (!verified) {
    throw new Error('Your EffectiveAltruism.org account email is unverified, cannot link with your Forum account')
  }
  delete profile._json
  const {data: updatedUser} = await updateMutator({
    collection: Users,
    documentId: user._id,
    // Annoying that typescript is concerned - `services` is a valid property
    // that's currently set to any
    set: {'services.auth0': profile} as any,
    // Normal updates are not supposed to update services
    validate: false
    // TODO: Soon we should delete passwords when we do this
  })
  return updatedUser
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
