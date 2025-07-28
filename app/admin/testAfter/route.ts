import { sleep } from "@/lib/helpers";
import LWEvents from "@/server/collections/lwevents/collection";
import { backgroundTask } from "@/server/utils/backgroundTask";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const requestId = uuidv4();

  const eventId = await LWEvents.rawInsert({
    name: 'testBackgroundTask',
    documentId: null,
    properties: {
      requestId,
      type: 'open',
    },
    important: null,
    intercom: null,
    userId: null,
  });
  
  backgroundTask((async () => {
    await sleep(290_000);
    await LWEvents.rawUpdateOne(eventId, {
      $set: {
        properties: {
          requestId,
          type: 'closed',
          closedAt: new Date(),
        }
      }
    });
  })());

  return new Response(requestId);
}
