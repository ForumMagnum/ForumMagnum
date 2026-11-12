import { cookies, headers } from 'next/headers';
import type { ForumTypeString } from '@/lib/instanceSettings';
import { getForumTypeFromRequestData } from './requestUtil';

/**
 * Get the forum type from an App Router server component or generateMetadata.
 */
export async function getForumTypeForPage(): Promise<ForumTypeString> {
  const [requestHeaders, requestCookies] = await Promise.all([headers(), cookies()]);
  return getForumTypeFromRequestData(requestHeaders, requestCookies.getAll());
}
