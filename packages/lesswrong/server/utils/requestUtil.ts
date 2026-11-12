import type { NextRequest } from 'next/server';
import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { FORUM_TYPE_COOKIE } from '@/lib/cookies/cookies';
import type { ForumTypeString } from '@/lib/instanceSettings';

const alignmentForumDomains = new Set([
  'alignmentforum.org',
  'www.alignmentforum.org',
  'alignmentforum.localhost',
]);

function isAlignmentForumHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const hostname = host.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  return alignmentForumDomains.has(hostname);
}

export function getForumTypeFromRequestData(
  requestHeaders: Pick<Headers, 'get'> | undefined,
  requestCookies: readonly RequestCookie[] | undefined,
): ForumTypeString {
  const useAlignmentForum = isAlignmentForumHost(requestHeaders?.get('host'))
    || isAlignmentForumHost(requestHeaders?.get('x-forwarded-host'))
    || requestCookies?.some(cookie => cookie.name === FORUM_TYPE_COOKIE && cookie.value === 'AlignmentForum');
  return useAlignmentForum ? 'AlignmentForum' : 'LessWrong';
}

export function getForumTypeForRequest(request: NextRequest): ForumTypeString {
  return getForumTypeFromRequestData(request.headers, request.cookies.getAll());
}
