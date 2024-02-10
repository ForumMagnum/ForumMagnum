import { DatabaseServerSetting } from "../databaseSettings";
import { AuthenticationClient, ManagementClient } from "auth0";
import Profile from "passport-auth0/lib/Profile";
import { getAuth0Id } from "../../lib/collections/users/helpers";
import { Profile as Auth0Profile } from 'passport-auth0';
import { getOrCreateForumUserAsync } from "./getOrCreateForumUser";
import { auth0ProfilePath, idFromAuth0Profile, userFromAuth0Profile } from "./auth0Accounts";
import { auth0ClientSettings } from "../../lib/publicSettings";
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

class Auth0Error extends Error {
  constructor(message: string, public policy?: string) {
    super(message);
  }
}

const getAuthError = async (
  e: AnyBecauseIsInput,
  defaultMessage: string,
  email: string,
): Promise<Auth0Error> => {
  let message: string;
  let policy: string | undefined;
  try {
    // If a user attempts to sign up with a weak password the error is returned
    // is a special format which we have to handle separately
    const parsedError = JSON.parse(e.originalError.response.text);
    if (parsedError.name === "PasswordStrengthError") {
      policy = parsedError.policy;
    } else if (parsedError.code === "invalid_signup") {
      // If a user tries to sign up with an email that is already in use auth0
      // gives us an extremely unhelpful "invalid signup" error - check if this
      // is the case here and give a better message if so
      const existingUser = await new UsersRepo().getUserByEmail(email);
      if (existingUser) {
        return new Auth0Error("A user with this email already exists");
      }
    }
    // eslint-disable-next-line no-empty
  } catch (_) {}
  try {
    const data = JSON.parse(e.message);
    message = data.error_description
      || data.description
      || data.message
      || e.description
      || e.message
      || defaultMessage;
  } catch (_e) {
    message = e.description || e.message || defaultMessage;
  }
  // Remove the ugly full-stop that auth0 appends to its error messages
  if (message[message.length - 1] === ".") {
    message = message.slice(0, -1);
  }
  return new Auth0Error(message, policy);
}

type ProfileFromAccessToken = (token: string) => Promise<Auth0Profile|undefined>;

/**
 * Note that some Auth0 endpoints call this the `connection`, and others call
 * it the `realm` for reasons that aren't entirely obvious. The default value
 * for a new Auth0 tenant is "Username-Password-Authentication".
 */
const getAuth0Connection = (): string => {
  const {connection} = auth0ClientSettings.get() ?? {};
  if (!connection) {
    throw new Error("Auth0 connection not configured");
  }
  return connection;
}

/**
 * Login a user using an email and password.
 * For this to work, you must manually enable the "password" grant type in
 * the Auth0 dashboard.
 */
export const loginAuth0User = async (
  profileFromAccessToken: ProfileFromAccessToken,
  email: string,
  password: string,
): Promise<{user: DbUser, token: string}> => {
  const client = auth0Client.getAuthClient();
  try {
    const grant = await client.passwordGrant({
      username: email,
      password,
      realm: getAuth0Connection(),
      scope: AUTH0_SCOPE,
    });

    // This should never happen, but better be safe
    if (!grant.access_token) {
      throw new Error("Incorrect email or password");
    }

    const profile = await profileFromAccessToken(grant.access_token);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const user = await getOrCreateForumUserAsync(
      auth0ProfilePath,
      profile,
      idFromAuth0Profile,
      userFromAuth0Profile,
    );
    if (!user) {
      throw new Error("User not found");
    }

    return {
      user,
      token: grant.access_token,
    };
  } catch (e) {
    throw await getAuthError(e, "Login failed", email);
  }
}

/**
 * Signup a new user using an email and password.
 * For this to work, you must manually enable the "password" grant type in
 * the Auth0 dashboard.
 * Specifically go to `Dashboard > Applications > Your App > Show Advanced Settings > Grant Types`
 */
export const signupAuth0User = async (
  profileFromAccessToken: ProfileFromAccessToken,
  email: string,
  password: string,
): Promise<{user: DbUser, token: string}> => {
  const client = auth0Client.getAuthClient();
  try {
    if (!client.database) {
      throw new Error("Database authenticator not initialized");
    }
    await client.database.signUp({
      email,
      password,
      connection: getAuth0Connection(),
    });
    return loginAuth0User(profileFromAccessToken, email, password);
  } catch (e) {
    throw await getAuthError(e, "Signup failed", email);
  }
}
