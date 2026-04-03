import { validateAuthorizationRequest, createAuthorizationCode, OAuthError } from "@/server/oauth/oauthProvider";
import { getUserFromReq } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { NextResponse, type NextRequest } from "next/server";
import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";
import { captureException } from "@/lib/sentryWrapper";

/**
 * GET /oauth/authorize — renders a minimal consent page.
 * If the user is not logged in, redirects to the login page and comes back.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const clientId = params.get("client_id") ?? "";
  const redirectUri = params.get("redirect_uri") ?? "";
  const responseType = params.get("response_type") ?? "";
  const scope = params.get("scope") ?? "lesswrong:access";
  const state = params.get("state") ?? "";
  const codeChallenge = params.get("code_challenge") ?? undefined;
  const codeChallengeMethod = params.get("code_challenge_method") ?? undefined;
  const resource = params.get("resource") ?? undefined;
  const siteUrl = getSiteUrlFromReq(req);

  // Check if user is logged in
  const user = await getUserFromReq(req);
  if (!user) {
    // Redirect to login, then back to this URL
    // Build the return URL using siteUrl's origin and req.nextUrl's pathname/search/hash
    const returnUrl = `${siteUrl}${req.nextUrl.pathname}${req.nextUrl.search}${req.nextUrl.hash}`;
    return NextResponse.redirect(`${siteUrl}/login?returnTo=${encodeURIComponent(returnUrl)}`);
  }

  // Validate the authorization request
  let client;
  try {
    client = await validateAuthorizationRequest({
      clientId,
      redirectUri,
      responseType,
      codeChallenge,
      codeChallengeMethod,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("oauth/authorize: OAuth error", e);
    captureException(e);
    if (e instanceof OAuthError) {
      return new Response(renderErrorPage(e.message), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }
    return new Response("Internal error", { status: 500 });
  }

  // Render consent page
  const html = renderConsentPage({
    clientName: client.clientName,
    userName: user.displayName,
    scope,
    clientId,
    redirectUri,
    state,
    codeChallenge: codeChallenge ?? "",
    codeChallengeMethod: codeChallengeMethod ?? "",
    resource: resource ?? "",
  });

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

/**
 * POST /oauth/authorize — handles the user's allow/deny decision.
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await req.formData();
  const decision = String(formData.get("decision") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  const redirectUri = String(formData.get("redirect_uri") ?? "");
  const scope = String(formData.get("scope") ?? "");
  const state = String(formData.get("state") ?? "");
  const codeChallenge = String(formData.get("code_challenge") ?? "");
  const codeChallengeMethod = String(formData.get("code_challenge_method") ?? "");
  const resource = String(formData.get("resource") ?? "");

  // Validate the request before processing allow/deny to protect both paths
  try {
    await validateAuthorizationRequest({
      clientId,
      redirectUri,
      responseType: "code",
      codeChallenge,
      codeChallengeMethod,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("oauth/authorize: OAuth error", e);
    captureException(e);
    if (e instanceof OAuthError) {
      return new Response(renderErrorPage(e.message), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }
    return new Response("Internal error", { status: 500 });
  }

  if (decision !== "allow") {
    const denyUrl = new URL(redirectUri);
    denyUrl.searchParams.set("error", "access_denied");
    if (state) denyUrl.searchParams.set("state", state);
    return Response.redirect(denyUrl.toString());
  }

  try {
    const { code } = await createAuthorizationCode({
      clientId,
      userId: user._id,
      redirectUri,
      scope,
      codeChallenge,
      codeChallengeMethod,
      resource,
    });

    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set("code", code);
    if (state) callbackUrl.searchParams.set("state", state);
    return NextResponse.redirect(callbackUrl.toString());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("oauth/authorize: OAuth error", e);
    captureException(e);
    if (e instanceof OAuthError) {
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set("error", e.code);
      errorUrl.searchParams.set("error_description", e.message);
      if (state) errorUrl.searchParams.set("state", state);
      return NextResponse.redirect(errorUrl.toString());
    }
    return new Response("Internal error", { status: 500 });
  }
}

interface ConsentPageArgs {
  clientName: string;
  userName: string;
  scope: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  resource: string;
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "lesswrong:access": "Read and edit posts you give it links to",
  "lesswrong:home-design": "Create and update home page designs on your behalf",
};

function describeScopeForUser(scope: string): string {
  const scopes = scope.split(" ").filter(Boolean);
  const descriptions = scopes.map((s) => SCOPE_DESCRIPTIONS[s] ?? s);
  return descriptions.join("; ");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderConsentPage(args: ConsentPageArgs): string {
  const { clientName, userName, scope, clientId, redirectUri, state, codeChallenge, codeChallengeMethod, resource } = args;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authorize ${escapeHtml(clientName)} — LessWrong</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 32px;
      max-width: 420px;
      width: 100%;
    }
    h1 { font-size: 20px; margin: 0 0 16px; }
    p { color: #555; line-height: 1.5; }
    .scope { background: #f0f0f0; padding: 8px 12px; border-radius: 4px; font-family: monospace; margin: 12px 0; }
    .buttons { display: flex; gap: 12px; margin-top: 24px; }
    button {
      flex: 1;
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    }
    .allow { background: #5f9b65; color: white; }
    .allow:hover { background: #4a8a50; }
    .deny { background: #e0e0e0; color: #333; }
    .deny:hover { background: #d0d0d0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authorize ${escapeHtml(clientName)}</h1>
    <p>
      <strong>${escapeHtml(clientName)}</strong> is requesting access to your LessWrong account
      (<strong>${escapeHtml(userName)}</strong>).
    </p>
    <p>This will allow ${escapeHtml(clientName)} to:</p>
    <div class="scope">${escapeHtml(describeScopeForUser(scope))}</div>
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
      <input type="hidden" name="scope" value="${escapeHtml(scope)}" />
      <input type="hidden" name="state" value="${escapeHtml(state)}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}" />
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(codeChallengeMethod)}" />
      <input type="hidden" name="resource" value="${escapeHtml(resource)}" />
      <div class="buttons">
        <button type="submit" name="decision" value="deny" class="deny">Deny</button>
        <button type="submit" name="decision" value="allow" class="allow">Allow</button>
      </div>
    </form>
  </div>
</body>
</html>`;
}

function renderErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Authorization Error — LessWrong</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 32px;
      max-width: 420px;
      width: 100%;
    }
    h1 { font-size: 20px; margin: 0 0 16px; color: #c62828; }
    p { color: #555; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authorization Error</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}
