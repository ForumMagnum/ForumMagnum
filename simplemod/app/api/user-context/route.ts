import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getModeratorSession, isErrorResponse } from '../../../src/server/fmAuth';
import { getUserContentHistory } from '../../../src/server/userContext';
import type { UserContextResponse } from '../../../src/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getModeratorSession(req);
  if (isErrorResponse(session)) {
    return session;
  }
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  const response: UserContextResponse = {
    items: await getUserContentHistory(userId),
  };
  return NextResponse.json(response);
}
