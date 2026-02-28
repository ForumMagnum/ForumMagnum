import { createHash, randomBytes } from "crypto";
import { randomId } from "@/lib/random";
import OAuthClients from "@/server/collections/oAuthClients/collection";
import OAuthAuthorizationCodes from "@/server/collections/oAuthAuthorizationCodes/collection";
import OAuthAccessTokens from "@/server/collections/oAuthAccessTokens/collection";
import { captureException } from "@/lib/sentryWrapper";

const AUTHORIZATION_CODE_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes
const ACCESS_TOKEN_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function handleErrorAndThrow(error: Error, message: string): never {
  // eslint-disable-next-line no-console
  console.error(error, message);
  captureException(error);
  throw error;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64");
}

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
    const error = new OAuthError("invalid_client_metadata", "At least one redirect_uri is required");
    handleErrorAndThrow(error, `registerClient: At least one redirect_uri is required`);
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
    const error = new OAuthError("invalid_client", "Unknown client");
    handleErrorAndThrow(error, `exchangeCodeForToken: Unknown client ${clientId}`);
  }
  if (hashToken(clientSecret) !== client.hashedSecret) {
    const error = new OAuthError("invalid_client", "Invalid client credentials");
    handleErrorAndThrow(error, `exchangeCodeForToken: Invalid client credentials ${clientId}`);
  }

  // Look up the authorization code
  const hashedCode = hashToken(code);
  const authCode = await OAuthAuthorizationCodes.findOne({ hashedCode });
  if (!authCode) {
    const error = new OAuthError("invalid_grant", "Invalid authorization code");
    handleErrorAndThrow(error, `exchangeCodeForToken: Invalid authorization code ${code}`);
  }

  // Validate the code
  if (authCode.used) {
    const error = new OAuthError("invalid_grant", "Authorization code already used");
    handleErrorAndThrow(error, `exchangeCodeForToken: Authorization code already used ${code}`);
  }
  if (authCode.expiresAt < new Date()) {
    const error = new OAuthError("invalid_grant", "Authorization code expired");
    handleErrorAndThrow(error, `exchangeCodeForToken: Authorization code expired ${code}`);
  }
  if (authCode.clientId !== clientId) {
    const error = new OAuthError("invalid_grant", "Client mismatch");
    handleErrorAndThrow(error, `exchangeCodeForToken: Client mismatch ${code}`);
  }
  if (authCode.redirectUri !== redirectUri) {
    const error = new OAuthError("invalid_grant", "Redirect URI mismatch");
    handleErrorAndThrow(error, `exchangeCodeForToken: Redirect URI mismatch ${code}`);
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

function verifyCodeChallenge(codeVerifier: string, codeChallenge: string, codeChallengeMethod: string): void {
  if (codeChallengeMethod !== "S256") {
    const error = new OAuthError("invalid_request", "Unsupported code_challenge_method");
    handleErrorAndThrow(error, `verifyCodeChallenge: Unsupported code_challenge_method ${codeChallengeMethod}`);
  }

  const expectedChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  if (expectedChallenge !== codeChallenge) {
    const error = new OAuthError("invalid_grant", "PKCE verification failed");
    handleErrorAndThrow(error, `verifyCodeChallenge: PKCE verification failed ${codeVerifier}`);
  }
}

interface ValidatedToken {
  userId: string;
  clientId: string;
  scope: string;
}

async function validateAccessToken(bearerToken: string): Promise<ValidatedToken> {
  const hashedToken = hashToken(bearerToken);
  const token = await OAuthAccessTokens.findOne({ hashedToken });

  if (!token) {
    const error = new OAuthError("invalid_token", "Unknown token");
    handleErrorAndThrow(error, `validateAccessToken: Unknown token ${bearerToken}`);
  }
  if (token.revokedAt) {
    const error = new OAuthError("invalid_token", "Token revoked");
    handleErrorAndThrow(error, `validateAccessToken: Token revoked ${bearerToken}`);
  }
  if (token.expiresAt < new Date()) {
    const error = new OAuthError("invalid_token", "Token expired");
    handleErrorAndThrow(error, `validateAccessToken: Token expired ${bearerToken}`);
  }

  return {
    userId: token.userId,
    clientId: token.clientId,
    scope: token.scope,
  };
}

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
    const error = new OAuthError("invalid_client", "Unknown client");
    handleErrorAndThrow(error, `validateAuthorizationRequest: Unknown client ${clientId}`);
  }

  if (!client.redirectUris.includes(redirectUri)) {
    const error = new OAuthError("invalid_request", "Invalid redirect_uri");
    handleErrorAndThrow(error, `validateAuthorizationRequest: Invalid redirect_uri ${redirectUri}`);
  }

  if (responseType !== "code") {
    const error = new OAuthError("unsupported_response_type", "Only 'code' is supported");
    handleErrorAndThrow(error, `validateAuthorizationRequest: Unsupported response type ${responseType}`);
  }

  if (!codeChallenge || codeChallengeMethod !== "S256") {
    const error = new OAuthError("invalid_request", "PKCE with S256 is required");
    handleErrorAndThrow(error, `validateAuthorizationRequest: PKCE with S256 is required ${codeChallenge} ${codeChallengeMethod}`);
  }

  return client;
}

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
