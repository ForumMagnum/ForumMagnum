import { validateAccessToken, OAuthError } from "@/server/oauth/oauthProvider";
import { HOME_PAGE_DESIGN_PUBLIC_ID_LENGTH, HOME_PAGE_DESIGN_MAX_HTML_SIZE } from "@/lib/collections/homePageDesigns/constants";
import HomePageDesigns from "@/server/collections/homePageDesigns/collection";
import { NextResponse, type NextRequest } from "next/server";

const REQUIRED_SCOPE = "lesswrong:home-design";

function unauthorized(description: string): Response {
  return NextResponse.json(
    { error: "unauthorized", error_description: description },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );
}

/**
 * POST /api/homeDesigns — Create or update a home page design via OAuth.
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

  const userId = tokenInfo.userId;

  let body: { html?: string; title?: string; publicId?: string; modelName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request", error_description: "Invalid JSON body" }, { status: 400 });
  }

  const { html, title, publicId: clientPublicId, modelName } = body;

  if (!html || typeof html !== "string") {
    return NextResponse.json(
      { error: "invalid_request", error_description: "\"html\" is required and must be a string" },
      { status: 400 },
    );
  }

  if (html.length > HOME_PAGE_DESIGN_MAX_HTML_SIZE) {
    return NextResponse.json(
      { error: "invalid_request", error_description: `"html" exceeds the ${HOME_PAGE_DESIGN_MAX_HTML_SIZE / 1024}KB size limit` },
      { status: 400 },
    );
  }

  let publicId = clientPublicId ?? null;

  // If updating an existing design, verify ownership
  if (publicId) {
    const original = await HomePageDesigns.findOne(
      { publicId },
      { sort: { createdAt: 1 } },
      { ownerId: 1 },
    );
    if (!original || original.ownerId !== userId) {
      return NextResponse.json(
        { error: "forbidden", error_description: "You do not own this design" },
        { status: 403 },
      );
    }
  }

  const newId = await HomePageDesigns.rawInsert({
    ownerId: userId,
    publicId: publicId ?? "",
    html,
    title: title ?? "Untitled Design",
    source: "external",
    modelName: modelName ?? null,
    conversationHistory: [],
    verified: false,
    commentId: null,
    createdAt: new Date(),
    autoReviewPassed: null,
    autoReviewMessage: null,
  });

  const shortId = newId.substring(0, HOME_PAGE_DESIGN_PUBLIC_ID_LENGTH);

  if (!publicId) {
    await HomePageDesigns.rawUpdateOne(
      { _id: newId },
      { $set: { publicId: shortId } },
    );
    publicId = shortId;
  }

  return NextResponse.json({
    success: true,
    publicId,
    designId: newId,
  });
}
