import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getUser } from '@/server/vulcan-lib/apollo-server/getUserFromReq';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const loginToken = body?.loginToken;
  if (typeof loginToken !== 'string' || !loginToken) {
    return NextResponse.json({ error: 'loginToken is required' }, { status: 400 });
  }
  const user = await getUser(loginToken);
  if (!user) {
    return NextResponse.json({ error: 'Invalid login token' }, { status: 401 });
  }
  if (!userIsAdminOrMod(user)) {
    return NextResponse.json({ error: 'Not a moderator' }, { status: 403 });
  }
  const response = NextResponse.json({ displayName: user.displayName });
  response.cookies.set('loginToken', loginToken, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('loginToken');
  return response;
}
