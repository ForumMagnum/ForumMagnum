import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getModeratorSession, isErrorResponse, type ModeratorSession } from './fmAuth';
import { EarliestItemConflictError } from './actions';
import type { ReviewCollectionName } from '../lib/types';

export async function handleActionRequest(
  req: NextRequest,
  handler: (session: ModeratorSession, body: Record<string, unknown>) => Promise<unknown>,
): Promise<NextResponse> {
  const session = await getModeratorSession(req);
  if (isErrorResponse(session)) {
    return session;
  }
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  try {
    const result = await handler(session, body as Record<string, unknown>);
    return NextResponse.json(result ?? { ok: true });
  } catch (error) {
    if (error instanceof EarliestItemConflictError) {
      return NextResponse.json(
        { error: error.message, currentEarliest: error.currentEarliest },
        { status: 409 },
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export function requireString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== 'string' || !value) {
    throw new Error(`${field} is required`);
  }
  return value;
}

export function requireCollectionName(body: Record<string, unknown>): ReviewCollectionName {
  const value = body.collectionName;
  if (value !== 'Posts' && value !== 'Comments') {
    throw new Error('collectionName must be Posts or Comments');
  }
  return value;
}
