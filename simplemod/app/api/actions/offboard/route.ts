import type { NextRequest } from 'next/server';
import { handleActionRequest, requireString } from '../../../../src/server/actionRoute';
import { offboardUser } from '../../../../src/server/actions';
import type { ReviewCollectionName } from '../../../../src/lib/types';

export const dynamic = 'force-dynamic';

interface RejectionInput {
  collectionName: ReviewCollectionName;
  documentId: string;
  rejectedReason: string;
}

function parseRejections(value: unknown): RejectionInput[] {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error('rejections must be an array');
  }
  return value.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Each rejection must be an object');
    }
    const { collectionName, documentId, rejectedReason } = entry as Record<string, unknown>;
    if (collectionName !== 'Posts' && collectionName !== 'Comments') {
      throw new Error('rejection collectionName must be Posts or Comments');
    }
    if (typeof documentId !== 'string' || !documentId) {
      throw new Error('rejection documentId is required');
    }
    if (typeof rejectedReason !== 'string' || !rejectedReason) {
      throw new Error('rejection rejectedReason is required');
    }
    return { collectionName, documentId, rejectedReason };
  });
}

export async function POST(req: NextRequest) {
  return handleActionRequest(req, ({ context, moderator }, body) => offboardUser(context, moderator, {
    userId: requireString(body, 'userId'),
    rejections: parseRejections(body.rejections),
    removePermissions: body.removePermissions === true,
    messageHtml: typeof body.messageHtml === 'string' && body.messageHtml ? body.messageHtml : undefined,
  }));
}
