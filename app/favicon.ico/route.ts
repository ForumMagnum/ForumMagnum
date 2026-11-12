import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import type { NextRequest } from "next/server";
import { faviconUrlSetting } from "@/lib/instanceSettings";
import { redirect } from "next/navigation";

export function GET(req: NextRequest) {
  const forumType = getForumTypeForRequest(req);
  return redirect(faviconUrlSetting.get(forumType));
}
