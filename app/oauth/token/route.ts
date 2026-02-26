import { exchangeCodeForToken, OAuthError } from "@/server/oauth/oauthProvider";
import type { NextRequest } from "next/server";

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
      return new Response(JSON.stringify({ error: "invalid_request", error_description: "Unsupported content type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const grantType = params.grant_type;
    if (grantType !== "authorization_code") {
      return new Response(JSON.stringify({ error: "unsupported_grant_type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await exchangeCodeForToken({
      code: params.code ?? "",
      clientId: params.client_id ?? "",
      clientSecret: params.client_secret ?? "",
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
