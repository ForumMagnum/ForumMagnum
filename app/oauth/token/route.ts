import { captureException } from "@/lib/sentryWrapper";
import { exchangeCodeForToken, OAuthError } from "@/server/oauth/oauthProvider";
import { NextResponse, type NextRequest } from "next/server";

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
      params = Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes("application/json")) {
      params = await req.json();
    } else {
      // eslint-disable-next-line no-console
      console.error("oauth/token: Invalid content type", contentType);
      captureException(new Error(`oauth/token: Invalid content type ${contentType}`));
      return NextResponse.json({ error: "invalid_request", error_description: "Unsupported content type" }, {
        status: 400,
      });
    }

    const grantType = params.grant_type;
    if (grantType !== "authorization_code") {
      // eslint-disable-next-line no-console
      console.error("oauth/token: Unsupported grant type", grantType);
      captureException(new Error(`oauth/token: Unsupported grant type ${grantType}`));
      return NextResponse.json({ error: "unsupported_grant_type" }, {
        status: 400,
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

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof OAuthError) {
      // eslint-disable-next-line no-console
      console.error("oauth/token: OAuth error", e);
      captureException(e);
      return NextResponse.json(e.toJSON(), {
        status: 400,
      });
    }
    // eslint-disable-next-line no-console
    console.error("OAuth token error:", e);
    captureException(e);
    return NextResponse.json({ error: "server_error" }, {
      status: 500,
    });
  }
}
