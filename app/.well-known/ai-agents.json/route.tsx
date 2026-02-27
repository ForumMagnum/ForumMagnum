import { siteNameWithArticleSetting, taglineSetting } from "@/lib/instanceSettings";
import { NextRequest } from "next/server";
import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";

/**
 * From: https://github.com/wild-card-ai/agents-json
 * This (/.well-known/ai-agents.json) is a standard that I don't expect to
 * take off, but in "user"-testing, the agent mentioned it as one of the
 * places it might check. So we have a minimal JSON blob here with a
 * documentationUrl that points to SKILL.md, which is the real documentation.
 */
export async function GET(req: NextRequest) {
  const siteUrl = getSiteUrlFromReq(req);
  return new Response(JSON.stringify({
    name: siteNameWithArticleSetting.get(),
    description: taglineSetting.get(),
    url: siteUrl,
    documentationUrl: `${siteUrl}/api/SKILL.md`,
  }), {
    headers: { "Content-Type": "application/json" },
  });
}
