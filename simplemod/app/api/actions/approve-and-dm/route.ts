import type { NextRequest } from 'next/server';
import { handleActionRequest, requireCollectionName, requireString } from '../../../../src/server/actionRoute';
import { approveItemAndDm } from '../../../../src/server/actions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handleActionRequest(req, ({ context, moderator }, body) => approveItemAndDm(context, moderator, {
    userId: requireString(body, 'userId'),
    collectionName: requireCollectionName(body),
    documentId: requireString(body, 'documentId'),
    messageHtml: requireString(body, 'messageHtml'),
  }));
}
