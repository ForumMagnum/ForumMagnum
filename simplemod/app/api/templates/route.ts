import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { standardRejectionIntroHtml } from '@/lib/collections/moderationTemplates/rejectionIntro';
import { getModeratorSession, isErrorResponse } from '../../../src/server/fmAuth';
import type { ModerationTemplateData } from '../../../src/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getModeratorSession(req);
  if (isErrorResponse(session)) {
    return session;
  }
  const collectionName = req.nextUrl.searchParams.get('collection');
  if (collectionName !== 'Rejections' && collectionName !== 'Messages') {
    return NextResponse.json({ error: 'collection must be Rejections or Messages' }, { status: 400 });
  }
  const db = getSqlClientOrThrow();
  const templates = await db.any<ModerationTemplateData>(`
    SELECT t."_id", t."name", t."collectionName", r."html"
    FROM "ModerationTemplates" t
    LEFT JOIN "Revisions" r ON r."_id" = t."contents_latest"
    WHERE t."collectionName" = $(collectionName)
      AND t."deleted" IS NOT TRUE
    ORDER BY t."order" ASC, t."name" ASC
  `, { collectionName });
  return NextResponse.json({ templates, rejectionIntroHtml: standardRejectionIntroHtml });
}
