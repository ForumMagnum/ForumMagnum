import type { NextRequest } from 'next/server';
import { handleActionRequest, requireString } from '../../../../src/server/actionRoute';
import { skipUser } from '../../../../src/server/actions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handleActionRequest(req, ({ context, moderator }, body) =>
    skipUser(context, moderator, requireString(body, 'userId'))
  );
}
