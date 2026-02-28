import { captureException } from "@/lib/sentryWrapper";
import { registerClient, OAuthError } from "@/server/oauth/oauthProvider";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await registerClient({
      clientName: body.client_name ?? "Unknown",
      redirectUris: body.redirect_uris ?? [],
      grantTypes: body.grant_types,
      responseTypes: body.response_types,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("OAuth register error:", e);
    captureException(e);
    if (e instanceof OAuthError) {
      return NextResponse.json(e.toJSON(), { status: 400 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
