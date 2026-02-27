import { NextRequest } from "next/server";
import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";

export async function GET(req: NextRequest) {
  const siteUrl = getSiteUrlFromReq(req);

  return new Response(JSON.stringify({
    resource: `${siteUrl}/api/mcp`,
    authorization_servers: [siteUrl],
    scopes_supported: ["lesswrong:access"],
  }), {
    headers: { "Content-Type": "application/json" },
  });
}
