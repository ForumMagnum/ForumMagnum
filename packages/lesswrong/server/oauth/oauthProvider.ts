import { createHash, randomBytes } from "crypto";
import { randomId } from "@/lib/random";
import OAuthClients from "@/server/collections/oAuthClients/collection";
import OAuthAuthorizationCodes from "@/server/collections/oAuthAuthorizationCodes/collection";
import OAuthAccessTokens from "@/server/collections/oAuthAccessTokens/collection";

const AUTHORIZATION_CODE_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes
const ACCESS_TOKEN_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64");
}

// --- Dynamic Client Registration ---

interface RegisterClientArgs {
  clientName: string;
  redirectUris: string[];
  grantTypes?: string[];
  responseTypes?: string[];
}

interface RegisterClientResult {
  client_id: string;
  client_secret: string;
  client_name: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
}

async function registerClient(args: RegisterClientArgs): Promise<RegisterClientResult> {
  const { clientName, redirectUris, grantTypes, responseTypes } = args;

  if (!redirectUris || redirectUris.length === 0) {
    throw new OAuthError("invalid_client_metadata", "At least one redirect_uri is required");
  }

  const clientId = randomId();
  const clientSecret = randomBytes(32).toString("hex");

  const resolvedGrantTypes = grantTypes ?? ["authorization_code"];
  const resolvedResponseTypes = responseTypes ?? ["code"];

  await OAuthClients.rawInsert({
    _id: clientId,
    createdAt: new Date(),
    hashedSecret: hashToken(clientSecret),
    clientName,
    redirectUris,
    grantTypes: resolvedGrantTypes,
    responseTypes: resolvedResponseTypes,
  });

  return {
    client_id: clientId,
    client_secret: clientSecret,
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: resolvedGrantTypes,
    response_types: resolvedResponseTypes,
  };
}

// --- Authorization Code ---

interface CreateAuthorizationCodeArgs {
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

interface CreateAuthorizationCodeResult {
  code: string;
}

async function createAuthorizationCode(args: CreateAuthorizationCodeArgs): Promise<CreateAuthorizationCodeResult> {
  const { clientId, userId, redirectUri, scope, codeChallenge, codeChallengeMethod } = args;

  const code = randomBytes(32).toString("hex");

  await OAuthAuthorizationCodes.rawInsert({
    _id: randomId(),
    createdAt: new Date(),
    hashedCode: hashToken(code),
    clientId,
    userId,
    redirectUri,
    scope,
    codeChallenge,
    codeChallengeMethod,
    expiresAt: new Date(Date.now() + AUTHORIZATION_CODE_LIFETIME_MS),
    used: false,
  });

  return { code };
}

// --- Token Exchange ---

async function exchangeCodeForToken(args: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}> {
  const { code, clientId, clientSecret, redirectUri, codeVerifier } = args;

  // Verify client credentials
  const client = await OAuthClients.findOne({ _id: clientId });
  if (!client) {
    console.log("exchangeCodeForToken: Unknown client", clientId);
    throw new OAuthError("invalid_client", "Unknown client");
  }
  if (hashToken(clientSecret) !== client.hashedSecret) {
    console.log("exchangeCodeForToken: Invalid client credentials", clientId);
    throw new OAuthError("invalid_client", "Invalid client credentials");
  }

  // Look up the authorization code
  const hashedCode = hashToken(code);
  const authCode = await OAuthAuthorizationCodes.findOne({ hashedCode });
  if (!authCode) {
    throw new OAuthError("invalid_grant", "Invalid authorization code");
  }

  // Validate the code
  if (authCode.used) {
    throw new OAuthError("invalid_grant", "Authorization code already used");
  }
  if (authCode.expiresAt < new Date()) {
    throw new OAuthError("invalid_grant", "Authorization code expired");
  }
  if (authCode.clientId !== clientId) {
    throw new OAuthError("invalid_grant", "Client mismatch");
  }
  if (authCode.redirectUri !== redirectUri) {
    throw new OAuthError("invalid_grant", "Redirect URI mismatch");
  }

  // Verify PKCE
  verifyCodeChallenge(codeVerifier, authCode.codeChallenge, authCode.codeChallengeMethod);

  // Mark code as used
  await OAuthAuthorizationCodes.rawUpdateOne({ _id: authCode._id }, { $set: { used: true } });

  // Generate access token
  const accessToken = randomBytes(32).toString("hex");
  const expiresInSeconds = Math.floor(ACCESS_TOKEN_LIFETIME_MS / 1000);

  await OAuthAccessTokens.rawInsert({
    _id: randomId(),
    createdAt: new Date(),
    hashedToken: hashToken(accessToken),
    clientId,
    userId: authCode.userId,
    scope: authCode.scope,
    expiresAt: new Date(Date.now() + ACCESS_TOKEN_LIFETIME_MS),
    revokedAt: null,
  });

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresInSeconds,
    scope: authCode.scope,
  };
}

// --- PKCE Verification ---

function verifyCodeChallenge(codeVerifier: string, codeChallenge: string, codeChallengeMethod: string): void {
  if (codeChallengeMethod !== "S256") {
    throw new OAuthError("invalid_request", "Unsupported code_challenge_method");
  }

  const expectedChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  if (expectedChallenge !== codeChallenge) {
    throw new OAuthError("invalid_grant", "PKCE verification failed");
  }
}

// --- Token Validation (for MCP server) ---

interface ValidatedToken {
  userId: string;
  clientId: string;
  scope: string;
}

async function validateAccessToken(bearerToken: string): Promise<ValidatedToken> {
  const hashedToken = hashToken(bearerToken);
  const token = await OAuthAccessTokens.findOne({ hashedToken });

  if (!token) {
    throw new OAuthError("invalid_token", "Unknown token");
  }
  if (token.revokedAt) {
    throw new OAuthError("invalid_token", "Token revoked");
  }
  if (token.expiresAt < new Date()) {
    throw new OAuthError("invalid_token", "Token expired");
  }

  return {
    userId: token.userId,
    clientId: token.clientId,
    scope: token.scope,
  };
}

// --- Authorization Request Validation ---

interface ValidateAuthorizationRequestArgs {
  clientId: string;
  redirectUri: string;
  responseType: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

async function validateAuthorizationRequest(args: ValidateAuthorizationRequestArgs): Promise<DbOAuthClient> {
  const { clientId, redirectUri, responseType, codeChallenge, codeChallengeMethod } = args;

  const client = await OAuthClients.findOne({ _id: clientId });
  if (!client) {
    throw new OAuthError("invalid_client", "Unknown client");
  }

  if (!client.redirectUris.includes(redirectUri)) {
    throw new OAuthError("invalid_request", "Invalid redirect_uri");
  }

  if (responseType !== "code") {
    throw new OAuthError("unsupported_response_type", "Only 'code' is supported");
  }

  if (!codeChallenge || codeChallengeMethod !== "S256") {
    throw new OAuthError("invalid_request", "PKCE with S256 is required");
  }

  return client;
}

// --- OAuth Error ---

class OAuthError extends Error {
  code: string;

  constructor(code: string, description: string) {
    super(description);
    this.code = code;
  }

  toJSON() {
    return {
      error: this.code,
      error_description: this.message,
    };
  }
}

export {
  registerClient,
  createAuthorizationCode,
  exchangeCodeForToken,
  validateAccessToken,
  validateAuthorizationRequest,
  OAuthError,
};
