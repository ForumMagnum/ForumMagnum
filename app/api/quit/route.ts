import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import type { NextRequest } from "next/server";
import { testServerSetting } from "@/lib/instanceSettings";

export async function POST(req: NextRequest) {
  const forumType = getForumTypeForRequest(req);
  if (!testServerSetting.get(forumType)) {
    return new Response("Not allowed", { status: 403 });
  }

  setTimeout(() => {
    process.kill(process.pid, 'SIGQUIT');
  }, 100);
  return new Response("Quitting server", { status: 202 });
}
