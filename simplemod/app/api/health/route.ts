import { NextResponse } from 'next/server';
import Users from '@/server/collections/users/collection';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health: { collectionLoaded: string; database: string } = {
    collectionLoaded: Users.collectionName,
    database: 'unavailable',
  };
  try {
    const user = await Users.findOne({});
    health.database = user ? 'connected' : 'connected (empty)';
  } catch (error) {
    health.database = `unavailable: ${error instanceof Error ? error.message : String(error)}`;
  }
  return NextResponse.json(health);
}
