import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getModeratorSession, isErrorResponse } from '../../../src/server/fmAuth';
import { computeQueue } from '../../../src/server/queue';
import type { QueueResponse } from '../../../src/lib/types';

export const dynamic = 'force-dynamic';

const QUICK_USER_LIMIT = 20;
const QUICK_CARD_LIMIT = 3;

export async function GET(req: NextRequest) {
  const session = await getModeratorSession(req);
  if (isErrorResponse(session)) {
    return session;
  }
  const quick = req.nextUrl.searchParams.get('quick') === '1';
  try {
    const cards = await computeQueue(
      session.context,
      quick ? { userLimit: QUICK_USER_LIMIT, cardLimit: QUICK_CARD_LIMIT } : {},
    );
    const response: QueueResponse = {
      cards,
      moderator: { _id: session.moderator._id, displayName: session.moderator.displayName ?? '' },
    };
    return NextResponse.json(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('SimpleMod queue computation failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Queue computation failed: ${message}` }, { status: 500 });
  }
}
