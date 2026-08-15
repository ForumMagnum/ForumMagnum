import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getModeratorSession, isErrorResponse } from '../../../src/server/fmAuth';
import { computeQueue } from '../../../src/server/queue';
import type { QueueResponse } from '../../../src/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getModeratorSession(req);
  if (isErrorResponse(session)) {
    return session;
  }
  const cards = await computeQueue(session.context);
  const response: QueueResponse = {
    cards,
    moderator: { _id: session.moderator._id, displayName: session.moderator.displayName ?? '' },
  };
  return NextResponse.json(response);
}
