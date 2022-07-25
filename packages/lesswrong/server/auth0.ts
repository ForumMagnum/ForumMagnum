import { DatabaseServerSetting } from "./databaseSettings";
import { ManagementClient } from "auth0";

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
const auth0Client = new class {
  private settings = new DatabaseServerSetting<Auth0Settings|null>("oAuth.auth0", null);
  private client: ManagementClient|undefined;

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

export const updateUserEmail = (user: DbUser, newEmail: string) => {
  const id = user.services?.auth0?.id ?? user.services?.auth0?.user_id;
  if (!id) {
    throw new Error("User does not have an Auth0 user ID");
  }

  return new Promise((resolve, reject) => {
    auth0Client.get().updateUser({id}, {email: newEmail}, (error, user) => {
      if (error) {
        reject(error);
      } else {
        resolve(user);
      }
    });
  });
}
