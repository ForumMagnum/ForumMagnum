import { NextRequest, NextResponse } from "next/server";
import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";

export async function GET(req: NextRequest) {
  const siteUrl = getSiteUrlFromReq(req);

  return NextResponse.json({
    resource: `${siteUrl}/api/mcp`,
    authorization_servers: [siteUrl],
    scopes_supported: ["lesswrong:access"],
  });
}
