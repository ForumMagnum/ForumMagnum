import { DatabaseServerSetting } from "../databaseSettings";
import { AuthenticationClient, ManagementClient } from "auth0";
import Profile from "passport-auth0/lib/Profile";
import { getAuth0Id } from "../../lib/collections/users/helpers";
import { UsersRepo } from "../repos";

type Auth0Settings = {
  appId: string;
  secret: string;
  domain: string;
  originalDomain: string;
}

export const AUTH0_SCOPE = "profile email openid offline_access";

/**
 * Auth0 Management API Client
 * For this to work, we must authorize the forum application in Auth0:
 * Applications -> APIs -> Auth0 Management API -> Machine to Machine Applications
 */
const auth0Client = new class Auth0Client {
  private settings = new DatabaseServerSetting<Auth0Settings|null>("oAuth.auth0", null);
  private managementClient?: ManagementClient;
  private authClient?: AuthenticationClient;

  private getSettings() {
    const {
      appId: clientId,
      secret: clientSecret,
      originalDomain: domain,
    } = this.settings?.get() ?? {};
    if (!clientId || !clientSecret || !domain) {
      throw new Error("Missing auth0 environment settings");
    }
    return {clientId, clientSecret, domain};
  }

  getManagementClient() {
    if (!this.managementClient) {
      this.managementClient = new ManagementClient({
        ...this.getSettings(),
        scope: "read:users update:users",
      });
    }
    return this.managementClient;
  }

  getAuthClient() {
    if (!this.authClient) {
      this.authClient = new AuthenticationClient(this.getSettings());
    }
    return this.authClient;
  }
}

// TODO: Probably good to fix this, IM(JP)O. It works because we only use it in
// a context where we're guaranteed to have an email/password user.
/** Warning! Only returns profiles of users who do not use OAuth */
export const getAuth0Profile = async (user: DbUser) => {
  const result = await auth0Client.getManagementClient().getUser({id: getAuth0Id(user)});
  return new Profile(result, JSON.stringify(result));
}

export const updateAuth0Email = (user: DbUser, newEmail: string) => {
  const id = getAuth0Id(user);
  return auth0Client.getManagementClient().updateUser({id}, {email: newEmail});
}

const getAuthError = (e: AnyBecauseIsInput, defaultMessage: string): string => {
  let message: string;
  try {
    const data = JSON.parse(e.message);
    message = data.error_description ?? data.message ?? e.message ?? defaultMessage;
  } catch (_e) {
    message = e.message ?? defaultMessage;
  }
  // Remove the ugly full-stop that auth0 appends to its error messages
  if (message[message.length - 1] === ".") {
    message = message.slice(0, -1);
  }
  return message;
}

/**
 * Login a user using an email and password.
 * For this to work, you must manually enable the "password" grant type in
 * the Auth0 dashboard.
 */
export const loginAuth0User = async (
  email: string,
  password: string,
): Promise<{user: DbUser, token: string}> => {
  const client = auth0Client.getAuthClient();
  try {
    const grant = await client.passwordGrant({
      username: email,
      password,
      realm: "Forum-User-Migration",
      scope: AUTH0_SCOPE,
    });

    // This should never happen, but better be safe
    if (!grant.access_token) {
      throw new Error("Incorrect email or password");
    }

    const user = await new UsersRepo().getUserByEmail(email);
    if (!user) {
      // TODO: Create user?
      throw new Error("User not found");
    }

    return {
      user,
      token: grant.access_token,
    };
  } catch (e) {
    throw new Error(getAuthError(e, "Login failed"));
  }
}
