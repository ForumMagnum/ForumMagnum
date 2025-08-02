import { CLIENT_ID_COOKIE, CLIENT_ID_NEW_COOKIE } from "@/lib/cookies/cookies";
import { randomId } from "@/lib/random";
import ClientIdsRepo from "@/server/repos/ClientIdsRepo";
import { getUserFromReq } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { backgroundTask } from "@/server/utils/backgroundTask";

const RegisterClientIdRequestSchema = z.object({
  landingPage: z.string(),
  referrer: z.string(),
});

export async function POST(req: NextRequest) {
  const clientId = req.cookies.get(CLIENT_ID_COOKIE);
  const body = RegisterClientIdRequestSchema.safeParse(await req.json());
  if (!body.data) {
    return NextResponse.json("Invalid request", {
      status: 400
    });
  }
  const { landingPage, referrer } = body.data;
  const user = await getUserFromReq(req);
  
  const clientIdsRepo = new ClientIdsRepo();
  if (!clientId) {
    return new Response("", { status: 200 });
  } else if (await clientIdsRepo.isClientIdInvalidated(clientId.value)) {
    const newClientId = randomId();
    backgroundTask(clientIdsRepo.ensureClientId({
      clientId: newClientId,
      landingPage,
      referrer,
      userId: user?._id,
    }));
    const cookieStore = await cookies();
    cookieStore.set(CLIENT_ID_COOKIE, newClientId);
    cookieStore.delete(CLIENT_ID_NEW_COOKIE);
    return new Response("", { status: 200 });
  } else {
    backgroundTask(clientIdsRepo.ensureClientId({
      clientId: clientId.value,
      landingPage,
      referrer,
      userId: user?._id,
    }));
    const cookieStore = await cookies();
    cookieStore.delete(CLIENT_ID_NEW_COOKIE);
    return new Response("", {
      status: 200,
    });
  }
}