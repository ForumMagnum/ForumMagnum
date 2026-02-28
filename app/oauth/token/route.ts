import { exchangeCodeForToken, OAuthError } from "@/server/oauth/oauthProvider";
import type { NextRequest } from "next/server";

interface BasicAuthCredentials {
  clientId: string;
  clientSecret: string;
}

function parseBasicAuthorizationHeader(headerValue: string | null): BasicAuthCredentials | null {
  if (!headerValue?.startsWith("Basic ")) {
    return null;
  }

  const encodedCredentials = headerValue.slice("Basic ".length).trim();
  if (!encodedCredentials) {
    return null;
  }

  try {
    const decodedCredentials = atob(encodedCredentials);
    const separatorIndex = decodedCredentials.indexOf(":");
    if (separatorIndex < 0) {
      return null;
    }

    return {
      clientId: decodedCredentials.slice(0, separatorIndex),
      clientSecret: decodedCredentials.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let params: Record<string, string>;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      console.log(`oauth/token: Text=${text}`);
      params = Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes("application/json")) {
      params = await req.json();
      console.log(`oauth/token: Params=${JSON.stringify(params)}`);
    } else {
      console.log("oauth/token: Invalid content type", contentType);
      return new Response(JSON.stringify({ error: "invalid_request", error_description: "Unsupported content type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const grantType = params.grant_type;
    if (grantType !== "authorization_code") {
      console.log("oauth/token: Unsupported grant type", grantType);
      return new Response(JSON.stringify({ error: "unsupported_grant_type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const basicAuthCredentials = parseBasicAuthorizationHeader(req.headers.get("authorization"));

    const result = await exchangeCodeForToken({
      code: params.code ?? "",
      clientId: params.client_id ?? basicAuthCredentials?.clientId ?? "",
      clientSecret: params.client_secret ?? basicAuthCredentials?.clientSecret ?? "",
      redirectUri: params.redirect_uri ?? "",
      codeVerifier: params.code_verifier ?? "",
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof OAuthError) {
      console.error(e)
      return new Response(JSON.stringify(e.toJSON()), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // eslint-disable-next-line no-console
    console.error("OAuth token error:", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
