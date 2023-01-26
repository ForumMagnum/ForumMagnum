import { DatabaseServerSetting } from "../databaseSettings";
import { ManagementClient } from "auth0";
import Profile from "passport-auth0/lib/Profile";
import { getAuth0Id } from "../../lib/collections/users/helpers";

type Auth0Settings = {
  appId: string;
  secret: string;
  domain: string;
  originalDomain: string;
}

/**
 * Auth0 Management API Client
 * For this to work, we must authorize the forum application in Auth0:
 * Applications -> APIs -> Auth0 Management API -> Machine to Machine Applications
 */
const auth0Client = new class Auth0Client {
  private settings = new DatabaseServerSetting<Auth0Settings|null>("oAuth.auth0", null);
  private client?: ManagementClient;

  get() {
    if (!this.client) {
      const {
        appId: clientId,
        secret: clientSecret,
        originalDomain: domain,
      } = this.settings?.get() ?? {};
      if (!clientId || !clientSecret || !domain) {
        throw new Error("Missing auth0 environment settings");
      }
      const scope = "read:users update:users";
      this.client = new ManagementClient({clientId, clientSecret, domain, scope});
    }

    return this.client;
  }
}

// TODO: Probably good to fix this, IM(JP)O. It works because we only use it in
// a context where we're guaranteed to have an email/password user.
/** Warning! Only returns profiles of users who do not use OAuth */
export const getAuth0Profile = async (user: DbUser) => {
  const result = await auth0Client.get().getUser({id: getAuth0Id(user)});
  return new Profile(result, JSON.stringify(result));
}

export const updateAuth0Email = (user: DbUser, newEmail: string) => {
  const id = getAuth0Id(user);
  return auth0Client.get().updateUser({id}, {email: newEmail});
}
