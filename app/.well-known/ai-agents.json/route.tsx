import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import { siteNameWithArticleSetting, taglineSetting } from "@/lib/instanceSettings";
import { NextRequest, NextResponse } from "next/server";
import { getSiteUrlFromReq } from "@/server/utils/getSiteUrl";

/**
 * From: https://github.com/wild-card-ai/agents-json
 * This (/.well-known/ai-agents.json) is a standard that I don't expect to
 * take off, but in "user"-testing, the agent mentioned it as one of the
 * places it might check. So we have a minimal JSON blob here with a
 * documentationUrl that points to SKILL.md, which is the real documentation.
 */
export async function GET(req: NextRequest) {
  const forumType = getForumTypeForRequest(req);
  const siteUrl = getSiteUrlFromReq(req);
  return NextResponse.json({
    name: siteNameWithArticleSetting.get(forumType),
    description: taglineSetting.get(forumType),
    url: siteUrl,
    documentationUrl: `${siteUrl}/api/SKILL.md`,
  });
}
