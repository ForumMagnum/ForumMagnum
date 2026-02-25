import { siteUrlSetting } from "@/lib/instanceSettings";

export async function GET() {
  const siteUrl = siteUrlSetting.get().replace(/\/$/, "");

  return new Response(JSON.stringify({
    issuer: siteUrl,
    authorization_endpoint: `${siteUrl}/oauth/authorize`,
    token_endpoint: `${siteUrl}/oauth/token`,
    registration_endpoint: `${siteUrl}/oauth/register`,
    code_challenge_methods_supported: ["S256"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    scopes_supported: ["lesswrong:access"],
    token_endpoint_auth_methods_supported: ["client_secret_post"],
  }), {
    headers: { "Content-Type": "application/json" },
  });
}
