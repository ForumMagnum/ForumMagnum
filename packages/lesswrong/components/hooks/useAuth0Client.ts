class Auth0ClientError extends Error {
  constructor(message?: string | null) {
    super(message || "Incorrect login details");
  }
}

class Auth0Client {
  async login(email: string, password: string): Promise<void> {
    const result = await fetch("/auth/auth0/embedded-login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (result.status !== 200) {
      const data = await result.json();
      throw new Auth0ClientError(data.error);
    }
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
