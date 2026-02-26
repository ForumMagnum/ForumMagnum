import { siteUrlSetting } from "@/lib/instanceSettings";

export async function GET() {
  const siteUrl = siteUrlSetting.get().replace(/\/$/, "");

  return new Response(JSON.stringify({
    resource: `${siteUrl}/api/mcp`,
    authorization_servers: [siteUrl],
    scopes_supported: ["lesswrong:access"],
  }), {
    headers: { "Content-Type": "application/json" },
  });
}
