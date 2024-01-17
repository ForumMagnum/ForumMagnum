import { auth0ClientSettings } from "../../lib/publicSettings";
import { combineUrls } from "../../lib/vulcan-lib";

class Auth0ClientError extends Error {
  public description: string;

  constructor(code?: string, description?: string) {
    super(code ?? "auth0_client_error");
    this.description = description ?? "An authentication error occurred";

    // Remove full stops from the end of the descriptions that auth0 sends us
    if (this.description[this.description.length - 1] === ".") {
      this.description = this.description.slice(0, -1);
    }
  }
}

class Auth0Client {
  private readonly domain;
  private readonly clientId;
  private readonly realm;
  private readonly credentialType;

  constructor() {
    const settings = auth0ClientSettings.get();
    if (!settings) {
      throw new Error("Auth0 client settings not configured");
    }
    this.domain = settings.domain;
    this.clientId = settings.clientId;
    this.realm = settings.realm;
    this.credentialType = settings.credentialType;
  }

  private post(endpoint: string, body: Record<string, string>) {
    return fetch(combineUrls("https://" + this.domain, endpoint), {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async login(email: string, password: string) {
    const result = await this.post("/co/authenticate", {
      username: email,
      password,
      client_id: this.clientId,
      realm: this.realm,
      credential_type: this.credentialType,
    });
    const response = await result.json();
    if (result.status !== 200) {
      throw new Auth0ClientError(response.error, response.error_description);
    }
    return response;
  }
}

let client: Auth0Client;

/**
 * This client allows us to authenticate a user with auth0 directly on the
 * forum without redirecting to a separate domain. For this to work, you must
 * setup cross-origin authentication:
 *   https://auth0.com/docs/get-started/applications/set-up-cors
 */
export const useAuth0Client = () => {
  if (!client) {
    client = new Auth0Client();
  }
  return client;
}
