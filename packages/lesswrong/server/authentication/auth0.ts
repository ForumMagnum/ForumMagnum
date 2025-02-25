import { DatabaseServerSetting } from "../databaseSettings";
import {
  AppMetadata,
  AuthenticationClient,
  GrantResponse,
  ManagementClient,
  UpdateUserData,
  User,
  UserMetadata,
} from "auth0";
import Profile from "passport-auth0/lib/Profile";
import { getAuth0Id, getAuth0Provider } from "../../lib/collections/users/helpers";
import { Profile as Auth0Profile } from 'passport-auth0';
import { getOrCreateForumUserAsync } from "./getOrCreateForumUser";
import { auth0ProfilePath, idFromAuth0Profile, userFromAuth0Profile } from "./auth0Accounts";
import { auth0ClientSettings } from "../../lib/publicSettings";
import UsersRepo from "../repos/UsersRepo";
import { isE2E } from "../../lib/executionEnvironment";

type Auth0Settings = {
  appId: string;
  secret: string;
  domain: string;
  originalDomain: string;
}

export const AUTH0_SCOPE = "profile email openid offline_access";

type Auth0User = User<AppMetadata, UserMetadata>;

abstract class IAuth0BackendClient {
  abstract getUserById(auth0UserId: string): Promise<Auth0User>;
  abstract updateUserById(auth0UserId: string, data: UpdateUserData): Promise<Auth0User>;
  abstract signupUser(email: string, password: string): Promise<void>;
  abstract loginUser(email: string, password: string): Promise<string | null>;
  abstract getGrants({auth0UserId, clientId}: {auth0UserId: string, clientId?: string}): Promise<GrantResponse[]>;
  abstract revokeApplicationAuthorization(auth0UserId: string): Promise<void>;
  abstract deleteUser(auth0UserId: string): Promise<void>;
}

/**
 * We replace the real `Auth0Client` (defined below) with this mock client for
 * end-to-end Playwright tests. This bypasses auth0 completely. Note that the mock
 * client will always login the user, whether or not their password is correct.
 */
class MockAuth0Client extends IAuth0BackendClient {
  private assertIsE2E() {
    if (!isE2E) {
      throw new Error("Using mock auth0 backend outside of E2E tests");
    }
  }

  getUserById(_auth0UserId: string): Promise<Auth0User> {
    this.assertIsE2E();
    throw new Error("getUserById not implemented for tests");
  }

  updateUserById(_auth0UserId: string, _data: UpdateUserData): Promise<Auth0User> {
    this.assertIsE2E();
    throw new Error("updateUserById not implemented for tests");
  }

  async signupUser(_email: string, _password: string): Promise<void> {
    this.assertIsE2E();
  }

  async loginUser(email: string, _password: string): Promise<string | null> {
    this.assertIsE2E();
    return `access-token-${email}`;
  }

  async getGrants({auth0UserId: _auth0UserId, clientId: _clientId}: {auth0UserId: string, clientId?: string}): Promise<GrantResponse[]> {
    this.assertIsE2E();
    throw new Error("getGrants not implemented for tests");
  }

  async revokeApplicationAuthorization(_auth0UserId: string): Promise<void> {
    this.assertIsE2E();
    throw new Error("revokeApplicationAuthorization not implemented for tests");
  }

  async deleteUser(_auth0UserId: string): Promise<void> {
    this.assertIsE2E();
    throw new Error("deleteUser not implemented for tests");
  }
}

/**
 * Auth0 Management API Client
 * For this to work, we must authorize the forum application in Auth0:
 * Applications -> APIs -> Auth0 Management API -> Machine to Machine Applications
 */
class Auth0Client extends IAuth0BackendClient {
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

  private getManagementClient() {
    if (!this.managementClient) {
      this.managementClient = new ManagementClient({
        ...this.getSettings(),
        scope: "read:users update:users read:client_grants read:grants delete:grants delete:users",
      });
    }
    return this.managementClient;
  }

  private getAuthClient() {
    if (!this.authClient) {
      this.authClient = new AuthenticationClient(this.getSettings());
    }
    return this.authClient;
  }

  getUserById(auth0UserId: string): Promise<Auth0User> {
    const client = this.getManagementClient();
    return client.getUser({id: auth0UserId});
  }

  updateUserById(auth0UserId: string, data: UpdateUserData): Promise<Auth0User> {
    const client = this.getManagementClient();
    return client.updateUser({id: auth0UserId}, data);
  }

  async signupUser(email: string, password: string): Promise<void> {
    const client = this.getAuthClient();
    if (!client.database) {
      throw new Error("Database authenticator not initialized");
    }
    await client.database.signUp({
      email,
      password,
      connection: getAuth0Connection(),
    });
  }

  async loginUser(email: string, password: string): Promise<string | null> {
    const client = this.getAuthClient();
    const grant = await client.passwordGrant({
      username: email,
      password,
      realm: getAuth0Connection(),
      scope: AUTH0_SCOPE,
    });
    return grant?.access_token ?? null;
  }

  async getGrants({auth0UserId, clientId}: {auth0UserId: string, clientId?: string}): Promise<GrantResponse[]> {
    const client = this.getManagementClient();

    // getGrants has clientId and audience as required parameters. These are not actually required, and we
    // need to get the grants for other applications to see if it is safe to delete the user
    // @ts-ignore
    const grants = await client.getGrants({
      user_id: auth0UserId,
      // @ts-ignore
      client_id: clientId
    }) as Promise<GrantResponse[]>;

    return grants;
  }

  async revokeApplicationAuthorization(auth0UserId: string) {
    const client = this.getManagementClient();
    const { clientId } = this.getSettings();

    const grants = await this.getGrants({
      auth0UserId,
      clientId
    });

    const grant = grants[0];

    if (!grant) {
      throw new Error("No grants found for this user")
    }

    if (grant.clientID !== clientId) {
      throw new Error("Grant clientID doesn't match application clientId, something has gone wrong")
    }

    await client.deleteGrant(grant)
  }

  /**
   * Permanently deletes the user in auth0
   */
  async deleteUser(auth0UserId: string) {
    const client = this.getManagementClient();
    await client.deleteUser({ id: auth0UserId });
  }
}

const auth0Client: IAuth0BackendClient = isE2E
  ? new MockAuth0Client()
  : new Auth0Client();

/**
 * The goal of this function is to absolve the forum instance of any responsibility
 * for the Auth0 user:
 * 1. Remove the user's authorization for the forum application
 * 2. If the user is not authorized to do anything else, delete the user
 *
 * If the user does have other authorizations then it is the responsibility of those
 * applications to delete the user if necessary
 *
 * @returns {boolean} Whether the user was newly deleted from Auth0
 */
export async function auth0RemoveAssociationAndTryDeleteUser(user: DbUser): Promise<boolean> {
  let auth0UserId = '';
  try {
    auth0UserId = getAuth0Id(user);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
    // User has no auth0 id (common for old users), so we can consider them already deleted
    return false;
  }

  try {
    await auth0Client.getUserById(auth0UserId)
  } catch (e) {
    if (e.message !== 'The user does not exist.') {
      throw e;
    }
    // eslint-disable-next-line no-console
    console.log(`User ${auth0UserId} does not exist in Auth0, no need to delete`)
    return false;
  }

  try {
    await auth0Client.revokeApplicationAuthorization(auth0UserId)
  } catch (e) {
    // 'No grants found for this user' means the grants have already been removed, so we can safely continue to trying to delete the user
    if (e.message !== 'No grants found for this user') {
      throw e;
    }
  }

  // getGrants will throw if there is any kind of error, so we can be sure we have the correct grants
  const grants = await auth0Client.getGrants({auth0UserId})

  if (grants.length) {
    // eslint-disable-next-line no-console
    console.log(`Auth0 user has remaining grants after removing forum association, not deleting user ${auth0UserId}`)
    return false;
  }

  await auth0Client.deleteUser(auth0UserId)
  return true;
}

export const getAuth0Profile = async (user: DbUser) => {
  const result = await auth0Client.getUserById(getAuth0Id(user));
  return new Profile(result, JSON.stringify(result));
}

export const updateAuth0Email = (user: DbUser, newEmail: string) => {
  if (getAuth0Provider(user) !== 'auth0') {
    throw new Error("Cannot update email for user that doesn't use username/password login")
  }

  return auth0Client.updateUserById(getAuth0Id(user), {email: newEmail});
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

export type ProfileFromAccessToken = (token: string) => Promise<Auth0Profile|undefined>;

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
  try {
    const accessToken = await auth0Client.loginUser(email, password);

    // This should never happen, but better be safe
    if (!accessToken) {
      throw new Error("Incorrect email or password");
    }

    const profile = await profileFromAccessToken(accessToken);
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
      token: accessToken,
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
  try {
    await auth0Client.signupUser(email, password);
    return loginAuth0User(profileFromAccessToken, email, password);
  } catch (e) {
    throw await getAuthError(e, "Signup failed", email);
  }
}
