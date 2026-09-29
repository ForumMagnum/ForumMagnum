import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import { aboutPostIdSetting } from "@/lib/instanceSettings";
import { NextRequest } from "next/server";
import { renderPostMarkdownByIdOrSlug } from "../post/postMarkdownUtils";

export async function GET(req: NextRequest) {
  const forumType = getForumTypeForRequest(req);
  return await renderPostMarkdownByIdOrSlug(req, aboutPostIdSetting.get(forumType));
}
