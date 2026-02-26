import { registerClient, OAuthError } from "@/server/oauth/oauthProvider";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await registerClient({
      clientName: body.client_name ?? "Unknown",
      redirectUris: body.redirect_uris ?? [],
      grantTypes: body.grant_types,
      responseTypes: body.response_types,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof OAuthError) {
      return new Response(JSON.stringify(e.toJSON()), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // eslint-disable-next-line no-console
    console.error("OAuth register error:", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
