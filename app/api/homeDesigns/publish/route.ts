import { MARKETPLACE_POST_ID } from "@/lib/collections/homePageDesigns/constants";
import { publishHomePageDesign } from "@/server/collections/homePageDesigns/mutations";
import { validateAccessToken, OAuthError } from "@/server/oauth/oauthProvider";
import Users from "@/server/collections/users/collection";
import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { NextResponse, type NextRequest } from "next/server";

const REQUIRED_SCOPE = "lesswrong:home-design";

function unauthorized(description: string): Response {
  return NextResponse.json(
    { error: "unauthorized", error_description: description },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );
}

function errorStatus(message: string): number {
  if (
    message === "Banned users cannot publish home page designs." ||
    message === "Your account must be approved before you can publish home page designs." ||
    message === "You do not own this design"
  ) {
    return 403;
  }
  if (message === "No design found with that publicId") {
    return 404;
  }
  return 400;
}

/**
 * POST /api/homeDesigns/publish — Publish a saved design to the marketplace via OAuth.
 *
 * Requires a Bearer token with the "lesswrong:home-design" scope.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized("Missing bearer token");
  }

  const bearerToken = authHeader.slice("Bearer ".length);
  let tokenInfo;
  try {
    tokenInfo = await validateAccessToken(bearerToken);
  } catch (e) {
    if (e instanceof OAuthError) {
      return unauthorized(e.message);
    }
    return unauthorized("Invalid token");
  }

  const scopes = tokenInfo.scope.split(" ").filter(Boolean);
  if (!scopes.includes(REQUIRED_SCOPE)) {
    return NextResponse.json(
      { error: "insufficient_scope", error_description: `Token requires the "${REQUIRED_SCOPE}" scope` },
      { status: 403, headers: { "WWW-Authenticate": `Bearer scope="${REQUIRED_SCOPE}"` } },
    );
  }

  const user = await Users.findOne({ _id: tokenInfo.userId });
  if (!user) {
    return unauthorized("Unknown user");
  }

  let body: { publicId?: string; title?: string; descriptionHtml?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request", error_description: "Invalid JSON body" }, { status: 400 });
  }

  const { publicId, title, descriptionHtml } = body;

  if (!publicId || typeof publicId !== "string") {
    return NextResponse.json(
      { error: "invalid_request", error_description: "\"publicId\" is required and must be a string" },
      { status: 400 },
    );
  }
  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { error: "invalid_request", error_description: "\"title\" is required and must be a string" },
      { status: 400 },
    );
  }
  if (!descriptionHtml || typeof descriptionHtml !== "string") {
    return NextResponse.json(
      { error: "invalid_request", error_description: "\"descriptionHtml\" is required and must be a string" },
      { status: 400 },
    );
  }

  const context = computeContextFromUser({ user, isSSR: false });

  try {
    const design = await publishHomePageDesign({
      input: { publicId, title, descriptionHtml },
      context,
    });
    if (!design) {
      return NextResponse.json(
        { error: "publish_failed", error_description: "Published design could not be loaded" },
        { status: 500 },
      );
    }
    const siteUrl = getSiteUrlFromReq(req);
    const commentId = design.commentId;
    const marketplaceUrl = `${siteUrl}/posts/${MARKETPLACE_POST_ID}${commentId ? `?commentId=${commentId}` : ""}`;

    return NextResponse.json({
      success: true,
      publicId: design.publicId,
      commentId,
      marketplaceUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to publish design";
    return NextResponse.json(
      { error: "publish_failed", error_description: message },
      { status: errorStatus(message) },
    );
  }
}
