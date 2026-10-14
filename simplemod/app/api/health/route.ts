import { NextResponse } from 'next/server';
import Users from '@/server/collections/users/collection';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await Users.findOne({});
    return NextResponse.json({ ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('SimpleMod health check failed:', error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
