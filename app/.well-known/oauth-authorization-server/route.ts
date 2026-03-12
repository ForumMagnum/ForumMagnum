import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const siteUrl = getSiteUrlFromReq(req);

  return NextResponse.json({
    issuer: siteUrl,
    authorization_endpoint: `${siteUrl}/oauth/authorize`,
    token_endpoint: `${siteUrl}/oauth/token`,
    registration_endpoint: `${siteUrl}/oauth/register`,
    code_challenge_methods_supported: ["S256"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    scopes_supported: ["lesswrong:access"],
    revocation_endpoint: `${siteUrl}/oauth/revoke`,
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    revocation_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
  });
}
