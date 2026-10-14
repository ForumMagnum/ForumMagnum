import type { NextRequest } from 'next/server';
import { handleActionRequest, requireCollectionName, requireString } from '../../../../src/server/actionRoute';
import { rejectItem } from '../../../../src/server/actions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handleActionRequest(req, ({ context, moderator }, body) => rejectItem(context, moderator, {
    userId: requireString(body, 'userId'),
    collectionName: requireCollectionName(body),
    documentId: requireString(body, 'documentId'),
    rejectedReason: requireString(body, 'rejectedReason'),
  }));
}
