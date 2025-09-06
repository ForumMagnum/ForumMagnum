import { winterCGHeadersToDict } from "@/lib/vendor/sentry/request";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { getUserFromReq } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getUserFromReq(req);
  if (!userIsAdmin(user)) {
    return new Response('Not an admin', { status: 403 });
  }

  const headers = JSON.stringify(winterCGHeadersToDict(req.headers));
  const otherIPsources =
    `\n` +
    `request.headers.get('x-forwarded-for'): ${req.headers.get('x-forwarded-for')}\n` +
    `request.headers.get('x-real-ip'): ${req.headers.get('x-real-ip')}\n`
  return new Response(`${headers}\n${otherIPsources}`);
}
