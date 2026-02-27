import { validateAuthorizationRequest, createAuthorizationCode, OAuthError } from "@/server/oauth/oauthProvider";
import { getUserFromReq } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import type { NextRequest } from "next/server";
import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";

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
  const siteUrl = getSiteUrlFromReq(req);

  // Check if user is logged in
  const user = await getUserFromReq(req);
  if (!user) {
    // Redirect to login, then back to this URL
    const returnUrl = req.nextUrl.toString();
    return Response.redirect(`${siteUrl}/auth/login?returnTo=${encodeURIComponent(returnUrl)}`);
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

  if (decision !== "allow") {
    const denyUrl = new URL(redirectUri);
    denyUrl.searchParams.set("error", "access_denied");
    if (state) denyUrl.searchParams.set("state", state);
    return Response.redirect(denyUrl.toString());
  }

  try {
    // Revalidate the request
    await validateAuthorizationRequest({
      clientId,
      redirectUri,
      responseType: "code",
      codeChallenge,
      codeChallengeMethod,
    });

    const { code } = await createAuthorizationCode({
      clientId,
      userId: user._id,
      redirectUri,
      scope,
      codeChallenge,
      codeChallengeMethod,
    });

    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set("code", code);
    if (state) callbackUrl.searchParams.set("state", state);
    return Response.redirect(callbackUrl.toString());
  } catch (e) {
    if (e instanceof OAuthError) {
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set("error", e.code);
      errorUrl.searchParams.set("error_description", e.message);
      if (state) errorUrl.searchParams.set("state", state);
      return Response.redirect(errorUrl.toString());
    }
    return new Response("Internal error", { status: 500 });
  }
}

// --- HTML Rendering ---

interface ConsentPageArgs {
  clientName: string;
  userName: string;
  scope: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
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
  const { clientName, userName, scope, clientId, redirectUri, state, codeChallenge, codeChallengeMethod } = args;

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
    <div class="scope">Read and edit posts you have access to</div>
    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
      <input type="hidden" name="scope" value="${escapeHtml(scope)}" />
      <input type="hidden" name="state" value="${escapeHtml(state)}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}" />
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(codeChallengeMethod)}" />
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
