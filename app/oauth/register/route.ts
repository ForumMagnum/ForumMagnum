import { captureException } from "@/lib/sentryWrapper";
import { registerClient, OAuthError } from "@/server/oauth/oauthProvider";
import { isLocalhost } from "@/server/utils/getSiteUrl";
import { NextResponse, type NextRequest } from "next/server";

function isValidRedirectUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    if (parsed.protocol === "https:") {
      return true;
    }
    if (parsed.protocol === "http:" && isLocalhost(parsed.hostname)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const redirectUris: string[] = body.redirect_uris ?? [];
    for (const uri of redirectUris) {
      if (!isValidRedirectUri(uri)) {
        return NextResponse.json(
          { error: "invalid_client_metadata", error_description: `Invalid redirect_uri: must use https or be a localhost URL: ${uri}` },
          { status: 400 },
        );
      }
    }

    const result = await registerClient({
      clientName: body.client_name ?? "Unknown",
      redirectUris,
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
