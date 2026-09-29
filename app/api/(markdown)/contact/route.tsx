import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import { contactPostIdSetting } from "@/lib/instanceSettings";
import { NextRequest } from "next/server";
import { renderPostMarkdownByIdOrSlug } from "../post/postMarkdownUtils";

export async function GET(req: NextRequest) {
  const forumType = getForumTypeForRequest(req);
  return await renderPostMarkdownByIdOrSlug(req, contactPostIdSetting.get(forumType));
}
