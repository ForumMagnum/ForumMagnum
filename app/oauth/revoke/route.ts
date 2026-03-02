import { hashToken } from "@/server/oauth/oauthProvider";
import OAuthAccessTokens from "@/server/collections/oAuthAccessTokens/collection";
import { captureException } from "@/lib/sentryWrapper";
import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /oauth/revoke — RFC 7009 token revocation endpoint.
 *
 * Per RFC 7009, this endpoint always returns 200 OK regardless of whether the
 * token was found, already revoked, or invalid. This prevents token fishing.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Content-Type must be application/x-www-form-urlencoded" },
        { status: 400 },
      );
    }

    const text = await req.text();
    const params = new URLSearchParams(text);
    const token = params.get("token") ?? "";

    if (!token) {
      // Per RFC 7009, return 200 even for missing tokens
      return new NextResponse(null, { status: 200 });
    }

    const hashedToken = hashToken(token);
    const accessToken = await OAuthAccessTokens.findOne({ hashedToken });

    if (accessToken && !accessToken.revokedAt) {
      await OAuthAccessTokens.rawUpdateOne(
        { _id: accessToken._id },
        { $set: { revokedAt: new Date() } },
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("oauth/revoke: error", e);
    captureException(e);
    // Per RFC 7009, return 200 even on server errors to prevent token fishing
    return new NextResponse(null, { status: 200 });
  }
}
