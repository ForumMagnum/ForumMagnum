import { CLIENT_ID_COOKIE, CLIENT_ID_NEW_COOKIE } from "@/lib/cookies/cookies";
import { randomId } from "@/lib/random";
import ClientIdsRepo from "@/server/repos/ClientIdsRepo";
import { getUserFromReq } from '@/server/vulcan-lib/apollo-server/getUserFromReq';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { backgroundTask } from "@/server/utils/backgroundTask";

const RegisterClientIdRequestSchema = z.object({
  landingPage: z.string(),
  referrer: z.string(),
});

/**
 * Called by the client on every fresh browser session (and whenever the
 * middleware has just minted a clientId, signalled by the clientIdUnset
 * cookie). Records new clientIds, and replaces ones that have been
 * invalidated; for an already-registered, still-valid clientId it only does
 * the invalidation lookup.
 */
export async function POST(req: NextRequest) {
  const clientId = req.cookies.get(CLIENT_ID_COOKIE);
  const isNewClientId = !!req.cookies.get(CLIENT_ID_NEW_COOKIE);
  const body = RegisterClientIdRequestSchema.safeParse(await req.json());
  if (!body.data) {
    return NextResponse.json("Invalid request", {
      status: 400
    });
  }
  const { landingPage, referrer } = body.data;

  if (!clientId) {
    return new Response("", { status: 200 });
  }

  const clientIdsRepo = new ClientIdsRepo();
  const invalidated = await clientIdsRepo.isClientIdInvalidated(clientId.value);
  if (!isNewClientId && !invalidated) {
    return new Response("", { status: 200 });
  }

  const user = await getUserFromReq(req);
  const cookieStore = await cookies();
  if (invalidated) {
    const newClientId = randomId();
    backgroundTask(clientIdsRepo.ensureClientId({
      clientId: newClientId,
      landingPage,
      referrer,
      userId: user?._id,
    }));
    cookieStore.set(CLIENT_ID_COOKIE, newClientId);
  } else {
    backgroundTask(clientIdsRepo.ensureClientId({
      clientId: clientId.value,
      landingPage,
      referrer,
      userId: user?._id,
    }));
  }
  cookieStore.delete(CLIENT_ID_NEW_COOKIE);
  return new Response("", { status: 200 });
}
